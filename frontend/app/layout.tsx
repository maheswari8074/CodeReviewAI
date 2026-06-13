import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeReviewAI — AI-Powered Code Review",
  description: "Get instant AI-powered code reviews with bug detection, complexity analysis, and refactoring suggestions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}