import Link from "next/link";
import React from "react";
import { MapUrl } from "@/constants/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";

const Topo1 = () => {
  return (
    <div className="w-full h-full px-20 flex flex-col bg-white md:px-28 lg:flex-row lg:flex-wrap justify-center items-center lg:gap-3 mb-20">
      {MapUrl.map((card) => (
        <Card
          key={card.key}
          className="w-full h-full lg:w-[380px] bg-red-800 py-5 lg:py-5 px-10 lg:px-10 rounded-3xl border-2 border-black hover:bg-red-700 transition-all ease-in-out flex flex-col items-center justify-center text-white mt-10 lg:mt-0"
        >
          <CardHeader>
            <CardTitle className="flex justify-center">{card.title}</CardTitle>
            <CardDescription className="pt-5">
              <span className="font-semibold">Description:</span>{" "}
              {card.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{card.streets}</p>
          </CardContent>
          <CardFooter>
            <Button
              variant={"secondary"}
              className="bg-white hover:bg-black hover:text-white text-black border-2 border-black rounded-xl px-12 md:px-28"
            >
              <Link href={`${card.href}`}>Go to Route</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Topo1;
