import { getRequestConfig } from 'next-intl/server';
import { decodeSessionPayload } from '@/lib/auth';
import { getSessionToken } from '@/lib/session';

export default getRequestConfig(async () => {
  let userLocale = 'en-US'; // default fallback
  
  try {
    const sessionToken = await getSessionToken();
    
    if (sessionToken) {
      const payload = await decodeSessionPayload(sessionToken);
      
      if (payload?.userLocale) {
        userLocale = payload.userLocale;
      }
    }
  } catch (error) {
    // Silently fall back to default locale on error
  }

  let messages;
  try {
    messages = (await import(`../messages/${userLocale}.json`)).default;
  } catch (error) {
    // Not all locales are translated, so fallback to a message file that exists 
    // if the requested message file is not found
    userLocale = 'en-US';
    messages = (await import('../messages/en-US.json')).default;
  }
 
  return {
    locale: userLocale,
    messages
  };
});
