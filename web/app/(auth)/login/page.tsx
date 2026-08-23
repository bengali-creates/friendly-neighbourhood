"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { CornerWebArt } from "@/components/SpiderArtSvg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else {
        document.cookie = "auth_session=active; path=/; max-age=86400";
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected authentication error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#111111] font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <CornerWebArt className="absolute -top-10 -left-10 w-80 h-80" />
      <CornerWebArt className="absolute -bottom-10 -right-10 w-80 h-80 rotate-180" />

      <div className="w-full max-w-md comic-panel comic-panel-notched bg-white border-3 border-[#111111] shadow-[8px_8px_0_#111111] p-8 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#E8194B] border-2 border-[#111111] shadow-[3px_3px_0_#111111] flex items-center justify-center mx-auto -rotate-6">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <Badge variant="critical" className="bg-[#E8194B] text-white">SECURE AUTHENTICATION</Badge>
          <h1 className="spider-title text-4xl font-bold tracking-wider">SIGN IN TO RADAR</h1>
          <p className="text-xs text-[#111111]/70 font-medium">
            Enter your credentials to access your protected Spider-Sense Control Room.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#E8194B]/10 border-2 border-[#E8194B] text-[#E8194B] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-['Bangers'] tracking-wider uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hero@spidersense.ai"
              className="input font-mono text-xs py-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-['Bangers'] tracking-wider uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input font-mono text-xs py-2.5"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="magenta"
            className="w-full comic-burst-btn bg-[#E8194B] text-white border-2 border-[#111111] shadow-[4px_4px_0_#111111] font-['Bangers'] text-base py-5 gap-2"
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN TO CONTROL ROOM"} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="border-t-2 border-[#111111]/20 pt-4 text-center text-xs font-medium">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#E8194B] font-bold hover:underline">
            Sign Up Here
          </Link>
        </div>
      </div>
    </div>
  );
}
