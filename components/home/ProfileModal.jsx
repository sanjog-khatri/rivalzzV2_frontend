"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, EloChip } from "./UI";
import { Shield, X, UserMinus, Upload, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",   
});

const multipartHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

export default function ProfileModal({ open, onClose, user: initialUser, onProfileUpdate }) {
  const [user, setUser] = useState(initialUser);
  const [factions, setFactions] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);

  useEffect(() => {
    if (!open) return;

    setUser(initialUser);
    setEditUsername(initialUser?.username || "");
    setEditImage(null);
    setEditPreview(null);
    setIsEditing(false);

    // Load factions and blocked users
    fetch(`${API}/api/user/factions`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setFactions(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API}/api/user/blocked`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => setBlocked(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [open, initialUser]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImage(file);
    setEditPreview(URL.createObjectURL(file));
  };

  // Save profile
  const saveProfile = async () => {
    setSaving(true);
    const formData = new FormData();

    if (editUsername && editUsername.trim() !== user.username) {
      formData.append("username", editUsername.trim());
    }
    if (editImage) {
      formData.append("profileImage", editImage);
    }

    try {
      const res = await fetch(`${API}/api/user/profile`, {
        method: "PUT",
        headers: multipartHeader(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      const updatedUser = {
        ...user,
        username: data.user?.username || user.username,
        profileImage: data.user?.profileImage || user.profileImage,
      };
      setUser(updatedUser);
      onProfileUpdate?.(updatedUser);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const joinFaction = async (id) => {
    setLoading(true);
    try {
      await fetch(`${API}/api/user/factions/${id}/join`, {
        method: "POST",
        headers: authHeader(),
      });
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to join faction");
    } finally {
      setLoading(false);
    }
  };

  const leaveFaction = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/api/user/factions/leave`, {
        method: "POST",
        headers: authHeader(),
      });
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to leave faction");
    } finally {
      setLoading(false);
    }
  };

  // FIXED UNBLOCK FUNCTION
  const unblock = async (userId) => {
    if (!userId) return;

    try {
      const res = await fetch(`${API}/api/user/unblock`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to unblock user");
      }

      // Remove from local list
      setBlocked((prev) => prev.filter((item) => item.blocked?._id !== userId));
      
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to unblock user");
    }
  };

  const TABS = ["overview", "faction", "blocked"];

  return (
    <Modal open={open} onClose={onClose} title="Profile">
      {/* Avatar + Info Header */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-border/30">
        {editPreview || user?.profileImage ? (
          <img
            src={editPreview || `${API}${user.profileImage}`}
            className="h-14 w-14 object-cover rounded-full border border-border/50"
            alt=""
          />
        ) : (
          <div className="h-14 w-14 bg-foreground/10 flex items-center justify-center text-lg font-mono rounded-full">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className="font-mono text-sm bg-transparent border-border/60"
              placeholder="Username"
            />
          ) : (
            <p className="font-mono font-bold text-sm">{user?.username}</p>
          )}

          <p className="text-[10px] text-muted-foreground font-mono">{user?.email}</p>

          <div className="flex items-center gap-2 mt-1.5">
            <EloChip rating={user?.rating ?? 1200} />
            {user?.faction?.name && (
              <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/60 px-1.5 py-0.5 flex items-center gap-1">
                <Shield size={9} />
                {user.faction.name}
              </span>
            )}
          </div>
        </div>

        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs h-7 px-3"
          >
            Edit
          </Button>
        )}
      </div>

      {/* Edit Controls */}
      {isEditing && (
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            onClick={saveProfile}
            disabled={saving}
            className="rounded-none text-xs flex-1"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setEditUsername(user?.username || "");
              setEditImage(null);
              setEditPreview(null);
            }}
            className="rounded-none text-xs flex-1"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Image Upload */}
      {isEditing && (
        <div className="mb-4">
          <Label className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1 block">
            Profile Image
          </Label>
          <label className="flex h-20 w-full cursor-pointer items-center justify-center border border-dashed border-border/60 hover:border-foreground transition-colors overflow-hidden rounded-none">
            {editPreview ? (
              <img src={editPreview} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="text-center">
                <Upload size={16} className="mx-auto mb-1 text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground/60">Click to change image</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
          </label>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "text-[9px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors",
              tab === t
                ? "border-foreground bg-foreground text-background"
                : "border-border/60 text-muted-foreground hover:border-foreground/30"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "ELO Rating", value: user?.rating ?? 1200 },
            { label: "Warnings", value: user?.warnings?.length ?? 0 },
            { label: "Faction", value: user?.faction?.name ?? "None" },
            { label: "Role", value: user?.role ?? "user" },
          ].map(({ label, value }) => (
            <div key={label} className="border border-border/60 bg-card/30 p-3 rounded-lg">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-mono mb-1">{label}</p>
              <p className="text-sm font-mono font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "faction" && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {user?.faction && (
            <button
              onClick={leaveFaction}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-destructive/70 hover:text-destructive border border-destructive/20 hover:border-destructive/60 transition-colors rounded-lg"
            >
              <X size={10} /> Leave current faction
            </button>
          )}

          {factions.map((f) => (
            <button
              key={f._id}
              onClick={() => joinFaction(f._id)}
              disabled={loading || user?.faction?._id === f._id}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 border transition-colors text-left rounded-lg",
                user?.faction?._id === f._id
                  ? "border-foreground/30 bg-foreground/5 text-muted-foreground cursor-default"
                  : "border-border/60 hover:border-foreground/60 hover:bg-foreground/5"
              )}
            >
              <div>
                <p className="text-xs font-mono font-bold">{f.name}</p>
                <p className="text-[9px] text-muted-foreground/60 font-mono">{f.description?.slice(0, 50) || "—"}</p>
              </div>
              <EloChip rating={f.totalRating} />
            </button>
          ))}
        </div>
      )}

      {tab === "blocked" && (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {blocked.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/30 font-mono py-4 text-center uppercase tracking-widest">
              No blocked users
            </p>
          ) : (
            blocked.map((b) => (
              <div key={b._id} className="flex items-center gap-3 border border-border/30 px-3 py-2 rounded-lg">
                {b.blocked?.profileImage ? (
                  <img 
                    src={`${API}${b.blocked.profileImage}`} 
                    className="h-6 w-6 object-cover rounded-full" 
                    alt="" 
                  />
                ) : (
                  <div className="h-6 w-6 bg-foreground/10 flex items-center justify-center text-[9px] font-mono rounded-full">
                    {b.blocked?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-mono flex-1">{b.blocked?.username}</span>
                <button
                  onClick={() => unblock(b.blocked?._id)}
                  className="text-[9px] font-mono text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 transition-colors"
                >
                  <UserMinus size={10} /> Unblock
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}