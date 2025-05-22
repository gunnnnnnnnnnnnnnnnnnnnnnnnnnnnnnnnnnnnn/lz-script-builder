import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as advisorViewApi from './api/advisorViewApi.js';
import { ENVIRONMENT } from './config.js';
import * as fs from 'fs';

const limit = pLimit(5);

/** Migration Setup */
const TENANT = 'LEGAL_PLANS';

const GIVEN = JSON.parse(fs.readFileSync('./given.json'));


const process = async (payload, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    try {
        const consultation = await advisorViewApi.getConsultationByConfirmationNumber(payload.confirmationnumber);

        return {
            ...payload,
            status: consultation.status,
            appointmentDateFromAdvisor: consultation.appointment.appointmentDate,
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
    const fileName = `${ENVIRONMENT} - Find Open Consultations [${getFormattedTimestamp()}].csv`;
    console.log(`Start ${fileName}`);

    const promises = GIVEN.map((payload, index) => limit(() => process(payload, index + 1, GIVEN.length))); const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: fileName,
        header: [
            { id: 'confirmationnumber', title: 'Confirmation Number' },
            { id: 'workitemid', title: 'Work Item ID' },
            { id: 'accountid', title: 'Account ID' },
            { id: 'status', title: 'Status' },
            { id: 'appointmentdate', title: 'Appointment Date (ECP)' },
            { id: 'appointmentDateFromAdvisor', title: 'Appointment Date (Advisor)' },

            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
})();