"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Terminal, LogOut, Mail, User, CheckCircle2, Loader2, Sparkles, Command } from "lucide-react"
import Image from "next/image"

export default function Home() {
  const { data, isPending } = authClient.useSession()
  const router = useRouter()

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
    )
  }

  if (!data?.session && !data?.user) {
    router.push("/sign-in")
  }

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
              Welcome back, commander
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Session Active</span>
        </div>

        {/* Profile Card */}
        <Card className="w-full bg-zinc-900/50 backdrop-blur-xl border-zinc-800 shadow-2xl shadow-indigo-500/5">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500" />
                  <Image
                    src={data?.user?.image || "/vercel.svg"}
                    alt={data?.user?.name || "User"}
                    width={100}
                    height={100}
                    className="relative w-24 h-24 rounded-full border-2 border-zinc-700 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-zinc-100">{data?.user?.name || "User"}</h2>
                <p className="text-zinc-500 text-sm">Authenticated Developer</p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

              {/* User Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Email</p>
                    <p className="text-zinc-200 font-medium truncate">{data?.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">User ID</p>
                    <p className="text-zinc-200 font-mono text-sm truncate">{data?.user?.id}</p>
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <Button
                onClick={() =>
                  authClient.signOut({
                    fetchOptions: {
                      onError: (ctx) => console.log(ctx),
                      onSuccess: () => router.push("/sign-in"),
                    },
                  })
                }
                variant="outline"
                className="relative w-full h-14 bg-gradient-to-r from-zinc-800 to-zinc-900 border-0 overflow-hidden group hover:shadow-lg hover:shadow-red-500/20 transition-all duration-500"
              >
                <span className="absolute inset-0 rounded-md bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute inset-[1px] rounded-md bg-gradient-to-r from-zinc-900 to-zinc-800" />
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
                <span className="relative flex items-center justify-center">
                  <LogOut className="w-5 h-5 mr-3 text-white group-hover:rotate-[-360deg] transition-transform duration-700" />
                  <span className="font-semibold text-white">Sign Out</span>
                </span>
              </Button>
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
          <div className="p-4 font-mono text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span className="text-zinc-300">botbyte</span>
              <span className="text-indigo-400">whoami</span>
            </div>
            <div className="text-cyan-400 text-xs flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span>Authenticated as {data?.user?.name || "User"}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-green-400">$</span>
              <span className="text-zinc-300">botbyte</span>
              <span className="text-purple-400">--help</span>
              <span className="animate-pulse text-zinc-400">▌</span>
            </div>
          </div>
        </div>

        {/* Quick actions hint */}
        <div className="flex items-center gap-4 text-zinc-600 text-xs">
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>+ K</span>
          </div>
          <span>Open command palette</span>
        </div>
      </div>
    </div>
  )
}