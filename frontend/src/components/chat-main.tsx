"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import FriendsService from "@/services/friends.service";
import WebSocketService from "@/services/websocket.service";
import { User } from "@/services/chat.types";
import { FriendsList } from "./friends-list";
import { ChatWindow } from "./chat-window";

export function ChatMain() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
    connectToWebSocket();
  }, []);

  useEffect(() => {
    filterFriends();
  }, [searchTerm, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await FriendsService.getFriends();
      setFriends(friendsData);
      setError(null);
    } catch (err) {
      setError("Failed to load friends");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectToWebSocket = () => {
    WebSocketService.connect();
  };

  const filterFriends = () => {
    if (!searchTerm) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend && friend.name && friend.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  };

  const handleAddFriend = async () => {
    // In a real app, this would open a dialog to search for users
    // For now, we'll just show an alert
    alert("Add friend functionality would be implemented here");
  };

  const handleSelectFriend = (friend: User) => {
    if (friend && friend.id !== undefined) {
      setSelectedFriend(friend);
    }
  };

  const handleBackToFriends = () => {
    setSelectedFriend(null);
  };

  if (selectedFriend) {
    return <ChatWindow friend={selectedFriend} onBack={handleBackToFriends} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Chats</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleAddFriend} size="icon">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            
            {error && <div className="text-red-500 mb-4">{error}</div>}
            
            {loading ? (
              <div>Loading friends...</div>
            ) : (
              <div className="flex-1 overflow-hidden">
                {filteredFriends.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {searchTerm ? "No friends found" : "No friends yet"}
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto h-full">
                    {filteredFriends.map((friend) => {
                      // Add defensive check for friend object
                      if (!friend || friend.id === undefined) {
                        return null;
                      }
                      
                      return (
                        <Button
                          key={friend.id}
                          variant="ghost"
                          className="w-full justify-start h-16"
                          onClick={() => handleSelectFriend(friend)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} />
                            <AvatarFallback>{friend.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3 text-left">
                            <p className="font-medium">{friend.name || 'Unknown User'}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              Last message would appear here
                            </p>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-2">
        <FriendsList />
      </div>
    </div>
  );
}