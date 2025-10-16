import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as ecpApi from './api/ecpApi.js';
import * as ipApi from './api/intellectualPropertyApi.js';
import * as authApi from './api/authApi.js';
import * as answerBankApi from './api/answerBankApi.js';
import { ENVIRONMENT } from './config.js';
import { PROCESSING_ORDERS } from './input/migrate-trademark-orders-input.js';
import { mapProoferToTrademarkExpert } from './trademark-mapper/trademarkDataMapper.js';

const limit = pLimit(5);

/** Migration Setup */
const TENANT_NAME = 'altm';
const WORK_TEMPLATE_NAME = 'ALTM_PRE_FILING_V3';
const PRODUCT_TYPE = 'TRADEMARK';
const TRADEMARK_EXPERT_ANSWER_DATA_TYPE = 'TRADEMARK_EXPERT';

const FILE_NAME = `${ENVIRONMENT} - Trademark Order Migration [${getFormattedTimestamp()}].csv`;

/**
 * Get customerId from account
 * @param {string} accountId 
 * @returns {Promise<{ customerId: string }>}
 */
const getCustomerIdFromAccount = async (accountId) => {
    const account = await authApi.getAccountById(accountId);
    
    if (!account) {
        throw new Error(`Account not found: ${accountId}`);
    }

    if (!account.members || account.members.length === 0) {
        throw new Error(`No members found for account: ${accountId}`);
    }

    // Get the first member's userId as customerId
    const customerId = account.members[0].userId;

    return {
        customerId,
    };
};

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
 * Fetch PROOFER data from Answer Bank
 * @param {string} processingOrderId 
 * @returns {Promise<{ prooferData: object }>}
 */
const fetchProoferData = async (processingOrderId) => {
    const answers = await answerBankApi.getAnswersByProcessingOrderId(processingOrderId);
    
    if (!answers || answers.length === 0) {
        throw new Error(`No PROOFER data found for processingOrderId: ${processingOrderId}`);
    }

    // Return the first answer's questionnaire data
    return {
        prooferData: answers[0].questionnaireFieldGroupAnswers,
    };
};

/**
 * Find trademark product by work item ID, or create one if not found
 * Includes retry logic to handle eventual consistency
 * @param {string} workItemId 
 * @param {string} accountId 
 * @param {string} customerId 
 * @param {string} processingOrderId 
 * @returns {Promise<{ productId: string, isNewProductCreated: boolean }>}
 */
const findOrCreateTrademarkProduct = async (workItemId, accountId, customerId, processingOrderId) => {
    try {
        return await pRetry(
            async () => {
                const products = await ipApi.findProducts(workItemId, PRODUCT_TYPE);
                
                if (!products || products.length === 0) {
                    throw new Error('No trademark product found, retrying...');
                }

                return {
                    productId: products[0].id,
                    isNewProductCreated: false,
                };
            },
            {
                retries: 3,
                minTimeout: 1000,
                maxTimeout: 1000,
                onFailedAttempt: (error) => {
                    console.log(
                        `Finding product for workItemId ${workItemId}: Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
                    );
                },
            }
        );
    } catch (error) {
        // All retries exhausted, create a new product
        console.log(`No product found after retries for workItemId ${workItemId}, creating new product...`);
        
        const newProduct = await ipApi.createProduct({
            accountId,
            customerId,
            processingOrderId,
            workItemId,
            type: PRODUCT_TYPE,
            expertId: null,
        });

        return {
            productId: newProduct.id,
            isNewProductCreated: true,
        };
    }
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
        // Step 0: Get customerId from account
        const customerResult = await getCustomerIdFromAccount(payload.accountId);
        payload = { ...payload, ...customerResult };

        // Step 1: Find or create ALTM work item
        const workItemResult = await findOrCreateWorkItem(payload.processingOrderId, payload.accountId);
        payload = { ...payload, ...workItemResult };

        // Step 2: Find or create trademark product
        const productResult = await findOrCreateTrademarkProduct(
            payload.workItemId,
            payload.accountId,
            payload.customerId,
            payload.processingOrderId
        );
        payload = { ...payload, ...productResult };

        // Step 3: Fetch PROOFER data from Answer Bank
        const prooferResult = await fetchProoferData(payload.processingOrderId);
        payload = { ...payload, ...prooferResult };

        // Step 4: Map PROOFER data to TRADEMARK_EXPERT format
        const trademarkExpertData = mapProoferToTrademarkExpert(payload.prooferData);
        payload = { 
            ...payload, 
            trademarkExpertData,
            mappingComplete: true 
        };

        // TODO: Step 5 - Create/update answer data in IP Service

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
            { id: 'customerId', title: 'Customer ID' },
            { id: 'workItemId', title: 'Work Item ID' },
            { id: 'isNewWorkItemCreated', title: 'Is New Work Item Created' },
            { id: 'productId', title: 'Product ID' },
            { id: 'isNewProductCreated', title: 'Is New Product Created' },
            { id: 'mappingComplete', title: 'Mapping Complete' },
            // TODO: Add answer creation status columns
            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
    console.log(`Completed ${FILE_NAME}`);

})();

