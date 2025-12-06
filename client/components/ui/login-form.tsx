"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Terminal, Zap, Shield, Github, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "http://localhost:3000",
      });
      
      if (result.error) {
        setError(result.error.message || "Failed to sign in with GitHub");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-8 items-center max-w-lg w-full">
        {/* Logo and branding */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <Terminal className="w-12 h-12 text-indigo-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              BotByte CLI
            </h1>
            <p className="text-zinc-400 text-lg">
              AI-powered command line magic
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="flex gap-6 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure</span>
          </div>
        </div>

        {/* Login card */}
        <Card className="w-full bg-zinc-900/50 backdrop-blur-xl border-zinc-800 shadow-2xl shadow-indigo-500/5">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-zinc-100">
                  Welcome Back
                </h2>
                <p className="text-zinc-500 text-sm">
                  Sign in to enable device flow authentication
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                variant="outline"
                className="relative w-full h-14 bg-gradient-to-r from-zinc-800 to-zinc-900 border-0 overflow-hidden group hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-500"
                type="button"
                disabled={isLoading}
                onClick={onLogin}
              >
                {/* Animated gradient border */}
                <span className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute inset-[1px] rounded-md bg-gradient-to-r from-zinc-900 to-zinc-800" />
                
                {/* Shine effect */}
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
                
                <span className="relative flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Github className="w-5 h-5 mr-3 text-white group-hover:rotate-[360deg] transition-transform duration-700" />
                      <span className="font-semibold text-white">Continue with GitHub</span>
                    </>
                  )}
                </span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-zinc-900 px-4 text-zinc-600">
                    Secure OAuth 2.0
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-zinc-600">
                By continuing, you agree to our{" "}
                <a href="#" className="text-indigo-400 hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-400 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terminal preview */}
        <div className="w-full bg-zinc-900/30 backdrop-blur border border-zinc-800 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-zinc-500 font-mono">terminal</span>
          </div>
          <div className="p-4 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span className="text-zinc-300">botbyte</span>
              <span className="text-indigo-400">--login</span>
              <span className="animate-pulse text-zinc-400">▌</span>
            </div>
            <div className="mt-2 text-zinc-500 text-xs">
              → Waiting for authentication...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
