"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import WebSocketService from "@/services/websocket.service";
import ChatMessageService from "@/services/chat-message.service";
import { ChatMessage, User } from "@/services/chat.types";

interface ChatWindowProps {
  friend: User;
  onBack: () => void;
}

export function ChatWindow({ friend, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      console.log('Loading chat history with friend ID:', friend.id);
      const history = await ChatMessageService.getChatHistory(friend.id);
      console.log('Loaded chat history:', history);
      setMessages(history);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load chat history", err);
      setLoading(false);
    }
  };

  const handleNewMessage = (message: ChatMessage) => {
    console.log('Received message in chat window:', message);
    // Check if the message is between the current user and the friend
    if (
      message &&
      message.sender && 
      message.receiver &&
      user?.id !== undefined && 
      friend.id !== undefined &&
      (
        (message.sender.id === user.id && message.receiver.id === friend.id) ||
        (message.sender.id === friend.id && message.receiver.id === user.id)
      )
    ) {
      console.log('Adding message to chat:', message);
      setMessages(prev => [...prev, message]);
    } else {
      console.log('Message filtered out. User ID:', user?.id, 'Friend ID:', friend.id, 'Message sender:', message?.sender?.id, 'Message receiver:', message?.receiver?.id);
    }
  };

  const connectToWebSocket = () => {
    // Check if already connected
    if (WebSocketService.isConnected()) {
      console.log('Already connected to WebSocket');
      setConnectionStatus("connected");
      return;
    }
    
    console.log('Connecting to WebSocket...');
    setConnectionStatus("connecting");
    
    // Connect to WebSocket
    WebSocketService.connect();
    
    // Check connection status after a short delay
    setTimeout(() => {
      if (WebSocketService.isConnected()) {
        console.log('WebSocket connected successfully');
        setConnectionStatus("connected");
      } else {
        console.log('WebSocket connection failed');
        setConnectionStatus("disconnected");
      }
    }, 1000);
  };

  useEffect(() => {
    console.log('ChatWindow mounted, loading chat history and connecting to WebSocket');
    (async () => {
      await loadChatHistory();
      connectToWebSocket();
    })();
    
    // Store the listener in a ref to maintain consistent reference
    const messageListener = (message: ChatMessage) => {
      console.log('Message listener triggered with message:', message);
      handleNewMessage(message);
    };
    
    // Add listener
    WebSocketService.addMessageListener(messageListener);
    
    // Set up interval to check connection status
    const connectionInterval = setInterval(() => {
      if (WebSocketService.isConnected()) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    }, 5000);
    
    return () => {
      console.log('Cleaning up WebSocket listener');
      WebSocketService.removeMessageListener(messageListener);
      clearInterval(connectionInterval);
    };
  }, [friend.id, user?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      console.log('Sending message:', newMessage);
      // Send via WebSocket for real-time delivery
      const message: ChatMessage = {
        sender: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        receiver: {
          id: friend.id,
          name: friend.name,
          email: friend.email
        },
        content: newMessage
      };

      WebSocketService.sendPrivateMessage(message);

      // Also send via REST API to persist the message
      await ChatMessageService.sendMessage(friend.id, newMessage);

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return <div>Loading chat...</div>;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} />
            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{friend.name}</CardTitle>
        </div>
        {connectionStatus === "connecting" && (
          <div className="text-sm text-yellow-600">Connecting...</div>
        )}
        {connectionStatus === "disconnected" && (
          <div className="text-sm text-red-600">Disconnected</div>
        )}
        {connectionStatus === "connected" && (
          <div className="text-sm text-green-600">Connected</div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              // Add defensive checks for message properties
              if (!message || !message.sender || !message.receiver) {
                return null;
              }
              
              const isCurrentUser = message.sender.id === user?.id;
              
              return (
                <div
                  key={message.id || `${message.timestamp}-${message.sender.id}-${message.receiver.id}`}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          {connectionStatus === "disconnected" && (
            <div className="text-red-500 text-sm mb-2">
              Connection lost. Attempting to reconnect...
            </div>
          )}
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={connectionStatus === "disconnected"}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || connectionStatus === "disconnected"}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}