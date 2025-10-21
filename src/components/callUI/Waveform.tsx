import { motion } from "framer-motion";

export function Waveform() {
  // Generate flexible number of bars that will stretch across full width
  const bars = Array.from({ length: 140 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center w-full h-56">
      {bars.map((i) => {
        // Create varied animation delays and heights for natural wave effect
        const delay = i * 0.012;
        const baseHeight = Math.sin(i * 0.12) * 60 + 80; // bigger amplitude and baseline
        
        return (
          <motion.div
            key={i}
            className="flex-1 mx-[1px] bg-gradient-to-t from-[#00AEEF] via-[#004C80] to-[#00AEEF] rounded-full"
            initial={{ height: 8 }}
            animate={{
              height: [
                baseHeight * 0.4,
                baseHeight,
                baseHeight * 1.3,
                baseHeight * 0.6,
                baseHeight * 0.4,
              ],
              opacity: [0.35, 1, 1, 0.65, 0.35],
            }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
            style={{
              filter: "drop-shadow(0 0 12px rgba(0, 174, 239, 0.55))",
            }}
          />
        );
      })}
    </div>
  );
}
