import type { MessageBlock } from '../types';

export interface StreamingOptions {
  onChunk: (currentText: string, currentBlocks?: MessageBlock[]) => void;
  onComplete: (fullText: string, blocks?: MessageBlock[]) => void;
  signal?: AbortSignal;
}

export const streamResponse = (
  fullText: string,
  blocks: MessageBlock[] | undefined,
  options: StreamingOptions
): { stop: () => void } => {
  let isCancelled = false;
  let currentIndex = 0;
  let timeoutId: number | null = null;
  const totalBlocks = blocks || [];

  const stop = () => {
    isCancelled = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };

  if (options.signal) {
    options.signal.addEventListener('abort', stop);
  }

  const streamNext = () => {
    if (isCancelled) return;

    if (currentIndex >= fullText.length) {
      options.onComplete(fullText, totalBlocks);
      return;
    }

    const nextChar = fullText[currentIndex];
    // Natural token chunking: 2-4 characters per tick for realistic LLM pacing
    let chunkSize = Math.min(Math.floor(Math.random() * 3) + 2, fullText.length - currentIndex);
    let delay = 24;

    if (nextChar === '.' || nextChar === '!' || nextChar === '?') {
      chunkSize = 1;
      delay = 75;
    } else if (nextChar === ',' || nextChar === ';' || nextChar === ':') {
      chunkSize = 1;
      delay = 45;
    } else if (nextChar === '\n') {
      chunkSize = 1;
      delay = 60;
    } else {
      delay = Math.floor(Math.random() * 8) + 22;
    }

    currentIndex += chunkSize;
    const currentSubstring = fullText.slice(0, currentIndex);

    // Progressive block reveal: Reveal blocks sequentially as the text stream progresses
    // This avoids all blocks popping in suddenly at the end
    let revealedBlocks: MessageBlock[] = [];
    if (totalBlocks.length > 0) {
      const progress = currentIndex / fullText.length;
      if (totalBlocks.length === 1) {
        if (progress >= 0.5) revealedBlocks = totalBlocks;
      } else {
        const blocksToReveal = Math.min(
          Math.floor(progress * (totalBlocks.length + 1)),
          totalBlocks.length
        );
        revealedBlocks = totalBlocks.slice(0, blocksToReveal);
      }
    }

    options.onChunk(currentSubstring, revealedBlocks);

    timeoutId = window.setTimeout(streamNext, delay);
  };

  timeoutId = window.setTimeout(streamNext, 35);

  return { stop };
};

// Component Generator based on user prompt context
export const getContextualResponse = (
  prompt: string
): { text: string; blocks: MessageBlock[] } => {
  return {
    text: prompt,
    blocks: [],
  };
};
