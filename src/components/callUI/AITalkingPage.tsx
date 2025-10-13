import { motion } from "framer-motion";
import { PhoneOverlay } from "./PhoneOverlay";
import { Waveform } from "./Waveform";

interface AITalkingPageProps {
  contactName: string;
  profileImage: string;
  onEndCall?: () => void;
  callDuration?: string;
}

export function AITalkingPage({ contactName, profileImage, onEndCall, callDuration }: AITalkingPageProps) {
  return (
    <div className="size-full relative overflow-hidden">
      {/* Background with gradient and glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#002B55] via-[#003d6b] to-[#002B55]">
        {/* Animated blue glow streak */}
        <motion.div
          className="absolute top-1/2 left-0 right-0 h-48 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0, 174, 239, 0.3) 0%, rgba(0, 76, 128, 0.2) 30%, transparent 70%)",
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Additional ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 30% 40%, rgba(0, 174, 239, 0.15) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Main Content Area - constrained to avoid phone overlap */}
      <div className="relative z-10 size-full flex flex-col items-center justify-center px-8 pr-[520px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl"
        >
          {/* Waveform */}
          <div className="relative">
            {/* Glow effect under waveform */}
            <div
              className="absolute inset-0 blur-xl"
              style={{
                background:
                  "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0, 174, 239, 0.4) 0%, transparent 70%)",
              }}
            />
            <Waveform />
          </div>
        </motion.div>
      </div>

      {/* Phone Overlay */}
      <PhoneOverlay 
        contactName={contactName} 
        profileImage={profileImage}
        onEndCall={onEndCall}
        callDuration={callDuration}
      />

      {/* App Title (top left) */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-white/90 text-2xl" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
          RealLead Trainer
        </h1>
        <p className="text-white/50 text-sm mt-1">Practice Call Simulation</p>
      </div>
    </div>
  );
}
