"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles, User, Mail, Lock } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { LoginLeftPanel } from "@/components/auth/LoginLeftPanel";
import { Particles } from "@/components/Particles";

// Shadcn UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize mode from URL parameter (?mode=signup)
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  const cardFlipRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Dynamic typing excitation counter passed to the left sensory panel
  const [typingCount, setTypingCount] = useState(0);

  // Synchronize mode if searchParams change
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "signup" && mode !== "signup") {
      setMode("signup");
    } else if (urlMode === "login" && mode !== "login") {
      setMode("login");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!rightRef.current) return;
    gsap.fromTo(
      rightRef.current,
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.8, ease: "power2.out", delay: 0.15 }
    );
  }, []);

  // 3D Mirror Flip Animation between Login and Sign Up
  const toggleMode = (targetMode: "login" | "signup") => {
    if (mode === targetMode || !cardFlipRef.current) return;
    setError("");

    const card = cardFlipRef.current;
    const isToSignup = targetMode === "signup";

    // Update URL shallowly so view is preserved
    window.history.replaceState(null, "", `/login?mode=${targetMode}`);

    gsap.timeline({
      onComplete: () => {
        setMode(targetMode);
        // Animate in the other face
        gsap.fromTo(
          card,
          { rotateY: isToSignup ? -90 : 90, opacity: 0, scale: 0.95 },
          { rotateY: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)" }
        );
      },
    })
      .to(card, {
        rotateY: isToSignup ? 90 : -90,
        opacity: 0,
        scale: 0.95,
        duration: 0.35,
        ease: "power2.in",
      });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setTypingCount((c) => c + 1);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setTypingCount((c) => c + 1);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setTypingCount((c) => c + 1);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
        if (cardFlipRef.current) {
          gsap.fromTo(
            cardFlipRef.current,
            { x: -10 },
            { x: 0, duration: 0.45, ease: "elastic.out(1, 0.3)", clearProps: "x" }
          );
        }
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

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        if (cardFlipRef.current) {
          gsap.fromTo(
            cardFlipRef.current,
            { x: -10 },
            { x: 0, duration: 0.45, ease: "elastic.out(1, 0.3)", clearProps: "x" }
          );
        }
      } else {
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!loginRes?.error) {
          document.cookie = "auth_session=active; path=/; max-age=86400";
          router.push("/dashboard");
          router.refresh();
        } else {
          toggleMode("login");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected registration error occurred");
      setLoading(false);
    }
  };

  return (
    <div
      className="relative h-screen w-full flex overflow-hidden select-none"
      style={{ background: "#08060D", fontFamily: "Onest, sans-serif" }}
    >
      {/* ─── BACKGROUND: REACT BITS OGL PARTICLES ─────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-70">
        <Particles
          particleColors={["#00E5FF", "#E0231C", "#DFE7E0"]}
          particleCount={160}
          particleSpread={12}
          speed={0.12}
          particleBaseSize={80}
          sizeRandomness={0.9}
          moveParticlesOnHover={true}
          particleHoverFactor={0.8}
          alphaParticles={true}
          cameraDistance={22}
          disableRotation={false}
          className="w-full h-full"
        />
      </div>

      {/* ─── LEFT PANEL (Interactive Spidey-Sense Hologram) ───────────────── */}
      <div
        className="hidden md:flex flex-col w-1/2 h-full relative z-10 overflow-hidden"
        style={{
          borderRight: "1px solid rgba(223,231,224,0.08)",
          background:
            "linear-gradient(145deg, rgba(11,8,22,0.92) 0%, rgba(8,6,13,0.95) 55%, rgba(13,10,26,0.9) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Top bar branding */}
        <div className="absolute top-5 left-7 z-20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#DFE7E0]/80">
            Spider-Sense // Consumer Defense
          </span>
        </div>

        {/* Main interactive panel */}
        <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden">
          <LoginLeftPanel typingIntensity={typingCount} />
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 px-7 pb-4 flex items-center justify-between">
          <span className="text-[8.5px] font-mono tracking-widest uppercase text-[rgba(223,231,224,0.3)]">
            Human Intuition · AI Radar
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[8.5px] font-mono text-[#10B981] tracking-widest uppercase">
              Radar Active
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (Mirror Flip Shadcn Card) ────────────────────────── */}
      <div
        ref={rightRef}
        className="flex flex-col w-full md:w-1/2 h-full items-center justify-center px-6 sm:px-10 py-4 relative z-10 opacity-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(16,13,26,0.92) 0%, rgba(8,6,13,0.95) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Mirror Flip Wrapper */}
        <div style={{ perspective: 1200 }} className="w-full max-w-[400px]">
          <div
            ref={cardFlipRef}
            style={{ transformStyle: "preserve-3d" }}
          >
            <Card className="w-full rounded-2xl border border-[rgba(223,231,224,0.12)] bg-[#0e0c16]/85 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              {/* Mode Switcher Tabs */}
              <div className="flex rounded-xl bg-black/40 p-1 border border-[rgba(223,231,224,0.08)] mb-3">
                <Button
                  type="button"
                  id="tab-signin"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMode("login")}
                  className={`flex-1 py-1 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-300 border-none shadow-none cursor-pointer ${
                    mode === "login"
                      ? "bg-[#E0231C] text-white shadow-[0_0_15px_rgba(224,35,28,0.4)] font-bold hover:bg-[#E0231C]"
                      : "text-[rgba(223,231,224,0.5)] hover:text-white hover:bg-transparent"
                  }`}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  id="tab-signup"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMode("signup")}
                  className={`flex-1 py-1 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-300 border-none shadow-none cursor-pointer ${
                    mode === "signup"
                      ? "bg-[#00E5FF] text-[#08060D] font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:bg-[#00E5FF]"
                      : "text-[rgba(223,231,224,0.5)] hover:text-white hover:bg-transparent"
                  }`}
                >
                  Sign Up
                </Button>
              </div>

              {/* Card Header */}
              <CardHeader className="p-0 mb-3 space-y-1 border-none">
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E0231C]/10 border border-[#E0231C]/30 text-[#E0231C] text-[9px] font-mono tracking-[0.18em] uppercase shadow-none font-bold"
                  >
                    <ShieldCheck className="w-3 h-3 text-[#E0231C]" />
                    {mode === "login" ? "Verified Protection" : "New Operator Clearance"}
                  </Badge>
                </div>

                <CardTitle
                  className="text-[clamp(20px,2vw,28px)] font-normal text-[#DFE7E0] leading-tight tracking-tight pt-1 font-sans"
                  style={{ fontFamily: "Onest, sans-serif" }}
                >
                  {mode === "login" ? (
                    <>
                      Step into your <br />
                      <span className="text-[#00E5FF] font-medium">Protection Radar</span>
                    </>
                  ) : (
                    <>
                      Initialize your <br />
                      <span className="text-[#00E5FF] font-medium">Early-Warning Radar</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-[11px] text-[rgba(223,231,224,0.6)] leading-relaxed font-sans">
                  {mode === "login"
                    ? "Real-time surveillance for fine print, contract shifts, and silent recalls."
                    : "Zero configuration. Sign up to activate early alerts before you agree to terms."}
                </CardDescription>
              </CardHeader>

              {/* Error notice */}
              {error && (
                <div
                  className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-[11px] font-sans"
                  style={{
                    background: "rgba(224,35,28,0.12)",
                    border: "1px solid rgba(224,35,28,0.4)",
                    color: "#FF8F8F",
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#E0231C]" />
                  {error}
                </div>
              )}

              {/* Card Content (Forms) */}
              <CardContent className="p-0">
                {/* ─── LOGIN FORM ───────────────────────────── */}
                {mode === "login" && (
                  <form onSubmit={handleLoginSubmit} className="space-y-2.5" noValidate>
                    <div>
                      <label className="block text-[9.5px] font-mono tracking-[0.2em] uppercase text-[rgba(223,231,224,0.5)] mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Input
                          id="login-email"
                          type="email"
                          required
                          value={email}
                          onChange={handleEmailChange}
                          placeholder="you@domain.com"
                          autoComplete="email"
                          className="h-9 w-full rounded-xl pl-9 pr-3 py-2 text-[12.5px] text-[#DFE7E0] placeholder:text-[rgba(223,231,224,0.25)] border-[rgba(223,231,224,0.12)] bg-[#0e0c16]/90 shadow-none focus-visible:border-[rgba(0,229,255,0.5)] focus-visible:shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all"
                          style={{ caretColor: "#00E5FF" }}
                        />
                        <Mail className="w-3.5 h-3.5 text-[rgba(223,231,224,0.35)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9.5px] font-mono tracking-[0.2em] uppercase text-[rgba(223,231,224,0.5)]">
                          Password
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => toggleMode("signup")}
                          className="h-auto p-0 text-[10.5px] text-[rgba(0,229,255,0.7)] hover:text-[#00E5FF] hover:bg-transparent font-normal normal-case border-none shadow-none cursor-pointer"
                        >
                          Sign up instead?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPass ? "text" : "password"}
                          required
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="••••••••••••"
                          autoComplete="current-password"
                          className="h-9 w-full rounded-xl pl-9 pr-10 py-2 text-[12.5px] text-[#DFE7E0] placeholder:text-[rgba(223,231,224,0.25)] border-[rgba(223,231,224,0.12)] bg-[#0e0c16]/90 shadow-none focus-visible:border-[rgba(0,229,255,0.5)] focus-visible:shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all"
                          style={{ caretColor: "#00E5FF" }}
                        />
                        <Lock className="w-3.5 h-3.5 text-[rgba(223,231,224,0.35)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPass((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(223,231,224,0.35)] hover:text-[rgba(223,231,224,0.8)] transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPass ? "Hide password" : "Show password"}
                        >
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      id="login-submit"
                      type="submit"
                      disabled={loading}
                      variant="default"
                      className="group w-full h-10 relative flex items-center justify-center gap-2 rounded-xl text-[12px] font-mono tracking-widest uppercase overflow-hidden transition-all duration-300 mt-1 cursor-pointer border-[rgba(224,35,28,0.6)] bg-gradient-to-r from-[#E0231C] to-[#C01B15] text-white shadow-[0_4px_20px_rgba(224,35,28,0.3)] hover:shadow-[0_6px_25px_rgba(224,35,28,0.5)] active:translate-none"
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter Radar Room</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* ─── SIGN UP FORM ──────────────────────────── */}
                {mode === "signup" && (
                  <form onSubmit={handleSignupSubmit} className="space-y-2" noValidate>
                    <div>
                      <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[rgba(223,231,224,0.5)] mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <Input
                          id="signup-name"
                          type="text"
                          required
                          value={name}
                          onChange={handleNameChange}
                          placeholder="Peter Parker"
                          className="h-8.5 w-full rounded-xl pl-8.5 pr-3 py-1.5 text-[12px] text-[#DFE7E0] placeholder:text-[rgba(223,231,224,0.25)] border-[rgba(223,231,224,0.12)] bg-[#0e0c16]/90 shadow-none focus-visible:border-[rgba(0,229,255,0.5)] focus-visible:shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all"
                          style={{ caretColor: "#00E5FF" }}
                        />
                        <User className="w-3.5 h-3.5 text-[rgba(223,231,224,0.35)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[rgba(223,231,224,0.5)] mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          value={email}
                          onChange={handleEmailChange}
                          placeholder="hero@spidersense.ai"
                          autoComplete="email"
                          className="h-8.5 w-full rounded-xl pl-8.5 pr-3 py-1.5 text-[12px] text-[#DFE7E0] placeholder:text-[rgba(223,231,224,0.25)] border-[rgba(223,231,224,0.12)] bg-[#0e0c16]/90 shadow-none focus-visible:border-[rgba(0,229,255,0.5)] focus-visible:shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all"
                          style={{ caretColor: "#00E5FF" }}
                        />
                        <Mail className="w-3.5 h-3.5 text-[rgba(223,231,224,0.35)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono tracking-[0.2em] uppercase text-[rgba(223,231,224,0.5)] mb-1">
                        Password (Min 6 Characters)
                      </label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPass ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="••••••••••••"
                          className="h-8.5 w-full rounded-xl pl-8.5 pr-9 py-1.5 text-[12px] text-[#DFE7E0] placeholder:text-[rgba(223,231,224,0.25)] border-[rgba(223,231,224,0.12)] bg-[#0e0c16]/90 shadow-none focus-visible:border-[rgba(0,229,255,0.5)] focus-visible:shadow-[0_0_12px_rgba(0,229,255,0.15)] transition-all"
                          style={{ caretColor: "#00E5FF" }}
                        />
                        <Lock className="w-3.5 h-3.5 text-[rgba(223,231,224,0.35)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPass((p) => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[rgba(223,231,224,0.35)] hover:text-[rgba(223,231,224,0.8)] transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          aria-label={showPass ? "Hide password" : "Show password"}
                        >
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      id="signup-submit"
                      type="submit"
                      disabled={loading}
                      variant="default"
                      className="group w-full h-9.5 relative flex items-center justify-center gap-2 rounded-xl text-[12px] font-mono tracking-widest uppercase overflow-hidden transition-all duration-300 mt-1 cursor-pointer border-[rgba(0,229,255,0.6)] bg-gradient-to-r from-[#00E5FF] to-[#0099B8] text-[#08060D] font-bold shadow-[0_4px_20px_rgba(0,229,255,0.3)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.5)] active:translate-none"
                    >
                      {loading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                          <span>Creating Profile...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign Up & Activate Radar</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>

              {/* Card Footer */}
              <CardFooter className="p-0 mt-3 pt-2.5 border-t border-[rgba(223,231,224,0.08)] flex items-center justify-between text-[11px] text-[rgba(223,231,224,0.4)]">
                <span>{mode === "login" ? "Don't have an account?" : "Already have an account?"}</span>
                <Button
                  type="button"
                  id="footer-toggle-btn"
                  variant="ghost"
                  onClick={() => toggleMode(mode === "login" ? "signup" : "login")}
                  className="h-auto p-0 text-[#00E5FF] hover:text-white hover:bg-transparent font-medium flex items-center gap-1 cursor-pointer border-none shadow-none text-[11px] normal-case"
                >
                  {mode === "login" ? (
                    <>
                      Sign Up <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-3 h-3 text-[#00E5FF]" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#08060D]" />}>
      <AuthCard />
    </Suspense>
  );
}
