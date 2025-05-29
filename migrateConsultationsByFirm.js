import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as fs from 'fs';
import * as advisorViewApi from './api/advisorViewApi.js';
import * as advisorAggregateApi from './api/advisorAggregateApi.js';
import * as consultationsApi from './api/consultationsApi.js';
import * as ordersApi from './api/ordersApi.js';
import * as authApi from './api/authApi.js';
import * as ecpApi from './api/ecpApi.js';
import { ENVIRONMENT } from './config.js';

const limit = pLimit(5);

/** Migration Setup */
const TENANT = 'LEGAL_PLANS';

const CONSULTATION_MIGRATION_INPUT = JSON.parse(fs.readFileSync('./consultationMigrationInput.json'));

const createConsultationWorkItem = async (payload) => {
    const res = await ecpApi.syncConsultation(
        TENANT,
        payload.accountId,
        payload.confirmationNumber,
    );

    return {
        workItemId: res.workItemId,
        expertUserId: res.expert?.lzUserId,
        expertFirstName: res.expert?.firstName,
        expertLastName: res.expert?.lastName,
        topic: res.topic?.name,
        appointmentDate: res.dateTime
    };
};

const getAccountIdByOrderId = async (payload) => {
    try {
        const order = (await ordersApi.getOrder(payload.orderId, payload.customerId))?.order;
        const orderGroup = (await ordersApi.getOrderGroup(order.orderGroupId, payload.customerId));

        if (!orderGroup.accountId) {
            const userInfo = await authApi.getUserByUserId(payload.customerId);
            const individualAccountId = userInfo.accountMembership?.find(a => a.accountType == 'INDIVIDUAL')?.accountId;

            if (!individualAccountId) {
                throw new Error('no account');
            }

            return {
                accountId: individualAccountId,
                accountIdSource: 'individual',
            };
        }

        return {
            accountId: orderGroup.accountId,
            accountIdSource: 'orderGroup',
        };
    } catch (e) {
        throw new Error(`account not found by order (orderId: ${payload.orderId}, customerId: ${payload.customerId}, err: ${e.message}).`);
    }
};

const forceCompleteConsultation = async (payload) => {
    const consultationId = payload.consultationId;
    const customerId = payload.customerId;
    const consultationDetail = await advisorViewApi.getConsultationById(consultationId, customerId);

    if (!consultationDetail) {
        throw new Error('forceCompleteConsultation: consultationDetail not found!');
    }

    await advisorAggregateApi.syncConsultation(
        'Completed',
        consultationDetail.advisorDetails.id,
        consultationDetail.advisorDetails.firstName,
        consultationDetail.advisorDetails.lastName,
        consultationDetail.advisorDetails.firmId,
        consultationDetail.appointment.timezone,
        consultationDetail.appointment.appointmentDate,
        consultationDetail.appointment.duration,
        'NoFurtherAction',
        consultationDetail.confirmationNumber,
        consultationId,
    );

    return {
        isConsultationForceCompleted: true,
    }
};


