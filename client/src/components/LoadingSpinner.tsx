import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Curating scroll-stopping hooks...",
  "Researching what's trending right now...",
  "Finding the best context for your product...",
  "Writing hooks that stop the scroll...",
  "Building your first slideshow...",
  "Crafting visual stories that convert...",
  "Generating cinematic product scenes...",
];

export function LoadingSpinner() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-container">
      <div className="spinner" />
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          className="loading-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          {MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
