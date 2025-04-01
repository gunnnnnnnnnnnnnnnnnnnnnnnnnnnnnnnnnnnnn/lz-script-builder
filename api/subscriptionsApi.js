import axios from 'axios';
import { getAuthHeaders } from './authApi.js';
import { SUBSCRIPTIONS_HOST } from '../config.js';



const client = axios.create({
    baseURL: SUBSCRIPTIONS_HOST,
});

export const getSubscriptionsByOrderId = async (orderId, customerId) => {
    const uri = `/v4/subscriptions/orders/${orderId}?includecancel=true`;

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
        return false;
    }
};