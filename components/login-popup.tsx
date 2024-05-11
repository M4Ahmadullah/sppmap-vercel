"use client";
import React from "react";
import Link from "next/link";
import TypewriterComponent from "typewriter-effect";
import { CardDemo } from "@/components/CardDemo";
import Footer from "./Footer";

const AboutLoginPopup = () => {
  return (
    <div className="w-full h-full" id="process">
      <div className="w-full h-full">
        <div
          className="w-full h-fit pt-40 pb-28"
          style={{ backgroundImage: "url(/bg-login.png)" }}
        >
          <div className="w-full h-full flex items-center justify-center  ">
            <h1 className="bg-red-900 text-3xl font-bold text-center text-white rounded-2xl p-5 px-[10vw] mb-5 mx-10">
              Understanding the Process
            </h1>
          </div>
          <CardDemo />
        </div>
      </div>
    </div>
  );
};

export default AboutLoginPopup;
