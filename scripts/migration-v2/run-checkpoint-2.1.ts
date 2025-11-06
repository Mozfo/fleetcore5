/**
 * CHECKPOINT 2.1 - Execute DIR Module Parser (7 tables)
 *
 * VALIDATION CRITERIA:
 * - 7 tables found in DIR module
 * - dir_car_makes validation:
 *   - 5 V1 columns (id, tenant_id, name, created_at, updated_at)
 *   - 12 new V2 columns (code, country_of_origin, parent_company, founded_year, logo_url, status, metadata, created_by, updated_by, deleted_at, deleted_by, deletion_reason)
 *   - 3 indexes
 *   - 1 enum named "car_make_status"
 *   - 4 FK relations (tenant + 3 audit trail)
 * - Output JSON saved to output/dir-module-parsed.json
 */

import { parseModuleFile } from './parsers/markdown-parser.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// ========== Configuration ==========

const MODULE_FILE = 'FLEETCORE_TABLES_DIR_ONLY.md';
const MODULE_CODE = 'DIR';
const OUTPUT_FILE = path.join(process.cwd(), 'output', 'dir-module-parsed.json');

// Expected counts for validation
const EXPECTED_TOTAL_TABLES = 5;  // DIR module has 5 tables (car_makes, car_models, platforms, country_regulations, vehicle_classes)
const EXPECTED_DIR_CAR_MAKES = {
  existingColumns: 5,
  newColumns: 12,
  indexes: 3,
  enums: 1,
  relations: 4,
  enumName: 'car_make_status',
};

// ========== Execution ==========

