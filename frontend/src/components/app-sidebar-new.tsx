"use client"

import * as React from "react"
import { MessageSquare, Users, Settings, Bell } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
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

interface AppSidebarProps {
  friends: User[]
  loading?: boolean
  currentPath?: string
  selectedFriendId?: number | null
}

export function AppSidebar({ 
  friends, 
  loading = false,
  currentPath = "/chat",
  selectedFriendId = null
}: AppSidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { setOpen } = useSidebar()
  const [showUnreads, setShowUnreads] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredFriends, setFilteredFriends] = React.useState<User[]>(friends)
  const [lastMessages, setLastMessages] = React.useState<Map<number, { content: string; timestamp: string }>>(new Map())

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

  // Load last messages for each friend
  React.useEffect(() => {
    const loadLastMessages = async () => {
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
    }

    if (friends.length > 0) {
      loadLastMessages()
    }
  }, [friends])

  const navItems = [
    {
      title: "Chats",
      icon: MessageSquare,
      path: "/chat",
    },
    {
      title: "Friends",
      icon: Users,
      path: "/friends",
    },
    {
      title: "Notifications",
      icon: Bell,
      path: "/notifications",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
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
    router.push(path)
    setOpen(true)
  }

  const handleFriendClick = (friendId: number) => {
    router.push(`/chat?friendId=${friendId}`)
    setOpen(true)
  }

  return (
    <Sidebar
      collapsible="icon"
      defaultOpen={true}
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    >
      {/* First sidebar - Navigation icons */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <button onClick={() => handleNavClick("/chat")}>
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
                  const isActive = currentPath?.startsWith(item.path) || 
                    (item.path === "/chat" && currentPath === "/")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.title,
                          hidden: false,
                        }}
                        onClick={() => handleNavClick(item.path)}
                        isActive={isActive}
                        className="px-2.5 md:px-2"
                      >
                        <item.icon />
                        <span>{item.title}</span>
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
              avatar: `https://api.dicebear.com/6.x/initials/svg?seed=${user.name || "User"}`
            }} />
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Second sidebar - Friends list (only show on chat page) */}
      {currentPath?.startsWith("/chat") && (
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-foreground text-base font-medium">
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
                  filteredFriends.map((friend) => {
                    if (!friend || friend.id === undefined) return null
                    
                    const lastMessage = lastMessages.get(friend.id)
                    const isSelected = selectedFriendId === friend.id

                    return (
                      <button
                        key={friend.id}
                        onClick={() => handleFriendClick(friend.id)}
                        className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors flex flex-col items-start gap-2 border-b last:border-b-0 w-full text-left p-4 ${
                          isSelected ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <div className="flex w-full items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${friend.name}`} />
                            <AvatarFallback className="bg-primary/10 text-foreground">
                              {friend.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
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