const process = async (payload, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    try {
        if (!payload.cutoffDate) {
            throw new Error('cutoffDate is required', payload.cutoffDate);
        }

        // Check for cutoff date
        if (!payload.appointmentDate || new Date(payload.appointmentDate) < payload.cutoffDate) {
            // If the appointment is scheduled before the [CUTOFF_DATE] then force complete the consultation
            payload = { ...payload, ...await forceCompleteConsultation(payload) };

            return {
                ...payload,
                isComplete: true
            }
        }

        // Get account id by order
        payload = { ...payload, ...await getAccountIdByOrderId(payload) };

        // Sync work item by confirmation number
        payload = { ...payload, ...await createConsultationWorkItem(payload) };

        return {
            ...payload,
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

const getBatchPayloads = async (firmId) => {
    const payloads = [];
    const customers = (await advisorViewApi.getConsultationCustomersByFirm(firmId));//splice(1, 1);

    for (const customer of customers) {
        const consultations = (await consultationsApi.getConsultationsByCustomerId(customer.customerId))?.appointmentHistory ?? [];

        for (const consultation of consultations) {
            const consultationDetail = await advisorViewApi.getConsultationById(consultation.consultationRequestId, customer.customerId);

            if (
                consultationDetail?.advisorDetails?.firmId?.toLocaleLowerCase() == firmId.toLocaleLowerCase() &&
                consultationDetail?.status == 'Open'
            ) {
                payloads.push({
                    customerId: customer.customerId,
                    customerEmail: customer.email,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    consultationId: consultation.consultationRequestId,
                    orderId: consultation.orderId,
                    processingOrderId: consultation.processingOrderId,
                    timeZone: consultation.timeZone,
                    confirmationNumber: consultation.timeTradeApptConfNumber,
                    appointmentDate: consultationDetail.appointment?.appointmentDate,
                    topic: `${consultationDetail.topic?.name}(${consultationDetail.topic?.referenceId})[${consultationDetail.topic?.planType}]`,
                });
            }
        }
    }

    return payloads;
};

const EXECUTION_DATE_TIME = new Date();

const buildFilePath = (migrationName) => {
    const mm = String(EXECUTION_DATE_TIME.getMonth() + 1).padStart(2, '0');
    const dd = String(EXECUTION_DATE_TIME.getDate()).padStart(2, '0');
    const yyyy = EXECUTION_DATE_TIME.getFullYear();
    const hour = EXECUTION_DATE_TIME.toLocaleString('en-US', {
        hour: 'numeric',
        hour12: true,
    }).replace(' ', '');

    return `${mm}${dd}${yyyy}/${hour}/${migrationName}`;
}

const runScript = async (migrationName, cutoffDate, firmName, firmId, firmAccountId) => {
    const fileName = `${ENVIRONMENT} - ${firmName} Consultation Migration (${firmAccountId}) [${getFormattedTimestamp()}].csv`;
    const filePath = buildFilePath(migrationName);
    const fullFilePath = `${filePath}/${fileName}`;
    fs.mkdirSync(filePath, { recursive: true });

    console.log(`Start [${migrationName}] ${fileName}`);
    const payloads = (await getBatchPayloads(firmId));//.splice(1, 1);
    const promises = payloads.map((payload, index) => limit(() => process(
        {
            ...payload,
            cutoffDate: new Date(cutoffDate),
        },
        index + 1,
        payloads.length)));
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: fullFilePath,
        header: [
            { id: 'accountId', title: 'Account ID' },
            { id: 'accountIdSource', title: 'Account ID Source' },
            { id: 'orderId', title: 'Order ID' },
            { id: 'processingOrderId', title: 'Processing Order ID' },
            { id: 'customerId', title: 'Customer ID' },
            { id: 'customerEmail', title: 'Customer Email' },
            { id: 'firstName', title: 'Customer fName' },
            { id: 'lastName', title: 'Customer lName' },
            { id: 'consultationId', title: 'Consultation ID' },
            { id: 'topic', title: 'Topic Name' },
            { id: 'confirmationNumber', title: 'Confirmation Number' },
            { id: 'appointmentDate', title: 'Appointment Date' },
            { id: 'timeZone', title: 'Time Zone' },
            { id: 'workItemId', title: 'Work Item ID' },
            { id: 'expertUserId', title: 'Expert User ID' },
            { id: 'expertFirstName', title: 'Expert First Name' },
            { id: 'expertLastName', title: 'Expert Last Name' },
            { id: 'isConsultationForceCompleted', title: 'Is Cutoff' },

            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
}

(async () => {
    for (const { name, cutoffDate, firms } of CONSULTATION_MIGRATION_INPUT) {
        for (const { firmName, firmId, firmAccountId } of firms) {
            await runScript(name, cutoffDate, firmName, firmId, firmAccountId);
        }
    }
})();