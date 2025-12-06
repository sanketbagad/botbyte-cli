import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to BotByte CLI - Access your AI-powered command line interface. Authenticate with GitHub to enable device flow and unlock intelligent terminal automation.",
  openGraph: {
    title: "Sign In | BotByte CLI",
    description: "Sign in to BotByte CLI - Access your AI-powered command line interface.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
