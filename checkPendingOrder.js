import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';
import * as ordersApi from './api/ordersApi.js';
import { ENVIRONMENT } from './config.js';
import { PENDING_ORDERS } from './input/check-pending-order-input.js';

const limit = pLimit(10);

const FILE_NAME = `${ENVIRONMENT} - Check Pending Orders [${getFormattedTimestamp()}].csv`;

const process = async (payload, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    try {
        const orderResponse = await ordersApi.getOrder(payload.orderId, payload.customerId);
        const order = orderResponse?.order;
        if (!order) {
            throw new Error(`order not found (${payload.orderId})`);
        }

        const orderGroupId = order.orderGroupId;
        if (!orderGroupId) {
            throw new Error(`order group id not found (${payload.orderId})`);
        }

        const orderGroup = await ordersApi.getOrderGroup(orderGroupId, payload.customerId);
        const accountId = orderGroup?.accountId;
        if (!accountId) {
            throw new Error(`account id not found by order group (${orderGroupId})`);
        }

        return {
            ...payload,
            orderGroupId,
            accountId,
            isComplete: true,
        };
    } catch (e) {
        console.error(e.message);
        return {
            ...payload,
            error: e.message,
            isComplete: false,
        };
    }
};

(async () => {
    console.log(`Start ${FILE_NAME}`);
    if (!PENDING_ORDERS || PENDING_ORDERS.length === 0) {
        console.log('No input data found in input/check-pending-order-input.js');
        return;
    }

    const promises = PENDING_ORDERS.map((payload, index) =>
        limit(() => process(payload, index + 1, PENDING_ORDERS.length))
    );
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'orderId', title: 'Order ID' },
            { id: 'customerId', title: 'Customer ID' },
            { id: 'orderGroupId', title: 'Order Group ID' },
            { id: 'accountId', title: 'Account ID' },
            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);
    console.log(`Completed ${FILE_NAME}`);
})();
