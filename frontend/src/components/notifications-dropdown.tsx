"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNotifications } from "@/context/notification-context";

export function NotificationsDropdown() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    refreshNotifications, 
    refreshCount,
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      refreshNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await markAsRead(notificationId);
      await refreshCount();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await refreshCount();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleNotificationClick = (notification: { id: number; type?: string; read?: boolean }) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    // Navigate based on notification type
    if (notification.type === "FRIEND_REQUEST" || notification.type === "FRIEND_ACCEPTED") {
      router.push("/friends");
      setOpen(false);
    } else if (notification.type === "MESSAGE") {
      router.push("/chat");
      setOpen(false);
    }
  };

  // Refresh count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!open) {
        refreshCount();
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [open, refreshCount]);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[18px] h-[18px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-h-[500px] border-2 shadow-2xl bg-gradient-to-br from-background via-background to-primary/5" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h3 className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Notifications
            </h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="text-xs h-7"
              >
                Mark all as read
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : notifications.length > 0 ? (
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const isUnread = !notification.read;
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        isUnread 
                          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 hover:from-primary/20 hover:via-primary/10 hover:border-primary/40" 
                          : "bg-gradient-to-r from-muted/40 via-muted/30 to-transparent border-border/50 hover:from-muted/50 hover:via-muted/40"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isUnread ? "font-medium" : "font-normal"}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {notification.type && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {notification.type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isUnread ? (
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                          ) : (
                            <CheckCheck className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}