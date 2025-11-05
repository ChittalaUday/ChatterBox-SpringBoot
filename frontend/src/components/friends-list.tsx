"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import FriendsService from "@/services/friends.service";
import { User } from "@/services/chat.types";
import { AddFriendDialog } from "./add-friend-dialog";

export function FriendsList({ onRefresh }: { onRefresh?: () => void }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriendsData();
  }, []);


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

  const handleAcceptRequest = async (friendId: number) => {
    try {
      await FriendsService.acceptFriendRequest(friendId);
      // Refresh the data
      loadFriendsData();
    } catch (err) {
      setError("Failed to accept friend request");
      console.error(err);
    }
  };

  const handleRejectRequest = async (friendId: number) => {
    try {
      await FriendsService.rejectFriendRequest(friendId);
      // Refresh the data
      loadFriendsData();
    } catch (err) {
      setError("Failed to reject friend request");
      console.error(err);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await FriendsService.removeFriend(friendId);
      // Refresh the data
      loadFriendsData();
    } catch (err) {
      setError("Failed to remove friend");
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading friends...</div>;
  }

  return (
    <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-2">
          <span className="text-primary">Friends</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {error && (
          <div className="text-red-500 text-sm mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading friends...</p>
          </div>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-lg">Friend Requests ({pendingRequests.length})</h3>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {pendingRequests.map((request) => {
                      if (!request || request.id === undefined) {
                        return null;
                      }
                      
                      return (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border-2 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={request.profileImageUrl || `https://api.dicebear.com/6.x/initials/svg?seed=${request.name}`} 
                                alt={request.name}
                              />
                              <AvatarFallback>{request.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{request.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleAcceptRequest(request.id)}
                              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-semibold mb-3 text-lg">My Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>No friends yet</p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {friends.map((friend) => {
                      if (!friend || friend.id === undefined) {
                        return null;
                      }
                      
                      return (
                        <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border-2 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={friend.profileImageUrl || `https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} 
                                alt={friend.name}
                              />
                              <AvatarFallback>{friend.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{friend.name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{friend.email}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRemoveFriend(friend.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}