import React from "react";
import Image from "next/image";

const page = () => {
  return (
    <div className="w-full h-full pt-44 pb-20">
      <div className="flex flex-col lg:flex-row ">
        <p className="w-full text-justify lg:pl-10 px-10 lg:px-0 lg:py-2 lg:text-xl lg:pt-10">
          Welcome to our immersive map experience! Our innovative map platform
          offers a comprehensive solution for navigating and exploring
          geographical data effortlessly. Tailored specifically for PCO drivers
          in London undergoing the TFL SERU Assessment, our map project serves
          as an indispensable tool for mastering the intricacies of London{"'"}s
          intricate road network. Designed with user convenience in mind, our
          map project boasts an array of advanced features to empower users in
          their exploration endeavors. Dive into an intuitive interface equipped
          with cutting-edge tools such as interactive drawing functionalities,
          allowing users to mark points of interest and create personalized
          routes with ease. Our undo/redo functionality ensures seamless
          editing, giving users the freedom to experiment and refine their maps
          to perfection. For those seeking clarity and precision, our
          topographical section showcases detailed maps tailored for various
          purposes, from outdoor enthusiasts planning hiking trails to urban
          commuters navigating city streets. But {"don'"}t just take our word
          for it - explore our testimonials section to hear firsthand from our
          delighted users who have experienced the transformative power of our
          map project. Need more information or eager to access our map
          platform? Simply click the Chat Icon located on the right-hand side of
          the page, and our dedicated team will be delighted to assist you.
          Thank you for considering our map project; we{"'"}re thrilled to
          embark on this exploration journey with you!
        </p>

        <Image
          src="/about-us.png"
          alt=""
          width="700"
          height="1000"
          className="w-full h-full px-5 py-10  text-center md:p-20 md:py-3 md:pt-10"
        />
      </div>
    </div>
  );
};

export default page;
