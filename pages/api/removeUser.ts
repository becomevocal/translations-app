import { NextApiRequest, NextApiResponse } from 'next';
import { removeUserData } from '@/lib/auth';
import { BigCommerceClient } from '@/lib/bigcommerce-client';

export default async function removeUser(req: NextApiRequest, res: NextApiResponse) {
    try {
        const session = await BigCommerceClient.verifyJWT(req.query.signed_payload_jwt as string, process.env.CLIENT_SECRET || '');

        await removeUserData(session);
        res.status(200).end();
    } catch (error: any) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }
}

// export const runtime = 'edge';