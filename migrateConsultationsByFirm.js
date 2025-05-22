import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

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

const GIVEN = [
    {
        firmName: 'Lyda Law',
        firmId: '27d0c765-fbb9-40cb-b7f6-a16364c19d39',
        firmAccountId: 'e0b372fd-f162-42cf-a82b-860d1f5be770',
    },
    {
        firmName: 'Helzer Law',
        firmId: 'a637f486-14cd-44bb-b05d-3a9e7226fbb7',
        firmAccountId: '8024ba96-cd08-4b4f-9f86-92bb2fcc96ec',
    },
    {
        firmName: 'Keeney Law PLLC',
        firmId: 'b1e23634-be1f-4356-b7f8-f3d1ef14d3d6',
        firmAccountId: '665f6478-d8dc-4659-965f-3770e14c5777',
    },
    {
        firmName: 'Lemoine Law Firm',
        firmId: 'd1500da2-04ca-4b38-92a0-3acfe8b7765e',
        firmAccountId: '44ea6f07-2679-4875-a5d0-f6fec1209701',
    },
    {
        firmName: 'Outside Chief Legal',
        firmId: '11189cf0-cdeb-4451-a646-52d6ca40da59',
        firmAccountId: '94345abc-c0ab-461e-9bd7-b6dc904ef435',
    },
    {
        firmName: 'Opticliff Law, LLC',
        firmId: '734e2437-11e2-411b-bb0c-32bcad667576',
        firmAccountId: '76b83e82-f17a-460a-9d93-6882017ab18c',
    },
    {
        firmName: 'Neil W. Siegel, Attorney at Law',
        firmId: 'cd461302-1d47-4b33-8e2a-9df5110bff2f',
        firmAccountId: '01ea76a6-8f8f-451d-86ce-7e1b55bae510',
    },
    {
        firmName: 'Miller Law Group, LLC',
        firmId: '34d79ba4-d42f-49f8-b6ce-fc9a52098a61',
        firmAccountId: 'ba6979c6-efcb-4fe4-ba68-103e0a034b74',
    }, {
        firmName: 'Lauren E.A. Truitt, PC',
        firmId: '8ccc8ab0-86c2-4b24-b0d6-b5642aee4fc0',
        firmAccountId: 'a48b11ed-daa7-49ba-94f5-4894c9946f02',
    }
];

const CUTOFF_DATE = new Date("2025-01-01T00:00:00Z");
// Phase 3 
// const CUTOFF_DATE = new Date("2025-05-27T00:00:00Z");

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

        // Check for cutoff date
        if (!payload.appointmentDate || new Date(payload.appointmentDate) < CUTOFF_DATE) {
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

const runScript = async (firmName, firmId, firmAccountId) => {
    const fileName = `${ENVIRONMENT} - ${firmName} Consultation Migration (${firmAccountId}) [${getFormattedTimestamp()}].csv`;

    console.log(`Start ${fileName}`);
    const payloads = (await getBatchPayloads(firmId));//.splice(1, 1);
    const promises = payloads.map((payload, index) => limit(() => process(payload, index + 1, payloads.length)));
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: fileName,
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
            { id: 'isConsultationForceCompleted', title: 'Force Closed' },

            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
}

(async () => {
    for (const { firmName, firmId, firmAccountId } of GIVEN) {
        await runScript(firmName, firmId, firmAccountId);
    }
})();