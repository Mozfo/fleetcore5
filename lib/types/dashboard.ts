/**
 * Dashboard Widget Types
 *
 * Architecture for react-grid-layout based customizable dashboard
 */

import type { Layout } from "react-grid-layout";

// Widget identifiers
export type WidgetId =
  // CRM Widgets
  | "crm_leads_today"
  | "crm_leads_week"
  | "crm_conversion_rate"
  | "crm_pipeline_value"
  | "crm_top_sources"
  | "crm_recent_activity"
  | "crm_leads_by_status"
  | "crm_leads_by_country"
  // Fleet Widgets
  | "fleet_total_vehicles"
  | "fleet_active_vehicles"
  | "fleet_maintenance_due"
  | "fleet_utilization"
  // Driver Widgets
  | "drivers_total"
  | "drivers_active"
  | "drivers_pending_docs"
  // Analytics Widgets
  | "analytics_revenue"
  | "analytics_growth"
  // Quick Actions
  | "quick_actions";

// Widget size constraints
export interface WidgetSize {
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
  defaultW: number;
  defaultH: number;
}

// Widget definition
export interface WidgetConfig {
  id: WidgetId;
  titleKey: string; // i18n key
  descriptionKey?: string;
  component: string; // Component name to render
  permission?: string; // Required permission (e.g., "crm:view")
  size: WidgetSize;
  refreshInterval?: number; // Auto-refresh in ms (optional)
}

// Layout item extends react-grid-layout Layout
export interface DashboardLayoutItem extends Layout {
  i: WidgetId;
}

// Full dashboard layout
export interface DashboardLayout {
  userId: string;
  layouts: {
    lg: DashboardLayoutItem[];
    md: DashboardLayoutItem[];
    sm: DashboardLayoutItem[];
  };
  enabledWidgets: WidgetId[];
  updatedAt: string;
}

// API response types
export interface DashboardLayoutResponse {
  success: boolean;
  data?: DashboardLayout;
  error?: string;
}

/**
 * Default widget configurations
 */
export const WIDGET_CONFIGS: Record<WidgetId, WidgetConfig> = {
  // CRM Widgets
  crm_leads_today: {
    id: "crm_leads_today",
    titleKey: "widgets.crm_leads_today",
    component: "LeadsTodayWidget",
    permission: "crm:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  crm_leads_week: {
    id: "crm_leads_week",
    titleKey: "widgets.crm_leads_week",
    component: "LeadsWeekWidget",
    permission: "crm:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  crm_conversion_rate: {
    id: "crm_conversion_rate",
    titleKey: "widgets.crm_conversion_rate",
    component: "ConversionRateWidget",
    permission: "crm:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  crm_pipeline_value: {
    id: "crm_pipeline_value",
    titleKey: "widgets.crm_pipeline_value",
    component: "PipelineValueWidget",
    permission: "crm:view",
    size: { minW: 3, minH: 2, defaultW: 3, defaultH: 2 },
  },
  crm_top_sources: {
    id: "crm_top_sources",
    titleKey: "widgets.crm_top_sources",
    component: "TopSourcesWidget",
    permission: "crm:view",
    size: { minW: 3, minH: 3, defaultW: 4, defaultH: 3 },
  },
  crm_recent_activity: {
    id: "crm_recent_activity",
    titleKey: "widgets.crm_recent_activity",
    component: "RecentActivityWidget",
    permission: "crm:view",
    size: { minW: 4, minH: 3, defaultW: 6, defaultH: 4 },
  },
  crm_leads_by_status: {
    id: "crm_leads_by_status",
    titleKey: "widgets.crm_leads_by_status",
    component: "LeadsByStatusWidget",
    permission: "crm:view",
    size: { minW: 3, minH: 3, defaultW: 4, defaultH: 3 },
  },
  crm_leads_by_country: {
    id: "crm_leads_by_country",
    titleKey: "widgets.crm_leads_by_country",
    component: "LeadsByCountryWidget",
    permission: "crm:view",
    size: { minW: 3, minH: 3, defaultW: 4, defaultH: 3 },
  },

  // Fleet Widgets
  fleet_total_vehicles: {
    id: "fleet_total_vehicles",
    titleKey: "widgets.fleet_total_vehicles",
    component: "TotalVehiclesWidget",
    permission: "fleet:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  fleet_active_vehicles: {
    id: "fleet_active_vehicles",
    titleKey: "widgets.fleet_active_vehicles",
    component: "ActiveVehiclesWidget",
    permission: "fleet:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  fleet_maintenance_due: {
    id: "fleet_maintenance_due",
    titleKey: "widgets.fleet_maintenance_due",
    component: "MaintenanceDueWidget",
    permission: "fleet:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  fleet_utilization: {
    id: "fleet_utilization",
    titleKey: "widgets.fleet_utilization",
    component: "FleetUtilizationWidget",
    permission: "fleet:view",
    size: { minW: 3, minH: 3, defaultW: 4, defaultH: 3 },
  },

  // Driver Widgets
  drivers_total: {
    id: "drivers_total",
    titleKey: "widgets.drivers_total",
    component: "TotalDriversWidget",
    permission: "drivers:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  drivers_active: {
    id: "drivers_active",
    titleKey: "widgets.drivers_active",
    component: "ActiveDriversWidget",
    permission: "drivers:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },
  drivers_pending_docs: {
    id: "drivers_pending_docs",
    titleKey: "widgets.drivers_pending_docs",
    component: "PendingDocsWidget",
    permission: "drivers:view",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 2 },
  },

  // Analytics Widgets
  analytics_revenue: {
    id: "analytics_revenue",
    titleKey: "widgets.analytics_revenue",
    component: "RevenueWidget",
    permission: "analytics:view",
    size: { minW: 4, minH: 3, defaultW: 6, defaultH: 3 },
  },
  analytics_growth: {
    id: "analytics_growth",
    titleKey: "widgets.analytics_growth",
    component: "GrowthWidget",
    permission: "analytics:view",
    size: { minW: 3, minH: 2, defaultW: 4, defaultH: 2 },
  },

  // Quick Actions
  quick_actions: {
    id: "quick_actions",
    titleKey: "widgets.quick_actions",
    component: "QuickActionsWidget",
    size: { minW: 2, minH: 2, defaultW: 2, defaultH: 3 },
  },
};

