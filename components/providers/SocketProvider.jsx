"use client";

import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : "";

    if (!token) {
      console.warn("No token found for socket connection");
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    // Connection events
    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected successfully");

      // Join personal notification room if we have userId
      if (userId) {
        socketInstance.emit("joinNotifications", userId);
        console.log(`Joined notification room for user: ${userId}`);
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

// Custom hook
export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (socket === undefined) {
    console.warn("useSocket must be used within a SocketProvider");
  }
  return socket;
};