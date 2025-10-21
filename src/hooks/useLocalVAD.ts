import { useEffect, useRef, useState } from "react";

// Simple RMS-based local VAD with short hangover.
// onSpeechEnd fires when silence > silenceMs after speech was active.

export function useLocalVAD(stream: MediaStream | null, opts?: { sampleRate?: number; silenceMs?: number; threshold?: number }) {
  const silenceMs = opts?.silenceMs ?? 300;
  const threshold = opts?.threshold ?? 0.02;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastVoiceTsRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new AudioContext({ sampleRate: 24000 });
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    source.connect(analyser);

    const data = new Float32Array(analyser.fftSize);

    const loop = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i] * data[i];
      }
      const rms = Math.sqrt(sum / (data.length / 4));
      const now = Date.now();
      const speaking = rms > threshold;
      if (speaking) lastVoiceTsRef.current = now;
      if (speaking !== isSpeaking) setIsSpeaking(speaking);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { source.disconnect(); } catch {}
      try { analyser.disconnect(); } catch {}
      try { audioCtx.close(); } catch {}
    };
  }, [stream]);

  const isSilenceFor = () => Date.now() - lastVoiceTsRef.current;

  return { isSpeaking, isSilenceFor };
}

