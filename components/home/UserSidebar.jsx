"use client";

import { cn } from "@/lib/utils";
import {
  Swords,
  Plus,
  Scroll,
  Shield,
  Trophy,
  Bell,
  LogOut,
  ChevronRight,
  User,
} from "lucide-react";

const NAV = [
  { id: "home",         label: "Arena",        icon: Swords, sub: "Ongoing battles" },
  { id: "create",       label: "Create",       icon: Plus,   sub: "New challenge"   },
  { id: "quests",       label: "Quests",       icon: Scroll, sub: "Accept a battle" },
  { id: "my-battles",   label: "My Battles",   icon: Shield, sub: "Your record"     },
  { id: "leaderboard",  label: "Leaderboard",  icon: Trophy, sub: "Rankings"        },
  { id: "notifications",label: "Alerts",       icon: Bell,   sub: "Notifications"   },
];

export default function UserSidebar({
  activeTab,
  setActiveTab,
  user,
  unreadCount = 0,
  onProfileClick,
  onLogout,
}) {
  return (
    <aside className="h-screen w-56 shrink-0 flex flex-col border-r border-border/60 bg-card/20 overflow-hidden">
      {/* Brand Header - Fixed at top */}
      <div className="shrink-0 flex items-center gap-2.5 border-b border-border/30 px-5 py-4">
        <div className="h-4 w-4 bg-foreground shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] leading-none">
          Rivalz<br />
          <span className="text-muted-foreground/60">Battle</span>
        </span>
      </div>

      {/* Navigation - Takes available space, only scrolls if really needed */}
      <nav className="flex-1 flex flex-col px-2 pt-4 overflow-hidden">
        <p className="px-3 mb-2 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/30 font-mono shrink-0">
          // Navigate
        </p>

        <div className="flex-1 overflow-y-auto custom-scroll space-y-0.5 pr-1">
          {NAV.map(({ id, label, icon: Icon, sub }) => {
            const active = activeTab === id;
            const isBell = id === "notifications";

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 text-left w-full transition-all rounded-md shrink-0",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Icon size={13} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider leading-none">{label}</p>
                  <p className={cn(
                    "text-[9px] mt-0.5 font-mono truncate",
                    active ? "text-background/50" : "text-muted-foreground/60"
                  )}>
                    {sub}
                  </p>
                </div>
                {isBell && unreadCount > 0 && (
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 min-w-[18px] text-center rounded",
                    active ? "bg-background/20 text-background" : "bg-foreground text-background"
                  )}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {!active && (
                  <ChevronRight 
                    size={9} 
                    className="opacity-0 group-hover:opacity-30 transition-opacity shrink-0" 
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile Footer - Always pinned at bottom */}
      <div className="shrink-0 border-t border-border/30 p-3 bg-card/30">
        <button
          onClick={onProfileClick}
          className="group flex w-full items-center gap-3 px-3 py-2.5 hover:bg-foreground/5 transition-colors text-left rounded-md"
        >
          {user?.profileImage ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${user.profileImage}`}
              className="h-7 w-7 shrink-0 object-cover rounded-full"
              alt=""
            />
          ) : (
            <div className="h-7 w-7 shrink-0 bg-foreground/10 flex items-center justify-center text-[10px] font-mono rounded-full">
              {user?.username?.[0]?.toUpperCase() ?? <User size={10} />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold truncate leading-none">{user?.username ?? "—"}</p>
            <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 truncate">
              {user?.faction?.name ?? "No Faction"} · {user?.rating ?? 1200}
            </p>
          </div>
        </button>

        <button
          onClick={onLogout}
          className="mt-2 flex w-full items-center gap-2 px-3 py-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase tracking-widest"
        >
          <LogOut size={10} />
          Logout
        </button>
      </div>
    </aside>
  );
}