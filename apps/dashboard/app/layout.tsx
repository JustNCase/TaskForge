import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskForge AI - AI-Powered Task Management",
  description: "Intelligent task management with AI-powered prioritization and automation",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gray-50 dark:bg-gray-900">
        <Providers>
          <Nav />
          <ErrorBoundary>
            <main className="max-w-7xl mx-auto px-4 py-8">
              {children}
            </main>
          </ErrorBoundary>
          <KeyboardShortcuts />
        </Providers>
      </body>
    </html>
  );
}
