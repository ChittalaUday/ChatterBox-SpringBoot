"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { LoginForm } from "@/components/login-form"

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    // Wait for initialization to complete before redirecting
    if (!isInitializing && isAuthenticated) {
      router.push("/dashboard/chat");
    }
  }, [isAuthenticated, isInitializing, router]);

  // Show loading while checking authentication
  if (isInitializing) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting (useEffect will handle redirect)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div>Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
