import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { deviceAuthorization } from "better-auth/plugins";
import prisma from "./db.js";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001",
    basePath: "/api/auth",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: [
        "http://localhost:3000",
        "https://botbyte-cli-client.vercel.app",
        "https://botbyte-cli-server.vercel.app",
        ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
        ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ],
    plugins: [
        deviceAuthorization({
            expiresIn: "30m",
            interval: "15s",
            verificationUri: "https://botbyte-cli-client.vercel.app/device",
        }),
    ],
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || process.env.GH_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.GH_CLIENT_SECRET!,
        },
    },
});

