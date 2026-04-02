"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Button } from "@/components/ui/button";
import { StatusChip, EloChip } from "./UI";
import { Flag, ThumbsUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const multipartHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

// VoteBar Component
function VoteBar({ challengerVotes = 0, acceptorVotes = 0 }) {
  const total = challengerVotes + acceptorVotes;
  const pct = total === 0 ? 50 : Math.round((challengerVotes / total) * 100);

  return (
    <div className="mt-3">
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50 mb-1">
        <span>{challengerVotes} votes</span>
        <span>{acceptorVotes} votes</span>
      </div>
      <div className="h-1 w-full bg-foreground/10 overflow-hidden rounded-full">
        <div
          className="h-full bg-foreground transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/30 mt-0.5">
        <span>{pct}%</span>
        <span>{100 - pct}%</span>
      </div>
    </div>
  );
}

export function BattleCard({ challenge: initialChallenge, currentUserId, onVoted }) {
  const socket = useSocket();
  const [localChallenge, setLocalChallenge] = useState(initialChallenge);
  const [loading, setLoading] = useState(null);
  const [reported, setReported] = useState(false);

  const isParticipant =
    localChallenge.challenger?._id === currentUserId ||
    localChallenge.acceptor?._id === currentUserId;

  // Socket real-time updates
  useEffect(() => {
    if (!socket || !localChallenge._id || localChallenge.status !== "ongoing") return;

    socket.emit("joinChallenge", localChallenge._id);

    const handleVoteUpdate = (data) => {
      if (data.challengeId === localChallenge._id && data.challenge) {
        setLocalChallenge((prev) => ({
          ...prev,
          ...data.challenge,
          votes: data.challenge.votes || prev.votes || { challenger: 0, acceptor: 0 },
        }));
      }
    };

    const handleChallengeCompleted = (data) => {
      if (data.challengeId === localChallenge._id) {
        setLocalChallenge((prev) => ({
          ...prev,
          status: "completed",
          winner: data.winner,
        }));
      }
    };

    socket.on("voteUpdated", handleVoteUpdate);
    socket.on("challengeCompleted", handleChallengeCompleted);

    return () => {
      socket.emit("leaveChallenge", localChallenge._id);
      socket.off("voteUpdated", handleVoteUpdate);
      socket.off("challengeCompleted", handleChallengeCompleted);
    };
  }, [socket, localChallenge._id]);

  const vote = async (side) => {
    setLoading(side);
    try {
      const res = await fetch(`${API}/api/user/challenges/${localChallenge._id}/vote`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ votedFor: side }),
      });

      if (res.ok) {
        onVoted?.();
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const report = async () => {
    try {
      await fetch(`${API}/api/user/challenges/${localChallenge._id}/report`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ reason: "inappropriate", description: "" }),
      });
      setReported(true);
    } catch (err) {
      console.error(err);
    }
  };

  const challengerVotes = localChallenge.votes?.challenger ?? 0;
  const acceptorVotes = localChallenge.votes?.acceptor ?? 0;
  const totalVotes = challengerVotes + acceptorVotes;

  return (
    <div className="border border-border/50 bg-card/30 hover:border-border/80 transition-colors group relative overflow-hidden">
      {/* Category tag */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-1.5">
          {localChallenge.category?.image && (
            <img
              src={`${API}${localChallenge.category.image}`}
              className="h-3.5 w-3.5 object-cover"
              alt=""
            />
          )}
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
            {localChallenge.category?.name ?? "Uncategorized"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status={localChallenge.status} />
          <span className="text-[9px] font-mono text-muted-foreground/30">{totalVotes} votes</span>
        </div>
      </div>

      {/* VS Section with Better Image Display */}
      <div className="grid grid-cols-2 gap-0">
        {/* Challenger Side */}
        <div className="relative border-r border-border/30 p-3 flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden bg-black/80 rounded">
            {localChallenge.challengerImage ? (
              <img
                src={`${API}${localChallenge.challengerImage}`}
                className="w-full h-full object-contain" 
                alt="Challenger"
              />
            ) : (
              <div className="h-full w-full bg-foreground/5 flex items-center justify-center">
                <span className="text-muted-foreground/40 text-xs">No Image</span>
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs font-mono font-bold truncate">
              {localChallenge.challenger?.username ?? "?"}
            </p>
            <EloChip rating={localChallenge.challenger?.rating ?? 1200} />
          </div>

          {!isParticipant && localChallenge.status === "ongoing" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => vote("challenger")}
              disabled={!!loading}
              className="mt-3 rounded-none text-[10px] h-8 w-full uppercase tracking-wider"
            >
              <ThumbsUp size={10} className="mr-1" />
              {loading === "challenger" ? "…" : "Vote"}
            </Button>
          )}
        </div>

        {/* Acceptor Side */}
        <div className="relative p-3 flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden bg-black/80 rounded">
            {localChallenge.acceptorImage ? (
              <img
                src={`${API}${localChallenge.acceptorImage}`}
                className="w-full h-full object-contain"   
                alt="Acceptor"
              />
            ) : (
              <div className="h-full w-full bg-foreground/5 flex items-center justify-center text-[10px] text-muted-foreground/40 font-mono">
                AWAITING IMAGE
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs font-mono font-bold truncate">
              {localChallenge.acceptor?.username ?? "—"}
            </p>
            {localChallenge.acceptor && (
              <EloChip rating={localChallenge.acceptor.rating ?? 1200} />
            )}
          </div>

          {!isParticipant && localChallenge.status === "ongoing" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => vote("acceptor")}
              disabled={!!loading}
              className="mt-3 rounded-none text-[10px] h-8 w-full uppercase tracking-wider"
            >
              <ThumbsUp size={10} className="mr-1" />
              {loading === "acceptor" ? "…" : "Vote"}
            </Button>
          )}
        </div>
      </div>

      {/* Vote Bar */}
      <div className="px-4 pb-4">
        <VoteBar
          challengerVotes={challengerVotes}
          acceptorVotes={acceptorVotes}
        />
      </div>

      {/* Report Button */}
      {!isParticipant && !reported && localChallenge.status === "ongoing" && (
        <div className="flex justify-end border-t border-border/20 px-4 py-2">
          <button
            onClick={report}
            className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Flag size={9} />
            Report
          </button>
        </div>
      )}

      {reported && (
        <p className="border-t border-border/20 px-4 py-2 text-[9px] font-mono text-muted-foreground/40 text-right">
          Reported ✓
        </p>
      )}
    </div>
  );
}

// ── Quest Card (unchanged) ─────────────────────────────────────────────────

export function QuestCard({ challenge, onAccepted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const accept = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("acceptorImage", file);

    try {
      await fetch(`${API}/api/user/challenges/${challenge._id}/accept`, {
        method: "PUT",
        headers: multipartHeader(),
        body: fd,
      });
      onAccepted?.();
      setExpanded(false);
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border/50 bg-card/30 hover:border-border/80 transition-colors overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {challenge.challenger?.profileImage ? (
            <img 
              src={`${API}${challenge.challenger.profileImage}`} 
              className="h-8 w-8 object-cover rounded-full" 
              alt="" 
            />
          ) : (
            <div className="h-8 w-8 bg-foreground/10 flex items-center justify-center text-xs font-mono rounded-full">
              {challenge.challenger?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-mono font-bold">{challenge.challenger?.username}</p>
            <EloChip rating={challenge.challenger?.rating ?? 1200} />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {challenge.category?.image && (
            <img 
              src={`${API}${challenge.category.image}`} 
              className="h-4 w-4 object-cover" 
              alt="" 
            />
          )}
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
            {challenge.category?.name}
          </span>
        </div>
      </div>

      {/* Challenge Image */}
      <div className="relative aspect-[16/10] bg-black/90 overflow-hidden">
        {challenge.challengerImage ? (
          <img
            src={`${API}${challenge.challengerImage}`}
            className="w-full h-full object-contain"   
            alt="Challenge"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-xs font-mono">
            No Image
          </div>
        )}
      </div>

      {/* Accept Section */}
      <div className="p-4">
        {!expanded ? (
          <Button
            size="sm"
            onClick={() => setExpanded(true)}
            className="rounded-none text-xs w-full uppercase tracking-wider h-9"
          >
            Accept Challenge
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="group flex h-28 w-full cursor-pointer items-center justify-center border border-dashed border-border/60 hover:border-foreground transition-colors overflow-hidden rounded">
              {preview ? (
                <img src={preview} className="h-full w-full object-cover" alt="" />
              ) : (
                <div className="text-center">
                  <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                    Upload Your Image
                  </span>
                </div>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
            </label>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExpanded(false);
                  setFile(null);
                  setPreview(null);
                }}
                className="rounded-none text-xs flex-1 h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={accept}
                disabled={!file || loading}
                className="rounded-none text-xs flex-1 h-9 uppercase tracking-wider"
              >
                {loading ? "Submitting…" : "Submit Your Side"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}