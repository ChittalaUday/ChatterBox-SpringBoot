"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Bell, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const features = [
    {
      title: "Chat",
      description: "Start conversations with your friends",
      icon: MessageSquare,
      href: "/dashboard/chat",
    },
    {
      title: "Friends",
      description: "Manage your friend connections",
      icon: Users,
      href: "/dashboard/friends",
    },
    {
      title: "Notifications",
      description: "View your latest notifications",
      icon: Bell,
      href: "/dashboard/notifications",
    },
    {
      title: "Settings",
      description: "Customize your profile and preferences",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Welcome to Chatterbox
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with friends, share messages, and stay updated with your social network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={feature.href}>Go to {feature.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Select a feature above to get started
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}