import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeReviewAI | Understand and improve your code",
  description:
    "Review code snippets and GitHub repositories with AI-powered findings, quality scores, refactoring suggestions, analytics, chat, and PDF reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
