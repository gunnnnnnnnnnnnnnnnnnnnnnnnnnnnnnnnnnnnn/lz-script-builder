const { AUTH_TOKEN, API_KEY } = require('../config');


const client = require('axios').create({
    baseURL: 'https://billing.apigw.legalzoom.com',
    headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  });

const getBillingByOrder = async (orderId, customerId) => {
    const uri = `/v3/billing/payments/orders/${orderId}`;
    try {
        const res = await client.get(uri, {
            headers: {
                'x-lz-customerid': customerId
            }
        });
        return res.data;
    } catch (e) {
        console.error(e);
        return null;
    }
}
module.exports =  {
    getBillingByOrder,
};