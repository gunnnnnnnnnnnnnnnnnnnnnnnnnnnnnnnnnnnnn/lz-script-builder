import axios from 'axios';
import { getAuthHeaders } from './authApi.js';
import config from '../config.js';

const { ECP_HOST } = config;
const DEFAULT_TENANT = 'legal_plans';

const client = axios.create({
    baseURL: ECP_HOST,
});

export const getWorkItems = async (tenantName = null) => {
    const uri = `api/v1/work-items`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data.content;
    } catch (e) {
        console.error('Failed to find task', e);
        return []
    }
}

export const findTaskById = async (id, tenantName = null) => {
    const uri = `api/v1/tasks/${id}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find task', e);
        throw e;
    }
}

export const findWorkItemById = async (id, tenantName = null) => {
    const uri = `api/v1/work-items/${id}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find workItem', e);
        throw e;
    }
}

export const deleteDocumentById = async (id, tenantName = null) => {
    const uri = `api/v1/documents/${id}`;

    try {
        const res = await client.delete(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find workItem', e);
        throw e;
    }
}

export const createTaxExtension = async (accountId, workItemId, processingOrderId, tenantName = null) => {
    const uri = `api/v1/work-items/create-from-template`;

    try {
        const res = await client.post(uri, {
            workTemplateName: 'TAX_EXTENSION',
            accountId,
            taxInfo: null,
            location: null,
            linkedWorkItems: [
                workItemId,
            ],
            createdFromProcessingOrderId: processingOrderId,
        }, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find workItem', e);
        throw e;
    }
}

export const syncConsultation = async (accountId, confirmationNumber, tenantName = null) => {
    const uri = `/api/v1/consultations/sync`;

    try {
        const res = await client.post(uri, [{
            confirmationNumber,
            accountId,
        }], {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data[0];
    } catch (e) {
        if (e.response?.data?.message?.includes('duplicate key value violates unique constraint')) {
            console.error('failed to sync consultation. work item exists with different account id');
            return null;
        }

        console.error('failed to sync consultation', e);
        throw e;
    }
}


export const getAccountById = async (accountId, tenantName = null) => {
    const uri = `/api/v1/accounts/${accountId}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('failed to get account from ecp', e);
        return null;
    }
}

export const cancelWorkItem = async (workItemId, tenantName = null) => {
    const uri = `/api/v1/work-items/${workItemId}/cancel`;

    try {
        const res = await client.patch(uri, undefined, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to un-cancel workItem', e);
        throw e;
    }
}

export const findWorkItemsByProcessingOrderId = async (processingOrderId, tenantName = null) => {
    if (!processingOrderId) { return []; }

    const uri = `api/v1/work-items?processing_order_id=${processingOrderId}&size=25&page=0`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to find workItems by processingOrderId (${processingOrderId})`, e);
        throw e;
    }

}

export const createWorkItem = async (
    workTemplateName,
    accountId,
    taxInfo,
    location,
    createdFromProcessingOrderId,
    tenantName = null,
) => {
    const uri = `api/v1/work-items/create-from-template`;

    try {
        const res = await client.post(uri, {
            workTemplateName,
            accountId,
            taxInfo,
            location,
            linkedWorkItems: [],
            createdFromProcessingOrderId,
        }, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to create workItem', e);
        throw e;
    }
}

export const addMessage = async (workItemId, jsonText, tenantName = null) => {
    const uri = `api/v1/messages`;

    try {
        const res = await client.post(uri, {
            workItemId,
            jsonText,
        }, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to create workItem', e);
        throw e;
    }
}

export const updateTaxInfo = async (
    workItemId,
    taxFormType,
) => {
    const uri = `/api/v1/work-items/${workItemId}/tax-info`;
    const request = {
        taxFormType,
    };

    try {
        const res = await client.patch(uri, request, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': 'tax',
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to update Tax Info', e);
        throw e;
    }
}

export const updateAltmInfo = async (
    workItemId,
    docketNumber,
    serialNumber,
    usptoDeadline,
    internalDeadline,
) => {
    const uri = `/api/v1/work-items/${workItemId}/altm-info`;
    const request = {
        docketNumber,
        serialNumber,
        usptoDeadline,
        internalDeadline,
    };

    try {
        const res = await client.patch(uri, request, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': 'altm',
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to update ALTM Info', e);
        throw e;
    }
}

export const forceCompleteTask = async (taskId, selectedDecisionName, tenantName = null) => {
    const uri = `/api/v1/admin/tasks/${taskId}/complete`;
    const request = selectedDecisionName ? { selectedDecisionName } : {};

    try {
        const res = await client.put(uri, request, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to force-complete task', e);
        throw e;
    }
}

export const uncancelWorkItem = async (workItemId, tenantName = null) => {
    const uri = `/api/v1/work-items/${workItemId}/un-cancel`;

    try {
        const res = await client.patch(uri, undefined, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to un-cancel workItem', e);
        throw e;
    }
}

export const updateWorkItem = async (workItemId, processingOrderId, tenantName = null) => {
    const uri = `/api/v1/work-items/${workItemId}`;

    try {
        const res = await client.patch(
            uri,
            {
                createdFromProcessingOrderId: processingOrderId,
            }, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to update workItem', e);
        throw e;
    }
}

export const assignSkillToExpert = async (expertUserId, skillName, locationValues, tenantName = null) => {
    const uri = `/api/v1/experts/${expertUserId}/assign-skills`;

    const request = locationValues.map(locationValue => ({
        skillName,
        locationValue
    }));

    try {
        const res = await client.post(
            uri,
            request,
            {
                headers: {
                    ...(await getAuthHeaders()),
                    'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
                },
            },
        );

        return res?.data;
    } catch (e) {
        console.error('Failed to assign skill', e);
        throw e;
    }
}

const getOutdatedWorkItemIds = async (workTemplateName, page = 0, size = 100, tenantName = null) => {
    const uri = `api/v1/work-items/outdated`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
            params: {
                'work-template': workTemplateName,
                page,
                size,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find task', e);
        return []
    }
}

export const getAllOutdatedWorkItemIds = async (workTemplateName, tenantName = null) => {
    const workItemIdSet = new Set();
    let totalPage = 0;
    let page = 0;

    try {
        do {
            const res = await getOutdatedWorkItemIds(workTemplateName, page, 100, tenantName);
            if (res == null) { return workItemIdSet; }

            totalPage = res.totalPages;

            res.content?.forEach(workItemId => {
                workItemIdSet.add(workItemId);
            });
        } while (++page < totalPage);
    } catch (e) {
        console.error('Failed to get oudated work item ids.', e);
        return [];
    }

    return workItemIdSet;
}

export const syncWorkItem = async (workItemId, tenantName = null) => {
    const uri = `api/v1/work-items/${workItemId}/sync`;

    try {
        const res = await client.post(uri, null, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        //console.error('Failed to sync work item', e);
        throw e;
    }
}

/**
 * Retrieves internal notes for a specific work item.
 * 
 * @param {string} workItemId - The ID of the work item
 * @param {string|null} tenantName - Optional tenant name (defaults to DEFAULT_TENANT if not provided)
 * @returns {Promise<Array>} Array of internal note objects
 * 
 * @example
 * // Sample response structure:
 * [
 *   {
 *     "id": "8639fea9-f3ea-40b0-8137-0f0ce50fecc0",
 *     "createdByExpertId": "15686667",
 *     "note": null,
 *     "createdAt": "2025-10-16T17:22:22.934Z",
 *     "jsonNote": { ... },
 *     "createdBy": { ... },
 *     "firmAccount": { ... },
 *     "isPinned": false,
 *     "pinnedBy": null,
 *     "updatedBy": { ... },
 *     "updatedAt": "2025-10-16T17:47:06.304288728Z"
 *   }
 * ]
 */
export const getInternalNotesByWorkItemId = async (workItemId, tenantName = null) => {
    const uri = `api/v1/internal-notes`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
            params: {
                workItemId,
            },
        });

        return res?.data || [];
    } catch (e) {
        console.error(`Failed to get internal notes for workItemId ${workItemId}`, e);
        throw e;
    }
}

/**
 * Updates an internal note by its ID.
 * 
 * @param {string} noteId - The ID of the internal note to update
 * @param {Object} jsonNote - The jsonNote object containing the note structure
 * @param {string|null} tenantName - Optional tenant name (defaults to DEFAULT_TENANT if not provided)
 * @returns {Promise<Object>} Updated internal note object
 * 
 * @example
 * // Sample request body structure:
 * const jsonNote = {
 *   root: {
 *     children: [
 *       {
 *         children: [
 *           {
 *             detail: 0,
 *             format: 1,
 *             mode: "normal",
 *             style: "",
 *             text: "Mɪɢʀᴀᴛᴇᴅ Fʀᴏᴍ Pʀᴏᴏꜰᴇʀ",
 *             type: "text",
 *             version: 1
 *           }
 *         ],
 *         direction: "ltr",
 *         format: "",
 *         indent: 0,
 *         type: "paragraph",
 *         version: 1
 *       }
 *     ],
 *     direction: "ltr",
 *     format: "",
 *     indent: 0,
 *     type: "root",
 *     version: 1
 *   }
 * };
 */
export const updateInternalNoteById = async (noteId, jsonNote, tenantName = null) => {
    const uri = `api/v1/internal-notes/${noteId}`;

    try {
        const res = await client.patch(uri, {
            jsonNote,
        }, {
            headers: {
                ...(await getAuthHeaders()),
                'Content-Type': 'application/json',
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to update internal note ${noteId}`, e);
        throw e;
    }
}

/**
 * Creates a new internal note and attaches it to a work item.
 * 
 * @param {string} workItemId - The ID of the work item to attach the note to
 * @param {Object} jsonNote - The jsonNote object containing the note structure
 * @param {string|null} tenantName - Optional tenant name (defaults to DEFAULT_TENANT if not provided)
 * @returns {Promise<Object>} Created internal note object
 * 
 * @example
 * // Sample request body structure:
 * const jsonNote = {
 *   root: {
 *     children: [
 *       {
 *         children: [
 *           {
 *             detail: 0,
 *             format: 1,
 *             mode: "normal",
 *             style: "",
 *             text: "Migrated from Proofer",
 *             type: "text",
 *             version: 1
 *           }
 *         ],
 *         direction: "ltr",
 *         format: "",
 *         indent: 0,
 *         type: "paragraph",
 *         version: 1
 *       }
 *     ],
 *     direction: "ltr",
 *     format: "",
 *     indent: 0,
 *     type: "root",
 *     version: 1
 *   }
 * };
 * 
 * const note = await createInternalNoteToWorkItem(workItemId, jsonNote, 'altm');
 */
export const createInternalNoteToWorkItem = async (workItemId, jsonNote, tenantName = null) => {
    const uri = `api/v1/internal-notes/add-to-work-item`;

    try {
        const res = await client.post(uri, {
            workItemId,
            jsonNote,
        }, {
            headers: {
                ...(await getAuthHeaders()),
                'Content-Type': 'application/json',
                'x-lz-current-tenant-name': tenantName ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to create internal note for workItemId ${workItemId}`, e);
        throw e;
    }
}
