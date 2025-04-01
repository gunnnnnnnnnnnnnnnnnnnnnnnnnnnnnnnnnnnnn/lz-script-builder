import axios from 'axios';
import { getAuthHeaders } from './authApi.js';


const client = axios.create({
    baseURL: 'https://storage.apigw.legalzoom.com',
});

export const updateDocumentDetails = async (documentId, status) => {
    const uri = `/storage-platform/v1/documentDetails/${documentId}`;
    try {
        const res = await client.put(
            uri,
            {
                documentStatus: status,
            }, {
            headers: { 
                ...(await getAuthHeaders()),
                'X-LZ-ROLE.ID': 'ExpertServices',
                'X-LZ-ROLE.TYPE': 'ExpertServices',
            },
        });
        return res.data;
    } catch (e) {
        console.error(e.message);
        //throw e;
    }
}