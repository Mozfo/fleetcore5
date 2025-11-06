/**
 * DEBUG SCRIPT - Test extractSubsection pour dir_car_makes
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const SPECS_DIR = path.join(process.cwd(), '../../docs/Deepdive/Tables par domaine');
const FILE = 'FLEETCORE_TABLES_DIR_ONLY.md';

function extractSubsection(sectionContent: string, subsectionName: string): string {
  const subsectionRegex = new RegExp(`${subsectionName}:\\s*\\n([\\s\\S]*?)(?=\\n{1,2}[A-Z]+:|$)`, 'i');
  const match = subsectionRegex.exec(sectionContent);

  if (!match) {
    return '';
  }

  return match[1].trim();
}

async function main() {
  const filePath = path.join(SPECS_DIR, FILE);
  const content = await fs.readFile(filePath, 'utf-8');

  // Extract V2 section for dir_car_makes (lignes 15-33)
  const v2Start = content.indexOf('**Évolutions V2 nécessaires:**');
  const v2End = content.indexOf('#### Table 10:', v2Start);
  const v2Section = content.substring(v2Start, v2End);

  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write('📋 V2 SECTION RAW (avant code block extraction):\n');
  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write(v2Section + '\n\n');

  // Extract code block
  const codeBlockMatch = /```\s*\n([\s\S]+?)\n```/.exec(v2Section);
  const v2Content = codeBlockMatch ? codeBlockMatch[1] : v2Section;

  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write('📋 V2 CONTENT (après code block extraction):\n');
  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write(v2Content + '\n\n');

  // Extract AJOUTER subsection
  const ajouterSection = extractSubsection(v2Content, 'AJOUTER');

  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write('📋 AJOUTER SUBSECTION:\n');
  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write(ajouterSection + '\n\n');

  process.stdout.write('━'.repeat(80) + '\n');
  process.stdout.write('📊 ANALYSE:\n');
  process.stdout.write('━'.repeat(80) + '\n');

  const lines = ajouterSection.split('\n');
  process.stdout.write(`Total lignes: ${lines.length}\n\n`);

  process.stdout.write('Lignes individuelles:\n');
  lines.forEach((line, idx) => {
    process.stdout.write(`  ${idx + 1}. "${line}"\n`);
  });
}

main();
