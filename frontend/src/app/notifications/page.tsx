"use client";

import { Suspense } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

function NotificationsContent() {
  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-6 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              View and manage your notifications
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                You're all caught up! When you receive friend requests or messages, they'll appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AppLayout>
        <NotificationsContent />
      </AppLayout>
    </Suspense>
  );
}

