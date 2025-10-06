import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/lib/dark-mode-context";
import SessionMonitor from "@/components/SessionMonitor";

import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Street Plotter Prime Maps",
  description: "Topographical Route Navigation System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased bg-white dark:bg-slate-900",
          fontSans.variable
        )}
      >
        <DarkModeProvider>
          <SessionMonitor />
          <main>
            <div className="w-full h-full">{children}</div>
          </main>
        </DarkModeProvider>
      </body>
    </html>
  );
}
