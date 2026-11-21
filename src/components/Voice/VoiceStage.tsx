import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, X } from 'lucide-react';
import AnimatedUMascot from '../Branding/AnimatedUMascot';

interface VoiceStageProps {
  onEndVoice?: () => void;
  isCallActive?: boolean;
  onCallActiveChange?: (active: boolean) => void;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({
  onEndVoice,
  isCallActive: externalCallActive,
  onCallActiveChange,
}) => {
  const [internalCallActive, setInternalCallActive] = useState(false);
  const isCallActive =
    externalCallActive !== undefined ? externalCallActive : internalCallActive;

  const setIsCallActive = (val: boolean) => {
    setInternalCallActive(val);
    onCallActiveChange?.(val);
  };

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Start voice chat
  const handleStartCall = () => {
    setIsCallActive(true);
    setIsMuted(false);
  };

  // End voice chat: reverts back to initial condition
  const handleEndCall = () => {
    setIsCallActive(false);
    setIsMuted(false);
    setVolume(0.1);
    if (onEndVoice) {
      // Optional callback
    }
  };

  // Audio reactivity: only active when isCallActive is true
  useEffect(() => {
    if (!isCallActive) {
      setIsMuted(false);
      setVolume(0.1);
      // Clean up any ongoing audio streams
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      return;
    }

    let isCancelled = false;
    let fallbackPhase = 0;

    const startAudio = async () => {
      try {
        if (!isMuted && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (isCancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;

          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateMicVolume = () => {
            if (isCancelled) return;

            if (isMuted) {
              // When user mic is muted, simulate bidirectional incoming AI speech and living pulse
              fallbackPhase += 0.05;
              const aiSpeech = Math.max(0, Math.sin(fallbackPhase * 1.5) * 0.4 + Math.sin(fallbackPhase * 3.1) * 0.25);
              const target = Math.min(Math.max(aiSpeech + 0.15, 0.15), 0.85);
              setVolume((prev) => prev + (target - prev) * 0.15);
            } else {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              // Map average 0-80 to normalized 0.12 to 0.95
              const normalized = Math.min(Math.max((average - 6) / 55, 0.12), 1);
              setVolume((prev) => prev + (normalized - prev) * 0.22);
            }

            animFrameRef.current = requestAnimationFrame(updateMicVolume);
          };

          updateMicVolume();
          return;
        }
      } catch {
        // Fallback natural simulation
      }

      // Natural speech cadence simulation (both for incoming AI voice and outgoing speech)
      const runSimulation = () => {
        if (isCancelled) return;

        fallbackPhase += 0.052;
        // Organic multi-harmonic cadence: voice waves with pauses
        const wave1 = Math.sin(fallbackPhase * 1.3) * 0.35;
        const wave2 = Math.sin(fallbackPhase * 2.6) * 0.22;
        const wave3 = Math.sin(fallbackPhase * 5.2) * 0.12;
        const pulse = Math.max(0, wave1 + wave2 + 0.28);
        const target = Math.min(Math.max(pulse + wave3, 0.14), 0.95);

        // Smooth volume adjustment
        setVolume((prev) => prev + (target - prev) * 0.16);

        animFrameRef.current = requestAnimationFrame(runSimulation);
      };

      runSimulation();
    };

    startAudio();

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCallActive, isMuted]);

  // Mascot state is controlled by isCallActive

  return (
    <div className="relative flex-1 w-full h-full flex flex-col justify-between items-center py-8 sm:py-12 select-none overflow-hidden">
      {/* Top spacer to balance ModeToggle */}
      <div className="h-10 shrink-0" />

      {/* Central Vertically Aligned Circle */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <div className="relative flex items-center justify-center w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
          {/* Core Mascot */}
          <AnimatedUMascot 
            className="w-[600px] h-[600px]" 
            paused={!isCallActive} 
            cadence={isCallActive ? Math.max(1.5, 4 - volume * 2.5) : 4}
          />
        </div>
      </div>

      {/* Two Buttons Downwards towards the screen vertically */}
      <div className="shrink-0 flex items-center gap-6 sm:gap-7 pb-4 sm:pb-6">
        {/* Mutable / Unmutable Mic Button */}
        {isCallActive ? (
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className={`w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
              isMuted
                ? 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-medium)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] shadow-soft-sm'
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white shadow-soft-md'
            }`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
            ) : (
              <Mic className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
            )}
          </button>
        ) : (
          /* Initial Inactive State: Mic is Off / Disabled */
          <button
            type="button"
            disabled
            className="w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center bg-[var(--surface-card)]/70 text-[var(--text-muted)]/40 border border-[var(--border-subtle)] cursor-not-allowed shadow-soft-sm"
            aria-label="Microphone inactive"
            title="Start voice chat to activate microphone"
          >
            <MicOff className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
          </button>
        )}

        {/* Action Button: Play (to start) vs Cross (to end) */}
        <AnimatePresence mode="wait">
          {isCallActive ? (
            /* Active Call: Cross (X) Button to End Call */
            <motion.button
              key="btn-end"
              type="button"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleEndCall}
              className="w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full bg-[#301217] hover:bg-[#441820] text-[#F3A5AF] border border-[#521C26] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-soft-sm"
              aria-label="End voice chat"
              title="End voice chat"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
            </motion.button>
          ) : (
            /* Initial Condition: Play Button to Start Call */
            <motion.button
              key="btn-play"
              type="button"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleStartCall}
              className="w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-soft-md"
              aria-label="Start voice chat"
              title="Start voice chat"
            >
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
