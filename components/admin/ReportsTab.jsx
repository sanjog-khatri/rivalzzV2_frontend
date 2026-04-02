"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Section, Table, Tr, Td, StatusBadge, Empty, StatCard } from "./AdminUI";
import { CheckCircle2, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

export default function ReportsTab({ onCountChange }) {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/reports`, { headers: authHeader() });
      const data = await res.json();
      setReports(data);
      const pending = data.filter((r) => r.status === "pending").length;
      onCountChange?.(pending);
    } catch {/* handle */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (id, status) => {
    await fetch(`${API}/api/admin/reports/${id}/review`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ status }),
    });
    setReports((r) =>
      r.map((x) => (x._id === id ? { ...x, status } : x))
    );
  };

  const pending  = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const rejected = reports.filter((r) => r.status === "rejected").length;

  return (
    <Section title="Reports" subtitle="Reported Challenges">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pending"  value={pending}  sub="Needs review" />
        <StatCard label="Resolved" value={resolved} />
        <StatCard label="Rejected" value={rejected} />
      </div>

      {reports.length === 0 && !loading ? (
        <Empty message="No reports found" />
      ) : (
        <Table cols={["Reporter", "Challenge", "Reason", "Status", "Date", "Actions"]} loading={loading}>
          {reports.map((r) => (
            <Tr key={r._id}>
              <Td>{r.reporter?.username ?? "—"}</Td>
              <Td className="text-muted-foreground max-w-[160px] truncate">
                {r.challenge?._id ? `#${r.challenge._id.slice(-6)}` : "—"}
              </Td>
              <Td className="max-w-xs">
                <span className="text-muted-foreground text-[11px] line-clamp-2">
                  {r.reason ?? "No reason provided"}
                </span>
              </Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-muted-foreground whitespace-nowrap">
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
              </Td>
              <Td>
                {r.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReview(r._id, "resolved")}
                      className="text-green-500/60 hover:text-green-500 transition-colors"
                      title="Resolve"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                    <button
                      onClick={() => handleReview(r._id, "rejected")}
                      className="text-destructive/50 hover:text-destructive transition-colors"
                      title="Reject"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
                {r.status !== "pending" && (
                  <span className="text-muted-foreground/30 text-[10px] uppercase tracking-wider">Done</span>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </Section>
  );
}