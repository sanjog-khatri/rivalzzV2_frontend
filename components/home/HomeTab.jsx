"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { SectionHeader, PageLoader, Empty } from "./UI";
import { BattleCard } from "./BattleCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

export default function HomeTab({ currentUserId }) {
  const socket = useSocket();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API}/api/user/challenges/ongoing`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // Real-time updates using Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = (data) => {
      setChallenges((prev) =>
        prev.map((challenge) =>
          challenge._id === data.challengeId
            ? {
                ...challenge,
                ...data.challenge,
                votes: data.challenge.votes || challenge.votes || { challenger: 0, acceptor: 0 },
              }
            : challenge
        )
      );
    };

    const handleChallengeCompleted = (data) => {
      setChallenges((prev) =>
        prev.filter((challenge) => challenge._id !== data.challengeId)
      );
    };

    socket.on("voteUpdated", handleVoteUpdate);
    socket.on("challengeCompleted", handleChallengeCompleted);

    return () => {
      socket.off("voteUpdated", handleVoteUpdate);
      socket.off("challengeCompleted", handleChallengeCompleted);
    };
  }, [socket]);

  const handleRefresh = () => {
    load(true);   // This will reshuffle because backend returns random order
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeader eyebrow="Arena" title="Ongoing Battles" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 text-xs font-mono uppercase tracking-widest rounded-none h-8"
        >
          <RefreshCw 
            size={14} 
            className={refreshing ? "animate-spin" : ""} 
          />
          SHUFFLE
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : challenges.length === 0 ? (
        <Empty message="No ongoing battles" sub="Check back soon or create one" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <BattleCard
              key={c._id}
              challenge={c}
              currentUserId={currentUserId}
              onVoted={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}