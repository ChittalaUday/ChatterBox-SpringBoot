"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import FriendsService from "@/services/friends.service";
import WebSocketService from "@/services/websocket.service";
import { Notification } from "@/services/chat.types";

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  refreshCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await FriendsService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load unread notifications count", err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const notifs = await FriendsService.getUnreadNotifications();
      setNotifications(notifs);
      // Update count from server instead of local count
      await refreshCount();
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, [refreshCount]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await FriendsService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Refresh count from server
      await refreshCount();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      throw err;
    }
  }, [refreshCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await FriendsService.markAllNotificationsAsRead();
      setNotifications([]);
      await refreshCount();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
      throw err;
    }
  }, [refreshCount]);

  // Set up WebSocket listener for real-time notifications
  useEffect(() => {
    // Connect WebSocket if not already connected
    if (!WebSocketService.isConnected()) {
      WebSocketService.connect();
    }

    // Subscribe to notification updates
    const handleNotificationUpdate = (data: any) => {
      if (data && data.type === "NEW_NOTIFICATION") {
        // Refresh notifications when new one arrives
        refreshCount();
        // Optionally refresh full list if needed
        // refreshNotifications();
      }
    };

    // Add listener for notification updates
    WebSocketService.addMessageListener((message: any) => {
      // Check if this is a notification update
      if (message && message.type === "NEW_NOTIFICATION") {
        handleNotificationUpdate(message);
      }
    });

    // Initial load
    refreshCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(refreshCount, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [refreshCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        refreshNotifications,
        refreshCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

