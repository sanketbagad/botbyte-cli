"use client";

import { LoginForm } from "@/components/ui/login-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Terminal, Loader2 } from "lucide-react";

export default function SignInPage() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (data?.session && data?.user) {
      router.push("/");
    }
  }, [data, router]);

  if (isPending) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <Terminal className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (data?.session && data?.user) {
    return null;
  }

  return <LoginForm />;
}
