/**
 * Types pour les Saved Views (E2-B)
 * Pattern: HubSpot/Salesforce/Notion saved views
 */

import type { FilterGroup } from "@/lib/config/filter-config";
import type { LeadsFilters } from "@/components/crm/leads/LeadsFilterBar";

// Configuration complète d'une vue
export interface SavedViewConfig {
  viewMode: "kanban" | "table";
  advancedFilters: FilterGroup | null;
  basicFilters: LeadsFilters;
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

// Vue sauvegardée
export interface SavedView {
  id: string;
  name: string;
  isDefault: boolean;
  isBuiltIn: boolean; // Vues système non supprimables
  createdAt: string;
  config: SavedViewConfig;
}

// État du store des vues
export interface SavedViewsState {
  views: SavedView[];
  activeViewId: string | null;
}

// Type pour création de vue (sans id/createdAt)
export type CreateViewInput = {
  name: string;
  isDefault?: boolean;
  config: SavedViewConfig;
};

// Type pour mise à jour de vue
export type UpdateViewInput = Partial<
  Omit<SavedView, "id" | "isBuiltIn" | "createdAt">
>;
