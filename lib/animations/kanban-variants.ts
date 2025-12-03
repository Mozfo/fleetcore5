/**
 * Kanban Animation Variants
 * Extend variants.ts avec patterns spécifiques au Kanban
 * Réutilise easing curves existantes
 */

import { Variants } from "framer-motion";

/**
 * Easing curve partagée (easeOutExpo)
 * Déjà définie dans variants.ts : [0.16, 1, 0.3, 1]
 */
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/**
 * Container Variants - Pour grids de cards avec stagger
 * OPTIMIZED: Stagger réduit de 100ms à 30ms, delay supprimé
 */
export const kanbanContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // 30ms = rapide mais visible (was 0.1)
      delayChildren: 0, // Pas de delay initial (was 0.2)
      when: "beforeChildren",
    },
  },
};

/**
 * Item Variants - Cards individuelles
 * OPTIMIZED: Blur supprimé (GPU intensive), durée réduite
 */
export const kanbanItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8, // Mouvement vertical réduit (was 20)
    // REMOVED: filter: "blur(10px)" - trop coûteux GPU
  },
  visible: {
    opacity: 1,
    y: 0,
    // REMOVED: filter: "blur(0px)"
    transition: {
      duration: 0.15, // Rapide (was 0.4)
      ease: "easeOut",
    },
  },
};

/**
 * Column Variants - Colonnes Kanban avec slide horizontal
 */
export const kanbanColumnVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: easeOutExpo,
    },
  },
};

/**
 * Card Hover - Pour hover states des cards
 */
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.02,
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.2,
      ease: [0.0, 0.0, 0.58, 1.0], // easeOut cubic-bezier
    },
  },
  tap: {
    scale: 0.98,
  },
};

/**
 * Filter Change - Pour transitions entre états de filtres
 */
export const filterTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOutExpo,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Badge Variants - Pour badges avec scale in
 */
export const badgeVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
};

/**
 * Empty State Variants - Pour états vides avec bounce
 */
export const emptyStateVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easeOutExpo,
    },
  },
};

/**
 * Stat Card Variants - Pour cards de stats avec slide up
 */
export const statCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easeOutExpo,
    },
  },
};

/**
 * Column Highlight - Pour hover state des colonnes (préparation DnD)
 */
export const columnHighlightVariants = {
  default: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    borderColor: "rgba(229, 231, 235, 1)", // gray-200
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    backgroundColor: "rgba(59, 130, 246, 0.05)", // blue-500/5
    borderColor: "rgba(59, 130, 246, 0.2)", // blue-500/20
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Loading State Variants - Pour skeleton loaders
 */
export const skeletonVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Progress Bar Variants - Pour barres de progression
 */
export const progressBarVariants = {
  initial: {
    width: 0,
  },
  animate: (percentage: number) => ({
    width: `${percentage}%`,
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  }),
};

/**
 * Float Animation - Pour icons flottants (empty states)
 */
export const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: [0.42, 0, 0.58, 1], // easeInOut cubic-bezier
    },
  },
};

/**
 * Number Animation Spring Config
 * Pour animations de nombres (stats)
 */
export const numberSpringConfig = {
  damping: 15,
  stiffness: 100,
};
