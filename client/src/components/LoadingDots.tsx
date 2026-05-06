import { motion } from "framer-motion";

const dotTransition = {
  duration: 0.9,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut",
};

export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-slate-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ ...dotTransition, delay: index * 0.2 }}
        />
      ))}
    </div>
  );
}
