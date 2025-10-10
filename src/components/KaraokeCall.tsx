import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** ─────────────────────────────────────────────────────────────────────────────
 *  TYPES
 *  ───────────────────────────────────────────────────────────────────────────*/
export type ScriptChunk = {
  speaker: "user" | "ai";
  text: string;
  label?: string;
};

type Phase = "user" | "ai";

type Props = {
  title?: string;
  scriptTitle?: string;
  chunks: ScriptChunk[];
  onEndCall?: () => void;
  onStartUserListening?: () => void;
  onStopUserListening?: () => void;
  onUserSilence?: (cb: () => void) => void;
  speakAI?: (text: string, onend: () => void) => void;
  showTimerText?: string;
  isUserSpeaking?: boolean; // New: to control breathing circle
};

const defaultTitle = "Voice Call in Progress";

/** ─────────────────────────────────────────────────────────────────────────────
 *  MAIN COMPONENT
 *  ───────────────────────────────────────────────────────────────────────────*/
export default function KaraokeCall({
  title = defaultTitle,
  scriptTitle = "Script",
  chunks,
  onEndCall,
  onStartUserListening,
  onStopUserListening,
  onUserSilence,
  speakAI,
  showTimerText,
  isUserSpeaking = false,
}: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => (chunks[0]?.speaker === "ai" ? "ai" : "user"));
  const [isTransitioning, setIsTransitioning] = useState(false);

  const current = chunks[index];
  const totalSteps = chunks.length;

  const canPrev = index > 0;
  const canNext = index < totalSteps - 1;

  const aiSpeakingRef = useRef(false);
  const stepLabel = useMemo(() => `Step ${index + 1} of ${totalSteps}`, [index, totalSteps]);

  /** ── NAVIGATION ───────────────────────────────────────────────────────────*/
  const goPrev = useCallback(() => {
    if (!canPrev) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((i) => i - 1);
      setPhase(chunks[index - 1].speaker);
      setIsTransitioning(false);
    }, 160);
  }, [canPrev, chunks, index]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setPhase(chunks[index + 1].speaker);
      setIsTransitioning(false);
    }, 160);
  }, [canNext, chunks, index]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  /** ── PHASE: USER ──────────────────────────────────────────────────────────*/
  useEffect(() => {
    if (!current) return;
    if (phase !== "user" || current.speaker !== "user") return;

    onStartUserListening?.();

    const stopOnSilence = () => {
      onStopUserListening?.();
      if (index < totalSteps - 1) {
        const nextChunk = chunks[index + 1];
        if (nextChunk.speaker === "ai") {
          // Advance to AI chunk FIRST, then switch phase
          setIndex((i) => i + 1);
          setPhase("ai");
        } else {
          // Next is also user, just advance
          setIndex((i) => i + 1);
          setPhase("user");
        }
      }
    };

    onUserSilence?.(stopOnSilence);
    return () => {
      onStopUserListening?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, current?.speaker]);

  /** ── PHASE: AI ────────────────────────────────────────────────────────────*/
  useEffect(() => {
    console.log("🔍 AI phase useEffect:", { phase, currentSpeaker: current?.speaker, index });
    
    if (!current) {
      console.log("❌ No current chunk");
      return;
    }
    if (phase !== "ai") {
      console.log("❌ Phase is not 'ai':", phase);
      return;
    }
    if (current.speaker !== "ai") {
      console.log("❌ Current speaker is not 'ai':", current.speaker);
      return;
    }
    if (!speakAI) {
      console.log("❌ No speakAI function provided");
      return;
    }
    if (aiSpeakingRef.current) {
      console.log("❌ AI already speaking (guard)");
      return;
    }

    console.log("✅ All checks passed - calling speakAI");
    aiSpeakingRef.current = true;
    speakAI(current.text, () => {
      console.log("🎉 AI onend callback fired!");
      aiSpeakingRef.current = false;
      if (index < totalSteps - 1) {
        setIndex((i) => i + 1);
        setPhase("user");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, current?.speaker]);

  /** ── RENDER ───────────────────────────────────────────────────────────────*/
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8EEFF] via-[#F3F6FF] to-[#FFFFFF] relative flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/70 border-b border-blue-100/50 sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold text-[#1E1E1E]">{title}</h1>
            <span className="hidden md:inline text-gray-400">•</span>
            <span className="hidden md:inline text-blue-600 font-medium">{scriptTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            {showTimerText && (
              <span className="text-blue-600 font-semibold text-lg">{showTimerText}</span>
            )}
            <span className="text-green-600 text-sm font-medium">● Connected</span>
            <button
              onClick={onEndCall}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              End Call
            </button>
          </div>
        </div>
      </header>

      {/* Main content - floating script text */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <AnimatePresence mode="wait">
          {phase === "user" && current?.speaker === "user" && (
            <motion.div
              key={`user-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-5xl"
            >
              {current?.label && (
                <div className="text-sm text-blue-600 font-semibold uppercase tracking-wide mb-4">
                  {current.label}
                </div>
              )}
              <p className="text-5xl md:text-6xl font-semibold text-[#0F172A] leading-snug tracking-wide">
                <span className="italic">&ldquo;{current?.text}&rdquo;</span>
              </p>
            </motion.div>
          )}

          {phase === "ai" && (
            <motion.div
              key="ai-speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center mt-12"
            >
              <LargeSoundWave />
              <p className="mt-8 text-xl text-gray-600 font-medium">
                AI Prospect is speaking…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Breathing circle indicator */}
      <div className="relative flex flex-col items-center justify-center mb-12">
        <motion.div
          animate={{ scale: isUserSpeaking ? [1, 1.2, 1] : [1, 1.15, 1] }}
          transition={{ 
            repeat: Infinity, 
            duration: isUserSpeaking ? 1.5 : 2, 
            ease: "easeInOut" 
          }}
          className={`w-20 h-20 rounded-full transition-all duration-500 ${
            phase === "user"
              ? "bg-blue-500 shadow-[0_0_40px_10px_rgba(37,99,235,0.3)]"
              : "bg-violet-500 shadow-[0_0_40px_10px_rgba(139,92,246,0.3)]"
          }`}
        />
        <p className="mt-4 text-gray-600 text-lg font-medium">
          {isUserSpeaking 
            ? "🎙️ You're speaking…"
            : phase === "user"
            ? "🫧 Waiting for your response…"
            : "🤖 AI Prospect Responding…"}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {chunks.map((_, i) => (
          <span
            key={i}
            className={
              "h-2 rounded-full transition-all duration-300 " +
              (i === index ? "w-10 bg-blue-600" : i < index ? "w-2 bg-blue-400" : "w-2 bg-gray-300")
            }
          />
        ))}
      </div>

      {/* Navigation - subtle, low placement */}
      <div className="pb-8 w-full flex justify-between px-12 text-gray-700">
        <button
          onClick={goPrev}
          disabled={!canPrev || isTransitioning}
          className="px-6 py-2 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          disabled={!canNext || isTransitioning}
          className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>

      {/* Footer tip - very subtle */}
      <footer className="pb-4 text-center text-xs text-gray-400">
        💡 Speak naturally — the AI detects when you start and stop talking.
      </footer>

      {/* DEBUG BUTTON - Remove this in production */}
      {phase === "ai" && (
        <button
          onClick={() => {
            console.log("🔴 MANUAL DEBUG: Simulating AI finish");
            if (index < totalSteps - 1) {
              setIndex((i) => i + 1);
              setPhase("user");
            }
          }}
          className="fixed top-24 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-bold z-50"
        >
          DEBUG: Skip AI
        </button>
      )}
    </div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  LARGE SOUND WAVE
 *  ───────────────────────────────────────────────────────────────────────────*/
function LargeSoundWave() {
  const bars = 8;
  const heights = [60, 90, 70, 100, 75, 95, 80, 65];

  return (
    <>
      <div className="flex gap-2.5 items-end">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="w-4 rounded-full bg-violet-500/90"
            style={{
              height: `${heights[i]}px`,
              animation: "wave 1s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.6); opacity: .7; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
      `}</style>
    </>
  );
}
