import { motion } from "framer-motion";

export function MicIndicator() {
  return (
    <div className="relative flex items-center justify-center h-20">
      {/* Expanding circles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-12 h-12 rounded-full border-2 border-[#00AEEF]"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{
            scale: [0.8, 2, 2.5],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Center circle */}
      <motion.div
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#004C80] shadow-lg"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          filter: "drop-shadow(0 0 16px rgba(0, 174, 239, 0.8))",
        }}
      />
    </div>
  );
}
