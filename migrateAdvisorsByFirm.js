import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as advisorConfigApi from './api/advisorConfigApi.js';
import * as authApi from './api/authApi.js';
import * as ecpApi from './api/ecpApi.js';
import { ENVIRONMENT, LOCATIONS } from './config.js';

const limit = pLimit(5);

/** Migration Setup */
const TENANT = 'LEGAL_PLANS';
const EXPERT_ROLE_NAME = 'expert';
const LEGAL_PLAN_ATTORNEY_SKILL_NAME = 'LP_ATTORNEY';
const FIRM_ID = 'b8af2f44-b4fc-40cf-a3c3-17a8afc5dc22';             // TODO: change per request
const FIRM_ACCOUNT_ID = 'b8af2f44-b4fc-40cf-a3c3-17a8afc5dc22';     // TODO: change per request
let EXPERT_ROLE_ID = 'NOT SET';                                     // set during run time

const FILE_NAME = `${ENVIRONMENT} - Advisor Migration (${FIRM_ACCOUNT_ID}) [${getFormattedTimestamp()}].csv`;


const getExpertRoleId = async () => {
    const account = await authApi.getAccountById(FIRM_ACCOUNT_ID);
    if (!account) {
        throw new Error(`Firm account not found (firmAccountId: ${FIRM_ACCOUNT_ID}.`);
    }

    const expertRole = account.roles?.find(r => r.role.name == EXPERT_ROLE_NAME);
    if (!expertRole) {
        throw new Error(`Expert role not found (firmAccountId: ${FIRM_ACCOUNT_ID}.`);
    }

    const expertRoleId = expertRole.role.id;
    if (!expertRoleId) {
        throw new Error(`Expert role id not found (firmAccountId: ${FIRM_ACCOUNT_ID}.`);
    }

    console.log(`Expert Role ID: ${expertRoleId}`);

    return expertRoleId;
};

/**
 * Upserts expert with [LP_ATTORNEY] in all locations.
 */
const setExpertSkill = async (payload) => {
    await ecpApi.assignSkillToExpert(TENANT, payload.userId, LEGAL_PLAN_ATTORNEY_SKILL_NAME, LOCATIONS);
    return payload;
}

/**
 * Finds the authUser by the advisorId.
 * If not found, then finds the authUser by the advisorEmail.
 * If not found, then creates a new authUser, then creates account membership with the [FIRM_ACCOUNT_ID] and [EXPERT_ROLE_ID].
 * @param {*} payload 
 * @returns { userId: string, userEmail: string, isNewUserCreated: boolean, isExpertRoleAdded: boolean }
 */
const findOrCreateAuthUser = async (payload) => {
    const returnedPayload = {
        userId: undefined,
        userEmail: undefined,
        isNewUserCreated: false,
        isExpertRoleAdded: false,
    };

    try {
        // Find authUser by partner id & email
        let authUser = await authApi.getUserByPartnerId(payload.advisorId);

        if (!authUser) {
            // if authUser is not found, find by email
            authUser = await authApi.getUserByEmail(payload.advisorEmail);
        }

        if (!authUser) {
            // if authUser is not found, create a new expert user
            const email = payload.advisorEmail;
            authUser = await authApi.createNewUser(email, payload.firstName, payload.lastName);

            if (!authUser) {
                throw new Error('Failed to find or create auth user.')
            }

            returnedPayload.isNewUserCreated = true;
        }

        returnedPayload.userId = authUser.id;
        returnedPayload.userEmail = authUser.email;
    } catch (e) {
        throw new Error(`findOrCreateAuthUser failed (advisorId: ${payload.advisorId}) - ${e.message}`);
    }

    return returnedPayload;
};

/**
 * Check if the user has the [EXPERT_ROLE_NAME] role in the [FIRM_ACCOUNT_ID].
 * If not found, create a new account membership for this user. 
 * @param {*} payload 
 * @returns { isExpertRoleAdded: boolean }
 */
