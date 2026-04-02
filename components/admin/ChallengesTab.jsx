"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section, Table, Tr, Td, StatusBadge, Empty, Modal, StatCard } from "./AdminUI";
import { Trash2, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

export default function ChallengesTab({ onCountChange }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [delModal, setDelModal]     = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/challenges`, { headers: authHeader() });
      const data = await res.json();
      setChallenges(data);
      onCountChange?.(data.length);
    } catch {/* handle */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = challenges.filter(
    (c) =>
      c.challenger?.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.acceptor?.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    await fetch(`${API}/api/admin/challenges/${delModal._id}`, { method: "DELETE", headers: authHeader() });
    setChallenges((c) => c.filter((x) => x._id !== delModal._id));
    onCountChange?.(challenges.length - 1);
    setDelModal(null);
  };

  const statusCounts = {
    open:     challenges.filter((c) => c.status === "open").length,
    active:   challenges.filter((c) => c.status === "active").length,
    closed:   challenges.filter((c) => c.status === "closed").length,
  };

  return (
    <Section
      title="Challenges"
      subtitle="Challenge Management"
      action={
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Search challenges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 rounded-none bg-transparent border-border/60 text-xs w-52"
          />
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Open"   value={statusCounts.open}   />
        <StatCard label="Active" value={statusCounts.active} />
        <StatCard label="Closed" value={statusCounts.closed} />
      </div>

      {filtered.length === 0 && !loading ? (
        <Empty message="No challenges found" />
      ) : (
        <Table cols={["Challenger", "Acceptor", "Category", "Status", "Votes", "Actions"]} loading={loading}>
          {filtered.map((c) => (
            <Tr key={c._id}>
              <Td>
                <div className="flex items-center gap-2">
                  {c.challenger?.profileImage ? (
                    <img src={`${API}${c.challenger.profileImage}`} className="h-5 w-5 object-cover" alt="" />
                  ) : (
                    <div className="h-5 w-5 bg-foreground/10 flex items-center justify-center text-[9px]">
                      {c.challenger?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {c.challenger?.username ?? "—"}
                </div>
              </Td>
              <Td>
                {c.acceptor ? (
                  <div className="flex items-center gap-2">
                    {c.acceptor?.profileImage ? (
                      <img src={`${API}${c.acceptor.profileImage}`} className="h-5 w-5 object-cover" alt="" />
                    ) : (
                      <div className="h-5 w-5 bg-foreground/10 flex items-center justify-center text-[9px]">
                        {c.acceptor?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    {c.acceptor?.username}
                  </div>
                ) : (
                  <span className="text-muted-foreground/40">Awaiting</span>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  {c.category?.image && (
                    <img src={`${API}${c.category.image}`} className="h-4 w-4 object-cover" alt="" />
                  )}
                  {c.category?.name ?? "—"}
                </div>
              </Td>
              <Td><StatusBadge status={c.status} /></Td>
              <Td className="text-muted-foreground">
                {(c.votes?.challenger ?? 0)} / {(c.votes?.acceptor ?? 0)}
              </Td>
              <Td>
                <button
                  onClick={() => setDelModal(c)}
                  className="text-destructive/50 hover:text-destructive transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Delete modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Delete Challenge">
        <p className="text-xs text-muted-foreground mb-5">
          Permanently delete this challenge between{" "}
          <span className="text-foreground font-bold">{delModal?.challenger?.username}</span> and{" "}
          <span className="text-foreground font-bold">{delModal?.acceptor?.username ?? "TBD"}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={() => setDelModal(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" className="rounded-none text-xs" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}