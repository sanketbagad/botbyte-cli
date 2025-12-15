import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { deviceAuthorization } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins: ["http://localhost:3000"],
    plugins: [
        deviceAuthorization({
            expiresIn: "30m",
            interval: "15s",
            verificationUri: "http://localhost:3000/device",
        }),
    ],
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || process.env.GH_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.GH_CLIENT_SECRET!,
        },
    },
});

