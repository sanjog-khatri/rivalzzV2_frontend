"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { SectionHeader, PageLoader, Empty, StatusChip, EloChip } from "./UI";
import { HeartCrack, Trophy, TrophyIcon } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const VOTE_THRESHOLD = 10;

// Helper for authenticated requests
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

function MyBattleCard({ challenge: initialChallenge, currentUserId, onCompleted }) {
  const socket = useSocket();
  const [localChallenge, setLocalChallenge] = useState(initialChallenge);

  const isChallenger = localChallenge.challenger?._id === currentUserId ||
    localChallenge.challenger === currentUserId;

  const myImage = isChallenger ? localChallenge.challengerImage : localChallenge.acceptorImage;
  const theirImage = isChallenger ? localChallenge.acceptorImage : localChallenge.challengerImage;
  const them = isChallenger ? localChallenge.acceptor : localChallenge.challenger;

  const iWon = localChallenge.winner &&
    (localChallenge.winner === currentUserId ||
      localChallenge.winner?._id === currentUserId ||
      localChallenge.winner?.toString() === currentUserId);

  // Calculate vote progress
  const totalVotes = (localChallenge.votes?.challenger ?? 0) + (localChallenge.votes?.acceptor ?? 0);
  const votesRemaining = Math.max(0, VOTE_THRESHOLD - totalVotes);
  const progressPercent = Math.min((totalVotes / VOTE_THRESHOLD) * 100, 100);

  // Real-time Socket.io updates
  useEffect(() => {
    if (!socket || !localChallenge._id) return;

    socket.emit("joinChallenge", localChallenge._id);

    const handleVoteUpdate = (data) => {
      if (data.challengeId === localChallenge._id) {
        setLocalChallenge(data.challenge);
      }
    };

    const handleChallengeCompleted = (data) => {
      if (data.challengeId === localChallenge._id) {
        setLocalChallenge((prev) => ({
          ...prev,
          status: "completed",
          winner: data.winner,
        }));
        onCompleted?.();
      }
    };

    socket.on("voteUpdated", handleVoteUpdate);
    socket.on("challengeCompleted", handleChallengeCompleted);

    return () => {
      socket.emit("leaveChallenge", localChallenge._id);
      socket.off("voteUpdated", handleVoteUpdate);
      socket.off("challengeCompleted", handleChallengeCompleted);
    };
  }, [socket, localChallenge._id, onCompleted]);

  return (
    <div className="border border-border/50 bg-card/30 hover:border-border/70 transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          {localChallenge.category?.image && (
            <img src={`${API}${localChallenge.category.image}`} className="h-3 w-3 object-cover" alt="" />
          )}
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
            {localChallenge.category?.name ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {localChallenge.status === "completed" && iWon && (
            <Trophy size={11} className="text-yellow-500" />
          )}
          <StatusChip status={localChallenge.status} />
        </div>
      </div>

      {/* Images Row */}
      <div className="grid grid-cols-2 gap-0">
        <div className="p-3 flex flex-col items-center gap-1.5 border-r border-border/30">
          {myImage ? (
            <img src={`${API}${myImage}`} className="h-20 w-full object-cover" alt="my entry" />
          ) : (
            <div className="h-20 w-full bg-foreground/5 flex items-center justify-center text-[9px] text-muted-foreground/20 font-mono">
              YOUR IMAGE
            </div>
          )}
          <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">You</span>
        </div>

        <div className="p-3 flex flex-col items-center gap-1.5">
          {theirImage ? (
            <img src={`${API}${theirImage}`} className="h-20 w-full object-cover" alt="opponent" />
          ) : (
            <div className="h-20 w-full bg-foreground/5 flex items-center justify-center text-[9px] text-muted-foreground/20 font-mono">
              AWAITING
            </div>
          )}
          <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider truncate max-w-full">
            {them?.username ?? "—"}
          </span>
        </div>
      </div>

      {/* Vote Progress */}
      {localChallenge.status === "ongoing" && (
        <div className="px-4 py-3 border-t border-border/20 bg-foreground/[0.02]">
          <div className="flex justify-between text-[10px] font-mono mb-1.5">
            <span>Votes so far: <strong>{totalVotes}</strong></span>
            <span className="text-foreground/70">{votesRemaining} votes remaining</span>
          </div>

          <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-foreground to-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-center text-[9px] text-muted-foreground/50 mt-1 font-mono">
            Auto-completes at {VOTE_THRESHOLD} total votes
          </p>
        </div>
      )}

      {/* Result Footer */}
      {localChallenge.status === "completed" && (
        <div
          className={`px-4 py-3 text-center text-sm font-mono uppercase tracking-widest border-t border-border/20 flex items-center justify-center gap-2 ${iWon ? "text-green-500" : "text-muted-foreground/50"
            }`}
        >
          {iWon ? (
            <>
              <TrophyIcon size={16} />
              VICTORY
            </>
          ) : (
            <>
              <HeartCrack size={16} />
              DEFEAT
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Tab Wrapper
export default function MyBattlesTab({ currentUserId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/challenges/my`, {
        headers: authHeader(),          // ← Now defined
      });
      const data = await res.json();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filters = ["all", "pending", "ongoing", "completed"];
  const filtered = filter === "all"
    ? challenges
    : challenges.filter((c) => c.status === filter);

  return (
    <div>
      <SectionHeader eyebrow="My Record" title="My Battles" />

      {/* Filter chips */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors ${filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-border/50 text-muted-foreground hover:border-foreground/40"
              }`}
          >
            {f} {f === "all" ? `(${challenges.length})` : `(${challenges.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${filter === "all" ? "" : filter} battles`} sub="Create a challenge to get started" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <MyBattleCard
              key={c._id}
              challenge={c}
              currentUserId={currentUserId}
              onCompleted={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}