import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as advisorViewApi from './api/advisorViewApi.js';
import * as advisorConfigApi from './api/advisorConfigApi.js';
import * as consultationsApi from './api/consultationsApi.js';
import * as ordersApi from './api/ordersApi.js';
import * as authApi from './api/authApi.js';
import * as ecpApi from './api/ecpApi.js';
import { ENVIRONMENT } from './config.js';

const limit = pLimit(5);

/** Migration Setup */
const TENANT = 'LEGAL_PLANS';
const WORK_TEMPLATE_NAME = 'LEGAL_PLANS_CONSULTATION';
const FIRM_ID = 'b8af2f44-b4fc-40cf-a3c3-17a8afc5dc22';             // TODO: change per request
const FIRM_ACCOUNT_ID = 'b8af2f44-b4fc-40cf-a3c3-17a8afc5dc22';     // TODO: change per request

const FILE_NAME = `${ENVIRONMENT} - Consultation Migration (${FIRM_ACCOUNT_ID}) [${getFormattedTimestamp()}].csv`;

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
            throw new Error('no account');
        }

        return {
            accountId: orderGroup.accountId,
        };
    } catch (e) {
        throw new Error(`account not found by order (orderId: ${payload.orderId}, customerId: ${payload.customerId}, err: ${e.message}).`);
    }
};

const process = async (payload, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    try {
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

const getBatchPayloads = async () => {
    const payloads = [];
    const customers = (await advisorViewApi.getConsultationCustomersByFirm(FIRM_ID));//splice(1, 1);

    for (const customer of customers) {
        const consultations = (await consultationsApi.getConsultationsByCustomerId(customer.customerId, consultationsApi.APPOINTMENT_STATUS_ENUM.Scheduled))?.appointmentHistory ?? [];

        for (const consultation of consultations) {
            const consultationDetail = await advisorViewApi.getConsultationById(consultation.consultationRequestId, customer.customerId);

            if (consultationDetail?.advisorDetails?.firmId?.toLocaleLowerCase() == FIRM_ID.toLocaleLowerCase()) {
                payloads.push({
                    customerId: customer.customerId,
                    customerEmail: customer.email,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    consultationId: consultation.consultationRequestId,
                    orderId: consultation.orderId,
                    processingOrderId: consultation.processingOrderId,
                    timezone: consultation.timeZone,
                    confirmationNumber: consultation.timeTradeApptConfNumber,
                });
            }
        }
    }

    return payloads;
};

(async () => {
    console.log(`Start ${FILE_NAME}`);
    const payloads = (await getBatchPayloads());//.splice(1, 1);
    const promises = payloads.map((payload, index) => limit(() => process(payload, index + 1, payloads.length)));
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'accountId', title: 'Account ID' },
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

            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);

})();