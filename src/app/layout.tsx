import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cursor Pop-Up Portal",
  description: "Event portal for Cursor community meetups",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 antialiased">
        {children}
        <footer className="fixed bottom-4 left-0 right-0 text-center pointer-events-none z-40">
          <span className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-medium">
            Coded by Cursor
          </span>
        </footer>
      </body>
    </html>
  );
}
