"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Bell, CheckCheck, MessageSquare, UserPlus, UserCheck } from "lucide-react";
import { useNotifications } from "@/context/notification-context";

function NotificationsContent() {
  const router = useRouter();
  const { 
    allNotifications, 
    unreadCount, 
    loading, 
    refreshAllNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    refreshAllNotifications();
  }, [refreshAllNotifications]);

  // Group notifications by type
  const notificationsByType = useMemo(() => {
    const grouped: { [key: string]: typeof allNotifications } = {};
    allNotifications.forEach(notif => {
      const type = notif.type || 'OTHER';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(notif);
    });
    return grouped;
  }, [allNotifications]);

  // Get categories
  const categories = useMemo(() => {
    return Object.keys(notificationsByType);
  }, [notificationsByType]);

  // Filter notifications by selected category
  const filteredNotifications = useMemo(() => {
    if (!selectedCategory) {
      return allNotifications;
    }
    return notificationsByType[selectedCategory] || [];
  }, [selectedCategory, allNotifications, notificationsByType]);

  const handleNotificationClick = (notification: { id: number; type?: string; read?: boolean }) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Navigate based on notification type
    if (notification.type === "FRIEND_REQUEST" || notification.type === "FRIEND_ACCEPTED") {
      router.push("/friends");
    } else if (notification.type === "MESSAGE") {
      router.push("/chat");
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageSquare className="h-4 w-4" />;
      case "FRIEND_REQUEST":
        return <UserPlus className="h-4 w-4" />;
      case "FRIEND_ACCEPTED":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "MESSAGE":
        return "Messages";
      case "FRIEND_REQUEST":
        return "Friend Requests";
      case "FRIEND_ACCEPTED":
        return "Friend Acceptances";
      default:
        return category;
    }
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar className="border-r w-64 shrink-0">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Categories</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSelectedCategory(null)}
                      isActive={selectedCategory === null}
                      className="w-full justify-start"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      All Notifications
                      <Badge variant="secondary" className="ml-auto">
                        {allNotifications.length}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {categories.map((category) => {
                    const categoryNotifications = notificationsByType[category] || [];
                    const unreadInCategory = categoryNotifications.filter(n => !n.read).length;
                    return (
                      <SidebarMenuItem key={category}>
                        <SidebarMenuButton
                          onClick={() => setSelectedCategory(category)}
                          isActive={selectedCategory === category}
                          className="w-full justify-start"
                        >
                          {getNotificationIcon(category)}
                          <span className="ml-2">{getCategoryLabel(category)}</span>
                          {unreadInCategory > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {unreadInCategory}
                            </Badge>
                          )}
                          {unreadInCategory === 0 && categoryNotifications.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                              {categoryNotifications.length}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto py-8 px-6 max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-muted-foreground text-lg">
                  View and manage your notifications
                </p>
              </div>
              {filteredNotifications.length > 0 && unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>

            <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">
                  {selectedCategory ? getCategoryLabel(selectedCategory) : "All Notifications"}
                </CardTitle>
                <CardDescription>
                  {selectedCategory 
                    ? `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`
                    : `${allNotifications.length} total notification${allNotifications.length !== 1 ? 's' : ''}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div className="space-y-3">
                      {filteredNotifications.map((notification) => {
                        const isUnread = !notification.read;
                        return (
                          <div 
                            key={notification.id}
                            className={`p-4 rounded-lg border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                              isUnread 
                                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 hover:from-primary/20 hover:via-primary/10 hover:border-primary/40" 
                                : "bg-gradient-to-r from-muted/40 via-muted/30 to-transparent border-border/50 hover:from-muted/50 hover:via-muted/40"
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`p-2 rounded-lg ${
                                  isUnread ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-sm ${isUnread ? "font-semibold" : "font-normal"}`}>
                                      {notification.message}
                                    </p>
                                    {isUnread && (
                                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(notification.createdAt).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {notification.type && (
                                      <Badge variant="outline" className="text-xs">
                                        {notification.type}
                                      </Badge>
                                    )}
                                  </div>
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
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      {selectedCategory 
                        ? `No ${getCategoryLabel(selectedCategory).toLowerCase()} yet.`
                        : "You're all caught up! When you receive friend requests or messages, they'll appear here."
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}
