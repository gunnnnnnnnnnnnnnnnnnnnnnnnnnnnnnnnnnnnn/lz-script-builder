import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';
import * as authApi from './api/authApi.js';
import { ENVIRONMENT } from './config.js';

const FILE_NAME = `${ENVIRONMENT} - Expert Users [${getFormattedTimestamp()}].csv`;
const INPUT_FILE = './input/given-experts';

const readUserIds = () => {
    const content = fs.readFileSync(INPUT_FILE, 'utf-8');
    return content.split('\n').map((line) => line.trim()).filter(Boolean);
};

const run = async () => {
    const userIds = readUserIds();
    console.log(`Fetching ${userIds.length} users from ${INPUT_FILE} (env: ${ENVIRONMENT})`);

    const rows = [];
    for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        console.log(`${i + 1}/${userIds.length} userId=${userId}`);
        try {
            const user = await authApi.getUserByUserId(userId);
            rows.push({
                userId: user?.id ?? userId,
                email: user?.email ?? '',
                firstName: user?.firstName ?? '',
                lastName: user?.lastName ?? '',
            });
        } catch (e) {
            console.error(`Failed for userId=${userId}`, e?.response?.data ?? e.message);
            rows.push({ userId, email: 'ERROR', firstName: '', lastName: '' });
        }
    }

    const csvWriter = createObjectCsvWriter({
        path: FILE_NAME,
        header: [
            { id: 'userId', title: 'User ID' },
            { id: 'email', title: 'Email' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
        ],
    });

    await csvWriter.writeRecords(rows);
    console.log(`Completed ${FILE_NAME} (${rows.length} rows)`);
};

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
