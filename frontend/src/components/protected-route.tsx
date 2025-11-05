"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AuthService from "@/services/auth.service";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          }
        } catch (error) {
          // Error validating token, logout and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push("/login");
        }
      } else if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push("/login");
      }
      
      setIsLoading(false);
    };

    validateAuth();
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}