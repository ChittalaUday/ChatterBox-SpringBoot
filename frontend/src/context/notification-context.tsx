"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import FriendsService from "@/services/friends.service";
import WebSocketService from "@/services/websocket.service";
import { Notification } from "@/services/chat.types";
import { useAuth } from "@/context/auth-context";

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  allNotifications: Notification[];
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  refreshAllNotifications: () => Promise<void>;
  refreshCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    // Don't fetch if auth is initializing or user is not authenticated
    if (isInitializing || !isAuthenticated) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token || token.trim() === '' || !token.includes('.')) {
        // Token is empty or invalid format (JWT should have at least one period)
        return;
      }

      const count = await FriendsService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (err) {
      // Silently fail if token is invalid or user is not authenticated
      // Don't log errors when user is not logged in or during initialization
      if (isAuthenticated && !isInitializing) {
        console.error("Failed to load unread notifications count", err);
      }
    }
  }, [isAuthenticated, isInitializing]);

  const refreshNotifications = useCallback(async () => {
    if (isInitializing || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token || token.trim() === '' || !token.includes('.')) {
        return;
      }

      const notifs = await FriendsService.getUnreadNotifications();
      setNotifications(notifs);
      // Update count from server instead of local count
      await refreshCount();
    } catch (err) {
      if (isAuthenticated && !isInitializing) {
        console.error("Failed to load notifications", err);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshCount, isAuthenticated, isInitializing]);

  const refreshAllNotifications = useCallback(async () => {
    if (isInitializing || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token || token.trim() === '' || !token.includes('.')) {
        return;
      }

      const allNotifs = await FriendsService.getAllNotifications();
      setAllNotifications(allNotifs);
      await refreshCount();
    } catch (err) {
      if (isAuthenticated && !isInitializing) {
        console.error("Failed to load all notifications", err);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshCount, isAuthenticated, isInitializing]);

  const markAsRead = useCallback(async (notificationId: number) => {
    if (isInitializing || !isAuthenticated) {
      return;
    }

    try {
      await FriendsService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setAllNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      // Refresh count from server
      await refreshCount();
    } catch (err) {
      if (isAuthenticated && !isInitializing) {
        console.error("Failed to mark notification as read", err);
        throw err;
      }
    }
  }, [refreshCount, isAuthenticated, isInitializing]);

  const markAllAsRead = useCallback(async () => {
    if (isInitializing || !isAuthenticated) {
      return;
    }

    try {
      await FriendsService.markAllNotificationsAsRead();
      setNotifications([]);
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await refreshCount();
    } catch (err) {
      if (isAuthenticated && !isInitializing) {
        console.error("Failed to mark all notifications as read", err);
        throw err;
      }
    }
  }, [refreshCount, isAuthenticated, isInitializing]);

  // Set up WebSocket listener for real-time notifications
  useEffect(() => {
    // Don't set up notifications if auth is initializing
    if (isInitializing) {
      return;
    }

    // Only set up notifications if user is authenticated
    if (!isAuthenticated) {
      // Clear notifications when user logs out
      setNotifications([]);
      setAllNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Check if token exists and is valid before connecting
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '' || !token.includes('.')) {
      // Token is empty or invalid format (JWT should have at least one period)
      return;
    }

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
  }, [refreshCount, isAuthenticated, isInitializing]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        allNotifications,
        loading,
        refreshNotifications,
        refreshAllNotifications,
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

