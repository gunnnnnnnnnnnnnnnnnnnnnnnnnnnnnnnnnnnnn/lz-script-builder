import fs from 'fs';
import path from 'path';
import * as ecpApi from './api/ecpApi.js';
import { WORK_ITEM_IDS } from './input/work-item-ids-input.js';

const TENANT_NAME = 'altm';
const OUTPUT_DIR = './output';
const OUTPUT_FILE = 'work-item-details.csv';
const CONCURRENT_REQUESTS = 20; // Number of concurrent API requests

/**
 * Fetches work item details and generates a CSV file
 */
async function fetchWorkItemDetails() {
    console.log(`Starting to fetch details for ${WORK_ITEM_IDS.length} work items...`);
    console.log(`Using ${CONCURRENT_REQUESTS} concurrent requests\n`);
    
    if (WORK_ITEM_IDS.length === 0) {
        console.error('No work item IDs provided. Please add work item IDs to input/work-item-ids-input.js');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Create array of fetch functions that maintain their index
    const fetchPromises = WORK_ITEM_IDS.map((workItemId, index) => async () => {
        try {
            const workItem = await ecpApi.findWorkItemById(workItemId, TENANT_NAME);
            
            const accountId = workItem?.accountId || '';
            const processingOrderId = workItem?.orderQuestionnaire?.userOrderId || '';
            
            successCount++;
            if (successCount % 100 === 0 || successCount === WORK_ITEM_IDS.length) {
                console.log(`Progress: ${successCount}/${WORK_ITEM_IDS.length} work items fetched...`);
            }
            
            return {
                index,
                workItemId,
                accountId,
                processingOrderId,
            };
        } catch (error) {
            errorCount++;
            console.error(`✗ Failed to fetch work item ${workItemId}:`, error.message);
            
            return {
                index,
                workItemId,
                accountId: 'ERROR',
                processingOrderId: 'ERROR',
            };
        }
    });

    // Process in batches with concurrency control
    const results = await processConcurrently(fetchPromises, CONCURRENT_REQUESTS);
    
    // Sort results by original index to maintain order
    results.sort((a, b) => a.index - b.index);

    // Generate CSV
    console.log('\nGenerating CSV file...');
    const csvContent = generateCSV(results);
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Write to file
    const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    console.log('\n===========================================');
    console.log('Summary:');
    console.log(`  Total work items: ${WORK_ITEM_IDS.length}`);
    console.log(`  Successfully fetched: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`\nCSV file saved to: ${outputPath}`);
    console.log('===========================================\n');
}

/**
 * Process promises with concurrency control
 */
async function processConcurrently(promiseFunctions, concurrency) {
    const results = [];
    const executing = [];
    
    for (const promiseFn of promiseFunctions) {
        const promise = promiseFn().then(result => {
            results.push(result);
            return result;
        });
        
        executing.push(promise);
        
        if (executing.length >= concurrency) {
            await Promise.race(executing);
            // Remove completed promises
            executing.splice(0, executing.findIndex(p => p === promise) + 1);
        }
    }
    
    // Wait for remaining promises
    await Promise.all(executing);
    
    return results;
}

/**
 * Generates CSV content from results
 */
function generateCSV(results) {
    // CSV header
    const header = 'workItemId,accountId,processingOrderId';
    
    // CSV rows
    const rows = results.map(row => {
        return `${row.workItemId},${row.accountId},${row.processingOrderId}`;
    });
    
    return [header, ...rows].join('\n');
}

// Run the script
fetchWorkItemDetails().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

