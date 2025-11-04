import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";


export const metadata: Metadata = {
  title: "Chatterbox",
  description: "A modern chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}