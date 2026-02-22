#!/usr/bin/env tsx
/**
 * Update Schema Reference Documentation
 *
 * This script generates/updates the SUPABASE_SCHEMA_REFERENCE.md file
 * by querying the PostgreSQL database for table and column information.
 *
 * Usage:
 *   pnpm exec tsx scripts/update-schema-reference.ts
 *
 * Requires:
 *   - DATABASE_URL or DIRECT_URL environment variable
 *   - dotenv-cli for loading .env.local: dotenv -e .env.local -- pnpm exec tsx scripts/update-schema-reference.ts
 *
 * @module scripts/update-schema-reference
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// CLI output helper (scripts are allowed to write to stdout)
const log = (msg: string) => process.stdout.write(`${msg}\n`);

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
}

interface TableInfo {
  table_name: string;
  row_count: number;
}

interface CheckConstraint {
  table_name: string;
  constraint_name: string;
  check_clause: string;
}

interface IndexInfo {
  table_name: string;
  index_name: string;
  index_definition: string;
}

// Module prefixes for grouping
const MODULE_PREFIXES = [
  {
    prefix: "adm_",
    name: "Administration Module",
    anchor: "administration-module-adm_",
  },
  { prefix: "auth_", name: "Auth Module", anchor: "auth-module-auth_" },
  { prefix: "bil_", name: "Billing Module", anchor: "billing-module-bil_" },
  { prefix: "clt_", name: "Client Module", anchor: "client-module-clt_" },
  { prefix: "crm_", name: "CRM Module", anchor: "crm-module-crm_" },
  { prefix: "dir_", name: "Directory Module", anchor: "directory-module-dir_" },
  { prefix: "doc_", name: "Document Module", anchor: "document-module-doc_" },
  { prefix: "fin_", name: "Finance Module", anchor: "finance-module-fin_" },
  { prefix: "flt_", name: "Fleet Module", anchor: "fleet-module-flt_" },
  { prefix: "hq_", name: "HQ Module", anchor: "hq-module-hq_" },
  { prefix: "rev_", name: "Revenue Module", anchor: "revenue-module-rev_" },
  {
    prefix: "rid_",
    name: "Rider/Driver Module",
    anchor: "riderdriver-module-rid_",
  },
  { prefix: "sch_", name: "Schedule Module", anchor: "schedule-module-sch_" },
  { prefix: "stripe_", name: "Stripe Module", anchor: "stripe-module-stripe_" },
  { prefix: "sup_", name: "Support Module", anchor: "support-module-sup_" },
  { prefix: "trp_", name: "Transport Module", anchor: "transport-module-trp_" },
  { prefix: "v_", name: "Views", anchor: "views-v_" },
];

async function getTableColumns(): Promise<ColumnInfo[]> {
  const result = await prisma.$queryRaw<ColumnInfo[]>`
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name NOT LIKE '_prisma%'
      AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name, ordinal_position
  `;
  return result;
}

async function getTableRowCounts(): Promise<TableInfo[]> {
  // Get list of tables first
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
      AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name
  `;

  const results: TableInfo[] = [];

  for (const table of tables) {
    try {
      const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM "${table.table_name}"`
      );
      results.push({
        table_name: table.table_name,
        row_count: Number(countResult[0]?.count || 0),
      });
    } catch {
      // Table might not be accessible
      results.push({
        table_name: table.table_name,
        row_count: 0,
      });
    }
  }

  return results;
}

async function getCheckConstraints(): Promise<CheckConstraint[]> {
  const result = await prisma.$queryRaw<CheckConstraint[]>`
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'CHECK'
      AND tc.table_name NOT LIKE '_prisma%'
      AND tc.constraint_name NOT LIKE '%_not_null'
    ORDER BY tc.table_name, tc.constraint_name
  `;
  return result;
}

async function getIndexes(): Promise<IndexInfo[]> {
  const result = await prisma.$queryRaw<IndexInfo[]>`
    SELECT
      t.relname as table_name,
      i.relname as index_name,
      pg_get_indexdef(i.oid) as index_definition
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname NOT LIKE '_prisma%'
      AND i.relname NOT LIKE '%_pkey'
      AND NOT ix.indisprimary
    ORDER BY t.relname, i.relname
  `;
  return result;
}

function formatDataType(dataType: string): string {
  const typeMap: Record<string, string> = {
    "character varying": "varchar",
    "timestamp with time zone": "timestamptz",
    "timestamp without time zone": "timestamp",
    integer: "integer",
    bigint: "bigint",
    boolean: "boolean",
    text: "text",
    uuid: "uuid",
    jsonb: "jsonb",
    json: "json",
    numeric: "numeric",
    date: "date",
    "time without time zone": "time",
    inet: "inet",
    citext: "citext",
    character: "character",
    ARRAY: "_text", // Simplified for arrays
  };

  return typeMap[dataType] || dataType;
}

function formatDefault(defaultValue: string | null): string {
  if (!defaultValue) return "-";
  if (defaultValue.includes("nextval")) return "auto-increment";
  if (defaultValue.includes("gen_random_uuid")) return "`gen_random_uuid()`";
  if (defaultValue.includes("uuid_generate_v4")) return "`uuid_generate_v4()`";
  if (defaultValue.includes("CURRENT_TIMESTAMP")) return "`CURRENT_TIMESTAMP`";
  if (defaultValue.includes("now()")) return "`now()`";
  if (defaultValue === "false") return "`false`";
  if (defaultValue === "true") return "`true`";
  if (defaultValue.match(/^'\w+'::[\w_]+$/)) {
    return `\`${defaultValue}\``;
  }
  if (defaultValue.match(/^[\d.]+$/)) return `\`${defaultValue}\``;
  if (defaultValue.includes("ARRAY")) return "`ARRAY[]::text[]`";
  if (defaultValue.includes("'{}'")) return "`'{}'::jsonb`";

  return `\`${defaultValue.substring(0, 30)}...\``;
}

function generateMarkdown(
  columns: ColumnInfo[],
  rowCounts: TableInfo[],
  checkConstraints: CheckConstraint[],
  indexes: IndexInfo[]
): string {
  const today = new Date().toISOString().split("T")[0];

  // Group columns by table
  const tableColumns = new Map<string, ColumnInfo[]>();
  for (const col of columns) {
    const existing = tableColumns.get(col.table_name);
    if (existing) {
      existing.push(col);
    } else {
      tableColumns.set(col.table_name, [col]);
    }
  }

  // Create row count map
  const rowCountMap = new Map<string, number>();
  for (const tc of rowCounts) {
    rowCountMap.set(tc.table_name, tc.row_count);
  }

  // Create check constraints map
  const checkMap = new Map<string, CheckConstraint[]>();
  for (const cc of checkConstraints) {
    const existing = checkMap.get(cc.table_name);
    if (existing) {
      existing.push(cc);
    } else {
      checkMap.set(cc.table_name, [cc]);
    }
  }

  // Create indexes map
  const indexMap = new Map<string, IndexInfo[]>();
  for (const idx of indexes) {
    const existing = indexMap.get(idx.table_name);
    if (existing) {
      existing.push(idx);
    } else {
      indexMap.set(idx.table_name, [idx]);
    }
  }

  // Group tables by module
  const moduleGroups = new Map<string, string[]>();
  const allTables = Array.from(tableColumns.keys()).sort();

  for (const tableName of allTables) {
    const mod = MODULE_PREFIXES.find((m) => tableName.startsWith(m.prefix));
    const moduleKey = mod?.prefix || "other_";
    const existingTables = moduleGroups.get(moduleKey);
    if (existingTables) {
      existingTables.push(tableName);
    } else {
      moduleGroups.set(moduleKey, [tableName]);
    }
  }

  // Generate header
  let md = `# FleetCore5 - Supabase Database Schema Reference

**Last Updated:** ${today}

**Database:** PostgreSQL on Supabase
**Total Tables:** ${allTables.length}

## Table Count by Module

`;

  // Add module counts
  for (const mod of MODULE_PREFIXES) {
    const tables = moduleGroups.get(mod.prefix) || [];
    if (tables.length > 0) {
      md += `- **${mod.prefix.replace("_", "\\_")}**: ${tables.length} tables\n`;
    }
  }

  // Table of contents
  md += `
## Table of Contents

`;

  let tocIndex = 1;
  for (const mod of MODULE_PREFIXES) {
    if (moduleGroups.has(mod.prefix)) {
      md += `${tocIndex}. [${mod.name} (${mod.prefix.replace("_", "\\_")})](#${mod.anchor})\n`;
      tocIndex++;
    }
  }
  md += `${tocIndex}. [Enum Types](#enum-types)\n`;
  md += `${tocIndex + 1}. [Foreign Key Relationships](#foreign-key-relationships)\n`;

  // Generate table documentation for each module
  for (const mod of MODULE_PREFIXES) {
    const tables = moduleGroups.get(mod.prefix);
    if (!tables || tables.length === 0) continue;

    md += `\n## ${mod.name} (${mod.prefix.replace("_", "\\_")})\n`;

    for (const tableName of tables) {
      const cols = tableColumns.get(tableName) || [];
      const rowCount = rowCountMap.get(tableName) || 0;
      const checks = checkMap.get(tableName) || [];
      const idxs = indexMap.get(tableName) || [];

      md += `\n### ${tableName}\n\n`;
      md += `**Row Count:** ~${rowCount}\n\n`;

      // Column table header
      md += `| Column | Type | Nullable | Default |\n`;
      md += `| ------ | ---- | -------- | ------- |\n`;

      for (const col of cols) {
        const type = formatDataType(col.data_type);
        const nullable = col.is_nullable === "YES" ? "YES" : "NO";
        const defaultVal = formatDefault(col.column_default);
        md += `| ${col.column_name} | \`${type}\` | ${nullable} | ${defaultVal} |\n`;
      }

      // Add check constraints if any
      if (checks.length > 0) {
        md += `\n**CHECK Constraints:**\n`;
        for (const check of checks) {
          md += `- \`${check.constraint_name}\`: ${check.check_clause.substring(0, 100)}${check.check_clause.length > 100 ? "..." : ""}\n`;
        }
      }

      // Add indexes if any
      if (idxs.length > 0) {
        md += `\n**Indexes:**\n`;
        for (const idx of idxs) {
          // Extract just the key columns from the definition
          const match = idx.index_definition.match(/\(([^)]+)\)/);
          const cols = match ? match[1] : "";
          md += `- \`${idx.index_name}\`: (${cols})\n`;
        }
      }
    }
  }

  // Placeholder sections for enums and FKs
  md += `
## Enum Types

*See prisma/schema.prisma for enum definitions*

## Foreign Key Relationships

*Generated from database foreign key constraints*
`;

  return md;
}

async function main() {
  log("Starting schema reference update...\n");

  try {
    log("Fetching table columns...");
    const columns = await getTableColumns();
    log(`   Found ${columns.length} columns\n`);

    log("Fetching row counts...");
    const rowCounts = await getTableRowCounts();
    log(`   Found ${rowCounts.length} tables\n`);

    log("Fetching check constraints...");
    const checkConstraints = await getCheckConstraints();
    log(`   Found ${checkConstraints.length} constraints\n`);

    log("Fetching indexes...");
    const indexes = await getIndexes();
    log(`   Found ${indexes.length} indexes\n`);

    log("Generating markdown...");
    const markdown = generateMarkdown(
      columns,
      rowCounts,
      checkConstraints,
      indexes
    );

    const outputPath = path.join(
      process.cwd(),
      "docs/Reference/SUPABASE_SCHEMA_REFERENCE.md"
    );

    fs.writeFileSync(outputPath, markdown, "utf-8");
    log(`\nSchema reference updated: ${outputPath}`);

    // Summary
    const tableCount = rowCounts.length;
    const totalRows = rowCounts.reduce((sum, t) => sum + t.row_count, 0);
    log(`\nSummary:`);
    log(`   - Tables: ${tableCount}`);
    log(`   - Total rows: ${totalRows}`);
    log(`   - Columns: ${columns.length}`);
    log(`   - Check constraints: ${checkConstraints.length}`);
    log(`   - Indexes: ${indexes.length}`);
  } catch (error) {
    process.stderr.write(`Error updating schema reference: ${error}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
