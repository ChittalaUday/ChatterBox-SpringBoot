"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import FriendsService from "@/services/friends.service";
import WebSocketService from "@/services/websocket.service";
import { User } from "@/services/chat.types";
import { ChatWindow } from "./chat-window";
import { MessageSquare } from "lucide-react";

export function ChatMain() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
    connectToWebSocket();
  }, []);

  // Handle friend selection from URL params
  useEffect(() => {
    const friendIdParam = searchParams.get("friendId");
    if (friendIdParam && friends.length > 0) {
      const friendId = parseInt(friendIdParam);
      const friend = friends.find(f => f.id === friendId);
      if (friend) {
        setSelectedFriend(friend);
      } else {
        setSelectedFriend(null);
      }
    } else {
      setSelectedFriend(null);
    }
  }, [searchParams, friends]);

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
    <div className="h-full flex flex-col overflow-hidden">
      {selectedFriend ? (
        <ChatWindow friend={selectedFriend} onBack={() => setSelectedFriend(null)} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
          <div className="text-center space-y-4 px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome to Chatterbox
            </h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Select a friend from the sidebar to start a conversation
            </p>
          </div>
        </div>
      )}
    </div>
  );
}