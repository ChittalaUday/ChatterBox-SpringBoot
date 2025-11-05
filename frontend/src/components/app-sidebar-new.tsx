"use client"

import * as React from "react"
import { MessageSquare, Users, Settings, Bell } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useNotifications } from "@/context/notification-context"
import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@/services/chat.types"
import ChatMessageService from "@/services/chat-message.service"
import WebSocketService from "@/services/websocket.service"
import { ChatMessage } from "@/services/chat.types"

interface AppSidebarProps {
  friends: User[]
  loading?: boolean
  currentPath?: string
  selectedFriendId?: number | null
  onRefreshUnreadCounts?: () => void;
}

export function AppSidebar({ 
  friends, 
  loading = false,
  currentPath = "/chat",
  selectedFriendId = null
}: AppSidebarProps) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const router = useRouter()
  const { setOpen } = useSidebar()
  const [showUnreads, setShowUnreads] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredFriends, setFilteredFriends] = React.useState<User[]>(friends)
  const [lastMessages, setLastMessages] = React.useState<Map<number, { content: string; timestamp: string }>>(new Map())
  const [unreadCounts, setUnreadCounts] = React.useState<Map<number, number>>(new Map())

  React.useEffect(() => {
    setFilteredFriends(friends)
  }, [friends])

  React.useEffect(() => {
    // Filter friends based on search term
    if (!searchTerm) {
      setFilteredFriends(friends)
    } else {
      const filtered = friends.filter(friend =>
        friend && friend.name && friend.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFriends(filtered)
    }
  }, [searchTerm, friends])

  const loadUnreadCounts = async () => {
    try {
      const counts = await ChatMessageService.getUnreadMessageCounts()
      const countsMap = new Map<number, number>()
      Object.entries(counts).forEach(([senderId, count]) => {
        countsMap.set(Number(senderId), count)
      })
      setUnreadCounts(countsMap)
    } catch (error) {
      console.error('Failed to load unread message counts:', error)
    }
  }

  // Load last messages for each friend
  const loadLastMessages = React.useCallback(async () => {
    const messagesMap = new Map<number, { content: string; timestamp: string }>()
    
    for (const friend of friends) {
      try {
        const messages = await ChatMessageService.getChatHistory(friend.id)
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1]
          messagesMap.set(friend.id, {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp || new Date().toISOString()
          })
        }
      } catch (error) {
        console.error(`Failed to load last message for friend ${friend.id}:`, error)
      }
    }
    
    setLastMessages(messagesMap)
  }, [friends])

  React.useEffect(() => {
    if (friends.length > 0) {
      loadLastMessages()
    }
  }, [friends, loadLastMessages])

  // Load unread message counts
  React.useEffect(() => {
    if (friends.length > 0) {
      loadUnreadCounts()
    }
  }, [friends])

  // WebSocket message listener for updating unread counts
  React.useEffect(() => {
    const handleNewMessage = (message: ChatMessage & { type?: string }) => {
      // Handle read status updates
      if (message.type === "UNREAD_COUNT_UPDATED") {
        loadUnreadCounts();
        loadLastMessages(); // Refresh last messages too
        return;
      }
      
      // Refresh unread counts when a new message arrives or when messages are marked as read
      if (message.sender && message.receiver) {
        loadUnreadCounts();
        // Update last message for the sender
        if (message.content && message.content !== 'MESSAGES_READ') {
          setLastMessages(prev => {
            const updated = new Map(prev);
            updated.set(message.sender.id, {
              content: message.content,
              timestamp: message.timestamp || new Date().toISOString()
            });
            return updated;
          });
        }
      }
    }

    // Add listener
    WebSocketService.addMessageListener(handleNewMessage)

    return () => {
      // Remove listener
      WebSocketService.removeMessageListener(handleNewMessage)
    }
  }, [])

  const navItems = [
    {
      title: "Chats",
      icon: MessageSquare,
      path: "/dashboard/chat",
    },
    {
      title: "Friends",
      icon: Users,
      path: "/dashboard/friends",
    },
    {
      title: "Notifications",
      icon: Bell,
      path: "/dashboard/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/dashboard/settings",
    },
  ]

  const formatTime = (timestamp: string) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleNavClick = (path: string) => {
    // Fix the path to include /dashboard prefix
    const fullPath = path.startsWith('/dashboard') ? path : `/dashboard${path}`;
    router.push(fullPath);
    setOpen(true);
  }

  const handleFriendClick = (friendId: number) => {
    router.push(`/dashboard/chat?friendId=${friendId}`);
    setOpen(true);
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden"
    >
      {/* First sidebar - Navigation icons (always visible) */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <button onClick={() => handleNavClick("/dashboard/chat")}>
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Chatterbox</span>
                    <span className="truncate text-xs">Chat App</span>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = currentPath === item.path || 
                    (item.path === "/dashboard/chat" && (currentPath === "/" || currentPath === "/dashboard")) ||
                    (currentPath?.startsWith(item.path))
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.title,
                          hidden: false,
                        }}
                        onClick={() => handleNavClick(item.path)}
                        isActive={isActive}
                        className="px-2.5 md:px-2 relative"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[18px] h-[18px]">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <NavUser user={{
              name: user.name || "User",
              email: user.email || "",
              avatar: user.profileImageUrl 
                ? (user.profileImageUrl.startsWith('http') 
                    ? user.profileImageUrl 
                    : `http://localhost:8083${user.profileImageUrl}`)
                : `https://api.dicebear.com/6.x/initials/svg?seed=${user.name || "User"}`
            }} />
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Second sidebar - Friends list (now show on all dashboard pages) */}
      {(currentPath?.startsWith("/dashboard")) && (
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4 bg-gradient-to-r from-sidebar-accent/50 via-sidebar-accent/30 to-transparent">
            <div className="flex w-full items-center justify-between">
              <div className="text-foreground text-base font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Chats
              </div>
              <Label className="flex items-center gap-2 text-sm">
                <span>Unreads</span>
                <Switch 
                  checked={showUnreads}
                  onCheckedChange={setShowUnreads}
                  className="shadow-none" 
                />
              </Label>
            </div>
            <SidebarInput 
              placeholder="Type to search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {loading ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading friends...</div>
                ) : filteredFriends.length === 0 ? (
                  <div className="p-4 text-sm text-center text-muted-foreground">
                    {searchTerm ? "No friends found" : "No friends yet"}
                  </div>
                ) : (
                  filteredFriends
                    .filter(friend => {
                      if (!friend || friend.id === undefined) return false
                      // If showUnreads is enabled, only show friends with unread messages
                      if (showUnreads) {
                        const unreadCount = unreadCounts.get(friend.id) || 0
                        return unreadCount > 0
                      }
                      return true
                    })
                    .map((friend) => {
                    if (!friend || friend.id === undefined) return null
                    
                    const lastMessage = lastMessages.get(friend.id)
                    const isSelected = selectedFriendId === friend.id

                    const unreadCount = unreadCounts.get(friend.id) || 0
                    
                    return (
                      <button
                        key={friend.id}
                        onClick={() => handleFriendClick(friend.id)}
                        className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 flex flex-col items-start gap-2 border-b last:border-b-0 w-full text-left p-4 ${
                          isSelected 
                            ? "bg-gradient-to-r from-sidebar-accent via-sidebar-accent to-primary/10 text-sidebar-accent-foreground border-l-4 border-l-primary shadow-sm" 
                            : ""
                        }`}
                      >
                        <div className="flex w-full items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/20 ring-2 ring-primary/10">
                              <AvatarImage 
                                src={friend.profileImageUrl 
                                  ? (friend.profileImageUrl.startsWith('http') 
                                      ? friend.profileImageUrl 
                                      : `http://localhost:8083${friend.profileImageUrl}`)
                                  : `https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} 
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                                {friend.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            {unreadCount > 0 && (
                              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-red-600 to-red-500 rounded-full min-w-[18px] h-[18px] shadow-lg shadow-red-500/50">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm truncate">{friend.name || 'Unknown User'}</span>
                              {lastMessage && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatTime(lastMessage.timestamp)}
                                </span>
                              )}
                            </div>
                            {lastMessage ? (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground italic mt-0.5">
                                No messages yet
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  )
}

