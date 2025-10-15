import pLimit from 'p-limit';
import { createObjectCsvWriter } from 'csv-writer';
import { getFormattedTimestamp } from './util.js';

import * as fs from 'fs';
import * as advisorViewApi from './api/advisorViewApi.js';
import * as advisorAggregateApi from './api/advisorAggregateApi.js';
import * as consultationsApi from './api/consultationsApi.js';
import * as ordersApi from './api/ordersApi.js';
import * as authApi from './api/authApi.js';
import * as ecpApi from './api/ecpApi.js';
import { ENVIRONMENT } from './config.js';


const FIRM_ID = '9acd0574-8a29-4b18-a2b4-3a727d7af064';

(async () => {
    const customers = (await advisorViewApi.getConsultationCustomersByFirm(FIRM_ID));
    fs.writeFileSync('./temp_output.json', JSON.stringify(customers, null, 2));
})();