import { motion } from "framer-motion";

const GraffitiText = ({ text, className = "", delay = 0 }) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`inline-block ${className}`}
    >
      {text}
    </motion.span>
  );
};

export default GraffitiText;
