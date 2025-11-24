/**
 * EmptyState Component
 * État vide élégant avec icon animé, message et CTA
 * Support dark mode
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

/**
 * EmptyState - État vide élégant
 *
 * @example
 * <EmptyState
 *   icon={<Inbox className="h-12 w-12" />}
 *   title="No leads yet"
 *   description="Start by creating your first lead"
 *   action={{
 *     label: "Create Lead",
 *     onClick: handleCreate,
 *     icon: <Plus className="h-4 w-4" />
 *   }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      {/* Icon animé (float) */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut",
        }}
        className="text-gray-300 dark:text-gray-700"
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 text-sm font-medium text-gray-900 dark:text-white"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center gap-3"
        >
          {action && (
            <Button onClick={action.onClick} size="sm">
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size="sm"
            >
              {secondaryAction.icon && (
                <span className="mr-2">{secondaryAction.icon}</span>
              )}
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Variants pré-configurés pour cas d'usage communs
 */
export const EmptyStateVariants = {
  NoResults: ({
    onReset,
    searchTerm,
  }: {
    onReset?: () => void;
    searchTerm?: string;
  }) => {
    const SearchX = ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6"
        />
      </svg>
    );

    return (
      <EmptyState
        icon={<SearchX className="h-16 w-16" />}
        title="No results found"
        description={
          searchTerm
            ? `No results for "${searchTerm}". Try adjusting your search.`
            : "Try adjusting your filters or search term"
        }
        action={
          onReset
            ? {
                label: "Clear filters",
                onClick: onReset,
              }
            : undefined
        }
      />
    );
  },

  NoData: ({ onCreate }: { onCreate?: () => void }) => {
    const Inbox = ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
        />
      </svg>
    );

    return (
      <EmptyState
        icon={<Inbox className="h-16 w-16" />}
        title="No data yet"
        description="Get started by creating your first item"
        action={
          onCreate
            ? {
                label: "Create",
                onClick: onCreate,
              }
            : undefined
        }
      />
    );
  },
};
