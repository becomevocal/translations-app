import { NextApiRequest, NextApiResponse } from "next";
import { encodePayload, getBCAuth, setSession } from "@/lib/auth";
import { createAppExtension } from "@/lib/appExtensions";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate the app on install
    const session = await getBCAuth(req.query);
    const encodedContext = encodePayload(session); // Signed JWT to validate/ prevent tampering

    //

    /**
     * For stores that do not have the app installed yet, create App Extensions when app is
     * installed.
     */

    // const { access_token: accessToken, store_hash: storeHash, scope, context } = session;
    const { access_token: accessToken, context, scope } = session;

    const storeHash = context.split('/')[1]

    console.log('sessionauth', session)



    const isAppExtensionsScopeEnabled = scope.includes(
      "store_app_extensions_manage"
    );
    if (isAppExtensionsScopeEnabled && storeHash) {
      await createAppExtension({ accessToken, storeHash });
    } else {
      console.warn(
        "WARNING: App extensions scope is not enabled yet. To register app extensions update the scope in Developer Portal: https://devtools.bigcommerce.com"
      );
    }

    //

    await setSession(session);
    res.redirect(302, `/?context=${encodedContext}`);
  } catch (error: any) {
    const { message, response } = error;
    res.status(response?.status || 500).json({ message });
  }
}

// export const runtime = "edge";
