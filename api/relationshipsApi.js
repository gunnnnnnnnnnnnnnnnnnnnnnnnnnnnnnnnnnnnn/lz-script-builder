import axios from 'axios';
import config from '../config.js';
import { getAuthHeaders } from './authApi.js';

const { RELATIONSHIP_HOST } = config;

const client = axios.create({
    baseURL: RELATIONSHIP_HOST,
});

/**
 * @typedef {Object} AdvisorRelationship
 * @property {string} advisorId
 * @property {number} attorneyId
 * @property {string} firmId
 * @property {string} firstName
 * @property {string|null} middleName
 * @property {string} lastName
 * @property {string} storageAccountId
 * @property {boolean} isActive
 * @property {boolean} availableToConsult
 * @property {string} externalId
 * @property {unknown} [states]
 * @property {string|null} [advisorProfileUrl]
 */

/**
 * Fetches advisors for the given state.
 *
 * @param {string} state - State code (e.g. 'AZ', 'CA').
 * @param {string} [status='Active'] - Advisor status filter.
 * @returns {Promise<{ advisorRelationships: AdvisorRelationship[] }>} Response with advisorRelationships array.
 */
export const getAdvisors = async (state, status = 'Active') => {
    const uri = '/relationships/advisors';

    const res = await client.get(uri, {
        headers: {
            ...(await getAuthHeaders()),
            'x-lz-api-version': '2.0',
            'x-lz-authorize': 'false',
        },
        params: { state, status },
    });

    return res?.data;
};
