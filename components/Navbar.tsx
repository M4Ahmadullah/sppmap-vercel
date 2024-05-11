import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HiMenuAlt2, HiRefresh } from "react-icons/hi";
import Link from "next/link";
import Image from "next/image";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const NavbarLinks = [
  {
    title: "Introduction",
    href: "/",
  },
  {
    title: "About Maps",
    href: "/topographical-mock-map",
  },
  {
    title: "About Us",
    href: "#about-us",
  },
  {
    title: "Process",
    href: "#process",
  },
  {
    title: "Asked Questions",
    href: "#questions",
  },
];

const Navbar = () => {
  return (
    <div className={cn(`w-full h-[110px] border-none fixed bg-red-800 z-20`)}>
      <Sheet>
        <SheetTrigger className="w-full h-full flex items-center justify-between px-5 text-white">
          <Link href={"/"}>
            <Image src="/logo.png" alt="logo" width={95} height={95} />
          </Link>
          <div className="flex flex-row gap-4">
            <SignedIn>{/* <UserButton /> */}</SignedIn>
            <SignedOut>
              <Link
                href={"/sign-in"}
                className="flex items-center bg-red-900 px-5 py-2 rounded-full hover:bg-red-700 transition-all"
              >
                Login
              </Link>
            </SignedOut>{" "}
            <HiMenuAlt2 className="text-white text-4xl" />
          </div>
        </SheetTrigger>
        <SheetContent side={"left"} className="bg-red-900 text-white">
          <SheetHeader>
            <SheetTitle className="text-3xl mt-5">
              Street Ploter Prime Maps
            </SheetTitle>
            <SheetDescription className="pt-5">
              {NavbarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col text-xl mt-2 hover:text-red-300 hover:transition-all mb-10 lg:mb-5 font-semibold"
                >
                  {link.title}
                </Link>
              ))}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Navbar;
