"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { useNotifications } from "@/context/notification-context";

function NotificationsContent() {
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    refreshNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleNotificationClick = (notification: { id: number; type?: string }) => {
    markAsRead(notification.id);
    // Navigate based on notification type
    if (notification.type === "FRIEND_REQUEST" || notification.type === "FRIEND_ACCEPTED") {
      router.push("/friends");
    } else if (notification.type === "MESSAGE") {
      router.push("/chat");
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-6 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-muted-foreground">
                View and manage your notifications
              </p>
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.type && (
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            {notification.type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    You're all caught up! When you receive friend requests or messages, they'll appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AppLayout>
        <NotificationsContent />
      </AppLayout>
    </Suspense>
  );
}

