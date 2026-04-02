"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function GridOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
    </div>
  );
}

export function Empty({ message = "Nothing here yet", sub }) {
  return (
    <div className="py-20 text-center border border-dashed border-border/30">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30 font-mono">
        {message}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground/20 font-mono mt-1">{sub}</p>
      )}
    </div>
  );
}

export function SectionHeader({ eyebrow, title }) {
  return (
    <div className="mb-6">
      <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/40 font-mono mb-1">
        // {eyebrow}
      </p>
      <h2 className="text-xl font-mono font-bold tracking-tight">{title}</h2>
      <div className="mt-2 h-px w-8 bg-foreground/30" />
    </div>
  );
}

export function EloChip({ rating, delta }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 border",
      delta > 0
        ? "border-green-500/30 bg-green-500/5 text-green-500"
        : delta < 0
        ? "border-red-500/30 bg-red-500/5 text-red-500"
        : "border-border/50 bg-foreground/5 text-muted-foreground"
    )}>
      {rating}
      {delta != null && delta !== 0 && (
        <span>{delta > 0 ? `+${delta}` : delta}</span>
      )}
    </span>
  );
}

export function StatusChip({ status }) {
  const map = {
    pending:   "border-yellow-500/30 bg-yellow-500/5  text-yellow-500",
    ongoing:   "border-blue-500/30   bg-blue-500/5    text-blue-500",
    completed: "border-green-500/30  bg-green-500/5   text-green-500",
  };
  return (
    <span className={cn(
      "inline-flex items-center text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border",
      map[status] ?? "border-border/50 bg-foreground/5 text-muted-foreground"
    )}>
      {status}
    </span>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-border/60 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs font-mono">
            [ESC]
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}