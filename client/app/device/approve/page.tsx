"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, CheckCircle2, XCircle, Loader2, Shield, Laptop } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function DeviceApprovalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userCode = searchParams.get("user_code") || "";
  const [status, setStatus] = useState<"loading" | "ready" | "approving" | "denying" | "success" | "denied" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name?: string; email?: string; id?: string } | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          // Not authenticated, redirect to sign-in with return URL
          const returnUrl = encodeURIComponent(`/device/approve?user_code=${userCode}`);
          router.push(`/sign-in?redirect=${returnUrl}`);
          return;
        }
        setUser(session.data.user);
        setStatus("ready");
      } catch {
        // Not authenticated
        const returnUrl = encodeURIComponent(`/device/approve?user_code=${userCode}`);
        router.push(`/sign-in?redirect=${returnUrl}`);
      }
    };

    if (userCode) {
      checkAuth();
    } else {
      router.push("/device");
    }
  }, [userCode, router]);

  const handleApprove = async () => {
    setStatus("approving");
    setError(null);

    try {
      const response = await authClient.device.approve({
        userCode: userCode,
      });

      if (response.error) {
        throw new Error(response.error.error_description || "Failed to approve device");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to approve device. Please try again.");
    }
  };

  const handleDeny = async () => {
    setStatus("denying");
    setError(null);

    try {
      const response = await authClient.device.deny({
        userCode: userCode,
      });

      if (response.error) {
        throw new Error(response.error.error_description || "Failed to deny device");
      }

      setStatus("denied");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to deny device. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-4">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-500" />
      </div>

      <Card className="w-full max-w-md border-gray-800 bg-gray-900/80 backdrop-blur-xl shadow-2xl">
        {status === "success" ? (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Device Authorized!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-400">
                Your Botbyte CLI is now connected to your account.
              </p>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-center gap-2 text-gray-300">
                  <Terminal className="w-5 h-5" />
                  <span className="font-mono text-sm">You can close this window</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Return to your terminal to continue.
              </p>
            </CardContent>
          </>
        ) : status === "denied" ? (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg shadow-gray-500/25">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-400">
                The device authorization request has been denied.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                Return Home
              </Button>
            </CardContent>
          </>
        ) : status === "error" ? (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Authorization Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-red-400">{error}</p>
              <Button
                onClick={() => setStatus("ready")}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Authorize Device
              </CardTitle>
              <CardDescription className="text-gray-400">
                A device is requesting access to your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Device Info */}
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Laptop className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Botbyte CLI</p>
                    <p className="text-sm text-gray-500">Command Line Interface</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Code:</span>
                  <span className="font-mono text-purple-400">{userCode}</span>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-1">Signing in as:</p>
                  <p className="text-white font-medium">{user.name || user.email}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDeny}
                  disabled={status === "approving" || status === "denying"}
                  variant="outline"
                  className="flex-1 h-12 border-gray-700 bg-gray-800/50 hover:bg-gray-700 text-gray-300"
                >
                  {status === "denying" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Deny"
                  )}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={status === "approving" || status === "denying"}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25"
                >
                  {status === "approving" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Authorize
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-gray-500">
                This will grant the CLI access to your account
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function DeviceApprovePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <DeviceApprovalContent />
    </Suspense>
  );
}
