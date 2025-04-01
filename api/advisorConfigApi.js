import axios from 'axios';
import config from '../config.js';
import { getAuthHeaders } from './authApi.js';

const PAGE_SIZE = 50;

const client = axios.create({
    baseURL: config.ADVISOR_CONFIG_HOST,
});

const getPaginatedAdvisorsByFirm = async (firmId, page = 0) => {
    const uri = '/advisors/configurations/advisors';

    const res = await client.get(uri, {
        headers: {
            ...(await getAuthHeaders()),
            'x-lz-api-version': '2.0',
        },
        params: {
            FirmId: firmId,
            Status: 'Active',
            AdvisorType: 'All',
            PageNumber: page + 1,
            PageSize: PAGE_SIZE,
        },
    });

    return res?.data;
};

/**
 * Fetches a paginated list of advisors for the specified firm.
 *
 * @param {string} firmId - The unique identifier of the firm.
 * @returns {Promise<Array<{ 
*   id: string, 
*   firstName: string, 
*   middleName: string, 
*   lastName: string, 
*   firmName: string, 
*   firmId: string, 
*   contactInfo: { 
*     timeZone: string, 
*     website: string, 
*     email: string, 
*     address: { 
*       address1: string, 
*       address2: string, 
*       city: string, 
*       county: string, 
*       state: string, 
*       zipCode: string, 
*       country: string 
*     }, 
*     phones: Array<{ 
*       type: string, 
*       value: string, 
*       allowText: boolean, 
*       provider: string 
*     }>
*   }, 
*   advisorTypes: string[], 
*   advisorRoles: string[], 
*   active: boolean, 
*   planStates: Array<{ 
*     planType: string, 
*     states: string[] 
*   }>, 
*   createdBy: string, 
*   updatedBy: string, 
*   version: number, 
*   dateCreated: string, 
*   dateUpdated: string 
* }>>} A promise that resolves to an array of advisor objects.
*/
export const getAdvisorsByFirm = async (firmId) => {
    const advisorIdSet = new Set();
    const result = [];
    let totalPage = 0;
    let page = 0;

    try {
        do {
            const res = await getPaginatedAdvisorsByFirm(firmId, page);
            if (res == null) { return result; }

            const totalCount = res.totalRecordsCount ?? 0;
            totalPage = Math.ceil(totalCount / PAGE_SIZE);

            res.advisorSearchResult?.forEach(a => {
                if (!advisorIdSet.has(a.id)) {
                    advisorIdSet.add(a.id);
                    result.push(a);
                }
            });
        } while (++page < totalPage);
    } catch (e) {
        console.error('Failed to find consultation customers', e);
        return [];
    }

    return result;
};

export const getAdvisorById = async (advisorId) => {
    const uri = `/advisors/configurations/advisors/${advisorId}`;

    try {

        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-api-version': '2.0',
                'x-lz-authorize': false,
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to get advisor by id (${advisorId}).`, e);
        throw e;
    }
};