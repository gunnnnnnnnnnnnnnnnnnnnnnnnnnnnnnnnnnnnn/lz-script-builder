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

/**
 * Delete a document by its storage document ID
 * @param {string} storageDocumentId - The storage document ID to delete
 * @returns {Promise<void>}
 */
export const deleteDocument = async (storageDocumentId) => {
    const uri = `/storage-platform/v1/documents/${storageDocumentId}`;

    try {
        await client.delete(uri, {
            headers: {
                ...(await getAuthHeaders()),
                'X-LZ-ROLE.ID': 'AttorneyServices',
                'X-LZ-ROLE.TYPE': 'AttorneyServices',
            },
        });
        console.log(`Successfully deleted document ${storageDocumentId}`);
    } catch (e) {
        console.error(`Failed to delete document ${storageDocumentId}`, e.message);
        throw e;
    }
}
