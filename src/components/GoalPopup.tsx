import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GoalPopup({ onClose, steps, title = "Your Goal" }: { onClose?: () => void; steps: string[]; title?: string }) {
  const [show, setShow] = useState(true);

  const handleClose = () => {
    setShow(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl p-10 sm:p-12 max-w-2xl w-[94%]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-5 text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl"
              aria-label="Close goal dialog"
            >
              ×
            </button>
            <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-center">{title}</h2>
            <ol className="list-decimal pl-8 space-y-4 text-gray-800 mb-10 text-xl sm:text-2xl leading-relaxed">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="bg-blue-600 text-white px-7 py-3 rounded-xl hover:bg-blue-700 transition text-lg sm:text-xl"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
