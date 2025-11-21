import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';
import fs from 'fs';
import csv from 'csv-parser';

import * as ordersApi from './api/ordersApi.js';
import * as agreementApi from './api/agreementApi.js';
import { ENVIRONMENT } from './config.js';

const limit = pLimit(5);

/** Migration Setup */
const INPUT_CSV_FILE = './input/input_agreement.csv';

// Get current date in MMDDYYYY format for output directory
const getOutputDirectory = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `./output/${month}${day}${year}`;
};

const OUTPUT_DIR = getOutputDirectory();
const FILE_NAME = `${OUTPUT_DIR}/${ENVIRONMENT} - Agreement Fix [${getFormattedTimestamp()}].csv`;

/**
 * Parse CSV file and return array of records
 * @returns {Promise<Array>}
 */
const parseInputCsv = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(INPUT_CSV_FILE)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

/**
 * Main processing function for fixing a single agreement
 * @param {object} item - Input item with agreement details
 * @param {number} index 
 * @param {number} total 
 * @returns {Promise<object>}
 */
const process = async (item, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    
    let payload = {
        type: item.type,
        customerId: item.customerId,
        entityOrderId: item.entityOrderId,
        entityProcessingOrderId: item.entityProcessingOrderId,
        givenYear: item.givenYear,
        isActive: item.isActive,
        orderId: item.orderId,
        processingOrderId: item.processingOrderId,
        productId: item.productId,
    };

    try {
        // Step 1: Get order using entityOrderId if exists, otherwise use orderId
        const orderIdToUse = item.entityOrderId || item.orderId;
        console.log(`Fetching order ${orderIdToUse} for customer ${item.customerId}...`);
        
        const orderResponse = await ordersApi.getOrder(orderIdToUse, item.customerId);
        
        if (!orderResponse) {
            throw new Error(`Failed to fetch order ${orderIdToUse}`);
        }

        const isCancelled = orderResponse.order?.isCancelled;
        payload.isCancelled = isCancelled;

        // If order is cancelled, stop processing
        if (isCancelled) {
            console.log(`Order ${orderIdToUse} is cancelled. Skipping...`);
            return {
                ...payload,
                skippedReason: 'Order is cancelled',
                isComplete: false,
            };
        }

        // Step 2: Create agreements
        console.log(`Order ${orderIdToUse} is not cancelled. Creating agreements...`);
        
        const agreements = await agreementApi.createAgreements(
            item.customerId,
            item.entityOrderId,
            item.entityProcessingOrderId,
            item.orderId,
            item.processingOrderId,
            item.productId,
            item.givenYear || null
        );

        payload.agreementsCreated = agreements ? agreements.length : 0;
        payload.agreementIds = agreements ? agreements.map(a => a.agreementId).join(';') : '';
        
        console.log(`Created ${payload.agreementsCreated} agreement(s) for order ${orderIdToUse}`);

        return {
            ...payload,
            isComplete: true
        };
    } catch (e) {
        console.error(e.message);
        return {
            ...payload,
            error: e.message,
            isComplete: false,
        };
    }
};

(async () => {
    console.log(`Start ${FILE_NAME}`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    }
    
    console.log(`Reading input from ${INPUT_CSV_FILE}...`);

    // Parse CSV file
    const inputData = await parseInputCsv();
    console.log(`Loaded ${inputData.length} records from CSV`);

    if (!inputData || inputData.length === 0) {
        console.log('No input data found.');
        return;
    }

    const promises = inputData.map((item, index) => 
        limit(() => process(item, index + 1, inputData.length))
    );
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'type', title: 'Type' },
            { id: 'customerId', title: 'Customer ID' },
            { id: 'entityOrderId', title: 'Entity Order ID' },
            { id: 'entityProcessingOrderId', title: 'Entity Processing Order ID' },
            { id: 'orderId', title: 'Order ID' },
            { id: 'processingOrderId', title: 'Processing Order ID' },
            { id: 'productId', title: 'Product ID' },
            { id: 'givenYear', title: 'Given Year' },
            { id: 'isActive', title: 'Is Active' },
            { id: 'isCancelled', title: 'Is Cancelled' },
            { id: 'agreementsCreated', title: 'Agreements Created' },
            { id: 'agreementIds', title: 'Agreement IDs' },
            { id: 'skippedReason', title: 'Skipped Reason' },
            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
    console.log(`Completed ${FILE_NAME}`);
})();

