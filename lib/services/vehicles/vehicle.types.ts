// Types pour les relations
export interface CarMake {
  id: string;
  tenant_id?: string | null;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CarModel {
  id: string;
  tenant_id?: string | null;
  make_id: string;
  name: string;
  year_start?: number | null;
  year_end?: number | null;
  vehicle_class?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleAssignment {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  driver_id: string;
  start_date: Date;
  end_date?: Date | null;
  assignment_type: string;
  status: string;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleMaintenance {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  type: string;
  description?: string | null;
  date: Date;
  cost?: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleInsurance {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  policy_number: string;
  provider: string;
  start_date: Date;
  end_date: Date;
  premium: number;
  coverage_type: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// Type de base correspondant au schéma Prisma
export interface Vehicle {
  id: string;
  tenant_id: string;
  make_id: string;
  model_id: string;
  license_plate: string;
  vin?: string | null;
  year: number;
  color?: string | null;
  seats: number;
  vehicle_class?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  registration_date?: Date | null;
  insurance_number?: string | null;
  insurance_expiry?: Date | null;
  last_inspection?: Date | null;
  next_inspection?: Date | null;
  odometer?: number | null;
  ownership_type: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
  deleted_at?: Date | null;
  deleted_by?: string | null;
  deletion_reason?: string | null;
}

// DTOs pour les opérations
export interface CreateVehicleDto {
  make_id: string;
  model_id: string;
  license_plate: string;
  vin?: string;
  year: number;
  color?: string;
  seats: number;
  vehicle_class?: string;
  fuel_type?: string;
  transmission?: string;
  registration_date?: Date;
  insurance_number?: string;
  insurance_expiry?: Date;
  last_inspection?: Date;
  next_inspection?: Date;
  odometer?: number;
  ownership_type?: string;
  country_code: string; // Nécessaire pour la validation de conformité réglementaire par pays
  metadata?: Record<string, unknown>;
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {
  status?: string;
}

// Types avec relations
export interface VehicleWithRelations extends Vehicle {
  make?: CarMake;
  model?: CarModel;
  assignments?: VehicleAssignment[];
  maintenance?: VehicleMaintenance[];
  insurances?: VehicleInsurance[];
}

// Types pour les filtres
export interface VehicleFilters {
  status?: string;
  make_id?: string;
  model_id?: string;
  vehicle_class?: string;
  ownership_type?: string;
  fuel_type?: string;
  transmission?: string;
  min_year?: number;
  max_year?: number;
  min_seats?: number;
  max_seats?: number;
}

// Types pour les stats
export interface VehicleStats {
  total: number;
  active: number;
  inactive: number;
  in_maintenance: number;
  by_status: Record<string, number>;
  by_class: Record<string, number>;
  by_ownership: Record<string, number>;
}
