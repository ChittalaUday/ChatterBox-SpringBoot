"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import FriendsService from "@/services/friends.service";
import WebSocketService from "@/services/websocket.service";
import { User } from "@/services/chat.types";
import { AppSidebar } from "./app-sidebar-new";
import ProtectedRoute from "./protected-route";

interface AppLayoutProps {
  children: React.ReactNode;
  onRefreshFriends?: () => void;
}

export function AppLayout({ children, onRefreshFriends }: AppLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get selected friend ID from URL params
  const selectedFriendId = pathname === "/chat" 
    ? searchParams.get("friendId") 
      ? parseInt(searchParams.get("friendId")!) 
      : null
    : null;

  const refreshFriends = async () => {
    if (user) {
      await loadFriends();
      if (onRefreshFriends) {
        onRefreshFriends();
      }
    }
  };

  useEffect(() => {
    if (user) {
      refreshFriends();
      connectToWebSocket();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await FriendsService.getFriends();
      setFriends(friendsData);
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoading(false);
    }
  };

  const connectToWebSocket = () => {
    WebSocketService.connect();
  };

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar 
            friends={friends} 
            loading={loading} 
            currentPath={pathname}
            selectedFriendId={selectedFriendId}
            onRefreshUnreadCounts={refreshFriends}
          />
          <main className="flex-1 flex flex-col overflow-hidden bg-background">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

