"use client"
import { authClient } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldAlert, Loader2 } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

const normalizeCode = (value: string) => value.trim().replace(/-/g, "").toUpperCase()
const formatCode = (value: string) => {
  const normalized = normalizeCode(value)
  if (!normalized) return ""
  return `${normalized.slice(0, 4)}${normalized.length > 4 ? "-" : ""}${normalized.slice(4, 8)}`
}

export default function DeviceAuthorizationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userCodeQuery = searchParams.get("user_code") || ""
  const { data: sessionData, isPending } = authClient.useSession()
  const [userCode, setUserCode] = useState(() => formatCode(userCodeQuery))
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const hasAutoSubmitted = useRef(false)
  const user = sessionData?.user

  useEffect(() => {
    if (userCodeQuery) {
      setUserCode(formatCode(userCodeQuery))
    }
  }, [userCodeQuery])

  useEffect(() => {
    if (isPending) return
    if (!user) {
      const redirectPath = `/device${userCodeQuery ? `?user_code=${encodeURIComponent(userCodeQuery)}` : ""}`
      router.replace(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`)
    }
  }, [isPending, user, router, userCodeQuery])

  const verifyCode = useCallback(
    async (code: string) => {
      setError(null)
      setIsLoading(true)

      try {
        const normalizedCode = normalizeCode(code)

        if (normalizedCode.length !== 8) {
          throw new Error("Enter the 8-character code shown in your terminal")
        }

        const response = await authClient.device({
          query: { user_code: normalizedCode },
        })

        if (response.data) {
          router.push(`/device/approve?user_code=${normalizedCode}`)
          return
        }

        throw new Error("Invalid or expired code")
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Invalid or expired code")
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    if (!user || !userCodeQuery || hasAutoSubmitted.current) {
      return
    }

    hasAutoSubmitted.current = true
    void verifyCode(userCodeQuery)
  }, [user, userCodeQuery, verifyCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyCode(userCode)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserCode(formatCode(e.target.value))
  }

  if (isPending || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-3 rounded-lg border-2 border-dashed border-zinc-700">
            <ShieldAlert className="w-8 h-8 text-yellow-300" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Device Authorization</h1>
            <p className="text-muted-foreground">Enter your device code to continue</p>
          </div>
        </div>

        {user && (
          <div className="mb-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.name || user.email}</span>
          </div>
        )}

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="border-2 border-dashed border-zinc-700 rounded-xl p-8 bg-zinc-950 backdrop-blur-sm"
        >
          <div className="space-y-6">
            {/* Code Input */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                Device Code
              </label>
              <input
                id="code"
                type="text"
                value={userCode}
                onChange={handleCodeChange}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="w-full px-4 py-3 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-zinc-600 font-mono text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground mt-2">Find this code on the device you want to authorize</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-950 border border-red-900 text-red-200 text-sm">{error}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || normalizeCode(userCode).length !== 8}
              className="w-full py-3 px-4 bg-zinc-100 text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Continue"
              )}
            </button>

            {/* Info Box */}
            <div className="p-4 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This code is unique to your device and will expire shortly. Keep it confidential and never share it with
                anyone.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
