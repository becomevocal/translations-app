import { strict } from 'assert';
import { parse, serialize } from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT, jwtVerify } from 'jose';
import { SessionProps } from '../types';

strict(process.env.COOKIE_NAME, "COOKIE_NAME is required");
strict(process.env.JWT_KEY, "JWT_KEY is required");
const { COOKIE_NAME = '', JWT_KEY = '' } = process.env;

const MAX_AGE = 60 * 60 * 24; // 24 hours

export async function setCookie(res: NextApiResponse, session: SessionProps) {
    const { context, scope = '' } = session;
    const storeHash = context?.split('/')[1] || '';

    const encodedCookie = await encode(scope, storeHash);

    const cookie = serialize(COOKIE_NAME, encodedCookie, {
        expires: new Date(Date.now() + MAX_AGE * 1000),
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true,
    });

    res.setHeader('Set-Cookie', cookie);
}

export function parseCookies(req: NextApiRequest) {
    if (req.cookies) return req.cookies; // API routes don't parse cookies

    const cookie = req.headers?.cookie;

    return parse(cookie || '');
}

export function getCookie(req: NextApiRequest) {
    return parseCookies(req)[COOKIE_NAME];
}

export function removeCookie(res: NextApiResponse) {
    const cookie = serialize(COOKIE_NAME, '', { maxAge: -1, path: '/' });

    res.setHeader('Set-Cookie', cookie);
}

export async function encode(scope: string, storeHash: string) {
    const payload = { scope, storeHash };
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(new TextEncoder().encode(JWT_KEY));
}

export async function decode(encodedCookie: string) {
    const { payload } = await jwtVerify(encodedCookie, new TextEncoder().encode(JWT_KEY));
    return payload as { scope: string; storeHash: string };
}
