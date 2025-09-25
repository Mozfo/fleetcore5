"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, y: 0, backdropFilter: "blur(20px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/20",
        "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
        "backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
