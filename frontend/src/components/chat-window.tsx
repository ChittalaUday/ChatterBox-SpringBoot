"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
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

  const handleNewMessage = useCallback((message: ChatMessage) => {
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
      // Prevent duplicates and replace optimistic messages with server responses
      setMessages(prev => {
        // If message has an ID, check if a message with that ID already exists
        if (message.id) {
          const existingIndex = prev.findIndex(msg => msg.id === message.id);
          if (existingIndex !== -1) {
            console.log('Message with ID already exists, updating it');
            // Replace existing message (might be optimistic version)
            const updated = [...prev];
            updated[existingIndex] = message;
            return updated;
          }
        }

        // Check for optimistic message (same content, same sender, no ID or different timestamp)
        const optimisticIndex = prev.findIndex(msg =>
          !msg.id && // Optimistic message doesn't have ID
          msg.content === message.content &&
          msg.sender.id === message.sender.id &&
          msg.receiver.id === message.receiver.id
        );

        if (optimisticIndex !== -1) {
          console.log('Replacing optimistic message with server response');
          // Replace optimistic message with server response
          const updated = [...prev];
          updated[optimisticIndex] = message;
          return updated;
        }

        // Check for duplicate by content + timestamp + sender (fallback)
        const duplicateExists = prev.some(msg =>
          msg.id && message.id && msg.id === message.id
        );

        if (duplicateExists) {
          console.log('Duplicate message detected, skipping');
          return prev;
        }

        // New message, add it
        return [...prev, message];
      });
    } else {
      console.log('Message filtered out. User ID:', user?.id, 'Friend ID:', friend.id, 'Message sender:', message?.sender?.id, 'Message receiver:', message?.receiver?.id);
    }
  }, [user?.id, friend.id]);

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

    // Set up interval to check connection status
    const connectionInterval = setInterval(() => {
      if (WebSocketService.isConnected()) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    }, 5000);

    return () => {
      clearInterval(connectionInterval);
    };
  }, [friend.id, user?.id]);

  // Separate useEffect for WebSocket message listener to avoid stale closures
  useEffect(() => {
    // Add listener - handleNewMessage is now stable with useCallback
    WebSocketService.addMessageListener(handleNewMessage);

    return () => {
      console.log('Cleaning up WebSocket listener');
      WebSocketService.removeMessageListener(handleNewMessage);
    };
  }, [handleNewMessage]); // handleNewMessage is stable with useCallback

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change or friend changes
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
        if (scrollViewport) {
          // Use requestAnimationFrame for smooth scrolling
          requestAnimationFrame(() => {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
          });
        }
      }
      // Also scroll messagesEndRef if it exists
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [messages, friend.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage;
    setNewMessage(""); // Clear input immediately for better UX

    try {
      console.log('Sending message:', messageContent);

      // Create optimistic message for immediate UI update
      const optimisticMessage: ChatMessage = {
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
        content: messageContent,
        timestamp: new Date().toISOString(),
        // Mark as temporary (no ID) so we can replace it when server responds
      };

      // Add optimistic message immediately for better UX
      setMessages(prev => [...prev, optimisticMessage]);

      // Send via WebSocket if connected, otherwise use REST API as fallback
      if (WebSocketService.isConnected()) {
        console.log('Sending via WebSocket');
        WebSocketService.sendPrivateMessage(optimisticMessage);
      } else {
        console.log('WebSocket not connected, sending via REST API');
        // REST API will save and broadcast via WebSocket
        const savedMessage = await ChatMessageService.sendMessage(friend.id, messageContent);
        // Replace optimistic message with server response
        setMessages(prev => {
          // Remove the optimistic message (the one without ID)
          const withoutOptimistic = prev.filter(msg =>
            msg.id !== undefined ||
            msg.content !== messageContent ||
            msg.sender.id !== user.id
          );
          // Add the saved message from server
          return [...withoutOptimistic, savedMessage];
        });
      }
    } catch (err) {
      console.error("Failed to send message", err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg =>
        msg.id !== undefined ||
        msg.content !== messageContent ||
        msg.sender.id !== user.id
      ));
      // Restore the message on error so user can retry
      setNewMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted animate-pulse" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Fixed at top */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {friend.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{friend.name}</h2>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" :
                  connectionStatus === "connecting" ? "bg-yellow-500" :
                    "bg-red-500"
                }`} />
              <span className="text-xs text-muted-foreground">
                {connectionStatus === "connected" ? "Online" :
                  connectionStatus === "connecting" ? "Connecting..." :
                    "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable, takes remaining space */}
      <div className="flex-1 overflow-hidden relative bg-muted/30">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div className="px-6 py-6 space-y-1 min-h-full flex flex-col justify-end">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start the conversation by sending a message below
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                // Add defensive checks for message properties
                if (!message || !message.sender || !message.receiver) {
                  return null;
                }

                const isCurrentUser = message.sender.id === user?.id;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;
                const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();
                const showDate = !prevMessage ||
                  new Date(prevMessage.timestamp || 0).toDateString() !== messageDate.toDateString();

                // Group messages: if next message is from same sender within 5 minutes, reduce spacing
                const isGrouped = nextMessage &&
                  nextMessage.sender.id === message.sender.id &&
                  message.timestamp && nextMessage.timestamp &&
                  (new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime()) < 300000; // 5 minutes

                return (
                  <div key={message.id || `${message.timestamp}-${message.sender.id}-${message.receiver.id}`}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {messageDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className={`flex items-end gap-2 ${isCurrentUser ? "justify-end" : "justify-start"} ${isGrouped ? "mb-1" : "mb-4"}`}>
                      {!isCurrentUser && (
                        <Avatar className={`h-8 w-8 shrink-0 ${showAvatar ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.sender.name}`} />
                          <AvatarFallback className="text-xs">
                            {message.sender.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} max-w-[70%]`}>
                        {!isCurrentUser && showAvatar && (
                          <span className="text-xs text-muted-foreground px-2 mb-1 font-medium">
                            {message.sender.name}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${isCurrentUser
                              ? "bg-primary text-primary-foreground rounded-br-md hover:bg-primary/90"
                              : "bg-muted text-foreground rounded-bl-md hover:bg-muted/80"
                            } ${isGrouped && isCurrentUser ? "rounded-tr-md" : ""} ${isGrouped && !isCurrentUser ? "rounded-tl-md" : ""}`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-1.5 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"} ${isGrouped ? "hidden" : ""}`}>
                            {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {isCurrentUser && (
                        <Avatar className={`h-8 w-8 shrink-0 ${showAvatar ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user?.name}`} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t bg-card">
        {connectionStatus === "disconnected" && (
          <div className="px-6 pt-3 pb-2">
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-md">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>Connection lost. Attempting to reconnect...</span>
            </div>
          </div>
        )}
        <div className="px-6 py-4 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[44px] pr-12 resize-none rounded-full border-2 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                disabled={connectionStatus === "disconnected"}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || connectionStatus === "disconnected"}
              size="icon"
              className="h-11 w-11 rounded-full shrink-0 shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}