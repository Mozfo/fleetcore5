"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModulesSidebar } from "./ModulesSidebar";
import { AppHeader } from "./AppHeader";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Main layout wrapper for authenticated app pages
 *
 * FleetCore Design System V1 layout:
 * - Header (56px) full-width at top
 * - Sidebar (collapsible 56px/240px) + Content below
 * - Responsive with mobile drawer
 */
export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="bg-fc-bg-app flex h-screen flex-col dark:bg-gray-950">
      {/* Header - full width, 56px */}
      <AppHeader
        showMenuButton
        onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - in flow, shrink-0 */}
        <div className="hidden shrink-0 lg:block">
          <ModulesSidebar
            isExpanded={isSidebarExpanded}
            onToggleExpand={() => setIsSidebarExpanded((prev) => !prev)}
          />
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
                className="fixed inset-0 top-14 z-40 bg-black/50 lg:hidden"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-14 bottom-0 left-0 z-50 lg:hidden"
              >
                <ModulesSidebar isExpanded />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <main className="relative flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
