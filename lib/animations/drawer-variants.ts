/**
 * Drawer Animation Variants (Framer Motion)
 *
 * Staggered animation for drawer content sections.
 * Uses the project's standard easing curve: [0.16, 1, 0.3, 1] (easeOutExpo)
 */

import { Variants } from "framer-motion";

/**
 * Container variants for drawer content
 * Orchestrates staggered children animations
 */
export const drawerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Section variants for individual drawer sections
 * Fade + slide up effect
 */
export const drawerSectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Score bar fill animation variants
 * Animated width from 0 to target percentage
 */
export const scoreBarVariants: Variants = {
  hidden: {
    scaleX: 0,
    originX: 0,
  },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.2,
    },
  },
};

/**
 * Badge variants for header badges
 * Scale + fade effect
 */
export const badgeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};
