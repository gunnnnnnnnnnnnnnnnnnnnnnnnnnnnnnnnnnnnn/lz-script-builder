import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as ecpApi from './api/ecpApi.js';
import * as ipApi from './api/intellectualPropertyApi.js';
import * as authApi from './api/authApi.js';
import * as answerBankApi from './api/answerBankApi.js';
import * as storageApi from './api/storageApi.js';
import { ENVIRONMENT } from './config.js';
import { PROCESSING_ORDERS } from './input/migrate-trademark-orders-input.js';
import { mapProoferToTrademarkExpert } from './trademark-mapper/trademarkDataMapper.js';
import { buildInternalNoteFromProofer, MIGRATED_FROM_PROOFER_TEXT } from './trademark-mapper/internalNoteMapper.js';
import { generateProoferPdf, getProoferPdfFilename } from './trademark-mapper/pdfGenerator.js';

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
 * Verify that the work item exists and matches the processing order ID
 * @param {string} workItemId 
 * @param {string} processingOrderId 
 * @returns {Promise<{ workItemId: string, accountId: string, workItemVerified: boolean }>}
 */
const verifyWorkItem = async (workItemId, processingOrderId) => {
    const workItem = await ecpApi.findWorkItemById(workItemId, TENANT_NAME);

    if (!workItem) {
        throw new Error(`Work item ${workItemId} not found`);
    }

    // Verify that the work item's processingOrderId matches
    if (workItem.processingOrderId !== processingOrderId) {
        throw new Error(
            `Work item ${workItemId} processingOrderId (${workItem.processingOrderId}) ` +
            `does not match expected processingOrderId (${processingOrderId})`
        );
    }

    return {
        workItemId: workItem.id,
        accountId: workItem.accountId,
        workItemVerified: true,
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
 * @param {string} workItemId 
 * @param {string} accountId 
 * @param {string} customerId 
 * @param {string} processingOrderId 
 * @returns {Promise<{ productId: string, isNewProductCreated: boolean }>}
 */
const findOrCreateTrademarkProduct = async (workItemId, accountId, customerId, processingOrderId) => {
    const products = await ipApi.findProducts(workItemId, PRODUCT_TYPE);
    
    if (products && products.length > 0) {
        return {
            productId: products[0].id,
            isNewProductCreated: false,
        };
    }

    // No product found, create a new one
    console.log(`No product found for workItemId ${workItemId}, creating new product...`);
    
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
};

/**
 * Check for existing internal note, update if exists, or create new one
 * @param {string} workItemId 
 * @param {object} prooferData 
 * @returns {Promise<{ internalNoteCreated: boolean, internalNoteUpdated: boolean, internalNoteUpdateFailed: boolean, internalNoteId?: string }>}
 */
const createOrUpdateInternalNote = async (workItemId, prooferData) => {
    // Get existing internal notes for the work item
    const existingNotes = await ecpApi.getInternalNotesByWorkItemId(workItemId, TENANT_NAME);

    // Check if any note contains "Migrated from Proofer"
    const existingMigratedNote = existingNotes.find(note => {
        const firstParagraphText = note.jsonNote?.root?.children?.[0]?.children?.[0]?.text;
        return firstParagraphText === MIGRATED_FROM_PROOFER_TEXT;
    });

    // Build the internal note from proofer data
    const jsonNote = buildInternalNoteFromProofer(prooferData);

    if (existingMigratedNote) {
        console.log(`Internal note with "${MIGRATED_FROM_PROOFER_TEXT}" already exists for workItemId ${workItemId}, attempting to update...`);
        
        try {
            // Attempt to update the existing note
            await ecpApi.updateInternalNoteById(existingMigratedNote.id, jsonNote, TENANT_NAME);
            
            // Pin the internal note to ensure it's always pinned
            await ecpApi.pinInternalNote(existingMigratedNote.id, TENANT_NAME);
            
            return {
                internalNoteCreated: false,
                internalNoteUpdated: true,
                internalNoteUpdateFailed: false,
                internalNoteId: existingMigratedNote.id,
            };
        } catch (error) {
            // Update failed (likely due to permissions - different JWT user created the note)
            console.log(`Failed to update internal note ${existingMigratedNote.id}: ${error.message}. Continuing...`);
            
            return {
                internalNoteCreated: false,
                internalNoteUpdated: false,
                internalNoteUpdateFailed: true,
                internalNoteId: existingMigratedNote.id,
            };
        }
    }

    // Create new internal note
    const newNote = await ecpApi.createInternalNoteToWorkItem(workItemId, jsonNote, TENANT_NAME);

    // Pin the internal note
    if (newNote?.id) {
        await ecpApi.pinInternalNote(newNote.id, TENANT_NAME);
    }

    return {
        internalNoteCreated: true,
        internalNoteUpdated: false,
        internalNoteUpdateFailed: false,
        internalNoteId: newNote?.id,
    };
};

/**
 * Process a single processing order
 * @param {object} order - { processingOrderId: string, workItemId: string }
 * @param {number} index 
 * @param {number} total 
 * @returns {Promise<object>}
 */
const process = async (order, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    
    let payload = {
        processingOrderId: order.processingOrderId,
        workItemId: order.workItemId,
    };

    try {
        // Step 1: Verify work item exists and matches processing order
        const workItemResult = await verifyWorkItem(payload.workItemId, payload.processingOrderId);
        payload = { ...payload, ...workItemResult };

        // Step 2: Get customerId from account
        const customerResult = await getCustomerIdFromAccount(payload.accountId);
        payload = { ...payload, ...customerResult };

        // Step 3: Find or create trademark product
        const productResult = await findOrCreateTrademarkProduct(
            payload.workItemId,
            payload.accountId,
            payload.customerId,
            payload.processingOrderId
        );
        payload = { ...payload, ...productResult };

        // Step 4: Fetch PROOFER data from Answer Bank
        const prooferResult = await fetchProoferData(payload.processingOrderId);
        payload = { ...payload, ...prooferResult };

        // Step 5: Map PROOFER data to TRADEMARK_EXPERT format
        const trademarkExpertData = mapProoferToTrademarkExpert(payload.prooferData);
        payload = { 
            ...payload, 
            trademarkExpertData,
            mappingComplete: true 
        };

        // Step 6: Create/update answer data in IP Service
        const answerResponse = await ipApi.createOrUpdateAnswer(
            payload.productId,
            TRADEMARK_EXPERT_ANSWER_DATA_TYPE,
            trademarkExpertData,
            false, // isCompleted
            false  // isPostUpdateProcessSkipped
        );
        payload = {
            ...payload,
            answerId: answerResponse?.id,
            answerCreated: true,
        };

        // Step 7: Create or update internal note
        const internalNoteResult = await createOrUpdateInternalNote(
            payload.workItemId,
            payload.prooferData
        );
        payload = { ...payload, ...internalNoteResult };

        // Step 8: Delete existing "_Proofer data" documents and upload new PDF file
        // First, get the work item to find existing "_Proofer data" documents
        const workItem = await ecpApi.findWorkItemById(payload.workItemId, TENANT_NAME);
        const prooferDataDocs = workItem.documents?.filter(doc => 
            doc.documentName.includes('_Proofer data')
        ) || [];
        
        // Delete existing "_Proofer data" documents
        for (const doc of prooferDataDocs) {
            console.log(`Deleting existing document: ${doc.documentName} (${doc.storageDocumentId})`);
            try {
                await storageApi.deleteDocument(doc.storageDocumentId);
            } catch (error) {
                console.warn(`Failed to delete document ${doc.documentName}: ${error.message}`);
            }
        }
        
        // Generate and upload new PDF
        const pdfBuffer = await generateProoferPdf(payload.prooferData, payload.processingOrderId);
        const pdfFilename = getProoferPdfFilename(payload.processingOrderId);
        
        const uploadResponse = await ecpApi.uploadFileToWorkItem(
            payload.workItemId,
            pdfBuffer,
            pdfFilename,
            false, // isUploadedForCustomer
            TENANT_NAME
        );
        
        payload = {
            ...payload,
            pdfUploaded: true,
            pdfStorageDocumentId: uploadResponse?.storageDocumentId,
            deletedProoferDataDocs: prooferDataDocs.length,
        };

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
            { id: 'workItemId', title: 'Work Item ID' },
            { id: 'workItemVerified', title: 'Work Item Verified' },
            { id: 'accountId', title: 'Account ID' },
            { id: 'customerId', title: 'Customer ID' },
            { id: 'productId', title: 'Product ID' },
            { id: 'isNewProductCreated', title: 'Is New Product Created' },
            { id: 'mappingComplete', title: 'Mapping Complete' },
            { id: 'answerId', title: 'Answer ID' },
            { id: 'answerCreated', title: 'Answer Created' },
            { id: 'internalNoteCreated', title: 'Internal Note Created' },
            { id: 'internalNoteUpdated', title: 'Internal Note Updated' },
            { id: 'internalNoteUpdateFailed', title: 'Internal Note Update Failed' },
            { id: 'internalNoteId', title: 'Internal Note ID' },
            { id: 'deletedProoferDataDocs', title: 'Deleted Proofer Data Docs' },
            { id: 'pdfUploaded', title: 'PDF Uploaded' },
            { id: 'pdfStorageDocumentId', title: 'PDF Storage Document ID' },
            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
    console.log(`Completed ${FILE_NAME}`);

})();

