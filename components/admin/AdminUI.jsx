"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// ── Section wrapper ──────────────────────────────────────
export function Section({ title, subtitle, action, children }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/60 font-mono mb-1">
            // {subtitle || title}
          </p>
          <h2 className="text-xl font-mono font-bold tracking-tight">{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────
export function StatCard({ label, value, sub }) {
  return (
    <div className="border border-border/60 bg-card/50 p-4">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-mono mb-1">
        {label}
      </p>
      <p className="text-2xl font-mono font-bold">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────
export function Table({ cols, children, loading }) {
  return (
    <div className="border border-border/60 overflow-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border/60 bg-foreground/[0.03]">
            {cols.map((c) => (
              <th
                key={c}
                className="px-4 py-2.5 text-left uppercase tracking-widest text-[9px] text-muted-foreground/50 font-mono whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={cols.length} className="py-12 text-center text-muted-foreground/60">
                <Loader2 size={14} className="animate-spin inline-block" />
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className }) {
  return (
    <tr
      className={cn(
        "border-b border-border/20 last:border-0 hover:bg-foreground/[0.02] transition-colors",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className }) {
  return (
    <td className={cn("px-4 py-3 text-xs font-mono", className)}>{children}</td>
  );
}

// ── Status badge ─────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pending:  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    resolved: "bg-green-500/10  text-green-500  border-green-500/20",
    rejected: "bg-red-500/10    text-red-500    border-red-500/20",
    open:     "bg-blue-500/10   text-blue-500   border-blue-500/20",
    closed:   "bg-muted         text-muted-foreground border-border",
    active:   "bg-green-500/10  text-green-500  border-green-500/20",
    banned:   "bg-red-500/10    text-red-500    border-red-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-widest border font-mono",
        map[status?.toLowerCase()] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {status}
    </span>
  );
}

// ── Empty state ──────────────────────────────────────────
export function Empty({ message = "No records found" }) {
  return (
    <div className="py-16 text-center border border-border/60 border-dashed">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30 font-mono">
        {message}
      </p>
    </div>
  );
}

// ── Modal shell ──────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-border/60 bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono"
          >
            [ESC]
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}