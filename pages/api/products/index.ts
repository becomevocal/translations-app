import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient, getSession } from '../../../lib/auth';

export default async function products(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { accessToken, storeHash } = await getSession(req);
        const bigcommerce = bigcommerceClient(accessToken, storeHash);

        const { data } = await bigcommerce.get('/catalog/summary');
        res.status(200).json(data);
    } catch (error: any) {
        const { message, response } = error;
        res.status(response?.status || 500).end(message || 'Authentication failed, please re-install');
    }
}

export const runtime = 'edge';