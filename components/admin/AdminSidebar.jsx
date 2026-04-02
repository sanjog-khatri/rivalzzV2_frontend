"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  Swords,
  Tag,
  Flag,
  Shield,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "users",      label: "Users",      icon: Users,  count: null },
  { id: "factions",   label: "Factions",   icon: Shield, count: null },
  { id: "categories", label: "Categories", icon: Tag,    count: null },
  { id: "challenges", label: "Challenges", icon: Swords, count: null },
  { id: "reports",    label: "Reports",    icon: Flag,   count: null },
];

export default function AdminSidebar({ activeTab, setActiveTab, counts = {} }) {
  return (
    <aside className="w-56 shrink-0 border-r border-border/40 min-h-full bg-card/30">
      {/* Section header */}
      <div className="px-4 pt-6 pb-3">
        <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/60 font-mono">
          // Modules
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const count = counts[id];
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-wider transition-all w-full text-left",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {/* Active left bar */}
              {active && (
                <span className="absolute left-0 top-0 h-full w-0.5 bg-foreground/0" />
              )}

              <Icon size={13} className="shrink-0" />
              <span className="flex-1">{label}</span>

              {count != null && (
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 font-mono",
                    active
                      ? "bg-background/20 text-background"
                      : "bg-foreground/10 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}

              {!active && (
                <ChevronRight
                  size={10}
                  className="opacity-0 group-hover:opacity-40 transition-opacity"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom decoration */}
      <div className="absolute bottom-6 left-0 w-56 px-4">
        <p className="text-[9px] text-muted-foreground/20 font-mono uppercase tracking-widest">
          ARENA_ADMIN v1.0
        </p>
      </div>
    </aside>
  );
}