"use client";

import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CategoriesTab from "@/components/admin/CategoriesTab";
import ChallengesTab from "@/components/admin/ChallengesTab";
import FactionsTab from "@/components/admin/FactionsTab";
import ReportsTab from "@/components/admin/ReportsTab";
import UsersTab from "@/components/admin/UsersTab";
import { useState } from "react";


// ── Scanlines / grid (same as auth page for consistency) ──
function GridOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [counts, setCounts]       = useState({});
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const setCount = (tab) => (n) =>
    setCounts((c) => ({ ...c, [tab]: n }));

  const TAB_MAP = {
    users:      <UsersTab      onCountChange={setCount("users")}      />,
    factions:   <FactionsTab   onCountChange={setCount("factions")}   />,
    categories: <CategoriesTab onCountChange={setCount("categories")} />,
    challenges: <ChallengesTab onCountChange={setCount("challenges")} />,
    reports:    <ReportsTab    onCountChange={setCount("reports")}    />,
  };

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tab-fade { animation: fade-in 0.25s ease both; }
      `}</style>

      <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
        <GridOverlay />

        {/* Navbar */}
        <AdminNavbar activeTab={activeTab} onMenuToggle={() => setMobileSidebar((v) => !v)} />

        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* Sidebar — hidden on mobile unless toggled */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 pt-[53px] transition-transform duration-200
              md:relative md:translate-x-0 md:pt-0
              ${mobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={(t) => { setActiveTab(t); setMobileSidebar(false); }}
              counts={counts}
            />
          </div>

          {/* Mobile overlay */}
          {mobileSidebar && (
            <div
              className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebar(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">
              <span>admin</span>
              <span>/</span>
              <span className="text-muted-foreground/70">{activeTab}</span>
            </div>

            {/* Tab content */}
            <div key={activeTab} className="tab-fade">
              {TAB_MAP[activeTab]}
            </div>
          </main>
        </div>

        {/* Corner tag */}
        <span className="pointer-events-none fixed bottom-5 right-5 text-[9px] text-muted-foreground/15 tracking-widest font-mono hidden sm:block">
          {"{ADMIN_MODULE}"}
        </span>
      </div>
    </>
  );
}