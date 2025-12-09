/**
 * Seed Data Catalogue Script
 *
 * Extracts data from the Cornerstone Data Mapping Exercise Excel file
 * and generates the v2-data-types.json seed file for the Data Catalogue.
 *
 * Only includes data tied to existing ecosystem entities.
 *
 * Usage: node scripts/seed-data-catalogue.js
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel file path
const EXCEL_FILE = path.join(__dirname, '../../Cornerstone Data Mapping Exercise (8_28).xlsx');

// Output path
const OUTPUT_FILE = path.join(__dirname, '../server/data/v2-data-types.json');

// Entity mapping - maps Excel source columns to entity IDs
const SOURCE_MAPPING = {
  'Landcor (BC)': { entityId: 'copa-landcor', entityName: 'Landcor Data Corporation', regionsCovered: ['BC'] },
  'Interac': { entityId: 'copa-interac', entityName: 'Interac Corp.', regionsCovered: [] },
  'BC Person Credential': { entityId: 'copa-interac', entityName: 'Interac Corp.', regionsCovered: ['BC'] },
  // 'Flinks': excluded - not in current entities
  // 'Verisk PDB (Ontario)': excluded - not in current entities
};

// Category mapping from Excel categories to our category IDs
const CATEGORY_MAPPING = {
  'Property Public Data': 'property',
  'Property Public Data []': 'property',
  'Homeowner Property Details': 'property',
  'Homeowner Details': 'identity', // Some are system-generated, but identity-related
  'Advisor Details': 'identity',
  'Homeowner/Advisor Verified Data': 'identity',
  'Advisor Verified Data': 'identity',
  'Credential': 'other',
  'Property HPI': 'property',
  'Property Value Projections': 'property',
  'Property Total Equity': 'financial',
  'Homeowner Mortgage Statement': 'financial',
  'BOC Overnight Rate': 'financial',
  'Homeowner Mortgage Balance': 'financial',
  'Property Comparables []': 'property',
  'Credential Evidence': 'other',
  'Homeowner Trust Network': 'other',
  'Homeowner Property Cost of Ownership': 'financial',
};

// Value type inference from property names
function inferValueType(name) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('date') || lowerName.includes('_date')) return 'date';
  if (lowerName.includes('datetime') || lowerName.includes('_at')) return 'datetime';
  if (lowerName.includes('email')) return 'email';
  if (lowerName.includes('phone') || lowerName.includes('tel')) return 'phone';
  if (lowerName.includes('url') || lowerName.includes('uri') || lowerName.includes('endpoint')) return 'url';
  if (lowerName.includes('price') || lowerName.includes('value') || lowerName.includes('amount') ||
      lowerName.includes('cost') || lowerName.includes('rate') || lowerName.includes('balance')) return 'currency';
  if (lowerName.includes('count') || lowerName.includes('number') || lowerName.includes('_code') ||
      lowerName.includes('area') || lowerName.includes('_ft') || lowerName.includes('_sq') ||
      lowerName.includes('year') || lowerName.includes('bedrooms') || lowerName.includes('bathrooms') ||
      lowerName.includes('storeys') || lowerName.includes('garages') || lowerName.includes('carports') ||
      lowerName.includes('fireplaces')) return 'number';
  if (lowerName.includes('is_') || lowerName.includes('has_') || lowerName.includes('age_over') ||
      lowerName.startsWith('corner_') || lowerName.startsWith('waterfront_') || lowerName.startsWith('water_') ||
      lowerName.startsWith('prime_') || lowerName.startsWith('good_') || lowerName.startsWith('fair_')) return 'boolean';
  if (lowerName.includes('history') || lowerName.includes('table') || lowerName.includes('[]')) return 'array';

  return 'string';
}

// Generate slug-style ID
function generateId(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate property ID
function generatePropertyId(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Human-readable display name
function toDisplayName(name) {
  // If already has spaces, capitalize each word
  if (name.includes(' ')) {
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  // Convert snake_case or kebab-case to Title Case
  return name
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function main() {
  console.log('Reading Excel file:', EXCEL_FILE);

  if (!fs.existsSync(EXCEL_FILE)) {
    console.error('Excel file not found:', EXCEL_FILE);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Column indices from header row (row 2, index 2)
  // Col 1 = Category, Col 2 = Attribute Name, Col 12 = Landcor (BC), Col 9 = Interac, Col 10 = BC Person Credential
  const CATEGORY_COL = 1;
  const ATTR_NAME_COL = 2;
  const LANDCOR_COL = 12;
  const INTERAC_COL = 9;
  const BC_PERSON_COL = 10;

  // Group attributes by category and source
  const dataTypeMap = new Map();
  const now = new Date().toISOString();

  console.log('\nProcessing rows...');

  // Skip header rows (0-2), start from row 3
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[CATEGORY_COL] || !row[ATTR_NAME_COL]) continue;

    const excelCategory = row[CATEGORY_COL];
    const attrName = row[ATTR_NAME_COL];

    // Determine which source(s) provide this attribute
    const hasLandcor = row[LANDCOR_COL] && row[LANDCOR_COL].toString().trim();
    const hasInterac = row[INTERAC_COL] && row[INTERAC_COL].toString().trim();
    const hasBCPerson = row[BC_PERSON_COL] && row[BC_PERSON_COL].toString().trim();

    // Skip if no source
    if (!hasLandcor && !hasInterac && !hasBCPerson) {
      continue;
    }

    // Map to our category
    const category = CATEGORY_MAPPING[excelCategory] || 'other';

    // Create a unique key for grouping
    // Group by category + source combination
    let sources = [];
    if (hasLandcor) {
      sources.push(SOURCE_MAPPING['Landcor (BC)']);
    }
    if (hasInterac || hasBCPerson) {
      sources.push(SOURCE_MAPPING['Interac']);
    }

    // Use category as the data type key
    const dataTypeKey = excelCategory;

    if (!dataTypeMap.has(dataTypeKey)) {
      dataTypeMap.set(dataTypeKey, {
        id: generateId(excelCategory),
        name: toDisplayName(excelCategory),
        description: `Data attributes for ${excelCategory.toLowerCase()}`,
        category,
        properties: [],
        sources: [],
        rawSources: new Set(),
      });
    }

    const dataType = dataTypeMap.get(dataTypeKey);

    // Add property
    const propertyId = generatePropertyId(attrName);

    // Check for duplicate properties
    if (!dataType.properties.find(p => p.name === propertyId)) {
      dataType.properties.push({
        id: `prop-${propertyId}`,
        name: propertyId,
        displayName: toDisplayName(attrName),
        valueType: inferValueType(attrName),
        required: false,
      });
    }

    // Track sources
    if (hasLandcor) dataType.rawSources.add('Landcor (BC)');
    if (hasInterac) dataType.rawSources.add('Interac');
    if (hasBCPerson) dataType.rawSources.add('BC Person Credential');
  }

  // Convert to array and finalize sources
  const dataTypes = [];

  for (const [key, dt] of dataTypeMap) {
    // Build sources array - deduplicate by entityId
    const sourcesByEntity = new Map();
    for (const rawSource of dt.rawSources) {
      const mapping = SOURCE_MAPPING[rawSource];
      if (mapping) {
        // Merge regions if entity already exists
        if (sourcesByEntity.has(mapping.entityId)) {
          const existing = sourcesByEntity.get(mapping.entityId);
          const mergedRegions = [...new Set([...existing.regionsCovered, ...mapping.regionsCovered])];
          existing.regionsCovered = mergedRegions;
        } else {
          sourcesByEntity.set(mapping.entityId, {
            entityId: mapping.entityId,
            entityName: mapping.entityName,
            regionsCovered: [...mapping.regionsCovered],
          });
        }
      }
    }

    const sources = Array.from(sourcesByEntity.values()).map(source => ({
      entityId: source.entityId,
      entityName: source.entityName,
      regionsCovered: source.regionsCovered,
      addedAt: now,
    }));

    // Only include if has at least one source
    if (sources.length > 0) {
      delete dt.rawSources;
      dt.sources = sources;
      dt.createdAt = now;
      dt.updatedAt = now;
      dataTypes.push(dt);
    }
  }

  // Sort by category then name
  dataTypes.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  console.log(`\nGenerated ${dataTypes.length} data types:`);
  dataTypes.forEach(dt => {
    const sourceNames = dt.sources.map(s => s.entityName).join(', ');
    console.log(`  - ${dt.name} (${dt.category}): ${dt.properties.length} properties, Sources: ${sourceNames}`);
  });

  // Write output
  const output = { dataTypes };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${OUTPUT_FILE}`);

  // Summary
  const totalProps = dataTypes.reduce((sum, dt) => sum + dt.properties.length, 0);
  const landcorTypes = dataTypes.filter(dt => dt.sources.some(s => s.entityId === 'copa-landcor')).length;
  const interacTypes = dataTypes.filter(dt => dt.sources.some(s => s.entityId === 'copa-interac')).length;

  console.log('\n=== Summary ===');
  console.log(`Total Data Types: ${dataTypes.length}`);
  console.log(`Total Properties: ${totalProps}`);
  console.log(`Landcor Data Types: ${landcorTypes}`);
  console.log(`Interac Data Types: ${interacTypes}`);
}

main();
