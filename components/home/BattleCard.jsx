"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Button } from "@/components/ui/button";
import { StatusChip, EloChip } from "./UI";
import { Flag, ThumbsUp, X, UserMinus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const multipartHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

// ── Vote Bar ───────────────────────────────────────────────────────────────
function VoteBar({ challengerVotes = 0, acceptorVotes = 0 }) {
  const total = challengerVotes + acceptorVotes;
  const pct = total === 0 ? 50 : Math.round((challengerVotes / total) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50 mb-1">
        <span>{challengerVotes} votes</span>
        <span>{acceptorVotes} votes</span>
      </div>
      <div className="h-1 w-full bg-foreground/10 overflow-hidden">
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

// ── Shared Report Modal ────────────────────────────────────────────────────
function ReportModal({ open, onClose, onSubmit, submitting }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-border/60 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">
            Report Challenge
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
          >
            [ESC]
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-1.5 block">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-transparent border border-border/60 px-3 py-2.5 text-xs font-mono focus:border-foreground transition-colors outline-none appearance-none"
            >
              <option value="">Select a reason…</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="copyright_violation">Copyright Violation</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-1.5 block">
              Additional Details{" "}
              <span className="text-muted-foreground/25">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue…"
              className="w-full bg-transparent border border-border/60 px-3 py-2.5 text-xs font-mono resize-none focus:border-foreground transition-colors outline-none placeholder:text-muted-foreground/25"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none text-xs flex-1 h-9"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onSubmit(reason, description)}
            disabled={!reason || submitting}
            className="rounded-none text-xs flex-1 h-9 uppercase tracking-wider"
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, description, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-border/60 bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
          >
            [ESC]
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none text-xs flex-1 h-9"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-none text-xs flex-1 h-9 uppercase tracking-wider"
          >
            {loading ? "Blocking…" : "Yes, Block User"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Battle Card ────────────────────────────────────────────────────────────
export function BattleCard({ challenge: initialChallenge, currentUserId, onVoted }) {
  const socket = useSocket();
  const [localChallenge, setLocalChallenge] = useState(initialChallenge);
  const [loading, setLoading] = useState(null);
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // New states for block confirmation
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [blocking, setBlocking] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const isParticipant =
    localChallenge.challenger?._id === currentUserId ||
    localChallenge.acceptor?._id === currentUserId;

  // Socket live updates
  useEffect(() => {
    if (!socket || !localChallenge._id || localChallenge.status !== "ongoing") return;

    socket.emit("joinChallenge", localChallenge._id);

    const onVoteUpdated = (data) => {
      if (data.challengeId === localChallenge._id && data.challenge) {
        setLocalChallenge((prev) => ({ ...prev, ...data.challenge }));
      }
    };

    const onCompleted = (data) => {
      if (data.challengeId === localChallenge._id) {
        setLocalChallenge((prev) => ({ ...prev, status: "completed", winner: data.winner }));
      }
    };

    socket.on("voteUpdated", onVoteUpdated);
    socket.on("challengeCompleted", onCompleted);

    return () => {
      socket.emit("leaveChallenge", localChallenge._id);
      socket.off("voteUpdated", onVoteUpdated);
      socket.off("challengeCompleted", onCompleted);
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
      if (res.ok) onVoted?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const submitReport = async (reason, description) => {
    setSubmittingReport(true);
    try {
      const res = await fetch(`${API}/api/user/challenges/${localChallenge._id}/report`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ reason, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReported(true);
      setShowReport(false);
    } catch (err) {
      alert(err.message || "Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Updated block logic with modal
  const openBlockModal = (userId, username) => {
    setUserToBlock({ id: userId, username });
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!userToBlock) return;

    setBlocking(true);
    try {
      await fetch(`${API}/api/user/block`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ userId: userToBlock.id }),
      });
      setBlocked(true);
      setShowBlockModal(false);
    } catch (err) {
      alert("Failed to block user");
    } finally {
      setBlocking(false);
      setUserToBlock(null);
    }
  };

  const challengerVotes = localChallenge.votes?.challenger ?? 0;
  const acceptorVotes = localChallenge.votes?.acceptor ?? 0;
  const totalVotes = challengerVotes + acceptorVotes;

  return (
    <>
      <div className="border border-border/50 bg-card/30 hover:border-border/80 transition-colors">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
          <div className="flex items-center gap-1.5">
            {localChallenge.category?.image && (
              <img src={`${API}${localChallenge.category.image}`} className="h-3.5 w-3.5 object-cover" alt="" />
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

        {/* VS grid */}
        <div className="grid grid-cols-2">
          {/* Challenger */}
          <div className="border-r border-border/30 p-3 flex flex-col items-center gap-2">
            <div className="relative w-full aspect-[4/3] bg-black/90 overflow-hidden">
              {localChallenge.challengerImage ? (
                <img src={`${API}${localChallenge.challengerImage}`} className="w-full h-full object-contain p-1" alt="" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[9px] text-muted-foreground/20 font-mono">NO IMAGE</div>
              )}
            </div>
            <p className="text-xs font-mono font-bold truncate max-w-full text-center">
              {localChallenge.challenger?.username ?? "?"}
            </p>
            <EloChip rating={localChallenge.challenger?.rating ?? 1200} />

            {!isParticipant && !blocked && localChallenge.status === "ongoing" && localChallenge.challenger && (
              <button
                onClick={() => openBlockModal(localChallenge.challenger._id, localChallenge.challenger.username)}
                className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/35 hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                <UserMinus size={9} />
                Block
              </button>
            )}

            {!isParticipant && localChallenge.status === "ongoing" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => vote("challenger")}
                disabled={!!loading}
                className="rounded-none text-[10px] h-8 w-full uppercase tracking-wider gap-1"
              >
                <ThumbsUp size={10} />
                {loading === "challenger" ? "…" : "Vote"}
              </Button>
            )}
          </div>

          {/* Acceptor */}
          <div className="p-3 flex flex-col items-center gap-2">
            <div className="relative w-full aspect-[4/3] bg-black/90 overflow-hidden">
              {localChallenge.acceptorImage ? (
                <img src={`${API}${localChallenge.acceptorImage}`} className="w-full h-full object-contain p-1" alt="" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/20 font-mono">AWAITING</div>
              )}
            </div>
            <p className="text-xs font-mono font-bold truncate max-w-full text-center">
              {localChallenge.acceptor?.username ?? "—"}
            </p>
            {localChallenge.acceptor && (
              <EloChip rating={localChallenge.acceptor.rating ?? 1200} />
            )}

            {!isParticipant && !blocked && localChallenge.status === "ongoing" && localChallenge.acceptor && (
              <button
                onClick={() => openBlockModal(localChallenge.acceptor._id, localChallenge.acceptor.username)}
                className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/35 hover:text-red-400 transition-colors uppercase tracking-wider"
              >
                <UserMinus size={9} />
                Block
              </button>
            )}

            {!isParticipant && localChallenge.status === "ongoing" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => vote("acceptor")}
                disabled={!!loading}
                className="rounded-none text-[10px] h-8 w-full uppercase tracking-wider gap-1"
              >
                <ThumbsUp size={10} />
                {loading === "acceptor" ? "…" : "Vote"}
              </Button>
            )}
          </div>
        </div>

        {/* Vote bar */}
        <div className="px-4 pb-4">
          <VoteBar challengerVotes={challengerVotes} acceptorVotes={acceptorVotes} />
        </div>

        {/* Footer: report */}
        {!isParticipant && localChallenge.status === "ongoing" && (
          <div className="flex justify-end border-t border-border/20 px-4 py-2">
            {reported ? (
              <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">
                Reported ✓
              </span>
            ) : (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/35 hover:text-muted-foreground transition-colors uppercase tracking-wider"
              >
                <Flag size={9} />
                Report
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={submitReport}
        submitting={submittingReport}
      />

      {/* Block Confirmation Modal */}
      <ConfirmModal
        open={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setUserToBlock(null);
        }}
        onConfirm={confirmBlock}
        title="Block User"
        description={
          userToBlock
            ? `Block ${userToBlock.username}? You won't see their challenges anymore.`
            : ""
        }
        loading={blocking}
      />
    </>
  );
}

// ── Quest Card (unchanged) ─────────────────────────────────────────────────
export function QuestCard({ challenge, onAccepted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reported, setReported] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (reason, description) => {
    setSubmittingReport(true);
    try {
      const res = await fetch(`${API}/api/user/challenges/${challenge._id}/report`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ reason, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReported(true);
      setShowReport(false);
    } catch (err) {
      alert(err.message || "Failed to submit report");
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <>
      <div className="border border-border/50 bg-card/30 hover:border-border/80 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            {challenge.challenger?.profileImage ? (
              <img src={`${API}${challenge.challenger.profileImage}`} className="h-7 w-7 object-cover" alt="" />
            ) : (
              <div className="h-7 w-7 bg-foreground/10 flex items-center justify-center text-[10px] font-mono">
                {challenge.challenger?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-mono font-bold leading-none">{challenge.challenger?.username}</p>
              <div className="mt-1">
                <EloChip rating={challenge.challenger?.rating ?? 1200} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {challenge.category?.image && (
              <img src={`${API}${challenge.category.image}`} className="h-3.5 w-3.5 object-cover" alt="" />
            )}
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
              {challenge.category?.name}
            </span>
          </div>
        </div>

        {/* Challenge image */}
        <div className="relative w-full aspect-[16/10] bg-black/90 overflow-hidden">
          {challenge.challengerImage ? (
            <img src={`${API}${challenge.challengerImage}`} className="w-full h-full object-contain" alt="" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[9px] text-muted-foreground/20 font-mono">
              NO IMAGE
            </div>
          )}
        </div>

        {/* Accept + report */}
        <div className="p-4 flex flex-col gap-3">
          {!expanded ? (
            <Button
              size="sm"
              onClick={() => setExpanded(true)}
              className="rounded-none text-xs w-full uppercase tracking-wider h-9"
            >
              Accept Challenge
            </Button>
          ) : (
            <>
              <label className="group flex h-24 w-full cursor-pointer items-center justify-center border border-dashed border-border/60 hover:border-foreground transition-colors overflow-hidden">
                {preview ? (
                  <img src={preview} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                    <Upload size={14} />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Upload Your Image</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setExpanded(false); setFile(null); setPreview(null); }}
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
                  {loading ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </>
          )}

          {/* Report row */}
          <div className="flex justify-end border-t border-border/20 pt-2">
            {reported ? (
              <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">
                Reported ✓
              </span>
            ) : (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/35 hover:text-muted-foreground transition-colors uppercase tracking-wider"
              >
                <Flag size={9} />
                Report
              </button>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={submitReport}
        submitting={submittingReport}
      />
    </>
  );
}