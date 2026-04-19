import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
});

export const auth = betterAuth({
    database: pool,
    trustedOrigins: [
        "chrome-extension://ibmlpgeggepeaaiincekmiojeljnacei"
    ],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },

    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        }
    }

});