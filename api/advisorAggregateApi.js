import axios from 'axios';
import config from '../config.js';
import { getAuthHeaders } from './authApi.js';

const { ADVISOR_AGGREGATE_HOST } = config;

const client = axios.create({
    baseURL: ADVISOR_AGGREGATE_HOST,
});

export const syncConsultation = async (
    consultationStatus,
    advisorId,
    advisorFirstName,
    advisorLastName,
    advisorFirmId,
    timezone,
    appointmentDate,
    duration,
    appointmentStatus,
    confirmationNumber,
    consultationId,
) => {
    const uri = '/advisors/consultations/sync';

    const res = await client.put(uri, {
        status: consultationStatus,
        advisorDetails: {
            id: advisorId,
            firstName: advisorFirstName,
            lastName: advisorLastName,
            firmId: advisorFirmId,
        },
        appointment: {
            timezone,
            appointmentDate,
            duration,
            appointmentStatus,
        },
        confirmationNumber,
        updatedBy: 'Gunn',
        consultationId,
    }, {
        headers: {
            ...(await getAuthHeaders()),
            'x-lz-api-version': '2.0',
            'x-lz-authorize': 'false',
        },
    });

    return res?.data;
};