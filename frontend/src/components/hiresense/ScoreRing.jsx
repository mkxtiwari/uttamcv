import { motion } from "framer-motion";

export default function ScoreRing({ score = 0, size = 200 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clamped / 100);
  const color = clamped >= 75 ? "#10B981" : clamped >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F4F4F5" strokeWidth="12" fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth="12" strokeLinecap="round" fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 2px 8px ${color}33)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="font-heading text-6xl font-semibold tracking-tighter"
          style={{ color }}
        >
          {clamped}
        </motion.div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Match Score</p>
      </div>
    </div>
  );
}