import { getAuthHeaders } from './authApi.js';
import config from '../config.js';
import axios from 'axios';

const { AGREEMENT_HOST } = config;

const client = axios.create({
    baseURL: AGREEMENT_HOST,
});


/**
 * 
 * @param {*} customerId 
 * @param {*} entityOrderId 
 * @param {*} entityProcessingOrderId 
 * @param {*} orderId 
 * @param {*} processingOrderId 
 * @param {*} productId 
 * @returns {
 *  agreements: [
 *   {
 *    agreementId: number,
 *    contentType: string,
 *   }
 *  ]
 * }
 */
export const createAgreements = async (customerId, entityOrderId, entityProcessingOrderId, orderId, processingOrderId, productId, givenYear) => {
    const uri = `v1/agreements`;
    const request = {
        entityProcessingOrderId,
        entityOrderId,
        orderId,
        processingOrderId,
        givenYear,
        productId,
    };

    try {
        const res = await client.post(uri, request, {
            headers: { 
                ...(await getAuthHeaders()),
                'x-lz-customerId': customerId,
            },
        });

        return res?.data?.agreements;
    } catch (e) {
        console.error('Failed to create agreements', e);
        throw e;
    }
};