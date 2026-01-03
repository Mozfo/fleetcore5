/**
 * Dashboard Mock Data
 *
 * Static data for the homepage LiveDashboard component.
 * This data simulates a real fleet management dashboard.
 *
 * @module lib/data/dashboard-mock
 */

// ============================================
// TYPES
// ============================================

export interface DashboardKPI {
  label: string;
  value: string;
  change: string;
  color: "green" | "blue" | "orange" | "purple";
}

export interface DriverData {
  id: string;
  name: string;
  car: string;
  platform: string;
  status: "online" | "busy" | "offline";
  trips: number;
  revenue: string;
  rating: number;
}

export interface AlertData {
  type: "urgent" | "warning" | "info";
  message: string;
}

export interface PlatformBreakdown {
  platform: string;
  trips: number;
  gross: string;
  commission: string;
  net: string;
}

export interface ScheduledService {
  vehicle: string;
  service: string;
  date: string;
  garage: string;
  cost: string;
}

export interface MaintenanceCosts {
  thisMonth: string;
  lastMonth: string;
  average: string;
  perVehicle: string;
}

export interface OperationsData {
  kpis: DashboardKPI[];
  drivers: DriverData[];
  alerts: AlertData[];
}

export interface FinancialData {
  kpis: DashboardKPI[];
  breakdown: PlatformBreakdown[];
}

export interface MaintenanceData {
  scheduled: ScheduledService[];
  costs: MaintenanceCosts;
}

export interface DashboardData {
  operations: OperationsData;
  financial: FinancialData;
  maintenance: MaintenanceData;
}

export type DashboardView = "operations" | "financial" | "maintenance";

// ============================================
// MOCK DATA
// ============================================

export const dashboardData: DashboardData = {
  operations: {
    kpis: [
      { label: "Online Now", value: "247", change: "+12", color: "green" },
      { label: "Available Cars", value: "89", change: "-3", color: "blue" },
      { label: "In Maintenance", value: "12", change: "0", color: "orange" },
      { label: "Today Trips", value: "1,847", change: "+234", color: "purple" },
    ],
    drivers: [
      {
        id: "DRV001",
        name: "Ahmed K.",
        car: "Toyota Camry",
        platform: "Uber",
        status: "online",
        trips: 12,
        revenue: "€287",
        rating: 4.9,
      },
      {
        id: "DRV002",
        name: "Sarah M.",
        car: "BMW 320i",
        platform: "Bolt",
        status: "busy",
        trips: 8,
        revenue: "€198",
        rating: 4.8,
      },
      {
        id: "DRV003",
        name: "John D.",
        car: "Mercedes E",
        platform: "Careem",
        status: "offline",
        trips: 15,
        revenue: "€412",
        rating: 5.0,
      },
      {
        id: "DRV004",
        name: "Maria L.",
        car: "Audi A4",
        platform: "Uber",
        status: "online",
        trips: 10,
        revenue: "€265",
        rating: 4.7,
      },
      {
        id: "DRV005",
        name: "Hassan R.",
        car: "Tesla M3",
        platform: "Yango",
        status: "busy",
        trips: 14,
        revenue: "€378",
        rating: 4.9,
      },
    ],
    alerts: [
      {
        type: "urgent",
        message: "Vehicle BMW-089 service overdue by 500km",
      },
      {
        type: "warning",
        message: "5 drivers approaching weekly hour limit",
      },
      { type: "info", message: "New Uber rate cards effective tomorrow" },
    ],
  },
  financial: {
    kpis: [
      {
        label: "Today Revenue",
        value: "€18,750",
        change: "+18%",
        color: "green",
      },
      {
        label: "Week Revenue",
        value: "€124,320",
        change: "+12%",
        color: "blue",
      },
      {
        label: "Outstanding",
        value: "€8,450",
        change: "-€2,100",
        color: "orange",
      },
      {
        label: "Net Margin",
        value: "28.4%",
        change: "+2.1%",
        color: "purple",
      },
    ],
    breakdown: [
      {
        platform: "Uber",
        trips: 487,
        gross: "€8,234",
        commission: "€2,058",
        net: "€6,176",
      },
      {
        platform: "Bolt",
        trips: 312,
        gross: "€5,421",
        commission: "€1,355",
        net: "€4,066",
      },
      {
        platform: "Careem",
        trips: 198,
        gross: "€3,234",
        commission: "€808",
        net: "€2,426",
      },
      {
        platform: "Yango",
        trips: 156,
        gross: "€2,456",
        commission: "€614",
        net: "€1,842",
      },
      {
        platform: "Office",
        trips: 43,
        gross: "€1,987",
        commission: "€0",
        net: "€1,987",
      },
    ],
  },
  maintenance: {
    scheduled: [
      {
        vehicle: "BMW-001",
        service: "Oil Change",
        date: "Today 14:00",
        garage: "Main Garage",
        cost: "€120",
      },
      {
        vehicle: "MERC-045",
        service: "Brake Service",
        date: "Tomorrow 10:00",
        garage: "City Center",
        cost: "€450",
      },
      {
        vehicle: "AUDI-023",
        service: "Tire Rotation",
        date: "Dec 28",
        garage: "Main Garage",
        cost: "€80",
      },
      {
        vehicle: "TESLA-012",
        service: "Software Update",
        date: "Dec 29",
        garage: "Tesla Service",
        cost: "€0",
      },
    ],
    costs: {
      thisMonth: "€12,450",
      lastMonth: "€14,230",
      average: "€13,340",
      perVehicle: "€124",
    },
  },
};
