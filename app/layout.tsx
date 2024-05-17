import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SPP Map",
  description: "SPP Map is a Topographical Map",
  icons: "/favicon.ico",
};

export default function RootLayout({
  children,
  hideNavbarFooter = true,
}: Readonly<{
  children: React.ReactNode;
  hideNavbarFooter: React.ReactNode;
}>) {
  const CrispWithSSR = dynamic(() => import("../components/crisp"));
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased bg-white",
            fontSans.variable
          )}
        >
          <CrispWithSSR />
          <main>
            <div className="w-full h-full">{children}</div>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
