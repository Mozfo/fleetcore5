/**
 * Type definitions for FleetCore V1→V2 migration parser
 * CHECKPOINT 2.1 - Module DIR (7 tables)
 */

// ========== Column Definition ==========

export interface Column {
  name: string;
  type: string;  // Prisma type: String, Int, DateTime, Float, Boolean, Json
  dbType?: string;  // PostgreSQL type decorator: @db.Uuid, @db.VarChar(50), @db.Timestamptz(6)
  nullable: boolean;
  default?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  enumName?: string;  // For enum columns, the name of the enum type
  references?: {
    table: string;
    column: string;
    onDelete?: 'Cascade' | 'SetNull' | 'Restrict' | 'NoAction';
    onUpdate?: 'Cascade' | 'SetNull' | 'Restrict' | 'NoAction';
  };
}

// ========== Index Definition ==========

export interface Index {
  name?: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash';
  unique: boolean;
  where?: string;  // Condition for partial index (e.g., "deleted_at IS NULL")
}

// ========== Relation Definition ==========

export interface Relation {
  name: string;
  type: 'oneToMany' | 'manyToOne' | 'oneToOne' | 'manyToMany';
  fromField: string;
  toTable: string;
  toField: string;
  relationName?: string;  // For disambiguating multiple relations
  isOptional?: boolean;
}

// ========== Enum Definition ==========

export interface EnumDef {
  name: string;  // e.g., "car_make_status" (snake_case)
  values: string[];  // e.g., ["active", "inactive", "deprecated"]
}

// ========== Constraint Definition ==========

export interface Constraint {
  type: 'unique' | 'check' | 'foreignKey';
  columns: string[];
  condition?: string;  // For CHECK constraints
  referencedTable?: string;  // For FK
  referencedColumns?: string[];
}

// ========== Table Specification ==========

export interface TableSpec {
  name: string;
  module: string;
  status: 'MODIFY' | 'NEW';
  sourceFile: string;
  sourceLines: { start: number; end: number };
  existingColumns: Column[];
  newColumns: Column[];
  indexes: Index[];
  enums: EnumDef[];
  relations: Relation[];
  constraints: Constraint[];
}

// ========== Parsed Module ==========

export interface ParsedModule {
  module: string;
  file: string;
  tables: TableSpec[];
  totalTables: number;
}

// ========== Parse Result ==========

export interface ParseResult {
  metadata: {
    generatedAt: string;
    totalTables: number;
    moduleCount: number;
    newTables: number;
    modifiedTables: number;
  };
  modules: ParsedModule[];
  tables: TableSpec[];
}
