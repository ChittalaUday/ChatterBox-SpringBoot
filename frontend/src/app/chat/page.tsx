"use client";

import { Suspense } from "react";
import { ChatMain } from "@/components/chat-main";
import { AppLayout } from "@/components/app-layout";

function ChatContent() {
  return <ChatMain />;
}

function AppLayoutWrapper() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </AppLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AppLayoutWrapper />
    </Suspense>
  );
}