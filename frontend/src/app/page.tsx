"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    // Wait for initialization to complete before redirecting
    if (!isInitializing && isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, isInitializing, router]);

  const handleGetStarted = () => {
    router.push("/login");
  };

  // Show loading while checking authentication
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Chatterbox</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button onClick={() => router.push("/signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container flex flex-col items-center justify-center py-8 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-6">Welcome to Chatterbox</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with friends and family through instant messaging. 
            Join our community and start chatting today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/signup")}>
              Create Account
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}