"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCheck,
  X,
} from "lucide-react";

interface NotificationItem {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: "scrape_complete" | "alert_triggered" | "heal_event" | "info";
  collectorId?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data || []);
          setUnreadCount(json.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("[Notifications] Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("[Notifications] Failed to mark read:", err);
    }
  };

  const markSingleRead = async (id: number) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("[Notifications] Failed to mark read:", err);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "alert_triggered":
        return "badge badge--critical";
      case "heal_event":
        return "badge badge--warning";
      case "scrape_complete":
        return "badge badge--healed";
      default:
        return "badge badge--info";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative btn btn--ghost p-2 border-2 border-[#111111] shadow-[3px_3px_0_#111111] hover:translate-y-[-1px] transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[var(--card-text)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 badge badge--critical text-[9px] px-1.5 py-0.5 rounded-none shadow-[2px_2px_0_#111111] animate-bounce">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 border-3 border-[#111111] bg-[var(--card-bg)] text-[var(--card-text)] p-4 shadow-[8px_8px_0_var(--shadow-color)] z-50 rounded-sm">
          <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="caption caption--red">SPIDER RADAR</span>
              <span className="font-['Archivo_Black'] text-xs uppercase tracking-wider text-[var(--card-text)]">
                NOTIFICATIONS
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center space-x-1 text-[10px] font-['Archivo_Black'] uppercase text-[var(--sv-cyan)] hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>READ ALL</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--subtext)] hover:text-[var(--card-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-[var(--subtext)]">
                NO NOTIFICATIONS RECORDED YET.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.read && markSingleRead(item.id)}
                  className={`p-3 border-2 border-[#111111] shadow-[3px_3px_0_#111111] transition-all cursor-pointer ${
                    item.read
                      ? "bg-[var(--input-bg)] opacity-70"
                      : "bg-[var(--card-bg)] border-[var(--sv-magenta)] shadow-[4px_4px_0_#111111]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={getTypeBadgeClass(item.type)}>
                      {item.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--subtext)]">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h5 className="font-['Archivo_Black'] text-xs uppercase text-[var(--card-text)] mb-1 leading-tight">
                    {item.title}
                  </h5>
                  <p className="text-xs font-mono text-[var(--subtext)] line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
