import axios from 'axios';
import config from '../config.js';
import { getAuthHeaders } from './authApi.js';

const { ADVISOR_VIEW_HOST } = config;
const PAGE_SIZE = 50;

const client = axios.create({
    baseURL: ADVISOR_VIEW_HOST,
});

const getPaginatedConsultationsByCustomerId = async (customerId, page = 0) => {
    const uri = '/advisors-view';

    const res = await client.get(uri, {
        headers: {
            ...(await getAuthHeaders()),
            'x-lz-api-version': '2.0',
            'x-lz-customerid': customerId,
        },
        params: {
            SearchCriteriaType: 'CustomerId',
            Value: customerId,
            PageNumber: page + 1,
            PageSize: PAGE_SIZE,
            ConsultationStatus: 'Open',
            ConsultationType: 'Attorney'
        },
    });

    return res?.data;
}

export const getConsultationsByCustomerId = async (customerId) => {
    const consultationIdSet = new Set();
    const result = [];
    let totalPage = 0;
    let page = 0;

    try {
        do {
            const res = await getPaginatedConsultationsByCustomerId(customerId, page);
            if (res == null) { return result; }

            const totalCount = res.totalRecordsCount ?? 0;
            totalPage = Math.ceil(totalCount / PAGE_SIZE);

            res.consultations?.forEach(c => {
                if (!consultationIdSet.has(c.id)) {
                    consultationIdSet.add(c.id);
                    result.push(c);
                }
            });

        } while (++page < totalPage);
    } catch (e) {
        console.error('Failed to find consultations by customer id', e);
        return [];
    }

    return result;
};


const getPaginatedConsultationCustomersByFirm = async (firmId, page = 0) => {
    const uri = '/advisors-view/consultations/customers';

    const res = await client.get(uri, {
        headers: {
            ...(await getAuthHeaders()),
            'x-lz-api-version': '2.0',
        },
        params: {
            FirmId: firmId,
            PageNumber: page + 1,
            PageSize: PAGE_SIZE,
            Status: 'Open',
        },
    });

    return res?.data;
};

/**
 * Fetches a paginated list of customers for the specified firm.
 *
 * @param {string} firmId - The unique identifier of the firm.
 * @returns {Promise<Array<{ 
*   firstName: string, 
*   lastName: string, 
*   phone: string, 
*   altPhone: string, 
*   email: string, 
*   personId: string, 
*   customerId: string 
* }>>} A promise that resolves to an array of customer objects.
*/
export const getConsultationCustomersByFirm = async (firmId) => {
    const customerIdSet = new Set();
    const result = [];
    let totalPage = 0;
    let page = 0;

    try {
        do {
            const res = await getPaginatedConsultationCustomersByFirm(firmId, page);
            if (res == null) { return result; }

            const totalCount = res.totalRecordsCount ?? 0;
            totalPage = Math.ceil(totalCount / PAGE_SIZE);

            res.consultedCustomers?.forEach(c => {
                if (!customerIdSet.has(c.customerId)) {
                    customerIdSet.add(c.customerId);
                    result.push(c);
                }
            });

        } while (++page < totalPage);
    } catch (e) {
        console.error('Failed to find consultation customers', e);
        return [];
    }

    return result;
};

export const getConsultationById = async (consultationId, customerId) => {
    const uri = `/advisors-view/${consultationId}`;

    try {

        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-api-version': '2.0',
                //'x-lz-customerid': customerId,
                'x-lz-authorize': 'false'
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find consultation customers', e);
        return null;//throw e;
    }
};

export const getConsultationByConfirmationNumber = async (confirmationNumber) => {
    const uri = '/advisors-view';

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-api-version': '2.0',
                'x-lz-authorize': 'false'
            },
            params: {
                SearchCriteriaType: 'ConfirmationNumber',
                Value: confirmationNumber,
            },
        });

        return res.data.consultations[0];
    } catch (e) {
        console.error('Failed to find consultation customers', e);
        throw e;
    }

}