/**
 * Default layout for new users
 * Grid: 12 columns
 */
export const DEFAULT_LAYOUT: DashboardLayout = {
  userId: "",
  layouts: {
    lg: [
      { i: "crm_leads_today", x: 0, y: 0, w: 2, h: 2 },
      { i: "crm_leads_week", x: 2, y: 0, w: 2, h: 2 },
      { i: "crm_conversion_rate", x: 4, y: 0, w: 2, h: 2 },
      { i: "crm_pipeline_value", x: 6, y: 0, w: 3, h: 2 },
      { i: "quick_actions", x: 9, y: 0, w: 3, h: 3 },
      { i: "crm_leads_by_status", x: 0, y: 2, w: 4, h: 3 },
      { i: "crm_top_sources", x: 4, y: 2, w: 5, h: 3 },
      { i: "crm_recent_activity", x: 0, y: 5, w: 6, h: 4 },
      { i: "crm_leads_by_country", x: 6, y: 5, w: 6, h: 4 },
    ],
    md: [
      { i: "crm_leads_today", x: 0, y: 0, w: 3, h: 2 },
      { i: "crm_leads_week", x: 3, y: 0, w: 3, h: 2 },
      { i: "crm_conversion_rate", x: 6, y: 0, w: 3, h: 2 },
      { i: "crm_pipeline_value", x: 0, y: 2, w: 4, h: 2 },
      { i: "quick_actions", x: 4, y: 2, w: 5, h: 3 },
      { i: "crm_leads_by_status", x: 0, y: 4, w: 5, h: 3 },
      { i: "crm_top_sources", x: 5, y: 4, w: 5, h: 3 },
      { i: "crm_recent_activity", x: 0, y: 7, w: 10, h: 4 },
    ],
    sm: [
      { i: "crm_leads_today", x: 0, y: 0, w: 3, h: 2 },
      { i: "crm_leads_week", x: 3, y: 0, w: 3, h: 2 },
      { i: "crm_conversion_rate", x: 0, y: 2, w: 3, h: 2 },
      { i: "crm_pipeline_value", x: 3, y: 2, w: 3, h: 2 },
      { i: "quick_actions", x: 0, y: 4, w: 6, h: 3 },
      { i: "crm_leads_by_status", x: 0, y: 7, w: 6, h: 3 },
      { i: "crm_recent_activity", x: 0, y: 10, w: 6, h: 4 },
    ],
  },
  enabledWidgets: [
    "crm_leads_today",
    "crm_leads_week",
    "crm_conversion_rate",
    "crm_pipeline_value",
    "quick_actions",
    "crm_leads_by_status",
    "crm_top_sources",
    "crm_recent_activity",
    "crm_leads_by_country",
  ],
  updatedAt: new Date().toISOString(),
};

/**
 * Get widgets available for a user based on permissions
 */
export function getAvailableWidgets(permissions: string[]): WidgetConfig[] {
  return Object.values(WIDGET_CONFIGS).filter((widget) => {
    if (!widget.permission) return true;
    return permissions.includes(widget.permission);
  });
}
