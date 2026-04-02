"use client";
import { useState } from "react";
import { Eye, EyeOff, Upload, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────
// Shared helpers 
// ─────────────────────────────────────────────────────────
const GLITCH_CHARS = "█▓▒░";

function GlitchText({ text, className = "" }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span
        className="absolute inset-0 text-foreground/10 select-none pointer-events-none animate-glitch-1"
        aria-hidden
      >
        {text}
      </span>
      <span
        className="absolute inset-0 text-foreground/10 select-none pointer-events-none animate-glitch-2"
        aria-hidden
      >
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
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
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
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Signup Form
// ─────────────────────────────────────────────────────────
function SignupForm({ onSwitch }) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    profileImage: null,
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, profileImage: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", form.username);
      fd.append("email", form.email);
      fd.append("password", form.password);
      if (form.profileImage) fd.append("profileImage", form.profileImage);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      router.push("/auth/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Avatar upload */}
      <div className="flex items-center gap-4">
        <label
          htmlFor="avatar-upload"
          className="group relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center border border-border/60 hover:border-foreground transition-colors overflow-hidden"
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <Upload
              size={16}
              className="text-muted-foreground group-hover:text-foreground transition-colors"
            />
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
          />
        </label>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Profile Image
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            Optional · JPG, PNG, WEBP
          </p>
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="su-username" className="text-xs uppercase tracking-widest text-muted-foreground">
          Username
        </Label>
        <Input
          id="su-username"
          type="text"
          placeholder="xX_Challenger_Xx"
          required
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          className="bg-transparent border-border/60 focus-visible:border-foreground rounded-none h-10 placeholder:text-muted-foreground/40 transition-colors"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="su-email" className="text-xs uppercase tracking-widest text-muted-foreground">
          Email
        </Label>
        <Input
          id="su-email"
          type="email"
          placeholder="challenger@arena.io"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="bg-transparent border-border/60 focus-visible:border-foreground rounded-none h-10 placeholder:text-muted-foreground/40 transition-colors"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="su-password" className="text-xs uppercase tracking-widest text-muted-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="su-password"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="bg-transparent border-border/60 focus-visible:border-foreground rounded-none h-10 pr-10 placeholder:text-muted-foreground/40 transition-colors"
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

      {/* Error */}
      {error && (
        <p className="text-destructive text-xs font-mono border border-destructive/30 bg-destructive/5 px-3 py-2">
          ⚠ {error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="rounded-none h-11 mt-1 uppercase tracking-[0.15em] text-xs font-mono gap-2 group"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            Join the Battle
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </Button>

      {/* Switch */}
      <p className="text-center text-xs text-muted-foreground">
        Already a challenger?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          Login
        </button>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// Main Signup Page
// ─────────────────────────────────────────────────────────
export default function SignupPage() {
  const [mode, setMode] = useState("signup");
  const router = useRouter();

  return (
    <>
      {/* Global keyframe styles injected once */}
      <style>{`
        @keyframes glitch-1 {
          0%,100% { clip-path: inset(0 0 98% 0); transform: translate(-2px, 0); }
          20% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 0); }
          40% { clip-path: inset(70% 0 10% 0); transform: translate(-1px, 0); }
          60% { clip-path: inset(10% 0 80% 0); transform: translate(1px, 0); }
          80% { clip-path: inset(55% 0 30% 0); transform: translate(-2px, 0); }
        }
        @keyframes glitch-2 {
          0%,100% { clip-path: inset(98% 0 0 0); transform: translate(2px, 0); }
          20% { clip-path: inset(5% 0 60% 0); transform: translate(-2px, 0); }
          40% { clip-path: inset(50% 0 20% 0); transform: translate(1px, 0); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(-1px, 0); }
          80% { clip-path: inset(20% 0 70% 0); transform: translate(2px, 0); }
        }
        .animate-glitch-1 { animation: glitch-1 4s infinite steps(1); }
        .animate-glitch-2 { animation: glitch-2 4s 0.1s infinite steps(1); }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s ease both; }
        .animate-fade-up-delay { animation: fade-up 0.5s 0.15s ease both; }
        .animate-fade-up-delay-2 { animation: fade-up 0.5s 0.28s ease both; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-ticker { animation: ticker 18s linear infinite; }
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
          <Badge
            variant="outline"
            className="rounded-none text-[10px] tracking-widest uppercase font-mono"
          >
            Register
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
            {/* Heading */}
            <div className="mb-10 animate-fade-up">
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-2">
                // New challenger
              </p>
              <h1 className="text-4xl font-mono font-bold leading-none tracking-tight">
                <GlitchText text="SIGN_UP" />
              </h1>
              <div className="mt-3 h-px w-12 bg-foreground" />
            </div>

            {/* Card */}
            <div className="border border-border/60 bg-card/50 backdrop-blur-sm p-7 animate-fade-up-delay">
              <SignupForm onSwitch={() => router.push("/auth/login")} />
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-[10px] text-muted-foreground/40 tracking-wider animate-fade-up-delay-2">
              Starting ELO · <span className="text-muted-foreground/60">1200</span>
              {" "}·{" "}
              Faction assigned on first battle
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