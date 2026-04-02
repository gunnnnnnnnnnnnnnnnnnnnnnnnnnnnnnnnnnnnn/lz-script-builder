import axios from 'axios';
import { getAuthHeaders } from './authApi.js';
import config from '../config.js';

const { IP_HOST } = config;

const client = axios.create({
    baseURL: IP_HOST,
});

/**
 * Find products with optional filters
 * 
 * @param {string} workItemId - Optional work item ID filter
 * @param {string} productType - Optional product type filter (e.g., 'TRADEMARK')
 * @param {string} accountId - Optional account ID filter
 * @returns {Promise<Array>} - Response data containing products (empty array if none found)
 * 
 * @example Response structure:
 * [{
 *   id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   accountId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   customerId: "string",
 *   processingOrderId: "string",
 *   workItemId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *   type: "TRADEMARK",
 *   status: "string",
 *   parties: [...],
 *   ...
 * }]
 */
export const findProducts = async (
    workItemId = null,
    productType = null,
    accountId = null
) => {
    const params = {};
    if (workItemId) params.workItemId = workItemId;
    if (productType) params.productType = productType;
    if (accountId) params.accountId = accountId;

    const uri = '/api/v1/products';

    try {
        const res = await client.get(uri, {
            params,
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data || [];
    } catch (e) {
        console.error('Failed to find products', e.message);
        throw e;
    }
};

/**
 * Create a new product
 * 
 * @param {object} productData - Product data to create
 * @param {string} productData.accountId - Account ID
 * @param {string} productData.customerId - Customer ID
 * @param {string} productData.processingOrderId - Processing order ID
 * @param {string} productData.workItemId - Work item ID
 * @param {string} productData.type - Product type (e.g., 'TRADEMARK')
 * @param {string|null} productData.expertId - Expert ID (optional)
 * @returns {Promise<object>} - Created product data
 */
export const createProduct = async (productData) => {
    const uri = '/api/v1/products';

    try {
        const res = await client.post(uri, productData, {
            headers: {
                ...(await getAuthHeaders()),
                'Content-Type': 'application/json',
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to create product', e.message);
        throw e;
    }
};

/**
 * Create or update answer data for a product
 * Upserts transformed questionnaire data into IP service
 * 
 * @param {string} productId - Product ID
 * @param {string} dataType - Data type (e.g., 'TRADEMARK_EXPERT')
 * @param {object} data - Answer data object (TRADEMARK_EXPERT format with JSON Pointer structure)
 * @param {boolean} isCompleted - Whether the answer is completed (default: false)
 * @param {boolean} isPostUpdateProcessSkipped - Whether to skip post-update process (default: false)
 * @returns {Promise<object>} - Created/updated answer data
 * 
 * @example Request body:
 * {
 *   productId: "uuid",
 *   dataType: "TRADEMARK_EXPERT",
 *   data: {
 *     attorney: { firstName: "John", ... },
 *     owners: [{ ownerSelection: { ownerType: "individual" }, ... }],
 *     markSelection: { markFormat: "standard", ... },
 *     ...
 *   }
 * }
 * 
 * @see /references/sample-answer-data.json for data structure example
 * @see /references/data mapper info.csv for field mappings
 */
export const createOrUpdateAnswer = async (
    productId,
    dataType,
    data,
    isCompleted = false,
    isPostUpdateProcessSkipped = false
) => {
    const uri = `/api/v1/answers?isCompleted=${isCompleted}&isPostUpdateProcessSkipped=${isPostUpdateProcessSkipped}`;

    const requestBody = {
        productId,
        dataType,
        data,
    };

    try {
        const res = await client.post(uri, requestBody, {
            headers: {
                ...(await getAuthHeaders()),
                'Content-Type': 'application/json',
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to create or update answer', e.message);
        throw e;
    }
};

