import { motion } from "framer-motion";

export function Waveform() {
  // Generate 80 bars for the waveform
  const bars = Array.from({ length: 80 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-1 h-32">
      {bars.map((i) => {
        // Create varied animation delays and heights for natural wave effect
        const delay = i * 0.02;
        const baseHeight = Math.sin(i * 0.15) * 30 + 40;
        
        return (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-[#00AEEF] via-[#004C80] to-[#00AEEF] rounded-full"
            initial={{ height: 4 }}
            animate={{
              height: [
                baseHeight * 0.3,
                baseHeight,
                baseHeight * 1.2,
                baseHeight * 0.5,
                baseHeight * 0.3,
              ],
              opacity: [0.4, 1, 1, 0.7, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
            style={{
              filter: "drop-shadow(0 0 8px rgba(0, 174, 239, 0.6))",
            }}
          />
        );
      })}
    </div>
  );
}
