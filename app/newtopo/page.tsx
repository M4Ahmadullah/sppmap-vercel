import Navbar from "@/components/Navbar";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-full">
      <Navbar />
      <div className="w-full h-full flex flex-col justify-start lg:pt-36 pt-36">
        <div className="w-full h-fit flex flex-row items-end justify-end pr-10 text-2xl ">
          {/* User button removed - using custom auth */}
        </div>
        <div className="w-full h-full">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Topographical Routes</h1>
            <p className="text-xl text-gray-600">Select a route from the dashboard to begin navigation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
