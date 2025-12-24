"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModulesSidebar } from "./ModulesSidebar";
import { AppHeader } from "./AppHeader";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Main layout wrapper for authenticated app pages
 *
 * Features:
 * - Persistent sidebar with modules navigation
 * - Responsive design with mobile drawer
 * - Fixed header with user controls
 */
export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar - always visible on lg+ */}
      <div className="hidden lg:block">
        <ModulesSidebar className="fixed inset-y-0 left-0 z-50" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <ModulesSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={cn("flex flex-1 flex-col", "lg:pl-64")}>
        {/* Header */}
        <AppHeader
          showMenuButton
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Page Content */}
        <main className="relative flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
