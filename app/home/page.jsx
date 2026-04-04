"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserSidebar      from "@/components/home/UserSidebar";
import HomeTab          from "@/components/home/HomeTab";
import CreateTab        from "@/components/home/CreateTab";
import QuestsTab        from "@/components/home/QuestsTab";
import MyBattlesTab     from "@/components/home/MyBattlesTab";
import LeaderboardTab   from "@/components/home/LeaderboardTab";
import NotificationsTab from "@/components/home/NotificationsTab";
import ProfileModal     from "@/components/home/ProfileModal";
import { GridOverlay }  from "@/components/home/UI";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab]     = useState("home");
  const [user, setUser]               = useState(null);
  const [unread, setUnread]           = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Load current user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }

    fetch(`${API}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { router.push("/auth"); return null; }
        return r.json();
      })
      .then((data) => { if (data) setUser(data); })
      .catch(() => {});
  }, []);

  // Load unread count
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/user/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setUnread(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  const TAB_MAP = {
    home:          <HomeTab currentUserId={user?._id} />,
    create:        <CreateTab />,
    quests:        <QuestsTab />,
    "my-battles":  <MyBattlesTab currentUserId={user?._id} />,
    leaderboard:   <LeaderboardTab currentUserId={user?._id} />,
    notifications: <NotificationsTab onUnreadChange={setUnread} />,
  };

  return (
    <>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tab-fade { animation: fade-in-up 0.22s ease both; }
      `}</style>

      <div className="relative h-screen bg-background flex overflow-hidden">
        <GridOverlay />

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 transition-transform duration-200
            md:relative md:translate-x-0
            ${mobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <UserSidebar
            activeTab={activeTab}
            setActiveTab={(t) => { setActiveTab(t); setMobileSidebar(false); }}
            user={user}
            unreadCount={unread}
            onProfileClick={() => { setProfileOpen(true); setMobileSidebar(false); }}
            onLogout={logout}
          />
        </div>

        {/* Mobile overlay */}
        {mobileSidebar && (
          <div
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebar(false)}
          />
        )}

        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b border-border/40 bg-background/90 backdrop-blur-md px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileSidebar(true)}
            className="flex flex-col gap-1 p-1"
          >
            <span className="h-px w-5 bg-foreground" />
            <span className="h-px w-5 bg-foreground" />
            <span className="h-px w-3 bg-foreground" />
          </button>
          <span className="text-xs font-mono uppercase tracking-[0.2em]">Rivalz Battle</span>
          <button
            onClick={() => setProfileOpen(true)}
            className="h-7 w-7 overflow-hidden"
          >
            {user?.profileImage ? (
              <img src={`${API}${user.profileImage}`} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="h-full w-full bg-foreground/10 flex items-center justify-center text-[10px] font-mono">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </button>
        </div>

        {/* Main content - Scrollable */}
        <main className="relative z-10 flex-1 overflow-auto pt-14 md:pt-0">
          <div className="p-6 md:p-8 max-w-5xl">
            {/* Breadcrumb */}
            <div className="mb-7 flex items-center gap-2 text-[9px] font-mono text-muted-foreground/30 uppercase tracking-widest">
              <span>arena</span>
              <span>/</span>
              <span className="text-muted-foreground/60">{activeTab.replace("-", " ")}</span>
            </div>

            {/* Tab Content */}
            <div key={activeTab} className="tab-fade">
              {TAB_MAP[activeTab]}
            </div>
          </div>
        </main>

        {/* Profile modal */}
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
        />

        {/* Corner text */}
        <span className="pointer-events-none fixed bottom-5 right-5 text-[9px] text-muted-foreground/15 tracking-widest font-mono hidden md:block">
          {"{USER_MODULE}"}
        </span>
      </div>
    </>
  );
}