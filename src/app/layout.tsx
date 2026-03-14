import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileNav from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "SQF Reports",
  description: "Safe Quality Food report management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SQF Reports",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="max-w-lg mx-auto min-h-screen pb-20">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
