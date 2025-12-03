"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import type {
  DashboardLayout,
  DashboardLayoutItem,
  WidgetId,
} from "@/lib/types/dashboard";
import { DEFAULT_LAYOUT } from "@/lib/types/dashboard";

const STORAGE_KEY = "fleetcore_dashboard_layout";
const API_ENDPOINT = "/api/v1/dashboard/layout";

// SWR fetcher
const fetcher = async (url: string): Promise<DashboardLayout | null> => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch layout");
  }
  const json = await res.json();
  return json.data || null;
};

/**
 * Hook for managing dashboard layout with persistence
 *
 * Strategy:
 * 1. Try to fetch from API (database)
 * 2. Fallback to localStorage
 * 3. Use default layout if neither exists
 *
 * Changes are saved to both localStorage (immediate) and API (debounced)
 */
export function useDashboardLayout() {
  const { user } = useUser();
  const userId = user?.id || "";

  // Local state for immediate updates
  const [localLayout, setLocalLayout] = useState<DashboardLayout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch from API
  const {
    data: apiLayout,
    error,
    isLoading,
    mutate,
  } = useSWR<DashboardLayout | null>(
    userId ? `${API_ENDPOINT}?userId=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardLayout;
        // Only use if it matches current user
        if (parsed.userId === userId || !parsed.userId) {
          setLocalLayout(parsed);
        }
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, [userId]);

  // Sync API data to local state when loaded
  useEffect(() => {
    if (apiLayout && !localLayout) {
      setLocalLayout(apiLayout);
      // Also save to localStorage for offline access
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiLayout));
      } catch {
        // Storage full or disabled
      }
    }
  }, [apiLayout, localLayout]);

  // Get the active layout (local > API > default)
  // Memoize to prevent new object reference on every render
  const layout: DashboardLayout = useMemo(
    () =>
      localLayout ||
      apiLayout || {
        ...DEFAULT_LAYOUT,
        userId,
      },
    [localLayout, apiLayout, userId]
  );

  /**
   * Update layout locally and persist
   */
  const updateLayout = useCallback(
    async (newLayouts: DashboardLayout["layouts"]) => {
      const updatedLayout: DashboardLayout = {
        ...layout,
        userId,
        layouts: newLayouts,
        updatedAt: new Date().toISOString(),
      };

      // Immediate local update
      setLocalLayout(updatedLayout);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLayout));
      } catch {
        // Storage full or disabled
      }

      // Save to API (debounced by caller if needed)
      setIsSaving(true);
      try {
        await fetch(API_ENDPOINT, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedLayout),
        });
        await mutate(updatedLayout, false);
      } catch {
        // API save failed, but localStorage is saved
      } finally {
        setIsSaving(false);
      }
    },
    [layout, userId, mutate]
  );

  /**
   * Add a widget to the dashboard
   */
  const addWidget = useCallback(
    (widgetId: WidgetId, position?: { x: number; y: number }) => {
      if (layout.enabledWidgets.includes(widgetId)) return;

      const newItem: DashboardLayoutItem = {
        i: widgetId,
        x: position?.x ?? 0,
        y: position?.y ?? Infinity, // Add at bottom
        w: 3,
        h: 2,
      };

      const newLayouts = {
        lg: [...layout.layouts.lg, newItem],
        md: [...layout.layouts.md, newItem],
        sm: [...layout.layouts.sm, newItem],
      };

      const updatedLayout: DashboardLayout = {
        ...layout,
        layouts: newLayouts,
        enabledWidgets: [...layout.enabledWidgets, widgetId],
        updatedAt: new Date().toISOString(),
      };

      setLocalLayout(updatedLayout);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLayout));
      } catch {
        // Ignore
      }
    },
    [layout]
  );

  /**
   * Remove a widget from the dashboard
   */
  const removeWidget = useCallback(
    (widgetId: WidgetId) => {
      const newLayouts = {
        lg: layout.layouts.lg.filter((item) => item.i !== widgetId),
        md: layout.layouts.md.filter((item) => item.i !== widgetId),
        sm: layout.layouts.sm.filter((item) => item.i !== widgetId),
      };

      const updatedLayout: DashboardLayout = {
        ...layout,
        layouts: newLayouts,
        enabledWidgets: layout.enabledWidgets.filter((id) => id !== widgetId),
        updatedAt: new Date().toISOString(),
      };

      setLocalLayout(updatedLayout);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLayout));
      } catch {
        // Ignore
      }
    },
    [layout]
  );

  /**
   * Reset to default layout
   */
  const resetLayout = useCallback(async () => {
    const defaultWithUser: DashboardLayout = {
      ...DEFAULT_LAYOUT,
      userId,
      updatedAt: new Date().toISOString(),
    };

    setLocalLayout(defaultWithUser);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWithUser));
    } catch {
      // Ignore
    }

    setIsSaving(true);
    try {
      await fetch(API_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultWithUser),
      });
      await mutate(defaultWithUser, false);
    } catch {
      // Ignore
    } finally {
      setIsSaving(false);
    }
  }, [userId, mutate]);

  return {
    layout,
    layouts: layout.layouts,
    enabledWidgets: layout.enabledWidgets,
    isLoading: isLoading && !localLayout,
    isSaving,
    error,
    updateLayout,
    addWidget,
    removeWidget,
    resetLayout,
  };
}
