"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { SectionHeader, PageLoader, EloChip } from "./UI";
import { Trophy, Shield, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

function RankMedal({ rank }) {
  if (rank === 1) return <span className="text-yellow-400 font-mono text-xs">①</span>;
  if (rank === 2) return <span className="text-slate-300 font-mono text-xs">②</span>;
  if (rank === 3) return <span className="text-amber-600 font-mono text-xs">③</span>;
  return <span className="text-muted-foreground/30 text-xs font-mono">{rank}</span>;
}

export default function LeaderboardTab({ currentUserId }) {
  const socket = useSocket();
  const [mode, setMode] = useState("users");
  const [users, setUsers] = useState([]);
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const loadUsers = fetch(`${API}/api/user/leaderboard/global`, { 
        headers: authHeader() 
      }).then(r => r.json());

      const loadFactions = fetch(`${API}/api/user/leaderboard/factions`, { 
        headers: authHeader() 
      }).then(r => r.json());

      const [u, f] = await Promise.all([loadUsers, loadFactions]);

      setUsers(Array.isArray(u) ? u : []);
      setFactions(Array.isArray(f) ? f : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Real-time faction updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleFactionUpdated = (data) => {
      setFactions((prevFactions) =>
        prevFactions.map((faction) =>
          faction._id === data.factionId
            ? { ...faction, totalRating: data.totalRating }
            : faction
        )
      );
    };

    socket.on("factionUpdated", handleFactionUpdated);

    return () => {
      socket.off("factionUpdated", handleFactionUpdated);
    };
  }, [socket]);

  const handleRefresh = () => loadData(true);

  const isMe = (id) => id === currentUserId || id?._id === currentUserId;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader eyebrow="Rankings" title="Leaderboard" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 text-xs"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1.5 mb-6">
        {[
          { id: "users", label: "Players", icon: Trophy },
          { id: "factions", label: "Factions", icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={cn(
              "flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-4 py-2 border transition-colors",
              mode === id
                ? "border-foreground bg-foreground text-background"
                : "border-border/50 text-muted-foreground hover:border-foreground/40"
            )}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : mode === "users" ? (
        /* ==================== USERS LEADERBOARD ==================== */
        <div className="border border-border/50 overflow-hidden rounded-xl">
          {users.map((u, i) => (
            <div
              key={u._id}
              className={cn(
                "flex items-center gap-4 px-5 py-3 border-b border-border/20 last:border-0 transition-colors",
                isMe(u._id) ? "bg-foreground/[0.04]" : "hover:bg-foreground/[0.02]"
              )}
            >
              <div className="w-6 text-center shrink-0">
                <RankMedal rank={i + 1} />
              </div>

              {u.profileImage ? (
                <img 
                  src={`${API}${u.profileImage}`} 
                  className="h-7 w-7 object-cover rounded-full shrink-0" 
                  alt="" 
                />
              ) : (
                <div className="h-7 w-7 bg-foreground/10 flex items-center justify-center text-[10px] font-mono rounded-full shrink-0">
                  {u.username?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-mono font-bold truncate", isMe(u._id) && "text-foreground")}>
                  {u.username}
                  {isMe(u._id) && <span className="ml-2 text-[9px] text-muted-foreground/50">(you)</span>}
                </p>
                <p className="text-[9px] text-muted-foreground/40 font-mono">{u.faction?.name ?? "No Faction"}</p>
              </div>

              <EloChip rating={u.rating} />
            </div>
          ))}
        </div>
      ) : (
        /* ==================== FACTIONS LEADERBOARD (Real-time) ==================== */
        <div className="border border-border/50 overflow-hidden rounded-xl">
          {factions.map((f, i) => (
            <div
              key={f._id}
              className="flex items-center gap-4 px-5 py-4 border-b border-border/20 last:border-0 hover:bg-foreground/[0.02] transition-colors"
            >
              <div className="w-6 text-center shrink-0">
                <RankMedal rank={i + 1} />
              </div>

              {f.image ? (
                <img 
                  src={`${API}${f.image}`} 
                  alt={f.name}
                  className="h-9 w-9 object-cover rounded-lg border border-border/50 shrink-0"
                />
              ) : (
                <div className="h-9 w-9 bg-muted flex items-center justify-center rounded-lg shrink-0">
                  <Shield size={18} className="text-muted-foreground/50" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-bold truncate">{f.name}</p>
                <p className="text-[9px] text-muted-foreground/40 font-mono line-clamp-2">
                  {f.description || "No description"}
                </p>
              </div>

              <div className="text-right">
                <EloChip rating={f.totalRating} />
                <p className="text-[9px] text-muted-foreground/40 mt-0.5">Total Rating</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}