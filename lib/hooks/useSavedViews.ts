"use client";

/**
 * useSavedViews - Hook pour gérer les vues sauvegardées (E2-B)
 * Pattern: HubSpot/Salesforce/Notion saved views
 * Persistance: localStorage
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  SavedView,
  SavedViewConfig,
  SavedViewsState,
  CreateViewInput,
  UpdateViewInput,
} from "@/lib/types/views";
import {
  DEFAULT_COLUMN_ORDER,
  DEFAULT_COLUMN_WIDTHS,
  DEFAULT_LEADS_COLUMNS,
} from "@/lib/config/leads-columns";

const STORAGE_KEY = "crm_leads_saved_views";

// Configuration par défaut pour les vues
const DEFAULT_CONFIG: SavedViewConfig = {
  viewMode: "kanban",
  advancedFilters: null,
  basicFilters: {
    status: "all",
    lead_stage: "all",
    assigned_to: "all",
    country_code: "all",
    min_score: undefined,
    search: undefined,
  },
  visibleColumns: DEFAULT_LEADS_COLUMNS.filter((c) => c.defaultVisible).map(
    (c) => c.key
  ),
  columnOrder: DEFAULT_COLUMN_ORDER,
  columnWidths: DEFAULT_COLUMN_WIDTHS,
  sortColumn: "created_at",
  sortDirection: "desc",
};

// Vues par défaut (built-in, non supprimables)
const BUILT_IN_VIEWS: SavedView[] = [
  {
    id: "all-leads",
    name: "All Leads",
    isDefault: true,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    config: { ...DEFAULT_CONFIG },
  },
  {
    id: "new-this-week",
    name: "New This Week",
    isDefault: false,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    config: {
      ...DEFAULT_CONFIG,
      viewMode: "table",
      advancedFilters: {
        id: "new-this-week-group",
        logic: "AND",
        conditions: [
          {
            id: "new-this-week-condition",
            field: "created_at",
            operator: "greater_than",
            value: getDateDaysAgo(7),
          },
        ],
        groups: [],
      },
    },
  },
  {
    id: "qualified-leads",
    name: "Qualified Leads",
    isDefault: false,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    config: {
      ...DEFAULT_CONFIG,
      viewMode: "kanban",
      advancedFilters: {
        id: "qualified-group",
        logic: "AND",
        conditions: [
          {
            id: "qualified-condition",
            field: "lead_stage",
            operator: "equals",
            value: "sales_qualified",
          },
        ],
        groups: [],
      },
    },
  },
];

// Helper pour calculer une date il y a N jours (format ISO)
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

export interface UseSavedViewsReturn {
  // State
  views: SavedView[];
  activeViewId: string | null;
  activeView: SavedView | null;
  mounted: boolean;

  // CRUD
  saveView: (input: CreateViewInput) => SavedView;
  updateView: (id: string, updates: UpdateViewInput) => void;
  deleteView: (id: string) => boolean;
  setDefaultView: (id: string) => void;

  // Actions
  applyView: (id: string) => SavedView | null;
  getCurrentConfig: () => SavedViewConfig;
}

export function useSavedViews(
  // Callback pour appliquer une config (appelé quand on sélectionne une vue)
  onApplyConfig?: (config: SavedViewConfig) => void,
  // Fonction pour récupérer la config actuelle (pour sauvegarder)
  getCurrentConfigFn?: () => SavedViewConfig
): UseSavedViewsReturn {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<SavedViewsState>({
    views: BUILT_IN_VIEWS,
    activeViewId: "all-leads",
  });

  // Load from localStorage on mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedViewsState = JSON.parse(saved);
        // Merge built-in views avec les vues sauvegardées
        const customViews = parsed.views.filter((v) => !v.isBuiltIn);
        setState({
          views: [...BUILT_IN_VIEWS, ...customViews],
          activeViewId: parsed.activeViewId || "all-leads",
        });
      }
    } catch {
      // Silently fail - use defaults
    }
  }, []);

  // Save to localStorage on change (only after mount, exclude built-in views for storage)
  useEffect(() => {
    if (!mounted) return;
    try {
      const customViews = state.views.filter((v) => !v.isBuiltIn);
      const toSave: SavedViewsState = {
        views: customViews,
        activeViewId: state.activeViewId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Silently fail
    }
  }, [state, mounted]);

  // Get active view
  const activeView = useMemo(() => {
    return state.views.find((v) => v.id === state.activeViewId) || null;
  }, [state.views, state.activeViewId]);

  // Save new view
  const saveView = useCallback((input: CreateViewInput): SavedView => {
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name: input.name,
      isDefault: input.isDefault || false,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      config: input.config,
    };

    setState((prev) => {
      let updatedViews = [...prev.views, newView];

      // Si cette vue est définie comme défaut, enlever le défaut des autres
      if (newView.isDefault) {
        updatedViews = updatedViews.map((v) =>
          v.id === newView.id ? v : { ...v, isDefault: false }
        );
      }

      return {
        views: updatedViews,
        activeViewId: newView.id,
      };
    });

    return newView;
  }, []);

  // Update view
  const updateView = useCallback((id: string, updates: UpdateViewInput) => {
    setState((prev) => {
      const view = prev.views.find((v) => v.id === id);
      if (!view || view.isBuiltIn) return prev; // Can't update built-in views

      let updatedViews = prev.views.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      );

      // Si on définit cette vue comme défaut, enlever le défaut des autres
      if (updates.isDefault) {
        updatedViews = updatedViews.map((v) =>
          v.id === id ? v : { ...v, isDefault: false }
        );
      }

      return { ...prev, views: updatedViews };
    });
  }, []);

  // Delete view
  const deleteView = useCallback(
    (id: string): boolean => {
      const view = state.views.find((v) => v.id === id);
      if (!view || view.isBuiltIn) return false; // Can't delete built-in views

      setState((prev) => ({
        views: prev.views.filter((v) => v.id !== id),
        activeViewId:
          prev.activeViewId === id ? "all-leads" : prev.activeViewId,
      }));

      return true;
    },
    [state.views]
  );

  // Set default view
  const setDefaultView = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      views: prev.views.map((v) => ({
        ...v,
        isDefault: v.id === id,
      })),
    }));
  }, []);

  // Apply view (select and apply config)
  const applyView = useCallback(
    (id: string): SavedView | null => {
      const view = state.views.find((v) => v.id === id);
      if (!view) return null;

      setState((prev) => ({ ...prev, activeViewId: id }));

      // Appeler le callback pour appliquer la config
      if (onApplyConfig) {
        onApplyConfig(view.config);
      }

      return view;
    },
    [state.views, onApplyConfig]
  );

  // Get current config (for saving)
  const getCurrentConfig = useCallback((): SavedViewConfig => {
    if (getCurrentConfigFn) {
      return getCurrentConfigFn();
    }
    return DEFAULT_CONFIG;
  }, [getCurrentConfigFn]);

  return {
    views: state.views,
    activeViewId: state.activeViewId,
    activeView,
    mounted,
    saveView,
    updateView,
    deleteView,
    setDefaultView,
    applyView,
    getCurrentConfig,
  };
}
