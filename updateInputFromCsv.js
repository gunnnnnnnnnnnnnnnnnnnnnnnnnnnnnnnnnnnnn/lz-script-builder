import fs from 'fs';
import path from 'path';

const CSV_FILE = './input/test-run-1.csv';
const OUTPUT_FILE = './input/migrate-trademark-orders-input.js';

/**
 * Parse CSV and generate input file
 */
function updateInputFromCsv() {
    console.log('Reading CSV file...');
    
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    console.log(`Found ${dataLines.length} entries in CSV\n`);
    
    // Parse CSV rows
    const entries = dataLines.map(line => {
        // Split by comma, handling quoted values if needed
        const parts = line.split(',');
        const processingOrderId = parts[0].trim();
        const accountId = parts[2].trim(); // Account ID is in column 3 (index 2)
        
        return { processingOrderId, accountId };
    });
    
    // Generate the JavaScript file content
    const jsContent = `/**
 * Processing Orders for Trademark Order Migration
 * Each entry should contain processingOrderId and accountId
 * 
 * Generated from: ${CSV_FILE}
 * Total entries: ${entries.length}
 */
export const PROCESSING_ORDERS = [
${entries.map(({ processingOrderId, accountId }) => 
    `    { processingOrderId: '${processingOrderId}', accountId: '${accountId}' },`
).join('\n')}
];
`;
    
    // Write to output file
    fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf8');
    
    console.log('✓ Successfully updated input file!');
    console.log(`  Input: ${CSV_FILE}`);
    console.log(`  Output: ${OUTPUT_FILE}`);
    console.log(`  Entries: ${entries.length}`);
    
    // Show first 3 entries as preview
    console.log('\nFirst 3 entries:');
    entries.slice(0, 3).forEach(({ processingOrderId, accountId }) => {
        console.log(`  { processingOrderId: '${processingOrderId}', accountId: '${accountId}' }`);
    });
}

// Run the script
updateInputFromCsv();


