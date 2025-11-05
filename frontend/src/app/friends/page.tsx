"use client";

import { Suspense } from "react";
import { FriendsList } from "@/components/friends-list";
import { AppLayout } from "@/components/app-layout";

function FriendsContent() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">
            Manage your friends and connections
          </p>
        </div>
        <FriendsList />
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AppLayout>
        <FriendsContent />
      </AppLayout>
    </Suspense>
  );
}
