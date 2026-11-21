/**
 * AssemblyAI Speech-to-Text Utility
 * Transcribes audio recordings using AssemblyAI's Universal model with
 * automatic silent retry mechanisms for rate limits (429) and transient errors.
 */

const getApiKey = (): string => {
  return import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';
};

/**
 * Fetch wrapper with silent retries and exponential backoff for rate limits (HTTP 429)
 * and transient network/server hiccups.
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelayMs = 400
): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Check for rate limit (429 Too Many Requests) or transient server errors (500-504)
      if (response.status === 429 || (response.status >= 500 && response.status <= 504)) {
        if (attempt < retries) {
          // Exponential backoff with random jitter to spread out requests
          const jitter = Math.random() * 200;
          const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
          console.warn(`[AssemblyAI] Received HTTP ${response.status}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (err: unknown) {
      if (attempt < retries) {
        const jitter = Math.random() * 200;
        const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
        console.warn(`[AssemblyAI] Network error. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})...`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  throw new Error('AssemblyAI request failed after retries.');
};

export const transcribeAudioBlob = async (audioBlob: Blob): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('AssemblyAI API key not found in .env (VITE_ASSEMBLYAI_API_KEY).');
  }

  // 1. Upload audio blob with retry
  const uploadResponse = await fetchWithRetry(
    'https://api.assemblyai.com/v2/upload',
    {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
      body: audioBlob,
    },
    3,
    350
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`AssemblyAI upload failed (${uploadResponse.status}): ${errorText}`);
  }

  const { upload_url } = await uploadResponse.json();
  if (!upload_url) {
    throw new Error('No upload_url returned from AssemblyAI upload.');
  }

  // 2. Submit transcription job with retry
  const transcriptResponse = await fetchWithRetry(
    'https://api.assemblyai.com/v2/transcript',
    {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        speech_models: ['universal-2'],
        punctuate: true,
        format_text: true,
      }),
    },
    3,
    350
  );

  if (!transcriptResponse.ok) {
    const errorText = await transcriptResponse.text();
    throw new Error(`AssemblyAI transcript creation failed (${transcriptResponse.status}): ${errorText}`);
  }

  const { id } = await transcriptResponse.json();
  if (!id) {
    throw new Error('No transcript ID returned from AssemblyAI.');
  }

  // 3. Poll for results (short voice typing clips typically finish in 1-2 seconds)
  const maxAttempts = 40;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      const pollResponse = await fetchWithRetry(
        `https://api.assemblyai.com/v2/transcript/${id}`,
        {
          headers: {
            authorization: apiKey,
          },
        },
        2,
        250
      );

      if (!pollResponse.ok) continue;

      const data = await pollResponse.json();

      if (data.status === 'completed') {
        return (data.text || '').trim();
      }

      if (data.status === 'error') {
        throw new Error(data.error || 'AssemblyAI transcription encountered an error.');
      }
    } catch (pollErr) {
      if (attempt === maxAttempts - 1) throw pollErr;
    }
  }

  throw new Error('AssemblyAI transcription timed out.');
};
