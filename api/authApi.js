import { v4 as uuid4 } from 'uuid';
import axios from 'axios';
import NodeCache from 'node-cache';
import config from '../config.js';
const { ENVIRONMENT, CLIENT_ID, CLIENT_SECRET, AUTH_HOST } = config;

const tokenCache = new NodeCache();
const client = axios.create({ baseURL: AUTH_HOST });

const CACHE_KEY = 'AUTH_TOKEN';

const getAuthToken = async () => {
    const cachedToken = tokenCache.get(CACHE_KEY);
    if (cachedToken) { return cachedToken; }

    const res = await client.request({
        method: 'POST',
        url: '/oauth2/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'insomnia/8.6.1'
        },
        data: {
            grant_type: 'client_credentials',
            audience: 'urn:apigee:target:api',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }
    });

    const { access_token, expires_in } = res.data;
    tokenCache.set(CACHE_KEY, access_token, expires_in);
    return access_token;
}

export const getAuthHeaders = async () => {
    const token = await getAuthToken();
    return {
        Authorization: `Bearer ${token}`,
    }
}

export const getAccountById = async (accountId) => {
    const uri = `/v1/accounts/${accountId}`;

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
            }
        });

        return res.data;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const getUserByUserId = async (userId) => {
    const uri = `/v1/users-by-ids`;

    try {
        const res = await client.post(uri, [userId], {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data[0];
    } catch (e) {
        console.error(`Failed to get user by user id (${userId})`, e);
        throw e;
    }
}

export const getUserByPartnerId = async (partnerId) => {
    const uri = `/v1/partner/users-by-internal-ids`;

    try {
        const res = await client.post(uri, [partnerId], {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data[0];
    } catch (e) {
        console.error(`Failed to get user by partner id (${partnerId})`, e);
        throw e;
    }
}
/**
 * 
 * @param {*} email 
 * @returns {
 *   id: string,
 *   email: string,
 *   subject: string,
 *   isLocked: boolean,
 * }
 */
export const getUserByEmail = async (email) => {
    const uri = `/v1/users-by-email/${email}`;
    if (!email) { return null; }

    try {
        const res = await client.get(uri, {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data;
    } catch (e) {
        if (e.code == 'ERR_BAD_REQUEST') {
            return null;
        }

        console.error(`Failed to get user by email (${email})`, e);
        throw e;
    }
}

/**
 * 
 * @param {*} email 
 * @param {*} firstName 
 * @param {*} lastName 
 * @returns {
 *   id: string,
 *   email: string,
 * }
 */
export const createNewUser = async (email, firstName, lastName) => {
    const uri = '/v2/users';

    if (!email) {
        throw new Error(`Failed to create a new user with empty email (${email}).`);
    }

    try {
        const res = await client.post(uri, {
            email,
            firstName,
            lastName,
            password: createPassword(),
        }, {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to create user (email: ${email})`, e);
        throw e;
    }
}

export const createAccountMembership = async (userId, roleId, accountId) => {
    const uri = 'v1/accounts/members';

    try {
        const res = await client.post(uri, {
            user: userId,
            role: roleId,
            account: accountId,
        }, {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to create account membership (userId: ${userId})`, e);
        throw e;
    }
};

export const createPartnerAttribute = async (email, advisorId, advisorFirmId, roles) => {
    const uri = 'v1/partner/users/internal';

    try {
        const res = await client.post(uri, {
            email,
            attorneyId: advisorId,
            firmId: advisorFirmId,
            roles: roles ?? [],
        }, {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to create account membership (userEmail: ${email})`, e);
        throw e;
    }
};

export const updatePartnerAttribute = async (email, advisorId, advisorFirmId, roles) => {
    const uri = `v1/partner/users/${email}/internal`;

    try {
        const res = await client.put(uri, {
            attorneyId: advisorId,
            firmId: advisorFirmId,
            roles: roles ?? [],
        }, {
            headers: {
                ...(await getAuthHeaders()),
            },
        });

        return res?.data;
    } catch (e) {
        console.error(`Failed to create account membership (userEmail: ${email})`, e);
        throw e;
    }
};

const createPassword = () => {
    if (ENVIRONMENT == 'p') {
        return uuidv4().replace(/-/g, '');
    }

    return 'test123';
}