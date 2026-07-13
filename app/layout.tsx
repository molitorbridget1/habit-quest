import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Habit Quest",
  description: "A game-first habit app for kids and families",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">{children}</body>
    </html>
  );
}