const addExpertRoleToUser = async (payload) => {
    const returnedPayload = {
        isExpertRoleAdded: false,
    };

    try {
        const userMembership = (await authApi.getUserByUserId(payload.userId)).accountMembership;
        const hasExpectedMembership = userMembership.some(m => m.accountId == FIRM_ACCOUNT_ID && m.role == EXPERT_ROLE_NAME);

        if (!hasExpectedMembership) {
            // Set firm account and expert role to the user
            await authApi.createAccountMembership(payload.userId, EXPERT_ROLE_ID, FIRM_ACCOUNT_ID);
            returnedPayload.isExpertRoleAdded = true;
        }
    } catch (e) {
        throw new Error(`addExpertRoleToUser failed (advisorId: ${payload.advisorId}) - ${e.message}`);
    }

    return returnedPayload;
};

/**
 * Check if the user has partnerAttribute.
 * If not found, create a new partnerAttribute for this user. 
 * @param {*} payload 
 * @returns { isPartnerAttributeCreated: boolean, isPartnerAttributeupdated: boolean, oldPartnerAttributes: string }
 */
const addPartnerAttributeToUser = async (payload) => {
    const returnedPayload = {
        isPartnerAttributeCreated: false,
        isPartnerAttributeupdated: false,
        oldPartnerAttributes: undefined,
    };

    try {
        const partnerAttributes = (await authApi.getUserByUserId(payload.userId)).partnerAttributes;
        if (!partnerAttributes) {
            // Create a new partner attribute for the user
            await authApi.createPartnerAttribute(payload.userEmail, payload.advisorId, FIRM_ID, ['attorney']);
            returnedPayload.isPartnerAttributeCreated = true;
        } else {
            returnedPayload.oldPartnerAttributes = JSON.stringify(partnerAttributes);

            if (
                partnerAttributes.id != payload.advisorId ||
                partnerAttributes.firmId != FIRM_ID
            ) {
                // Incorrect partner attribute is found: Update partner attribute
                const roles = !partnerAttributes.roles || partnerAttributes.roles.length == 0
                    ? ['attorney']
                    : partnerAttributes.roles;

                await authApi.updatePartnerAttribute(payload.userId, payload.userEmail, payload.advisorId, FIRM_ID, roles);
                returnedPayload.isPartnerAttributeupdated = true;
            }
        }
    } catch (e) {
        throw new Error(`addExpertRoleToUser failed (advisorId: ${payload.advisorId}) - ${e.message}`);
    }

    return returnedPayload;
}

const process = async (advisor, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    let payload = {
        advisorId: advisor.id,
        advisorEmail: advisor.contactInfo?.email,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        firmId: advisor.firmId,
    };

    try {
        // Get or create AuthUser by the AdvisorID
        payload = { ...payload, ...await findOrCreateAuthUser(payload) };

        // Set Expert Role and Firm Account if not set
        payload = { ...payload, ...await addExpertRoleToUser(payload) };

        // Set Partner Attribute if not set
        payload = { ...payload, ...await addPartnerAttributeToUser(payload) };

        // Set Expert Skills
        payload = { ...payload, ...await setExpertSkill(payload) };

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

(async () => {
    console.log(`Start ${FILE_NAME}`);
    EXPERT_ROLE_ID = await getExpertRoleId();

    const advisors = (await advisorConfigApi.getAdvisorsByFirm(FIRM_ID));//.splice(1, 1);
    const promises = advisors.map((advisor, index) => limit(() => process(advisor, index + 1, advisors.length)));
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'advisorId', title: 'Advisor ID' },
            { id: 'advisorEmail', title: 'Advisor Email' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'firmId', title: 'Advisor Firm ID' },
            { id: 'userId', title: 'Auth User ID' },
            { id: 'userEmail', title: 'Auth User Email' },
            { id: 'isNewUserCreated', title: 'Is New Auth User' },
            { id: 'isExpertRoleAdded', title: 'Is Expert Role Added' },
            { id: 'isPartnerAttributeCreated', title: 'Is Partner Attribute Created' },
            { id: 'isPartnerAttributeupdated', title: 'Is Partner Attribute Updated' },
            { id: 'oldPartnerAttributes', title: 'Existing Partner Attribute' },

            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);

})();