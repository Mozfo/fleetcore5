/**
 * Markdown Parser for FleetCore V1→V2 Migration Specs
 * CHECKPOINT 2.1 - Parse module DIR (7 tables)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TableSpec, Column, Index, EnumDef, Relation, ParsedModule } from '../types/table-spec.js';

const SPECS_DIR = path.join(process.cwd(), '../../docs/Deepdive/Tables par domaine');

// ========== Helper: Extract section from markdown ==========

function extractSection(content: string, tableName: string, sectionHeader: string): string {
  const tableHeaderRegex = new RegExp(`#### Table \\d+: \`${tableName}\``);
  const tableMatch = tableHeaderRegex.exec(content);

  if (!tableMatch) {
    throw new Error(`Table ${tableName} not found in content`);
  }

  const tableStart = tableMatch.index;

  // Support both **Header:** and Header: formats
  const headerVariants = [
    `**${sectionHeader}**`,
    sectionHeader,
  ];

  let sectionStart = -1;
  let usedHeader = '';
  for (const variant of headerVariants) {
    sectionStart = content.indexOf(variant, tableStart);
    if (sectionStart !== -1) {
      usedHeader = variant;
      break;
    }
  }

  if (sectionStart === -1) {
    return '';  // Section not found (optional)
  }

  // Find end of section (next **Header or #### Table)
  const afterHeader = sectionStart + usedHeader.length;
  const nextHeaderRegex = /\*\*[A-ZÀ-ÿ]|\n####/g;
  nextHeaderRegex.lastIndex = afterHeader;
  const nextHeader = nextHeaderRegex.exec(content);

  const sectionEnd = nextHeader ? nextHeader.index : content.length;

  let sectionContent = content.substring(afterHeader, sectionEnd).trim();

  // Extract content from code blocks if present
  // Format: ```\nAJOUTER:\n- col1\nCRÉER INDEX:\n- idx1\n```
  const codeBlockMatch = /```\s*\n([\s\S]+?)\n```/.exec(sectionContent);
  if (codeBlockMatch) {
    sectionContent = codeBlockMatch[1];
  }

  return sectionContent;
}

// ========== Helper: Extract specific subsection from V2 content ==========

function extractSubsection(sectionContent: string, subsectionName: string): string {
  // Format: "AJOUTER:\n- col1\n- col2\n\nMODIFIER:\n..."
  // Accepts 1 or 2 empty lines between subsections
  // Note: [A-ZÀ-ÿ ]+ includes space AND French accents to match "CRÉER INDEX:"
  const subsectionRegex = new RegExp(`${subsectionName}:\\s*\\n([\\s\\S]*?)(?=\\n{1,2}[A-ZÀ-ÿ ]+:|$)`, 'i');
  const match = subsectionRegex.exec(sectionContent);

  if (!match) {
    return '';
  }

  return match[1].trim();
}

// ========== Helper: Infer column type from naming convention ==========

function inferColumnTypeFromName(columnName: string): {
  type: string;
  dbType?: string;
  nullable: boolean;
  isForeignKey: boolean;
  references?: { table: string; column: string };
} {
  // Timestamps
  if (['created_at', 'updated_at', 'deleted_at'].includes(columnName)) {
    return {
      type: 'DateTime',
      dbType: '@db.Timestamptz(6)',
      nullable: columnName === 'deleted_at',
      isForeignKey: false,
    };
  }

  // Foreign key: tenant_id
  if (columnName === 'tenant_id') {
    return {
      type: 'String',
      dbType: '@db.Uuid',
      nullable: true,  // Usually nullable for global/tenant scoping
      isForeignKey: true,
      references: {
        table: 'adm_tenants',
        column: 'id',
      },
    };
  }

  // Foreign keys audit trail
  if (['created_by', 'updated_by', 'deleted_by'].includes(columnName)) {
    return {
      type: 'String',
      dbType: '@db.Uuid',
      nullable: columnName !== 'created_by',
      isForeignKey: true,
      references: {
        table: 'adm_provider_employees',
        column: 'id',
      },
    };
  }

  // Soft delete reason
  if (columnName === 'deletion_reason') {
    return {
      type: 'String',
      dbType: undefined,
      nullable: true,
      isForeignKey: false,
    };
  }

  // Default: text column
  return {
    type: 'String',
    dbType: undefined,
    nullable: false,
    isForeignKey: false,
  };
}

// ========== Helper: Parse column list from markdown ==========

function parseColumnList(sectionContent: string): Column[] {
  const columns: Column[] = [];

  if (!sectionContent) return columns;

  const lines = sectionContent.split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim() || !line.trim().startsWith('-')) continue;

    // Try multi-column format first: - col1, col2, col3 - description
    const multiColMatch = /^-\s+([\w,\s]+?)\s+-\s+(.+)$/m.exec(line.trim());

    if (multiColMatch && multiColMatch[1].includes(',')) {
      // Multi-column format detected
      const columnNames = multiColMatch[1].split(',').map(n => n.trim());
      const description = multiColMatch[2];

      for (const columnName of columnNames) {
        const inferred = inferColumnTypeFromName(columnName);

        const column: Column = {
          name: columnName,
          type: inferred.type,
          dbType: inferred.dbType,
          nullable: inferred.nullable,
          isPrimaryKey: false,
          isForeignKey: inferred.isForeignKey,
          references: inferred.references,
        };

        columns.push(column);
      }

      continue; // Next line
    }

    // Try single-column format: - column_name (type) - description
    // Note: Type regex supports nested parentheses like varchar(50) or char(2)
    const singleColMatch = /^-\s+(\w+)\s+\(([^)]+(?:\([^)]+\))?[^)]*)\)(?:\s+-\s+(.+))?$/m.exec(line.trim());

    if (singleColMatch) {
      // Existing single-column logic (unchanged)
      const [, name, typeInfo, description = ''] = singleColMatch;

      const column: Column = {
        name: name.trim(),
        type: parseColumnType(typeInfo),
        dbType: parseDbType(typeInfo),
        nullable: typeInfo.includes('nullable'),
        isPrimaryKey: name === 'id',
        isForeignKey: typeInfo.includes('uuid') && description.toLowerCase().includes('fk'),
      };

      // Extract FK reference
      if (column.isForeignKey && description) {
        const fkMatch = /FK vers (\w+)(?:\((\w+)\))?/i.exec(description);
        if (fkMatch) {
          column.references = {
            table: fkMatch[1],
            column: fkMatch[2] || 'id',
            onDelete: description.includes('Cascade') ? 'Cascade' : undefined,
          };
        }
      }

      // Parse default value
      if (typeInfo.toLowerCase().includes('default')) {
        const defaultMatch = /default[:\s]+([^\s,)]+)/i.exec(typeInfo);
        if (defaultMatch) {
          column.default = defaultMatch[1].replace(/['"]/g, '');
        }
      }

      // Check if enum column
      if (typeInfo.includes('enum')) {
        column.enumName = 'TBD';  // Will be set by extractEnums
      }

      // Post-processing: Apply FK metadata for known column names
      // This handles columns defined with explicit types that bypass inferColumnTypeFromName()
      const knownFKColumns = ['tenant_id', 'created_by', 'updated_by', 'deleted_by'];
      if (knownFKColumns.includes(column.name) && !column.isForeignKey) {
        const inferredFK = inferColumnTypeFromName(column.name);
        if (inferredFK.isForeignKey) {
          column.isForeignKey = true;
          column.references = inferredFK.references;
        }
      }

      columns.push(column);
    }
  }

  return columns;
}

// ========== Helper: Parse indexes from markdown ==========

function parseIndexes(sectionContent: string): Index[] {
  const indexes: Index[] = [];

  if (!sectionContent) return indexes;

  // Find CRÉER INDEX: section
  const indexSectionMatch = /CRÉER INDEX:([\s\S]+?)(?:\n\n|$)/i.exec(sectionContent);

  if (!indexSectionMatch) return indexes;

  const indexSection = indexSectionMatch[1];

  // Regex for index format: - btree (column1, column2) WHERE condition
  const indexRegex = /^-\s+(btree|gin|gist|hash)\s+\(([^)]+)\)(?:\s+WHERE\s+(.+))?$/gmi;

  let match;
  while ((match = indexRegex.exec(indexSection)) !== null) {
    const [, type, columnsStr, whereClause] = match;

    indexes.push({
      type: type.toLowerCase() as 'btree' | 'gin' | 'gist' | 'hash',
      columns: columnsStr.split(',').map(c => c.trim()),
      unique: false,
      where: whereClause?.trim(),
    });
  }

  return indexes;
}

// ========== Helper: Singularize table name for enum generation ==========

function singularizeTableName(tableName: string): string {
  // Remove module prefix (dir_, adm_, flt_, etc.)
  const withoutModule = tableName.replace(/^[a-z]+_/, '');

  // Split by underscore to singularize only the last segment
  const parts = withoutModule.split('_');

  // Singularize the last part by removing trailing 's'
  // Examples: "makes" → "make", "models" → "model", "classes" → "class"
  if (parts.length > 0 && parts[parts.length - 1].endsWith('s')) {
    parts[parts.length - 1] = parts[parts.length - 1].slice(0, -1);
  }

  return parts.join('_');
}

// ========== Helper: Extract ENUMs from section ==========

function extractEnums(sectionContent: string, tableName: string): EnumDef[] {
  const enums: EnumDef[] = [];

  if (!sectionContent) return enums;

  // Format: column_name (enum) - value1, value2, value3
  const enumRegex = /(\w+)\s+\(enum\)\s+-\s+([\w,\s]+)/gi;

  let match;
  while ((match = enumRegex.exec(sectionContent)) !== null) {
    const [, columnName, valuesStr] = match;

    // Generate enum name: table_prefix + column_name (snake_case)
    // Example: dir_car_makes + status → car_make_status
    const tablePrefix = singularizeTableName(tableName);
    const enumName = `${tablePrefix}_${columnName}`;

    enums.push({
      name: enumName,
      values: valuesStr.split(',').map(v => v.trim()),
    });
  }

  return enums;
}

// ========== Helper: Extract relations from FK columns ==========

function extractRelations(existingCols: Column[], newCols: Column[]): Relation[] {
  const relations: Relation[] = [];
  const allColumns = [...existingCols, ...newCols];

  for (const col of allColumns) {
    if (col.references) {
      relations.push({
        name: `${col.references.table}_relation`,
        type: 'manyToOne',
        fromField: col.name,
        toTable: col.references.table,
        toField: col.references.column,
        isOptional: col.nullable,
      });
    }
  }

  return relations;
}

// ========== Helper: Map markdown type to Prisma type ==========

function parseColumnType(typeInfo: string): string {
  const lowerType = typeInfo.toLowerCase();

  if (lowerType.includes('uuid')) return 'String';
  if (lowerType.includes('text')) return 'String';
  if (lowerType.includes('varchar')) return 'String';
  if (lowerType.includes('char')) return 'String';
  if (lowerType.includes('integer') || lowerType.includes('int')) return 'Int';
  if (lowerType.includes('float') || lowerType.includes('decimal')) return 'Float';
  if (lowerType.includes('boolean') || lowerType.includes('bool')) return 'Boolean';
  if (lowerType.includes('timestamp') || lowerType.includes('datetime')) return 'DateTime';
  if (lowerType.includes('date')) return 'DateTime';
  if (lowerType.includes('jsonb') || lowerType.includes('json')) return 'Json';
  if (lowerType.includes('enum')) return 'Enum';

  return 'String';  // Default
}

// ========== Helper: Extract @db.Type decorator ==========

function parseDbType(typeInfo: string): string | undefined {
  if (typeInfo.includes('uuid')) return '@db.Uuid';

  const varcharMatch = /varchar\((\d+)\)/i.exec(typeInfo);
  if (varcharMatch) return `@db.VarChar(${varcharMatch[1]})`;

  const charMatch = /char\((\d+)\)/i.exec(typeInfo);
  if (charMatch) return `@db.Char(${charMatch[1]})`;

  if (typeInfo.includes('timestamptz')) return '@db.Timestamptz(6)';

  return undefined;
}

// ========== Main: Parse single table section ==========

async function parseTableSection(
  content: string,
  tableName: string,
  module: string
): Promise<TableSpec> {
  // 1. Extract "Existant V1:" section
  const v1Section = extractSection(content, tableName, 'Existant V1:');
  const existingColumns = parseColumnList(v1Section);

  // 2. Extract "Évolutions V2 nécessaires:" section
  const v2Section = extractSection(content, tableName, 'Évolutions V2 nécessaires:');
  // Extract only AJOUTER: subsection for columns (excludes CRÉER INDEX:, MODIFIER:, etc.)
  const ajouterSection = extractSubsection(v2Section, 'AJOUTER');
  const newColumns = parseColumnList(ajouterSection);
  const indexes = parseIndexes(v2Section);

  // 3. Extract ENUMs from V2 section
  const enums = extractEnums(v2Section, tableName);

  // 4. Update enum column types
  for (const col of [...existingColumns, ...newColumns]) {
    if (col.enumName === 'TBD' && enums.length > 0) {
      // Find matching enum for this column
      const matchingEnum = enums.find(e => e.name.includes(col.name));
      if (matchingEnum) {
        col.enumName = matchingEnum.name;
      }
    }
  }

  // 5. Extract relations from FK columns
  const relations = extractRelations(existingColumns, newColumns);

  // 6. Extract source line numbers
  const lines = content.split('\n');
  const tableHeaderRegex = new RegExp(`#### Table \\d+: \`${tableName}\``);
  const startLine = lines.findIndex(line => tableHeaderRegex.test(line));
  let endLine = lines.findIndex((line, idx) => idx > startLine && /^####/.test(line));
  if (endLine === -1) endLine = lines.length;

  return {
    name: tableName,
    module,
    status: existingColumns.length > 0 ? 'MODIFY' : 'NEW',
    sourceFile: `FLEETCORE_TABLES_${module}_ONLY.md`,
    sourceLines: {
      start: startLine + 1,
      end: endLine
    },
    existingColumns,
    newColumns,
    indexes,
    enums,
    relations,
    constraints: [],
  };
}

// ========== Public API: Parse module file ==========

export async function parseModuleFile(
  fileName: string,
  moduleCode: string
): Promise<ParsedModule> {
  const filePath = path.join(SPECS_DIR, fileName);
  const content = await fs.readFile(filePath, 'utf-8');

  // Extract all table names from the file
  const tableRegex = /#### Table \d+: `([a-z_]+)`/g;
  const tableNames: string[] = [];

  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    tableNames.push(match[1]);
  }

  // Parse each table
  const tables: TableSpec[] = [];
  for (const tableName of tableNames) {
    const table = await parseTableSection(content, tableName, moduleCode);
    tables.push(table);
  }

  return {
    module: moduleCode,
    file: fileName,
    tables,
    totalTables: tables.length,
  };
}
