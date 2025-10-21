import { useEffect, useRef, useState } from "react";

// Simple FIFO queue for PCM16 Float32 chunks into WebAudio, with prebuffer target.

export function useAudioQueue(targetBufferMs = 100, sampleRate = 24000) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<Float32Array[]>([]);
  const playingRef = useRef(false);
  const [readyMs, setReadyMs] = useState(0);

  useEffect(() => {
    audioCtxRef.current = new AudioContext({ sampleRate });
    return () => { audioCtxRef.current?.close(); };
  }, [sampleRate]);

  const enqueue = (float32: Float32Array) => {
    queueRef.current.push(float32);
    const totalSamples = queueRef.current.reduce((acc, cur) => acc + cur.length, 0);
    setReadyMs((totalSamples / sampleRate) * 1000);
    if (!playingRef.current && readyMs >= targetBufferMs) playNext();
  };

  const playNext = () => {
    if (!audioCtxRef.current) return;
    if (queueRef.current.length === 0) { playingRef.current = false; return; }
    playingRef.current = true;
    const src = audioCtxRef.current.createBufferSource();
    const chunk = queueRef.current.shift()!;
    const buf = audioCtxRef.current.createBuffer(1, chunk.length, sampleRate);
    buf.copyToChannel(chunk, 0);
    src.buffer = buf;
    src.connect(audioCtxRef.current.destination);
    src.onended = () => { playNext(); };
    src.start();
  };

  return { enqueue, readyMs };
}

