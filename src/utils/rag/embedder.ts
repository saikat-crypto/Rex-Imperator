import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: import.meta.env.VITE_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Computes a 256-dimensional normalized vector embedding for student queries.
 * In production/desktop self-hosted mode, this can be swapped with a local on-device embedder.
 */
export const getQueryEmbedding = async (queryText: string): Promise<number[] | null> => {
  if (!queryText || !queryText.trim()) return null;

  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: queryText.trim(),
        dimensions: 256,
        normalize: true,
      }),
    });

    const response = await client.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.body));
    return result.embedding as number[];
  } catch (err) {
    console.warn("[RAG] Failed to compute query embedding via Titan v2:", err);
    return null;
  }
};
