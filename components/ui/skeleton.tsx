/**
 * Skeleton Component avec Shimmer Effect
 * Utilise Framer Motion pour animation fluide
 * Support dark mode
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

/**
 * Composant Skeleton de base avec effet shimmer
 *
 * @example
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-10 w-full rounded-lg" animate={false} />
 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
      )}
    </div>
  );
}

/**
 * Skeleton variants pré-configurés
 */
export const SkeletonVariants = {
  Text: ({ className }: { className?: string }) => (
    <Skeleton className={cn("h-4 w-full", className)} />
  ),

  Heading: ({ className }: { className?: string }) => (
    <Skeleton className={cn("h-6 w-3/4", className)} />
  ),

  Avatar: ({ className }: { className?: string }) => (
    <Skeleton className={cn("h-10 w-10 rounded-full", className)} />
  ),

  Button: ({ className }: { className?: string }) => (
    <Skeleton className={cn("h-10 w-24 rounded-md", className)} />
  ),

  Card: ({ className }: { className?: string }) => (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};
