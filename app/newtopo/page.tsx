import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Topo1 from "@/components/topo-components/Topo1";
import { UserButton } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-full">
      <Navbar />
      <div className="w-full h-full flex flex-col justify-start lg:pt-36 pt-36">
        <div className="w-full h-fit flex flex-row items-end justify-end pr-10 text-2xl ">
          <UserButton />
        </div>
        <div className="w-full h-full">
          <Topo1 />
        </div>
      </div>
    </div>
  );
};

export default page;
