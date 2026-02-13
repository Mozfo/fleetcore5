"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  animate = true,
  ...props
}: React.ComponentProps<"div"> & { animate?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
      {...props}
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

const SkeletonVariants = {
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

export { Skeleton, SkeletonVariants };
