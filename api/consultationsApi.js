import axios from 'axios';
import config from '../config.js';
import { getAuthHeaders } from './authApi.js';

const PAGE_SIZE = 50;
const client = axios.create({
    baseURL: config.CONSULTATIONS_HOST,
});


export const APPOINTMENT_STATUS_ENUM = {
    All: 0,
    NotScheduled: 2,
    Cancelled: 3,
    Unassigned: 9,
    Scheduled: 10,
    Completed: 16,
    PendingNoContact: 37,
    Reassigned: 41
};

/**
 * 
 * @param {*} customerId 
 * @param {*} appointmentStatus 
 * @returns {
 *     consultationRequestId: 'dd157ed6-a3e9-4b2c-b796-95fd28887417',
 *     attorneyAssignedDate: '2025-01-31T17:17:35.45Z',
 *     consultationScheduledDate: '2025-03-04T14:00:00Z',
 *     lawFirmAssignedDate: '2025-01-31T17:17:34.783Z',
 *     attorneyId: 1223,
 *     attorneyFirstName: 'Jonathan',
 *     attorneyLastName: 'Panossian',
 *     consultationState: 'CA',
 *     consultationStateName: 'California',
 *     lawFirmName: 'Arroyo Law Group, LLP',
 *     legalMatter: 'Criminal Defense',
 *     orderId: 46643563,
 *     processingOrderId: 511729007,
 *     firmTimeZone: 'PST',
 *     timeTradeApptConfNumber: 'VBX81F1S9',
 *     timeZone: 'PST',
 *     appointmentStatus: 'Scheduled',
 *     details: null
 *   }
 */
export const getConsultationsByCustomerId = async (customerId) => {
    const uri = `/consultations/attorney/appointments/${customerId}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                //'x-lz-api-version': '1.0',
                'x-lz-customerid': customerId,
            },
        });

        return res?.data;
    } catch (e) {
        console.error('Failed to find consultations by customer id', e);
        return [];
    }
};
