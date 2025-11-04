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

export function FriendsList() {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Friends</CardTitle>
        <AddFriendDialog onFriendAdded={loadFriendsData} />
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Friend Requests</h3>
            <ScrollArea className="h-40">
              {pendingRequests.map((request) => {
                // Add defensive check for request object
                if (!request || request.id === undefined) {
                  return null;
                }
                
                return (
                  <div key={request.id} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${request.name}`} />
                        <AvatarFallback>{request.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span>{request.name || 'Unknown User'}</span>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptRequest(request.id)}
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
            </ScrollArea>
          </div>
        )}

        <h3 className="font-semibold mb-2">Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-muted-foreground">No friends yet</p>
        ) : (
          <ScrollArea className="h-60">
            {friends.map((friend) => {
              // Add defensive check for friend object
              if (!friend || friend.id === undefined) {
                return null;
              }
              
              return (
                <div key={friend.id} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} />
                      <AvatarFallback>{friend.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span>{friend.name || 'Unknown User'}</span>
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}