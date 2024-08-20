import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function TopoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  return (
    <div className="">
      {userId ? (
        <SignedIn>{children}</SignedIn>
      ) : (
        <SignedOut>{redirect("/")}</SignedOut>
      )}
    </div>
  );
}
