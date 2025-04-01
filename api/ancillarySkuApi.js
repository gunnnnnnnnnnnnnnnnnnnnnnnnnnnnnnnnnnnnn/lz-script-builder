import { CLIENT_ID, ANCILLARY_API_KEY, ANCILLARY_HOST } from '../config.js';
import { getAuthHeaders } from './authApi.js';
import axios from 'axios';

const client = axios.create({
    baseURL: ANCILLARY_HOST,
});


const buildAltmRepNoaRequest = (workItemId, isSkipped) => {
    const metadata = {
        workItemId: workItemId,
        dataType: "skuBuilder",
	    submittedBy: CLIENT_ID,
    }

    const data = isSkipped
        ? {
            templateName: "ALTM_REP_NOA",
            skipPackageSelection: true
        } : {
            templateName: "ALTM_REP_NOA",
            packages: [
                "9641"
            ],
            numberOfClasses: null,
            skipPackageSelection: false
        
        };

    return { metadata, data };
}

export const completeAncillaryTask = async (workItemId, taskId, isSkipped) => {
    const uri = `/tasks/${taskId}/complete`;
    const request = buildAltmRepNoaRequest(workItemId, isSkipped);

    try {
        const res = await client.post(
            uri,
            request, {
                headers: { 
                    ...(await getAuthHeaders()),
                    'x-api-key': ANCILLARY_API_KEY,
                },
            },
        );
        
        return res.data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};