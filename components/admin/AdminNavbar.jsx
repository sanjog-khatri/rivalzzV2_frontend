"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Terminal } from "lucide-react";

export default function AdminNavbar({ activeTab }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-foreground" />
          <span className="text-xs uppercase tracking-[0.2em] font-mono">
            Challenge Battle
          </span>
          <span className="text-muted-foreground/30 text-xs">/</span>
          <Badge
            variant="outline"
            className="rounded-none text-[10px] tracking-widest uppercase font-mono border-foreground/30"
          >
            ADMIN_CONSOLE
          </Badge>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground/50 font-mono">
            <Terminal size={10} />
            <span className="uppercase tracking-widest">{activeTab}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none text-xs gap-2 text-muted-foreground hover:text-foreground uppercase tracking-wider"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}