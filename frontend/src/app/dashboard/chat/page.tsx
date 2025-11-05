"use client";

import { Suspense } from "react";
import { ChatMain } from "@/components/chat-main";

function ChatContent() {
  return <ChatMain />;
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
      <ChatContent />
    </Suspense>
  );
}