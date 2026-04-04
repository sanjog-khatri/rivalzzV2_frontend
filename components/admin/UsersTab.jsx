"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Section, Table, Tr, Td, StatusBadge, Empty, Modal, StatCard } from "./AdminUI";
import { Trash2, AlertTriangle, Ban, Undo, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function authHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function UsersTab({ onCountChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [warnModal, setWarnModal] = useState(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState(""); // in days (empty = permanent)
  const [delModal, setDelModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: authHeader() });
      const data = await res.json();
      setUsers(data);
      onCountChange?.(data.length);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ====================== ACTIONS ======================

  const handleWarn = async () => {
    if (!warnModal) return;

    await fetch(`${API}/api/admin/users/${warnModal._id}/warn`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ message: warnMsg }),
    });

    setWarnModal(null);
    setWarnMsg("");
    load(); // refresh list
  };

  const handleBan = async () => {
    if (!banModal) return;

    await fetch(`${API}/api/admin/users/${banModal._id}/ban`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({
        reason: banReason.trim() || "No reason provided",
        duration: banDuration ? parseInt(banDuration) : null, // null = permanent
      }),
    });

    setBanModal(null);
    setBanReason("");
    setBanDuration("");
    load(); // refresh to show banned status
  };

  const handleUnban = async (userId) => {
    await fetch(`${API}/api/admin/users/${userId}/unban`, {
      method: "PATCH",
      headers: authHeader(),
    });
    load();
  };

  const handleDelete = async () => {
    if (!delModal) return;

    await fetch(`${API}/api/admin/users/${delModal._id}`, {
      method: "DELETE",
      headers: authHeader(),
    });

    setUsers((prev) => prev.filter((x) => x._id !== delModal._id));
    onCountChange?.(users.length - 1);
    setDelModal(null);
  };

  return (
    <Section
      title="Users"
      subtitle="User Management"
      action={
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 rounded-none bg-transparent border-border/60 text-xs w-52"
          />
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Banned" value={users.filter((u) => u.banned).length} />
        <StatCard label="Admins" value={users.filter((u) => u.role === "admin").length} />
      </div>

      {filtered.length === 0 && !loading ? (
        <Empty message="No users found" />
      ) : (
        <Table
          cols={["User", "Email", "Role", "Rating", "Faction", "Status", "Warnings", "Actions"]}
          loading={loading}
        >
          {filtered.map((u) => (
            <Tr key={u._id}>
              <Td>
                <div className="flex items-center gap-2">
                  {u.profileImage ? (
                    <img
                      src={`${API}${u.profileImage}`}
                      className="h-6 w-6 rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="h-6 w-6 bg-foreground/10 flex items-center justify-center text-[9px] rounded-full">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium">{u.username}</span>
                </div>
              </Td>
              <Td className="text-muted-foreground">{u.email}</Td>
              <Td>
                <StatusBadge status={u.role} />
              </Td>
              <Td>{u.rating ?? 1200}</Td>
              <Td className="text-muted-foreground">{u.faction?.name ?? "—"}</Td>

              <Td>
                <StatusBadge 
                  status={u.banned ? "banned" : "active"} 
                  label={u.banned ? "Banned" : "Active"}
                />
              </Td>

              <Td>{u.warnings?.length ?? 0}</Td>

              <Td>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWarnModal(u)}
                    className="text-yellow-500/70 hover:text-yellow-500 transition-colors"
                    title="Warn User"
                  >
                    <AlertTriangle size={14} />
                  </button>

                  {u.banned ? (
                    <button
                      onClick={() => handleUnban(u._id)}
                      className="text-green-500/70 hover:text-green-500 transition-colors"
                      title="Unban User"
                    >
                      <Undo size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setBanModal(u)}
                      className="text-red-500/70 hover:text-red-500 transition-colors"
                      title="Ban User"
                    >
                      <Ban size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => setDelModal(u)}
                    className="text-destructive/50 hover:text-destructive transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Warn Modal */}
      <Modal open={!!warnModal} onClose={() => setWarnModal(null)} title={`Warn · ${warnModal?.username}`}>
        <Textarea
          placeholder="Enter warning message..."
          value={warnMsg}
          onChange={(e) => setWarnMsg(e.target.value)}
          className="rounded-none bg-transparent border-border/60 text-xs min-h-24 mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setWarnModal(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleWarn} disabled={!warnMsg.trim()}>
            Send Warning
          </Button>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal open={!!banModal} onClose={() => setBanModal(null)} title={`Ban · ${banModal?.username}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Ban Reason</label>
            <Textarea
              placeholder="Reason for banning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="rounded-none bg-transparent border-border/60 text-xs min-h-20"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Duration (in days) — Leave empty for permanent ban
            </label>
            <Input
              type="number"
              placeholder="e.g. 7 (for 7 days)"
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              className="rounded-none bg-transparent border-border/60 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setBanModal(null)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBan}
          >
            {banDuration ? "Temporarily Ban" : "Permanently Ban"}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Confirm Delete">
        <p className="text-xs text-muted-foreground mb-5">
          Permanently delete <span className="text-foreground font-bold">{delModal?.username}</span>? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDelModal(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete User
          </Button>
        </div>
      </Modal>
    </Section>
  );
}