import pLimit from 'p-limit';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import config from './config.js';

import * as authApi from './api/authApi.js';
import * as advisorViewApi from './api/advisorViewApi.js';

const limit = pLimit(5);
// const FILE_NAME = 'Gunn QA Test.csv';
const FILE_NAME = 'bulkmsg.csv';

const readCSV = async () => {
    try {
        const results = [];
        // Read the CSV file
        const stream = fs.createReadStream(FILE_NAME);

        // Pipe the stream through the csv-parser
        stream.pipe(csv())
            .on('data', (data) => {
                // Parse each row of data and push it to the results array
                results.push({
                    workItemId: data['Work item ID'],
                    clientName: data['Client Name'],
                    isComplete: data['isComplete']?.toLowerCase(),
                });
            });

        // Wait for the stream to finish
        await new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        return results;
    } catch (error) {
        console.log(error)
        throw new Error('Error reading CSV file:', error);
    }
}

const process = async (item, index, total) => {
    console.log(`${String(index).padStart(String(total).length, '0')}/${total} (${((index / total) * 100).toFixed(2)}%)`);
    if (item.isComplete == 'true') {
        return item;
    }

    try {
        const jsonText = buildFarronMsg(item.clientName);
        await addMessage(item.workItemId, jsonText);

        return {
            ...item,
            isComplete: true,
        }
    } catch (e) {
        console.error(e.message)
        return {
            ...item,
            error: e.message,
            isComplete: false,
        }
    }
}

const processByCustomer = async (customer) => {
    const user = await authApi.getUserByUserId(customer.customerId);
    console.log('user', user);
};


(async () => {
    const FIRM_ID = 'e6b78705-5937-44a0-af93-db845b9c922a';
    const customers = await advisorViewApi.getConsultationCustomersByFirm(FIRM_ID);
    const res = await Promise.all(customers.map(c => processByCustomer(c)));

    //console.log(customers, customers.length);
    // const data = await readCSV();
    // const promises = data.map((item, index) => limit(() => process(item, index + 1, data.length)));
    // const result = await Promise.all(promises);

    // const csvWriter = createObjectCsvWriter({
    //     path: `out_${FILE_NAME}`,
    //     header: [
    //         { id: 'workItemId', title: 'Work item ID' },
    //         { id: 'clientName', title: 'Client Name' },
    //         { id: 'isComplete', title: 'isComplete' },
    //         { id: 'error', title: 'Error' },
    //     ],
    // });

    // await csvWriter.writeRecords(result);

})();