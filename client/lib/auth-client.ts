import { createAuthClient } from 'better-auth/react';
import { deviceAuthorizationClient } from 'better-auth/client/plugins';

const getBaseURL = () => {
    // In browser, use relative URL for API routes
    if (typeof window !== 'undefined') {
        return '';
    }
    // Server-side fallback
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
    plugins: [
        deviceAuthorizationClient(),
    ],
});