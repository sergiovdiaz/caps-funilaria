import { motion } from "framer-motion";
import "./styles/AnimatedPage.css";

const animations = {
  up: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
};

export default function AnimatedPage({ children }) {
  return (
    <>
      <div className="savision-container" /> {/* fundo fixo da tela */}
      <motion.div
        className="motion-page"
        initial={animations.up.initial}
        animate={animations.up.animate}
        exit={animations.up.exit}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </>
  );
}
