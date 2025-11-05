"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AuthService from "@/services/auth.service";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, isInitializing } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth context to finish initializing before making decisions
    if (isInitializing) {
      return;
    }

    const validateAuth = async () => {
      // If we think we're authenticated, validate with backend
      if (isAuthenticated && user) {
        try {
          const isValid = await AuthService.validateToken();
          if (!isValid) {
            // Token is invalid, logout and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push("/login");
            return;
          }
        } catch (error) {
          // Error validating token, logout and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push("/login");
          return;
        }
      } else if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push("/login");
        return;
      }
      
      setIsLoading(false);
    };

    validateAuth();
  }, [isAuthenticated, user, isInitializing, router]);

  // Show loading while auth context is initializing or validating
  if (isInitializing || isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}