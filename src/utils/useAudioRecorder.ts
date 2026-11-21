import { useState, useRef, useCallback } from 'react';
import { transcribeAudioBlob } from './assemblyai';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  recordingError: string | null;
  analyser: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const cleanupAudio = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAnalyser(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    setRecordingError(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Initialize Web Audio API Analyser for real-time waveform visualization
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 64;
        analyserNode.smoothingTimeConstant = 0.5;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyserNode);
        setAnalyser(analyserNode);
      } catch (e) {
        console.warn('Could not initialize AudioContext for visualization', e);
      }

      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
    } catch (err: unknown) {
      cleanupAudio();
      setIsRecording(false);
      const message = err instanceof Error ? err.message : 'Could not access microphone';
      if (message.includes('Permission') || message.includes('denied')) {
        setRecordingError('Microphone permission denied. Please allow microphone access in your browser.');
      } else {
        setRecordingError(`Microphone error: ${message}`);
      }
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupAudio();
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        setIsRecording(false);
        cleanupAudio();

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          resolve(null);
          return;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: mimeType });

        // If audio blob is very tiny (less than ~800 bytes), likely empty silence
        if (audioBlob.size < 800) {
          resolve(null);
          return;
        }

        try {
          setIsTranscribing(true);
          const transcript = await transcribeAudioBlob(audioBlob);
          setIsTranscribing(false);
          resolve(transcript);
        } catch (err: unknown) {
          setIsTranscribing(false);
          console.error('[AudioRecorder] Transcription failed:', err);
          setRecordingError('Error: Transcription failed');
          setTimeout(() => {
            setRecordingError(null);
          }, 3500);
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanupAudio();
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
  }, []);

  return {
    isRecording,
    isTranscribing,
    recordingError,
    analyser,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
