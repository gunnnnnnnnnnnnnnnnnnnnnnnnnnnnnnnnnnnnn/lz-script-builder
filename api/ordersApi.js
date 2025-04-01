import axios from 'axios';
import { getAuthHeaders } from './authApi.js';
import config from '../config.js';


const client = axios.create({
    baseURL: config.ORDERS_HOST,
});

/**
 * Finds the first order item that contains one of the matching 
 * product configuration ids from the given order.
 * @param {object} order 
 * @param {Set<number>} matchingProductIds 
 * @returns 
 */
const findMatchingOrderItem = (order, matchingProductIds) => {
    try {
        return order.order.orderItems.find(oi => {
            const pid = oi.productConfiguration?.productConfigurationId;
            if (matchingProductIds.has(pid)) {
                return true;
            }

            return false;
        })
    } catch (e) {
        console.error(e.message);
        return false;
    }
};


export const getOrder = async (orderId, customerId) => {
    const uri = `/v1/core/orders/${orderId}`;
    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-customerid': customerId,
            },
        });
        return res.data;
    } catch (e) {
        console.error(e.message);
        //throw e;
    }
}

export const getOrderInfoByCustomer = async (customerId) => {
    const uri = `/v1/core/orders/customer/${customerId}`;
    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-customerid': customerId,
            },
        });
        return res.data;
    } catch (e) {
        console.error(`Something wrong :${customerId}`)
        console.error(e.message);
        //throw e;
    }
}

export const getOrderGroup = async (orderGroupId, customerId) => {
    const uri = `v1/core/orders/order-groups/${orderGroupId}`;
    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-customerid': customerId,
            },
        });
        return res.data;
    } catch (e) {
        console.error(e.message);
        return null;
        //throw e;
    }
}

export const getProcessingOrder = async (processingOrderId, customerId) => {
    const uri = `v1/core/orders/order-items/processing-orders/${processingOrderId}`;
    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'x-lz-authorize': false,
                'x-lz-customerid': customerId,
            },
        });
        return res.data;
    } catch (e) {
        console.error(e.message);
        return null;
        //throw e;
    }
}

/**
 * 
 * @param {*} orderId 
 * @param {*} customerId 
 * @param {Set<number>} matchingProductIds 
 * @returns {{
 *   productConfigurationId: number, 
 *   processingOrderId: number,
 * }}
 */
export const findMatchingOrder = async (orderId, customerId, matchingProductIds) => {
    const givenOrder = await getOrder(orderId, customerId);
    if (!givenOrder) {
        console.error(`order not found (${orderId})`);
        return null;
    }

    const foundOrderItem = findMatchingOrderItem(givenOrder, matchingProductIds);
    if (!foundOrderItem) {
        return await findMatchingOrderFromOrderGroup(givenOrder.order.orderGroupId, customerId, matchingProductIds);
    } else {
        const data = {
            productConfigurationId: foundOrderItem.productConfiguration?.productConfigurationId,
            processingOrderId: foundOrderItem.processingOrder?.processingOrderId,
        };
        //console.log(data);
        return data;
    }
};

export const findMatchingOrderFromOrderGroup = async (orderGroupId, customerId, matchingProductIds) => {
    const group = await getOrderGroup(orderGroupId, customerId);
    if (!group) {
        console.error(`order group not found (oid = ${orderId}, ogid = ${givenOrder.order.orderGroupId})`);
        return;
    }

    for (const { orderId: oid } of group.orderIds) {
        const order = await getOrder(oid, customerId);
        const orderItem = findMatchingOrderItem(order, matchingProductIds);
        if (orderItem) {
            const data = {
                productConfigurationId: orderItem.productConfiguration?.productConfigurationId,
                processingOrderId: orderItem.processingOrder?.processingOrderId,
            };
            console.log(data);
            return data;
        }
    }
    console.log('Failed to find matching order')
    return null;
}