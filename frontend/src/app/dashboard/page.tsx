"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/protected-route";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page (main dashboard)
    router.replace("/chat");
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to chat...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}