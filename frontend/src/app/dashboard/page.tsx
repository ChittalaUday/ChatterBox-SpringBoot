"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/protected-route";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { FriendsList } from "@/components/friends-list";

interface User {
  id: number;
  name: string;
  email: string;
  gender: string;
  dob: string;
  mobile?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold">Chatterbox</h1>
            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              <span>Welcome, {user?.name}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link href="/chat">
                <Button className="w-full h-32 text-lg">
                  Open Chat
                </Button>
              </Link>
              <Link href="/friends">
                <Button className="w-full h-32 text-lg" variant="outline">
                  Friends
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-32 text-lg" disabled>
                Settings (Coming Soon)
              </Button>
            </div>
            
            <div className="mb-8">
              <FriendsList />
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{user?.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{user?.dob || "Not specified"}</p>
                </div>
                {user?.mobile && (
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">{user?.mobile}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}