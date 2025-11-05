"use client";

import { ChatMain } from "@/components/chat-main";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

export default function ChatPage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold">Chatterbox</h1>
            </Link>
            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              <span>Welcome, {user?.name}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="flex-1 container mx-auto py-6">
          <ChatMain />
        </div>
      </div>
    </ProtectedRoute>
  );
}