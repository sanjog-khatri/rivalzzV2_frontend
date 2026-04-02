"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Section, Table, Tr, Td, StatusBadge, Empty, Modal, StatCard } from "./AdminUI";
import { Trash2, AlertTriangle, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function authHeader() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function UsersTab({ onCountChange }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [warnModal, setWarnModal] = useState(null); // user object
  const [warnMsg, setWarnMsg]   = useState("");
  const [delModal, setDelModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: authHeader() });
      const data = await res.json();
      setUsers(data);
      onCountChange?.(data.length);
    } catch {/* handle */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleWarn = async () => {
    await fetch(`${API}/api/admin/users/${warnModal._id}/warn`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ message: warnMsg }),
    });
    setWarnModal(null);
    setWarnMsg("");
  };

  const handleDelete = async () => {
    await fetch(`${API}/api/admin/users/${delModal._id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    setUsers((u) => u.filter((x) => x._id !== delModal._id));
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
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Users"  value={users.length} />
        <StatCard label="Banned"       value={users.filter((u) => u.banned).length} />
        <StatCard label="Admins"       value={users.filter((u) => u.role === "admin").length} />
      </div>

      {filtered.length === 0 && !loading ? (
        <Empty message="No users found" />
      ) : (
        <Table cols={["User", "Email", "Role", "Rating", "Faction", "Status", "Warnings", "Actions"]} loading={loading}>
          {filtered.map((u) => (
            <Tr key={u._id}>
              <Td>
                <div className="flex items-center gap-2">
                  {u.profileImage ? (
                    <img src={`${API}${u.profileImage}`} className="h-6 w-6 object-cover" alt="" />
                  ) : (
                    <div className="h-6 w-6 bg-foreground/10 flex items-center justify-center text-[9px]">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="font-mono">{u.username}</span>
                </div>
              </Td>
              <Td className="text-muted-foreground">{u.email}</Td>
              <Td>
                <StatusBadge status={u.role} />
              </Td>
              <Td>{u.rating ?? 1200}</Td>
              <Td className="text-muted-foreground">{u.faction?.name ?? "—"}</Td>
              <Td>
                <StatusBadge status={u.banned ? "banned" : "active"} />
              </Td>
              <Td>{u.warnings?.length ?? 0}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWarnModal(u)}
                    className="text-yellow-500/70 hover:text-yellow-500 transition-colors"
                    title="Warn"
                  >
                    <AlertTriangle size={13} />
                  </button>
                  <button
                    onClick={() => setDelModal(u)}
                    className="text-destructive/50 hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Warn modal */}
      <Modal open={!!warnModal} onClose={() => setWarnModal(null)} title={`Warn · ${warnModal?.username}`}>
        <Textarea
          placeholder="Warning message…"
          value={warnMsg}
          onChange={(e) => setWarnMsg(e.target.value)}
          className="rounded-none bg-transparent border-border/60 text-xs min-h-24 mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={() => setWarnModal(null)}>
            Cancel
          </Button>
          <Button size="sm" className="rounded-none text-xs" onClick={handleWarn} disabled={!warnMsg.trim()}>
            Send Warning
          </Button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Confirm Delete">
        <p className="text-xs text-muted-foreground mb-5">
          Permanently delete <span className="text-foreground font-bold">{delModal?.username}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={() => setDelModal(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" className="rounded-none text-xs" onClick={handleDelete}>
            Delete User
          </Button>
        </div>
      </Modal>
    </Section>
  );
}