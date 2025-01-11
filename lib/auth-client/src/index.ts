import { BigCommerceAuthClient } from './client';
export * from './client';
export * from './types';
export * from './schemas';

export function createAuthClient(config: {
  clientId?: string;
  clientSecret?: string;
  callback?: string;
  jwtKey?: string;
  loginUrl?: string;
}) {
  return new BigCommerceAuthClient(config);
} 