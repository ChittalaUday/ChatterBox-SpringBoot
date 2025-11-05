"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AuthService from "@/services/auth.service";

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

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  gender: string;
  dob: string;
  role: string;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = AuthService.getToken();
      const currentUser = AuthService.getCurrentUser();
      
      if (token && currentUser) {
        // Validate token with backend
        try {
          const isValid = await AuthService.validateToken();
          if (isValid) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            AuthService.logout();
          }
        } catch (error) {
          // Error validating token, clear storage
          AuthService.logout();
        }
      }
      
      // Mark initialization as complete
      setIsInitializing(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      // Ensure role is provided if not already present
      const userDataWithRole = {
        ...userData,
        role: userData.role || "USER"  // Default to "USER" if role is not provided
      };
      
      const response = await AuthService.register(userDataWithRole);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}