"use client";

import { FriendsList } from "@/components/friends-list";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

export default function FriendsPage() {
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
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Friends</h1>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
            <FriendsList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}