async function main() {
  try {
    process.stdout.write('🚀 CHECKPOINT 2.1 - Parsing DIR Module\n');
    process.stdout.write('━'.repeat(60) + '\n\n');

    // 1. Parse module file
    process.stdout.write(`📄 Reading file: ${MODULE_FILE}\n`);
    const result = await parseModuleFile(MODULE_FILE, MODULE_CODE);

    process.stdout.write(`✅ Parsing complete\n\n`);

    // 2. Basic validation
    process.stdout.write('🔍 VALIDATION RESULTS:\n');
    process.stdout.write('━'.repeat(60) + '\n');

    const totalTables = result.totalTables;
    const tablesStatus = totalTables === EXPECTED_TOTAL_TABLES ? '✅' : '❌';
    process.stdout.write(`${tablesStatus} Total tables: ${totalTables} (expected: ${EXPECTED_TOTAL_TABLES})\n`);

    // 3. List all tables found
    process.stdout.write(`\n📋 Tables found in module ${MODULE_CODE}:\n`);
    result.tables.forEach((table, idx) => {
      process.stdout.write(`   ${idx + 1}. ${table.name} (${table.status})\n`);
    });

    // 4. Detailed validation of dir_car_makes
    const dirCarMakes = result.tables.find(t => t.name === 'dir_car_makes');

    if (!dirCarMakes) {
      throw new Error('❌ CRITICAL: dir_car_makes not found in parsed results');
    }

    process.stdout.write(`\n🎯 Detailed validation: dir_car_makes\n`);
    process.stdout.write('━'.repeat(60) + '\n');

    const v1ColsStatus = dirCarMakes.existingColumns.length === EXPECTED_DIR_CAR_MAKES.existingColumns ? '✅' : '❌';
    process.stdout.write(`${v1ColsStatus} V1 columns: ${dirCarMakes.existingColumns.length} (expected: ${EXPECTED_DIR_CAR_MAKES.existingColumns})\n`);

    const newColsStatus = dirCarMakes.newColumns.length === EXPECTED_DIR_CAR_MAKES.newColumns ? '✅' : '❌';
    process.stdout.write(`${newColsStatus} New columns: ${dirCarMakes.newColumns.length} (expected: ${EXPECTED_DIR_CAR_MAKES.newColumns})\n`);

    const indexesStatus = dirCarMakes.indexes.length === EXPECTED_DIR_CAR_MAKES.indexes ? '✅' : '❌';
    process.stdout.write(`${indexesStatus} Indexes: ${dirCarMakes.indexes.length} (expected: ${EXPECTED_DIR_CAR_MAKES.indexes})\n`);

    const enumsStatus = dirCarMakes.enums.length === EXPECTED_DIR_CAR_MAKES.enums ? '✅' : '❌';
    process.stdout.write(`${enumsStatus} Enums: ${dirCarMakes.enums.length} (expected: ${EXPECTED_DIR_CAR_MAKES.enums})\n`);

    if (dirCarMakes.enums.length > 0) {
      const enumName = dirCarMakes.enums[0].name;
      const enumNameStatus = enumName === EXPECTED_DIR_CAR_MAKES.enumName ? '✅' : '❌';
      process.stdout.write(`${enumNameStatus} Enum name: "${enumName}" (expected: "${EXPECTED_DIR_CAR_MAKES.enumName}")\n`);
    }

    const relationsStatus = dirCarMakes.relations.length === EXPECTED_DIR_CAR_MAKES.relations ? '✅' : '❌';
    process.stdout.write(`${relationsStatus} Relations: ${dirCarMakes.relations.length} (expected: ${EXPECTED_DIR_CAR_MAKES.relations})\n`);

    // 5. Show sample columns
    process.stdout.write(`\n📝 Sample V1 columns (first 3):\n`);
    dirCarMakes.existingColumns.slice(0, 3).forEach(col => {
      process.stdout.write(`   - ${col.name} (${col.type}${col.dbType ? ' ' + col.dbType : ''}${col.nullable ? ', nullable' : ''})\n`);
    });

    process.stdout.write(`\n📝 Sample V2 new columns (first 5):\n`);
    dirCarMakes.newColumns.slice(0, 5).forEach(col => {
      const fkInfo = col.isForeignKey && col.references ? ` → FK to ${col.references.table}` : '';
      process.stdout.write(`   - ${col.name} (${col.type}${col.dbType ? ' ' + col.dbType : ''}${col.nullable ? ', nullable' : ''})${fkInfo}\n`);
    });

    process.stdout.write(`\n📝 Indexes:\n`);
    dirCarMakes.indexes.forEach(idx => {
      const whereClause = idx.where ? ` WHERE ${idx.where}` : '';
      process.stdout.write(`   - ${idx.type} (${idx.columns.join(', ')})${whereClause}\n`);
    });

    if (dirCarMakes.enums.length > 0) {
      process.stdout.write(`\n📝 Enum: ${dirCarMakes.enums[0].name}\n`);
      process.stdout.write(`   Values: ${dirCarMakes.enums[0].values.join(', ')}\n`);
    }

    // 6. Save output JSON
    process.stdout.write(`\n💾 Saving output to: ${OUTPUT_FILE}\n`);
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
    process.stdout.write(`✅ Output saved successfully\n`);

    // 7. Final summary
    process.stdout.write('\n' + '━'.repeat(60) + '\n');
    process.stdout.write('🎉 CHECKPOINT 2.1 VALIDATION COMPLETE\n');
    process.stdout.write('━'.repeat(60) + '\n');

    const allChecks = [
      totalTables === EXPECTED_TOTAL_TABLES,
      dirCarMakes.existingColumns.length === EXPECTED_DIR_CAR_MAKES.existingColumns,
      dirCarMakes.newColumns.length === EXPECTED_DIR_CAR_MAKES.newColumns,
      dirCarMakes.indexes.length === EXPECTED_DIR_CAR_MAKES.indexes,
      dirCarMakes.enums.length === EXPECTED_DIR_CAR_MAKES.enums,
      dirCarMakes.enums[0]?.name === EXPECTED_DIR_CAR_MAKES.enumName,
      dirCarMakes.relations.length === EXPECTED_DIR_CAR_MAKES.relations,
    ];

    const passedChecks = allChecks.filter(Boolean).length;
    const totalChecks = allChecks.length;

    if (passedChecks === totalChecks) {
      process.stdout.write(`\n✅ ALL CHECKS PASSED (${passedChecks}/${totalChecks})\n`);
      process.stdout.write(`\n✅ Parser is READY for CHECKPOINT 2.2 (extend to 98 tables)\n\n`);
      process.exit(0);
    } else {
      process.stdout.write(`\n⚠️  SOME CHECKS FAILED (${passedChecks}/${totalChecks})\n`);
      process.stdout.write(`\n❌ Review validation errors above\n\n`);
      process.exit(1);
    }

  } catch (error) {
    process.stderr.write(`\n❌ ERROR: ${(error as Error).message}\n`);
    process.stderr.write(`\nStack trace:\n${(error as Error).stack}\n`);
    process.exit(1);
  }
}

main();
