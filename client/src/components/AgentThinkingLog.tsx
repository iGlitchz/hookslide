import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THINKING_STEPS = [
  "[1/3] Analyzing image visual framing...",
  "[2/3] Generating curiosity-gap viral hooks...",
  "[3/3] Compositing 9:16 high-contrast layouts...",
];

export function AgentThinkingLog() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < THINKING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="agent-thinking-log">
      <div className="thinking-header">
        <span className="thinking-pulse" />
        <span className="thinking-title">AGENT REASONING STATUS</span>
      </div>

      <div className="thinking-steps">
        {THINKING_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          return (
            <AnimatePresence key={step}>
              {(isDone || isActive) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: isActive ? 1 : 0.45, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`thinking-step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                >
                  <span className="step-text">{step}</span>
                  {isActive && <span className="step-spinner" />}
                  {isDone && <span className="step-check">✓</span>}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}
