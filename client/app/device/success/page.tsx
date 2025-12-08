"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Terminal } from "lucide-react";

function DeviceSuccessContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const status = error ? "error" : "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-4">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md border-gray-800 bg-gray-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
            status === "success" 
              ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/25" 
              : "bg-gradient-to-br from-red-500 to-pink-500 shadow-red-500/25"
          }`}>
            {status === "success" ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {status === "success" ? "Authorization Complete!" : "Authorization Failed"}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {status === "success" ? (
            <>
              <p className="text-gray-400">
                Your Botbyte CLI is now authenticated with your GitHub account.
              </p>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center justify-center gap-2 text-gray-300">
                  <Terminal className="w-5 h-5" />
                  <span className="font-mono text-sm">You can close this window</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Return to your terminal to continue using the CLI.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-400">
                Something went wrong during authorization.
              </p>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 font-mono text-sm">
                  {error || "Unknown error occurred"}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Please try running <code className="text-purple-400">botbyte login</code> again.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DeviceSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <DeviceSuccessContent />
    </Suspense>
  );
}
