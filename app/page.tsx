import Image from "next/image";
import { Button } from "@/components/ui/button";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full">
      <div className="h-full">
        <Hero />
        <Testimonials />
      </div>
    </div>
  );
}
