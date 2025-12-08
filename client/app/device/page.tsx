"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, XCircle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function DeviceVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userCode, setUserCode] = useState(searchParams.get("user_code") || "");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Auto-fill the code if provided in URL
  useEffect(() => {
    const code = searchParams.get("user_code");
    if (code) {
      setUserCode(code);
    }
  }, [searchParams]);

  const handleVerify = async () => {
    if (!userCode.trim()) {
      setError("Please enter the code shown in your CLI");
      return;
    }

    setStatus("verifying");
    setError(null);

    try {
      const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();
      
      // Check if the code is valid using GET /device endpoint
      const response = await authClient.device({
        query: { user_code: formattedCode },
      });

      if (response.data) {
        // Redirect to approval page
        router.push(`/device/approve?user_code=${formattedCode}`);
      } else {
        throw new Error("Invalid or expired code");
      }
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Invalid or expired code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-4">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-500" />
      </div>

      <Card className="w-full max-w-md border-gray-800 bg-gray-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Device Authorization
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter the code shown in your Botbyte CLI to authorize this device
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "error" ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <p className="text-red-400">{error}</p>
              </div>
              <Button
                onClick={() => {
                  setStatus("idle");
                  setError(null);
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 8-character code"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl font-mono tracking-[0.3em] h-14 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  maxLength={8}
                  disabled={status !== "idle"}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={status !== "idle" || !userCode.trim()}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300 disabled:opacity-50"
              >
                {status === "verifying" ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Continue
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                This will link your CLI to your GitHub account
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DevicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <DeviceVerificationContent />
    </Suspense>
  );
}
