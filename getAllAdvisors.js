import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';
import * as relationshipsApi from './api/relationshipsApi.js';
import * as authApi from './api/authApi.js';
import { ENVIRONMENT, LOCATIONS } from './config.js';

const limit = pLimit(5);
const AUTH_BATCH_SIZE = 100;

const FILE_NAME = `${ENVIRONMENT} - All Advisors [${getFormattedTimestamp()}].csv`;

/**
 * Fetch advisors for all configured states and tag each with the state used.
 */
const fetchAllAdvisorsByState = async () => {
    const advisorsWithState = [];
    for (let i = 0; i < LOCATIONS.length; i++) {
        const state = LOCATIONS[i];
        console.log(`Advisors ${i + 1}/${LOCATIONS.length} state=${state}`);
        try {
            const data = await limit(() => relationshipsApi.getAdvisors(state));
            const list = data?.advisorRelationships ?? [];
            list.forEach((advisor) => {
                advisorsWithState.push({ ...advisor, state });
            });
        } catch (e) {
            console.error(`Failed to get advisors for state ${state}`, e?.response?.data ?? e.message);
        }
    }
    return advisorsWithState;
};

/**
 * Fetch auth users for all given partner IDs in batches; return Map(partnerId -> user).
 */
const fetchAuthUsersMap = async (partnerIds) => {
    const uniqueIds = [...new Set(partnerIds)];
    const map = new Map();
    for (let i = 0; i < uniqueIds.length; i += AUTH_BATCH_SIZE) {
        const batch = uniqueIds.slice(i, i + AUTH_BATCH_SIZE);
        console.log(`Auth batch ${Math.floor(i / AUTH_BATCH_SIZE) + 1}/${Math.ceil(uniqueIds.length / AUTH_BATCH_SIZE)} (${batch.length} ids)`);
        const users = await authApi.getUsersByPartnerIds(batch);
        users.forEach((u) => {
            const partnerId = u?.partnerAttributes?.id;
            if (partnerId) map.set(partnerId, u);
        });
    }
    return map;
};

const getFirmMembership = (user) => {
    const memberships = user?.accountMembership ?? [];
    return memberships.find((m) => m.accountType === 'FIRM') ?? null;
};

const run = async () => {
    console.log(`Start ${FILE_NAME} (env: ${ENVIRONMENT}, ${LOCATIONS.length} states)`);

    const advisorsWithState = await fetchAllAdvisorsByState();
    console.log(`Fetched ${advisorsWithState.length} advisor-state rows`);

    const partnerIds = advisorsWithState.map((a) => a.advisorId).filter(Boolean);
    const authUsersMap = await fetchAuthUsersMap(partnerIds);
    console.log(`Auth users found: ${authUsersMap.size}`);

    const rows = [];
    for (const advisor of advisorsWithState) {
        const authUser = authUsersMap.get(advisor.advisorId);
        if (!authUser) continue;

        const firm = getFirmMembership(authUser);
        rows.push({
            advisorId: advisor.advisorId,
            attorneyId: advisor.attorneyId,
            firmId: advisor.firmId,
            firstName: advisor.firstName,
            middleName: advisor.middleName ?? '',
            lastName: advisor.lastName,
            state: advisor.state,
            firmAccountId: firm?.accountId ?? '',
            firmName: firm?.accountName ?? '',
            expertUserId: authUser.id ?? '',
            email: authUser.email ?? '',
            hasAuthUser: true,
            isActive: true,
        });
    }

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'advisorId', title: 'Advisor ID' },
            { id: 'attorneyId', title: 'Attorney ID' },
            { id: 'firmId', title: 'Firm ID' },
            { id: 'firstName', title: 'First Name' },
            { id: 'middleName', title: 'Middle Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'state', title: 'State' },
            { id: 'firmAccountId', title: 'Firm Account ID' },
            { id: 'firmName', title: 'Firm Name' },
            { id: 'expertUserId', title: 'Expert User ID' },
            { id: 'email', title: 'Email' },
            { id: 'hasAuthUser', title: 'Has Auth User' },
            { id: 'isActive', title: 'Is Active' },
        ],
    });

    await csvWriter.writeRecords(rows);
    console.log(`Completed ${FILE_NAME} (${rows.length} rows)`);
};

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
