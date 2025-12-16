import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { deviceAuthorization } from "better-auth/plugins";
import prisma from "./db.js";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: ["http://localhost:3000", "https://botbyte-cli-client.vercel.app"],
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

