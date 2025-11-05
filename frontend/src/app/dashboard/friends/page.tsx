"use client";

import { Suspense, useState, useEffect } from "react";
import { FriendsList } from "@/components/friends-list";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import FriendsService from "@/services/friends.service";
import { User } from "@/services/chat.types";
import { Search, UserPlus, Loader2, Users, UserCheck } from "lucide-react";

function FriendsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"find" | "my">("find");
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriendsData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0 && activeTab === "find") {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailableUsers([]);
    }
  }, [searchQuery, activeTab]);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        FriendsService.getFriends(),
        FriendsService.getPendingRequests()
      ]);
      setFriends(friendsData);
      setPendingRequests(requestsData);
      setError(null);
    } catch (err) {
      setError("Failed to load friends data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      setSearching(true);
      const users = await FriendsService.searchUsers(searchQuery);
      // Filter out current user and existing friends
      const friendIds = new Set(friends.map(f => f.id));
      const filteredUsers = users.filter(u =>
        u.id !== user?.id && !friendIds.has(u.id)
      );
      setAvailableUsers(filteredUsers);
    } catch (err) {
      console.error("Failed to search users", err);
      setAvailableUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (friendId: number) => {
    try {
      await FriendsService.sendFriendRequest(friendId);
      setSearchQuery("");
      setAvailableUsers([]);
      await loadFriendsData();
    } catch (err) {
      console.error("Failed to send friend request", err);
      setError("Failed to send friend request");
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar className="border-r w-64 shrink-0">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Friends</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveTab("find")}
                    isActive={activeTab === "find"}
                    className="w-full justify-start"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Friends
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveTab("my")}
                    isActive={activeTab === "my"}
                    className="w-full justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    My Friends
                    {friends.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {friends.length}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {pendingRequests.length > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab("my")}
                      isActive={activeTab === "my"}
                      className="w-full justify-start"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Friend Requests
                      <Badge variant="destructive" className="ml-auto">
                        {pendingRequests.length}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
        {activeTab === "find" && (
          <div className="container mx-auto py-8 px-6 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Find Friends
              </h1>
              <p className="text-muted-foreground text-lg">
                Search for users and send friend requests
              </p>
            </div>

            <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Search className="h-6 w-6 text-primary" />
                  Search Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                {searching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : searchQuery.trim() && availableUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No users found</p>
                  </div>
                ) : availableUsers.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-2">
                      {availableUsers.map((availableUser) => (
                        <div
                          key={availableUser.id}
                          className="flex items-center justify-between p-3 rounded-lg border-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={availableUser.profileImageUrl || `https://api.dicebear.com/6.x/initials/svg?seed=${availableUser.name}`}
                                alt={availableUser.name}
                              />
                              <AvatarFallback>{availableUser.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{availableUser.name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{availableUser.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSendFriendRequest(availableUser.id)}
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Friend
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Start typing to search for users</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "my" && (
          <div className="container mx-auto py-8 px-6 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                My Friends
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your friends and connections
              </p>
            </div>
            <FriendsList onRefresh={loadFriendsData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <FriendsContent />
    </Suspense>
  );
}