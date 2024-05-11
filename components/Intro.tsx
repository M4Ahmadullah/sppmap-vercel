import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

const Intro = () => {
  return (
    <div
      className="w-[100vw] h-[100vh] lg:h-[100vh] pt-44 bg-cover"
      style={{
        backgroundImage: "url(/head-hero-bg.jpg)",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className=" w-full h-fit text-white flex flex-col pt-[10%] items-center justify-center">
        <h1
          className="w-full h-fit text-5xl text-center  
        font-semibold font-serif p-10 pt-0"
        >
          Welcome To the Street Ploter Prime Maps
        </h1>
        <p className="text-4xl py-2 text-center">
          Route Planing & Ploting Mock Maps
        </p>
        <p className="text-4xl text-center">Topographical Mock Maps</p>

        <SignedIn>
          <Link href={"/topo"}>
            <button
              className={cn(
                "mt-20 bg-red-700 hover:bg-red-600 transition-all rounded-full text-xl p-5"
              )}
            >
              Topographical Mock Map
            </button>
          </Link>
        </SignedIn>
        <SignedOut>
          <Link href={"/topographical-mock-map"}>
            <button
              className={cn(
                "mt-20 bg-red-700 hover:bg-red-600 transition-all rounded-full text-xl p-5 "
              )}
            >
              Topographical Mock Map
            </button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
};

export default Intro;
