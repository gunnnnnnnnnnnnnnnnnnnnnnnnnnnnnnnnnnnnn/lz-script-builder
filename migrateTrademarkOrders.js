import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as ecpApi from './api/ecpApi.js';
import { ENVIRONMENT } from './config.js';
import { PROCESSING_ORDERS } from './input/migrate-trademark-orders-input.js';

const limit = pLimit(5);

/** Migration Setup */
const TENANT_NAME = 'altm';
const WORK_TEMPLATE_NAME = 'ALTM_PRE_FILING_V3';

const FILE_NAME = `${ENVIRONMENT} - Trademark Order Migration [${getFormattedTimestamp()}].csv`;

/**
 * Find existing work item or create a new one if it doesn't exist
 * @param {string} processingOrderId 
 * @param {string} accountId 
 * @returns {Promise<{ workItemId: string, isNewWorkItemCreated: boolean }>}
 */
const findOrCreateWorkItem = async (processingOrderId, accountId) => {
    const existingWorkItems = await ecpApi.findWorkItemsByProcessingOrderId(
        processingOrderId,
        TENANT_NAME
    );

    if (!existingWorkItems || existingWorkItems.content?.length === 0) {
        // No work item exists, create a new one
        const newWorkItem = await ecpApi.createWorkItem(
            WORK_TEMPLATE_NAME,
            accountId,
            null, // taxInfo
            null, // location
            processingOrderId, // createdFromProcessingOrderId
            TENANT_NAME
        );
        return {
            workItemId: newWorkItem.id,
            isNewWorkItemCreated: true,
        };
    }

    // Work item already exists
    return {
        workItemId: existingWorkItems.content[0].id,
        isNewWorkItemCreated: false,
    };
};

/**
 * Process a single processing order
 * @param {object} order - { processingOrderId: string, accountId: string }
 * @param {number} index 
 * @param {number} total 
 * @returns {Promise<object>}
 */
const process = async (order, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    
    let payload = {
        processingOrderId: order.processingOrderId,
        accountId: order.accountId,
    };

    try {
        // Step 1: Find or create ALTM work item
        const workItemResult = await findOrCreateWorkItem(payload.processingOrderId, payload.accountId);
        payload = { ...payload, ...workItemResult };

        // TODO: Implement next steps here

        return {
            ...payload,
            isComplete: true
        }
    } catch (e) {
        console.error(e.message)
        return {
            ...payload,
            error: e.message,
            isComplete: false,
        }
    }
};

(async () => {
    console.log(`Start ${FILE_NAME}`);

    const promises = PROCESSING_ORDERS.map((order, index) => 
        limit(() => process(order, index + 1, PROCESSING_ORDERS.length))
    );
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'processingOrderId', title: 'Processing Order ID' },
            { id: 'accountId', title: 'Account ID' },
            { id: 'workItemId', title: 'Work Item ID' },
            { id: 'isNewWorkItemCreated', title: 'Is New Work Item Created' },
            // TODO: Add more header columns as needed
            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
    console.log(`Completed ${FILE_NAME}`);

})();

