import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context";

export const metadata: Metadata = {
  title: "Genesis-OS",
  description: "AI-Powered Dashboard with Voice Control",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
