import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { downsampleTo16k, int16ToBase64, LiveAudioPlayer } from '../utils/audio.js';

export type LiveSessionStatus =
  | 'idle'
  | 'requesting_token'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'finishing'
  | 'finished'
  | 'error';

export interface LiveTranscriptItem {
  id: string;
  speaker: 'learner' | 'agent';
  text: string;
  at: Date;
  isPartial?: boolean;
}

export interface StartSessionOptions {
  targetMinutes?: number;
  nativeLanguage?: string;
  targetLanguage?: string;
  topic?: string;
}

export function useGeminiLive() {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(10);
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>([]);

  // Refs for audio and connection instances
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const isMutedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSpeakerRef = useRef<'learner' | 'agent' | null>(null);
  const resumptionHandleRef = useRef<string | null>(null);
  const transcriptRef = useRef<LiveTranscriptItem[]>([]);

  // Keep transcriptRef synced
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Clean up all resources
  const cleanupAudio = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // already closed
      }
      sessionRef.current = null;
    }

    setMicVolume(0);
    setAgentSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const appendTranscriptFragment = useCallback(
    (speaker: 'learner' | 'agent', textFragment: string) => {
      if (!textFragment) return;

      setTranscript((prev) => {
        const last = prev[prev.length - 1];

        // If the same speaker spoke last and was within 3 seconds, append to turn
        if (last && last.speaker === speaker) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            text: last.text + textFragment,
            at: new Date(),
          };
          return updated;
        }

        // New speaker turn
        const newItem: LiveTranscriptItem = {
          id: `${speaker}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          speaker,
          text: textFragment,
          at: new Date(),
        };
        return [...prev, newItem];
      });

      currentSpeakerRef.current = speaker;
    },
    []
  );

  const startSession = useCallback(
    async (options: StartSessionOptions = {}) => {
      cleanupAudio();
      setError(null);
      setStatus('requesting_token');
      setTranscript([]);
      setElapsedSeconds(0);
      setTargetMinutes(options.targetMinutes || 10);

      try {
        // Step 1: Request session and ephemeral token from our backend API
        const tokenRes = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetMinutes: options.targetMinutes || 10,
            nativeLanguage: options.nativeLanguage,
            targetLanguage: options.targetLanguage,
            topic: options.topic,
          }),
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to initialize session on backend');
        }

        const sessionData = await tokenRes.json();
        setSessionId(sessionData.sessionId);

        setStatus('connecting');

        // Step 2: Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // Step 3: Initialize audio playback queue
        audioPlayerRef.current = new LiveAudioPlayer();

        // Step 4: Setup AudioContext & ScriptProcessor to capture PCM 16kHz
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const micAudioContext = new AudioCtx();
        audioContextRef.current = micAudioContext;

        const micSource = micAudioContext.createMediaStreamSource(stream);
        const processor = micAudioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        micSource.connect(processor);
        // Connect to destination to keep ScriptProcessor running (Chrome requirement)
        const silenceNode = micAudioContext.createGain();
        silenceNode.gain.value = 0;
        processor.connect(silenceNode);
        silenceNode.connect(micAudioContext.destination);

        // Step 5: Connect to Gemini Live API via @google/genai
        const ai = new GoogleGenAI({
          apiKey: sessionData.token,
          httpOptions: { apiVersion: 'v1alpha' },
        });

        const liveSession = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' },
              },
            },
            systemInstruction: {
              parts: [{ text: sessionData.systemInstruction }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            sessionResumption: {},
            contextWindowCompression: {},
          },
          callbacks: {
            onopen: () => {
              console.log('Gemini Live session opened successfully!');
              setStatus('connected');

              // Start session elapsed timer
              timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
              }, 1000);
            },
            onmessage: (message: LiveServerMessage) => {
              const sc = message.serverContent;
              if (!sc) return;

              // Store session resumption handle if provided
              const sessionResumption = (sc as Record<string, unknown>).sessionResumption as
                | { resumptionHandle?: string }
                | undefined;
              if (sessionResumption?.resumptionHandle) {
                resumptionHandleRef.current = sessionResumption.resumptionHandle;
              }

              // Interruption handling: user started speaking while agent was talking
              if (sc.interrupted) {
                console.log('Interruption detected: flushing agent audio queue');
                audioPlayerRef.current?.interrupt();
                setAgentSpeaking(false);
              }

              // Learner spoken transcript
              if (sc.inputTranscription?.text) {
                appendTranscriptFragment('learner', sc.inputTranscription.text);
              }

              // Agent spoken transcript
              if (sc.outputTranscription?.text) {
                appendTranscriptFragment('agent', sc.outputTranscription.text);
              }

              // Incoming agent audio stream
              if (sc.modelTurn?.parts) {
                for (const part of sc.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    setAgentSpeaking(true);
                    audioPlayerRef.current?.playChunk(part.inlineData.data);
                  }
                }
              }

              // Turn completion
              if (sc.turnComplete) {
                setAgentSpeaking(false);
              }
            },
            onerror: (err: unknown) => {
              console.error('Gemini Live error:', err);
              const errMsg =
                err instanceof Error ? err.message : 'Voice loop connection error occurred';
              setError(errMsg);
              setStatus('error');
            },
            onclose: (closeEvent: unknown) => {
              console.log('Gemini Live closed:', closeEvent);
              setStatus((prev) => (prev === 'finishing' ? 'finished' : 'idle'));
            },
          },
        });

        sessionRef.current = liveSession;

        // Step 6: Hook microphone audio processor to send PCM chunks
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (isMutedRef.current || !sessionRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate volume for UI visualizer (RMS)
          let sumSquares = 0;
          for (let i = 0; i < inputData.length; i++) {
            sumSquares += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sumSquares / inputData.length);
          setMicVolume(Math.min(1, rms * 5));

          // Downsample to 16kHz PCM
          const pcm16 = downsampleTo16k(inputData, micAudioContext.sampleRate);
          const base64Audio = int16ToBase64(pcm16);

          try {
            sessionRef.current.sendRealtimeInput({
              audio: {
                data: base64Audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (sendErr) {
            console.warn('Failed to stream audio chunk:', sendErr);
          }
        };
      } catch (err) {
        console.error('Failed to start session:', err);
        cleanupAudio();
        setError(err instanceof Error ? err.message : 'Could not start live voice session');
        setStatus('error');
      }
    },
    [cleanupAudio, appendTranscriptFragment]
  );

  const stopSession = useCallback(async () => {
    setStatus('finishing');

    const currentSessionId = sessionId;
    const finalTranscript = transcriptRef.current;

    cleanupAudio();

    if (currentSessionId) {
      try {
        await fetch(`/api/sessions/${currentSessionId}/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: finalTranscript.map((t) => ({
              speaker: t.speaker,
              text: t.text,
              lang: 'auto',
              at: t.at.toISOString(),
            })),
          }),
        });
      } catch (err) {
        console.error('Failed to save session transcript:', err);
      }
    }

    setStatus('finished');
  }, [sessionId, cleanupAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    status,
    error,
    sessionId,
    isMuted,
    micVolume,
    agentSpeaking,
    elapsedSeconds,
    targetMinutes,
    transcript,
    startSession,
    stopSession,
    toggleMute,
    resetSession: () => {
      cleanupAudio();
      setStatus('idle');
      setError(null);
      setTranscript([]);
      setSessionId(null);
      setElapsedSeconds(0);
    },
  };
}
