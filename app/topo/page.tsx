import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Topo1 from "@/components/topo-components/Topo1";
import { UserButton } from "@clerk/nextjs";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-full">
      <Navbar />
      <div className="w-full h-[100vh] flex flex-col justify-start pt-[150px]">
        <div className="w-full h-fit flex flex-row items-end justify-end pr-10 text-2xl">
          <UserButton />
        </div>
        <Topo1 />
      </div>
      <Footer />
    </div>
  );
};

export default page;
