"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Button } from "@/components/ui/button";
import { SectionHeader, PageLoader, Empty } from "./UI";
import { Bell, CheckCheck, Swords, Trophy, Vote, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const TYPE_ICON = {
  challenge_accepted: Swords,
  challenge_completed: Trophy,
  new_vote: Vote,
  warning: AlertTriangle,        
};

function NotifCard({ notif, onRead }) {
  const Icon = TYPE_ICON[notif.type] ?? Bell;

  return (
    <div
      className={cn(
        "flex items-start gap-4 px-5 py-4 border-b border-border/20 last:border-0 transition-colors cursor-pointer",
        !notif.isRead ? "bg-foreground/[0.03]" : "opacity-60"
      )}
      onClick={() => !notif.isRead && onRead(notif._id)}
    >
      <div className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border",
        !notif.isRead ? "border-foreground/30 bg-foreground/5" : "border-border/30"
      )}>
        <Icon 
          size={12} 
          className={notif.isRead ? "text-muted-foreground/30" : ""} 
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-mono leading-snug", 
          !notif.isRead ? "text-foreground" : "text-muted-foreground/50"
        )}>
          {notif.message}
        </p>

        {notif.sender && (
          <p className="text-[9px] font-mono text-muted-foreground/30 mt-0.5">
            from {notif.sender.username}
          </p>
        )}

        <p className="text-[9px] font-mono text-muted-foreground/25 mt-1">
          {notif.createdAt 
            ? new Date(notif.createdAt).toLocaleString() 
            : "—"}
        </p>
      </div>

      {!notif.isRead && (
        <div className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export default function NotificationsTab({ onUnreadChange }) {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/notifications`, { 
        headers: authHeader() 
      });
      const data = await res.json();
      
      const notifs = data.notifications ?? [];
      setNotifications(notifs);
      onUnreadChange?.(data.unreadCount ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // Real-time notifications via Socket.io
  useEffect(() => {
    if (!socket) return;

    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("joinNotifications", userId);
    }

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]); // Add new notification at the top
      onUnreadChange?.((prevCount) => prevCount + 1);
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket, onUnreadChange]);

  const markOne = async (id) => {
    try {
      await fetch(`${API}/api/user/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeader(),
      });

      setNotifications((n) =>
        n.map((x) => (x._id === id ? { ...x, isRead: true } : x))
      );

      onUnreadChange?.(
        notifications.filter((n) => !n.isRead && n._id !== id).length
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAll = async () => {
    try {
      await fetch(`${API}/api/user/notifications/read-all`, {
        method: "PATCH",
        headers: authHeader(),
      });

      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
      onUnreadChange?.(0);
    } catch (err) {
      console.error(err);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-xl">
      <SectionHeader eyebrow="Alerts" title="Notifications" />

      {unread > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono text-muted-foreground/50">
            {unread} unread
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAll}
            className="rounded-none text-[10px] h-7 gap-1.5 uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <CheckCheck size={11} />
            Mark All Read
          </Button>
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <Empty message="No notifications yet" />
      ) : (
        <div className="border border-border/50">
          {notifications.map((n) => (
            <NotifCard 
              key={n._id} 
              notif={n} 
              onRead={markOne} 
            />
          ))}
        </div>
      )}
    </div>
  );
}