import { useEffect, useState } from "react";

export type NotifType =
  | "approaching"
  | "your_turn"
  | "missed"
  | "excluded"
  | "left"
  | "joined";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

let _notifications: AppNotification[] = [];
let _listeners: Array<(n: AppNotification[]) => void> = [];

function notify(listeners: typeof _listeners, data: AppNotification[]) {
  listeners.forEach((fn) => fn([...data]));
}

export const NotificationCenter = {
  push(type: NotifType, title: string, message: string) {
    const notif: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
    };
    _notifications = [notif, ..._notifications].slice(0, 50);
    notify(_listeners, _notifications);
  },

  markRead(id: string) {
    _notifications = _notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    notify(_listeners, _notifications);
  },

  markAllRead() {
    _notifications = _notifications.map((n) => ({ ...n, read: true }));
    notify(_listeners, _notifications);
  },

  clear() {
    _notifications = [];
    notify(_listeners, _notifications);
  },

  subscribe(fn: (n: AppNotification[]) => void) {
    _listeners.push(fn);
    fn([..._notifications]);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  },

  get unreadCount() {
    return _notifications.filter((n) => !n.read).length;
  },
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    return NotificationCenter.subscribe(setNotifications);
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markRead: NotificationCenter.markRead,
    markAllRead: NotificationCenter.markAllRead,
    clear: NotificationCenter.clear,
  };
}
