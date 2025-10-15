import axios from 'axios';
import { getAuthHeaders } from './authApi.js';
import config from '../config.js';

const { ANSWER_BANK_HOST } = config;

const client = axios.create({
    baseURL: ANSWER_BANK_HOST,
});

/**
 * Get answers by processing order ID (batch)
 * Returns PROOFER questionnaire data
 * 
 * @param {string} processingOrderId - Processing order ID (userOrderId)
 * @param {number} source - Source identifier (default: 0)
 * @returns {Promise<Array>} - Array of answer data
 * 
 * @example Response structure:
 * [{
 *   questionnaireFieldGroupAnswers: {
 *     userOrderId: "512037491",
 *     fieldAnswers: [
 *       { fieldName: "mark", fieldValue: "Corporation Slogan", ... }
 *     ],
 *     groupAnswers: [
 *       { groupName: "signatory_info_GRP", fieldName: "signatory_info_GRP_signature_ST_1", fieldValue: "Jane Doe", groupIndex: 1, ... }
 *     ]
 *   }
 * }]
 * 
 * @see /references/sample-answer-bank-data-*.json for full response examples
 */
export const getAnswersByProcessingOrderId = async (processingOrderId, source = 0) => {
    const uri = '/answers/batch';

    try {
        const res = await client.get(uri, {
            params: {
                source,
                userOrderIds: processingOrderId,
            },
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-authorize': 'false',
            },
        });

        return res?.data || [];
    } catch (e) {
        console.error('Failed to get answers', e.message);
        throw e;
    }
};

