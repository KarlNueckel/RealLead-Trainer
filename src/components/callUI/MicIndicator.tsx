import { motion } from "framer-motion";

interface MicIndicatorProps {
  active?: boolean; // legacy prop
  isActive?: boolean; // preferred prop for clarity
}

export function MicIndicator({ active, isActive }: MicIndicatorProps) {
  const on = isActive ?? active ?? false;
  return (
    <div className="relative flex items-center justify-center h-20">
      {/* Expanding circles when active */}
      {on && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-12 h-12 rounded-full border-2 border-[#00AEEF]"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{
            scale: [0.8, 2, 2.5],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: i * 0.45,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Center circle */}
      <motion.div
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#004C80] shadow-lg"
        animate={on ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: on ? 1.2 : 0.2, repeat: on ? Infinity : 0, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 0 16px rgba(0, 174, 239, 0.8))" }}
      />
    </div>
  );
}

// Alias for clearer naming in call pages
export const ListeningIndicator = MicIndicator;
