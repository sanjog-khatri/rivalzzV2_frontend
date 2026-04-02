"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────
// Shared helpers (unchanged)
// ─────────────────────────────────────────────────────────
function GlitchText({ text, className = "" }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="absolute inset-0 text-foreground/10 select-none pointer-events-none animate-glitch-1" aria-hidden>
        {text}
      </span>
      <span className="absolute inset-0 text-foreground/10 select-none pointer-events-none animate-glitch-2" aria-hidden>
        {text}
      </span>
      {text}
    </span>
  );
}

function GridOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
      style={{
        backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
}

function Scanlines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Login Form
// ─────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      console.log("Login successful:", data);

      // === CRITICAL: Save token AND userId ===
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);     // ← This was missing

      // Optional: Save full user data
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/home");        // or "/dashboard"
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email" className="text-xs uppercase tracking-widest text-muted-foreground">
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="challenger@arena.io"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="bg-transparent border-border/60 focus-visible:border-foreground rounded-none h-10 placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password" className="text-xs uppercase tracking-widest text-muted-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="bg-transparent border-border/60 focus-visible:border-foreground rounded-none h-10 pr-10 placeholder:text-muted-foreground/40"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-xs font-mono border border-destructive/30 bg-destructive/5 px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="rounded-none h-11 mt-1 uppercase tracking-[0.15em] text-xs font-mono gap-2 group"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            Enter Arena
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          Register
        </button>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// Main Login Page
// ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @keyframes glitch-1 { ... } /* your existing keyframes */
        @keyframes glitch-2 { ... }
        /* ... rest of your keyframes */
      `}</style>

      <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
        <GridOverlay />
        <Scanlines />

        {/* Top bar */}
        <header className="relative z-10 flex items-center justify-between border-b border-border/40 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-foreground" />
            <span className="text-xs uppercase tracking-[0.2em] font-mono">
              Challenge Battle
            </span>
          </div>
          <Badge variant="outline" className="rounded-none text-[10px] tracking-widest uppercase font-mono">
            Authenticate
          </Badge>
        </header>

        {/* Ticker */}
        <div className="relative z-10 border-b border-border/20 overflow-hidden bg-foreground/[0.02] py-1.5">
          <div className="flex animate-ticker whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, i) => (
              <span
                key={i}
                className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/40 mr-8"
              >
                {[
                  "Challenge Battle Arena",
                  "⬛",
                  "Live Voting System",
                  "⬛",
                  "Real-time Notifications",
                  "⬛",
                  "ELO Rating 1200",
                  "⬛",
                  "Join a Faction",
                  "⬛",
                  "Rise the Leaderboard",
                  "⬛",
                ].join(" ")}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-10 animate-fade-up">
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
                // Welcome back
              </p>
              <h1 className="text-4xl font-mono font-bold leading-none tracking-tight">
                <GlitchText text="SIGN_IN" />
              </h1>
              <div className="mt-3 h-px w-12 bg-foreground" />
            </div>

            <div className="border border-border/60 bg-card/50 backdrop-blur-sm p-7 animate-fade-up-delay">
              <LoginForm onSwitch={() => router.push("/auth/signup")} />
            </div>

            <p className="mt-6 text-center text-[10px] text-muted-foreground/40 tracking-wider animate-fade-up-delay-2">
              Starting ELO · <span className="text-muted-foreground/60">1200</span> · Faction assigned on first battle
            </p>
          </div>
        </main>

        {/* Corner decorations */}
        <span className="pointer-events-none fixed bottom-6 left-6 text-[10px] text-muted-foreground/20 tracking-widest font-mono hidden sm:block">
          ARENA_v1.0
        </span>
        <span className="pointer-events-none fixed bottom-6 right-6 text-[10px] text-muted-foreground/20 tracking-widest font-mono hidden sm:block">
          {"{AUTH_MODULE}"}
        </span>
      </div>
    </>
  );
}