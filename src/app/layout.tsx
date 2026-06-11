import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bid & Proposal Response Engine",
  description: "AI-powered RFP analysis, compliance matching, and win-probability scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}