import "./globals.css";
import type { Metadata, Viewport } from "next";
import RegisterSW from "./register-sw";

export const metadata: Metadata = {
  title: "Habit Quest",
  description: "A game-first habit app that teaches kids why healthy habits matter",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Habit Quest",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6F5E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
