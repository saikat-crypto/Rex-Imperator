import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Square, Plus, Mic, Loader2, AlertCircle, X } from 'lucide-react';
import AnimatedUMascot from '../Branding/AnimatedUMascot';
import { useAudioRecorder } from '../../utils/useAudioRecorder';
import { VoiceWaveform } from './VoiceWaveform';

interface ChatInputProps {
  isZeroState: boolean;
  isStreaming: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isZeroState,
  isStreaming,
  onSend,
  onStop,
}) => {
  const [input, setInput] = useState('');
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Single-line height and line-height matching optical text cap-height to center text in the pill
  const singleLineHeight = isZeroState ? '24px' : '22px';

  // Audio recording hook for AssemblyAI voice typing
  const {
    isRecording,
    isTranscribing,
    recordingError,
    analyser,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Start voice recording when user clicks the mic
  const handleStartRecording = async () => {
    if (isStreaming || isTranscribing) return;
    await startRecording();
  };

  // Square button: Stop recording, transcribe, and keep text in the chat input
  const handleStopAndKeep = async () => {
    if (isTranscribing) return;
    const transcript = await stopRecording();
    if (transcript) {
      setInput((prev) => {
        const trimmedPrev = prev.trim();
        return trimmedPrev ? `${trimmedPrev} ${transcript}` : transcript;
      });
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Cross button: Cancel recording and discard audio
  const handleCancelRecording = () => {
    cancelRecording();
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Main Send Arrow clicked while recording: Stop recording, transcribe, and send immediately
  const handleDirectSendWhileRecording = async () => {
    if (isStreaming || isTranscribing) return;
    const transcript = await stopRecording();
    const existingText = input.trim();

    if (transcript) {
      const fullMessage = existingText ? `${existingText} ${transcript}` : transcript;
      onSend(fullMessage);
      setInput('');
      setIsMultiLine(false);
      setIsOverflowing(false);
      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.style.height = singleLineHeight;
        textareaRef.current.style.lineHeight = singleLineHeight;
      }
    } else if (existingText && !recordingError) {
      // If no speech was detected but user already had typed text, send the typed text
      onSend(existingText);
      setInput('');
      setIsMultiLine(false);
      setIsOverflowing(false);
      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.style.height = singleLineHeight;
        textareaRef.current.style.lineHeight = singleLineHeight;
      }
    }
    // If transcription failed or returned null with error, input remains intact and reverts
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Global keydown handler for Enter/Escape during active recording
  useEffect(() => {
    if (!isRecording) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelRecording();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleDirectSendWhileRecording();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRecording, input]);

  // Auto-resize textarea with strict single-line default and bounded max height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const trimmed = input.trim();
    if (!trimmed) {
      textarea.style.height = singleLineHeight;
      textarea.style.lineHeight = singleLineHeight;
      setIsMultiLine(false);
      setIsOverflowing(false);
      return;
    }

    // Reset to auto first to accurately calculate new scrollHeight
    textarea.style.height = 'auto';
    textarea.style.lineHeight = '1.5';
    const scrollH = textarea.scrollHeight;
    const isOverOneLine = scrollH > (isZeroState ? 28 : 26) || input.includes('\n');
    setIsMultiLine(isOverOneLine);

    // Max vertical height before internal scrolling takes over
    const maxHeight = 160;
    const shouldScroll = scrollH > maxHeight;
    setIsOverflowing(shouldScroll);

    if (isOverOneLine) {
      const minBaseHeight = isZeroState ? 24 : 22;
      const targetHeight = Math.min(Math.max(scrollH, minBaseHeight), maxHeight);
      textarea.style.height = `${targetHeight}px`;
      textarea.style.lineHeight = '1.5';
    } else {
      textarea.style.height = singleLineHeight;
      textarea.style.lineHeight = singleLineHeight;
    }
  }, [input, isZeroState, singleLineHeight]);

  // Focus on mount or state change and ensure clean baseline height
  useEffect(() => {
    textareaRef.current?.focus();
    if (!input.trim() && textareaRef.current) {
      textareaRef.current.style.height = singleLineHeight;
      textareaRef.current.style.lineHeight = singleLineHeight;
      setIsMultiLine(false);
      setIsOverflowing(false);
    }
  }, [isZeroState, singleLineHeight]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    setIsMultiLine(false);
    setIsOverflowing(false);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = singleLineHeight;
      textareaRef.current.style.lineHeight = singleLineHeight;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        handleSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Disallow single newline or leading newline on empty input
    if (!input && val === '\n') return;
    setInput(val);
  };

  return (
    <div
      className={
        isZeroState
          ? 'w-full max-w-[620px] sm:max-w-[680px] md:max-w-[720px] px-5 flex flex-col items-center justify-center mx-auto transition-all duration-300 -translate-y-20 sm:-translate-y-24'
          : 'w-full px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 pb-5 pt-2 shrink-0 transition-all duration-300'
      }
    >
      <AnimatePresence>
        {isZeroState && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8 select-none w-full"
          >
            {/* Mascot Logo - Large animated hero */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 inline-block"
            >
              <AnimatedUMascot
                cadence={4}
                style={{ width: 100, height: 100 }}
                className="mx-auto select-none drop-shadow-lg"
              />
            </motion.div>

            {/* Hero Heading - Scaled up with bespoke editorial typography */}
            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-serif font-normal text-[#181615] tracking-[-0.02em] leading-tight">
              What's on your mind?
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full relative">
        {/* Recording Error banner */}
        <AnimatePresence>
          {recordingError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-11 left-1/2 -translate-x-1/2 bg-red-50/95 border border-red-200/80 text-red-700 text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 whitespace-nowrap z-20 backdrop-blur-sm pointer-events-none"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{recordingError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pill / Rounded container */}
        <div
          className={`relative flex ${
            isRecording || isTranscribing
              ? isZeroState
                ? 'items-center rounded-full p-2 pl-3 pr-2.5 shadow-soft-lg'
                : 'items-center rounded-full p-1.5 pl-2.5 pr-2 shadow-soft-md'
              : isMultiLine
              ? 'items-end rounded-2xl p-2'
              : isZeroState
              ? 'items-center rounded-full p-2 pl-3 pr-2.5 shadow-soft-lg'
              : 'items-center rounded-full p-1.5 pl-2.5 pr-2 shadow-soft-md'
          } bg-white/95 hover:bg-white focus-within:bg-white focus-within:ring-1 focus-within:ring-black/10 transition-all duration-200 border border-black/[0.08] min-h-[46px]`}
        >
          {isRecording ? (
            /* Active Voice Recording Mode with Waveform, Square, Cross, and Send Arrow */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full flex items-center justify-between gap-1.5 py-0.5 px-0.5"
            >
              {/* Left: Square icon for stopping speech and typing text into chat input */}
              <button
                type="button"
                onClick={handleStopAndKeep}
                className={`${
                  isZeroState ? 'w-8 h-8' : 'w-7 h-7'
                } rounded-full bg-black/[0.06] hover:bg-black/[0.12] text-[#181615] flex items-center justify-center transition-all active:scale-95 shrink-0`}
                title="Stop recording and keep text (Square)"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Center: Waveform of dots reacting to speech loudness */}
              <VoiceWaveform analyser={analyser} />

              {/* Right: Cross icon for canceling voice recording */}
              <button
                type="button"
                onClick={handleCancelRecording}
                className={`${
                  isZeroState ? 'w-8 h-8' : 'w-7 h-7'
                } rounded-full text-[#6E685E] hover:text-[#D60103] hover:bg-red-50 flex items-center justify-center transition-all active:scale-95 shrink-0`}
                title="Cancel voice recording (X)"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>

              {/* Main Send Arrow button: Direct transcribe and send */}
              <button
                type="button"
                onClick={handleDirectSendWhileRecording}
                className={`${
                  isZeroState ? 'w-8 h-8' : 'w-7 h-7'
                } rounded-full bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer`}
                title="Transcribe and send prompt immediately"
              >
                <ArrowUp className={`${isZeroState ? 'w-4 h-4' : 'w-3.5 h-3.5'} stroke-[2.4]`} />
              </button>
            </motion.div>
          ) : isTranscribing ? (
            /* Transcribing loading feedback */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center gap-2 py-1 text-xs text-[#6E685E] select-none"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#181615]" />
              <span className="font-medium text-[#181615]">Transcribing...</span>
            </motion.div>
          ) : (
            /* Standard Text Typing Mode */
            <>
              {/* Plus button on the left end */}
              <button
                type="button"
                className={`shrink-0 ${
                  isMultiLine ? 'mb-1' : ''
                } ${isZeroState ? 'p-2' : 'p-1.5'} rounded-full text-[#6E685E] hover:text-[#181615] hover:bg-black/[0.04] transition-colors`}
                title="Attach or add action"
              >
                <Plus className={`${isZeroState ? 'w-4.5 h-4.5' : 'w-4 h-4'} stroke-[2]`} />
              </button>

              {/* Text input: strictly overflow-hidden when single-line or under 160px */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={isZeroState ? 'Ask anything or explore ideas...' : 'Reply to Usher...'}
                className={`flex-1 resize-none bg-transparent px-3 text-[#181615] placeholder:text-[#8C8578] focus:outline-none max-h-[160px] box-border block m-0 my-auto ${
                  isZeroState ? 'text-[15px]' : 'text-[14px]'
                } ${
                  isMultiLine
                    ? 'py-1 leading-[1.5]'
                    : isZeroState
                    ? 'py-0 h-[24px] min-h-[24px] leading-[24px]'
                    : 'py-0 h-[22px] min-h-[22px] leading-[22px]'
                } ${isOverflowing ? 'overflow-y-auto' : 'overflow-hidden'}`}
                style={{
                  height: !isMultiLine ? singleLineHeight : undefined,
                  lineHeight: !isMultiLine ? singleLineHeight : '1.5',
                  overflowY: isOverflowing ? 'auto' : 'hidden',
                  scrollbarWidth: isOverflowing ? 'thin' : 'none',
                }}
              />

              {/* Right actions: Mic + Send/Enter */}
              <div className={`shrink-0 flex items-center gap-1.5 ${isMultiLine ? 'mb-1' : ''}`}>
                {/* Mic button to trigger voice recording */}
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className={`${
                    isZeroState ? 'p-2' : 'p-1.5'
                  } rounded-full text-[#6E685E] hover:text-[#181615] hover:bg-black/[0.04] transition-colors`}
                  title="Voice type (AssemblyAI)"
                >
                  <Mic className={`${isZeroState ? 'w-4.5 h-4.5' : 'w-4 h-4'} stroke-[1.8]`} />
                </button>

                {/* Enter / Stop button */}
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className={`${isZeroState ? 'w-8 h-8' : 'w-7 h-7'} rounded-full bg-[#D60103] hover:bg-[#B70002] text-white flex items-center justify-center transition-all active:scale-95 shadow-sm`}
                    title="Stop response"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={!input.trim()}
                    className={`${isZeroState ? 'w-8 h-8' : 'w-7 h-7'} rounded-full flex items-center justify-center transition-all ${
                      input.trim()
                        ? 'bg-[#FCD702] hover:bg-[#F2CE00] text-[#181615] cursor-pointer active:scale-95 shadow-sm'
                        : 'bg-black/[0.05] text-black/20 cursor-not-allowed'
                    }`}
                    title="Send (Enter)"
                  >
                    <ArrowUp className={`${isZeroState ? 'w-4 h-4' : 'w-3.5 h-3.5'} stroke-[2.4]`} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
