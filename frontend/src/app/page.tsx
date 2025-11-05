"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignup = () => {
    router.push("/signup");
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-background/70 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="h-8 w-8 text-primary" />
                <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1" />
              </div>
              <span className="text-2xl font-bold text-primary">
                Chatterbox
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Login
              </Button>
              <Button
                onClick={handleSignup}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
          <div
            className={`max-w-4xl text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-muted-foreground text-sm font-medium mb-8 animate-pulse">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>New: Voice & Video Calls Available</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-primary">
                Chat Reimagined
              </span>
              <br />
              <span className="text-foreground">for Modern Teams</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience seamless conversations with lightning-fast messaging,
              crystal-clear calls, and powerful collaboration tools—all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                onClick={handleSignup}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl text-lg h-14 px-8 group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleLogin}
                className="border-2 border-border hover:border-primary/50 bg-transparent hover:bg-muted text-foreground text-lg h-14 px-8"
              >
                Login
              </Button>
            </div>

          </div>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-normal filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary rounded-full mix-blend-normal filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-primary rounded-full mix-blend-normal filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}