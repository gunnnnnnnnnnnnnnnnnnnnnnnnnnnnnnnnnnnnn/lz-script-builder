import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as ecpApi from './api/ecpApi.js';
import { ENVIRONMENT } from './config.js';

const limit = pLimit(5);

/** Migration Setup */
const TENANT = 'LEGAL_PLANS';
const WORK_TEMPLATE_NAME = 'LEGAL_PLANS_CONSULTATION';

const FILE_NAME = `${ENVIRONMENT} - Sync Work Items (template: ${WORK_TEMPLATE_NAME}) [${getFormattedTimestamp()}].csv`;

const process = async (workItemId, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    try {
        await ecpApi.syncWorkItem(workItemId, TENANT);

        return {
            workItemId,
            isComplete: true
        }
    } catch (e) {
        console.error(`${workItemId} - ` + e.message)
        return {
            workItemId,
            error: e.message,
            isComplete: false,
        }
    }
};

(async () => {
    console.log(`Start ${FILE_NAME}`);
    const workItemIdSet = await ecpApi.getAllOutdatedWorkItemIds(WORK_TEMPLATE_NAME, TENANT);
    const payloads = [...workItemIdSet];
    const promises = payloads.map((workItemId, index) => limit(() => process(workItemId, index + 1, payloads.length)));
    const result = await Promise.all(promises);

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'workItemId', title: 'Work Item ID' },

            { id: 'isComplete', title: 'Is Complete' },
            { id: 'error', title: 'Error' },
        ],
    });

    await csvWriter.writeRecords(result);

})();