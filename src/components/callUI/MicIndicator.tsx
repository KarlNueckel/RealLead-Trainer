import { useEffect, useRef, useState } from "react";

interface MicIndicatorProps {
  active?: boolean; // legacy prop
  isActive?: boolean; // preferred prop for clarity
}

export function MicIndicator({ active, isActive }: MicIndicatorProps) {
  const enabled = (isActive ?? active ?? true);

  const [vars, setVars] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const smoothRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        if (!enabled) return; // idle visuals handled by defaults
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8; // analyser smoothing
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);

        const loop = () => {
          if (!mounted) return;
          analyser.getFloatTimeDomainData(buffer);
          // RMS
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i];
            sum += v * v;
          }
          let rms = Math.sqrt(sum / buffer.length);

          // Normalize and floor
          // Noise gate floor ~0.01 (very quiet), clamp 0..1
          const floor = 0.01;
          let level = Math.max(0, rms - floor) / (0.5 - floor);
          level = Math.min(1, level);

          // Exponential smoothing to avoid jitter
          const alpha = 0.15;
          const prev = smoothRef.current || 0;
          const smoothed = prev + alpha * (level - prev);
          smoothRef.current = smoothed;

          // Curved intensity mapping for nicer response
          const intensity = Math.pow(smoothed, 0.8); // 0..1

          // Map into CSS vars
                    // Idle factor halves visuals when quiet, restores to 1 as intensity rises
          const activityFactor = 0.5 + 1.0 * intensity;

          const rippleScaleMax = (3.5 + 2.5 * intensity) * 1.25 * activityFactor;
          const rippleOpacity = Math.min(1, (0.6 + 0.8 * intensity) * activityFactor);
          const glowAlpha = Math.min(1, (0.85 + 0.15 * intensity) * activityFactor);
          const glowSize = (1.5 + 1.5 * intensity) * 2.5 * activityFactor;
          const ringAlpha = Math.min(1, 0.3 + 0.7 * activityFactor);

          setVars({
            ["--ripple-scale-max" as any]: rippleScaleMax,
            ["--ripple-opacity" as any]: rippleOpacity,
            ["--glow-alpha" as any]: glowAlpha,
            ["--glow-size" as any]: glowSize,
             ["--ring-alpha" as any]: ringAlpha,
            ["--sat" as any]: (1 + 0.6 * intensity),
            ["--bri" as any]: (1 + 0.2 * intensity),
          } as React.CSSProperties);

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        // Permission denied or no mic: keep idle pulse by setting low-intensity vars
        setVars({
          ["--ripple-scale-max" as any]: 3.125,
          ["--ripple-opacity" as any]: 0.3,
          ["--glow-alpha" as any]: 0.5,
          ["--glow-size" as any]: 1.875,
           ["--ring-alpha" as any]: 0.4,
          ["--sat" as any]: 1,
          ["--bri" as any]: 1,
        } as React.CSSProperties);
      }
    };

    start();

    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      try {
        sourceRef.current?.disconnect();
      } catch {}
      try {
        analyserRef.current?.disconnect();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        if (ctx.state !== "closed") ctx.close().catch(() => {});
      }
    };
  }, [enabled]);

  return (
    <div className="mic-pulse" style={vars}><span className="mic-bloom" aria-hidden="true"></span><span className="mic-ring mic-ring--3" aria-hidden="true"></span></div>
  );
}

// Alias for clearer naming in call pages
export const ListeningIndicator = MicIndicator;











