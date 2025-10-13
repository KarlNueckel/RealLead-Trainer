import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** ─────────────────────────────────────────────────────────────────────────────
 *  TYPES
 *  ───────────────────────────────────────────────────────────────────────────*/
export type ScriptChunk = {
  speaker: "user" | "ai";
  text: string;
  label?: string;
};

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
  isUserSpeaking?: boolean;
};

const defaultTitle = "Voice Call Practice";

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const current = chunks[index];
  const totalSteps = chunks.length;

  const canPrev = index > 0;
  const canNext = index < totalSteps - 1 && !isAISpeaking; // Can't advance while AI is speaking

  /** ── NAVIGATION ───────────────────────────────────────────────────────────*/
  const goPrev = useCallback(() => {
    if (!canPrev) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((i) => i - 1);
      setIsTransitioning(false);
    }, 160);
  }, [canPrev, index]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setIsTransitioning(false);
    }, 160);
  }, [canNext, index]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Auto-start listening when on a user script slide
  useEffect(() => {
    if (!current || isAISpeaking) return;
    
    console.log("📝 User script slide - starting to listen for:", current.text.substring(0, 50));
    onStartUserListening?.();
    
    // Set up silence callback - when user stops talking, trigger AI response
    const handleSilence = () => {
      console.log("🤫 User stopped speaking - AI will respond");
      onStopUserListening?.();
      setIsAISpeaking(true);
    };
    
    onUserSilence?.(handleSilence);
    
    return () => {
      onStopUserListening?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isAISpeaking]);

  // Register AI finish callback - called by CallSimulationPage when AI audio ends
  useEffect(() => {
    if (!speakAI) return;
    
    const handleAIFinish = () => {
      console.log("✅ AI finished speaking - advancing to next slide");
      setIsAISpeaking(false);
      
      // Auto-advance to next script slide
      if (index < totalSteps - 1) {
        setTimeout(() => {
          setIndex(i => i + 1);
        }, 200); // Minimal pause before next slide for smooth transition
      }
    };
    
    // Register the callback with CallSimulationPage
    speakAI("", handleAIFinish);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]); // Re-register callback for each slide

  /** ── RENDER ───────────────────────────────────────────────────────────────*/
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F6FF] to-[#EFF6FF] relative flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/80 border-b border-blue-200/40 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-6xl px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            <span className="hidden md:inline text-gray-300">•</span>
            <span className="hidden md:inline text-blue-600 font-semibold text-lg">{scriptTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            {showTimerText && (
              <span className="text-blue-600 font-bold text-xl tabular-nums">{showTimerText}</span>
            )}
            <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Connected
            </span>
            <button
              onClick={onEndCall}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-red-500/20 hover:shadow-xl transition-all"
            >
              End Call
            </button>
          </div>
        </div>
      </header>

      {/* Main content - script OR AI speaking */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <AnimatePresence mode="wait">
          {!isAISpeaking ? (
            // Show user script slide
            <motion.div
              key={`script-${index}`}
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -20 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="text-center max-w-5xl"
            >
              {current?.label && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-2 mb-6 bg-blue-100 text-blue-700 font-bold uppercase tracking-wider text-xs rounded-full"
                >
                  {current.label}
                </motion.div>
              )}
              {current?.text ? (
                <p className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                  <span className="italic">&ldquo;{current.text}&rdquo;</span>
                </p>
              ) : (
                <p className="text-3xl text-red-600 font-bold">
                  ⚠️ No script text for this slide
                </p>
              )}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 text-lg text-gray-600"
              >
                💬 Speak this line naturally
              </motion.p>
            </motion.div>
          ) : (
            // Show AI speaking animation
            <motion.div
              key="ai-speaking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center justify-center"
            >
              <LargeSoundWave />
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10 text-2xl text-gray-700 font-semibold"
              >
                AI Prospect is responding…
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Indicator */}
      <div className="relative flex flex-col items-center justify-center mb-12">
        <motion.div
          animate={{ scale: isUserSpeaking ? [1, 1.2, 1] : isAISpeaking ? [1, 1.15, 1] : 1 }}
          transition={{ 
            type: "spring",
            stiffness: isUserSpeaking ? 150 : 100,
            damping: 15,
            repeat: (isUserSpeaking || isAISpeaking) ? Infinity : 0,
            duration: isUserSpeaking ? 1.2 : 1.8
          }}
          className={`w-24 h-24 rounded-full transition-colors duration-500 ${
            isAISpeaking
              ? "bg-gradient-to-br from-violet-500 to-violet-600 shadow-[0_0_50px_15px_rgba(139,92,246,0.35)]"
              : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_50px_15px_rgba(59,130,246,0.35)]"
          }`}
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-gray-700 text-lg font-semibold"
        >
          {isAISpeaking
            ? "🤖 AI Responding…"
            : isUserSpeaking
            ? "🎙️ You're speaking…"
            : "🫧 Ready when you are…"}
        </motion.p>
      </div>

      {/* Call Info Bar */}
      <div className="px-8 mb-6">
        <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl px-6 py-4 shadow-lg">
          <div className="flex items-center justify-center gap-6 text-sm font-semibold text-gray-700 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">📖</span>
              <span>Script {index + 1} of {totalSteps}</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span className="text-blue-600">{scriptTitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        {chunks.map((_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{
              width: i === index ? 40 : 8,
              backgroundColor: i === index ? "#3B82F6" : i < index ? "#93C5FD" : "#D1D5DB"
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-2.5 rounded-full"
          />
        ))}
      </div>

      {/* Navigation - prominent */}
      <div className="pb-10 w-full flex justify-center gap-6 px-12">
        <button
          onClick={goPrev}
          disabled={!canPrev || isTransitioning}
          className="px-10 py-4 rounded-xl bg-white/80 backdrop-blur-sm text-gray-700 font-semibold hover:bg-white hover:shadow-lg border-2 border-gray-300 hover:border-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg"
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          disabled={!canNext || isTransitioning}
          className="px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg"
        >
          Next →
        </button>
      </div>

      {/* Footer tip */}
      <footer className="pb-6 text-center text-sm text-gray-500 font-medium">
        💡 Speak your line naturally — AI will respond after you stop talking
      </footer>

      {/* DEBUG: Manual AI skip button */}
      {isAISpeaking && (
        <button
          onClick={() => {
            console.log("🔴 MANUAL DEBUG: Skipping AI response");
            setIsAISpeaking(false);
            if (index < totalSteps - 1) {
              setIndex(i => i + 1);
            }
          }}
          className="fixed top-24 right-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-bold z-50"
        >
          DEBUG: Skip AI
        </button>
      )}

      {/* DEBUG: Show current state */}
      <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-2 rounded-lg font-mono z-50">
        <div>Index: {index}/{totalSteps}</div>
        <div>AI Speaking: {isAISpeaking ? "YES" : "NO"}</div>
        <div>User Speaking: {isUserSpeaking ? "YES" : "NO"}</div>
        <div>Script: {current?.text?.substring(0, 20) || "NONE"}...</div>
      </div>
    </div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  LARGE SOUND WAVE
 *  ───────────────────────────────────────────────────────────────────────────*/
function LargeSoundWave() {
  const bars = 12;
  const heights = [50, 75, 60, 95, 70, 110, 85, 100, 65, 90, 75, 55];
  const delays = [0, 0.1, 0.05, 0.15, 0.08, 0.2, 0.12, 0.18, 0.06, 0.14, 0.1, 0.04];

  return (
    <div className="flex gap-3 items-end">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-violet-600 to-violet-400"
          initial={{ scaleY: 0.5, opacity: 0.6 }}
          animate={{ 
            scaleY: [0.5, 1.4, 0.6, 1.2, 0.5],
            opacity: [0.6, 1, 0.7, 1, 0.6]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            delay: delays[i],
            ease: "easeInOut"
          }}
          style={{
            height: `${heights[i]}px`,
            originY: 1
          }}
        />
      ))}
    </div>
  );
}
