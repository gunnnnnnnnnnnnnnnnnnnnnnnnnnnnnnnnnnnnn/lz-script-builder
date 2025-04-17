import axios from 'axios';
import { getAuthHeaders } from './authApi.js';
import config from '../config.js';

const { ECP_HOST } = config;
const DEFAULT_TENANT = 'legal_plans';

const client = axios.create({
    baseURL: ECP_HOST,
});

export const getWorkItems = async () => {
    const uri = `api/v1/work-items`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data.content;
    } catch (e) {
        console.error('Failed to find task', e);
        return []
    }
}

export const findTaskById = async (id) => {
    const uri = `api/v1/tasks/${id}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find task', e);
        throw e;
    }
}

export const findWorkItemById = async (id) => {
    const uri = `api/v1/work-items/${id}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find workItem', e);
        throw e;
    }
}

export const deleteDocumentById = async (id) => {
    const uri = `api/v1/documents/${id}`;

    try {
        const res = await client.delete(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find workItem', e);
        throw e;
    }
}

export const createTaxExtension = async (accountId, workItemId, processingOrderId) => {
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
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find workItem', e);
        throw e;
    }
}

export const syncConsultation = async (tenant, accountId, confirmationNumber) => {
    const uri = `/api/v1/consultations/sync`;

    try {
        const res = await client.post(uri, [{
            confirmationNumber,
            accountId,
        }], {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenant ?? DEFAULT_TENANT,
            },
        });

        return res?.data[0];
    } catch (e) {
        console.error('failed to get account from ecp', e);
        return null;
    }
}


export const getAccountById = async (accountId, tenant) => {
    const uri = `/api/v1/accounts/${accountId}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenant ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('failed to get account from ecp', e);
        return null;
    }
}

export const cancelWorkItem = async (workItemId, tenant) => {
    const uri = `/api/v1/work-items/${workItemId}/cancel`;

    try {
        const res = await client.patch(uri, undefined, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenant ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to un-cancel workItem', e);
        throw e;
    }
}

export const findWorkItemsByProcessingOrderId = async (processingOrderId) => {
    if (!processingOrderId) { return []; }

    const uri = `api/v1/work-items?processing_order_id=${processingOrderId}&size=25&page=0`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
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
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to create workItem', e);
        throw e;
    }
}

export const addMessage = async (workItemId, jsonText) => {
    const uri = `api/v1/messages`;

    try {
        const res = await client.post(uri, {
            workItemId,
            jsonText,
        }, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
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
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to update ALTM Info', e);
        throw e;
    }
}

export const forceCompleteTask = async (taskId, selectedDecisionName) => {
    const uri = `/api/v1/admin/tasks/${taskId}/complete`;
    const request = selectedDecisionName ? { selectedDecisionName } : {};

    try {
        const res = await client.put(uri, request, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to force-complete task', e);
        throw e;
    }
}

export const uncancelWorkItem = async (workItemId) => {
    const uri = `/api/v1/work-items/${workItemId}/un-cancel`;

    try {
        const res = await client.patch(uri, undefined, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to un-cancel workItem', e);
        throw e;
    }
}

export const updateWorkItem = async (workItemId, processingOrderId, tenant) => {
    const uri = `/api/v1/work-items/${workItemId}`;

    try {
        const res = await client.patch(
            uri,
            {
                createdFromProcessingOrderId: processingOrderId,
            }, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenant ?? DEFAULT_TENANT,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to update workItem', e);
        throw e;
    }
}

export const assignSkillToExpert = async (tenant, expertUserId, skillName, locationValues) => {
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
                    'x-lz-current-tenant-name': tenant ?? DEFAULT_TENANT,
                },
            },
        );

        return res?.data;
    } catch (e) {
        console.error('Failed to assign skill', e);
        throw e;
    }
}

const getOutdatedWorkItemIds = async (tenant, workTemplateName, page = 0, size = 100) => {
    const uri = `api/v1/work-items/outdated`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenant,
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

export const getAllOutdatedWorkItemIds = async (tenant, workTemplateName) => {
    const workItemIdSet = new Set();
    let totalPage = 0;
    let page = 0;

    try {
        do {
            const res = await getOutdatedWorkItemIds(tenant, workTemplateName, page, 100);
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

export const syncWorkItem = async (tenant, workItemId) => {
    const uri = `api/v1/work-items/${workItemId}/sync`;

    try {
        const res = await client.post(uri, null, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-current-tenant-name': tenant,
            },
        });

        return res?.data;
    } catch (e) {
        //console.error('Failed to sync work item', e);
        throw e;
    }
}
