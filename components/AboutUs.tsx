import Image from "next/image";
import React from "react";

const AboutUs = () => {
  return (
    <div
      className="w-full h-fit p-10 xl:p-28 py-32 flex flex-col lg:flex-row "
      id="about-us"
    >
      <div className="p-10 w-full h-full">
        <h1 className="flex justify-center items-center text-3xl font-semibold pb-10 lg:text-4xl xl:mt-14">
          About Us
        </h1>
        <p className=" text-justify lg:text-xl">
          Welcome to our interactive map experience! Our map project offers a
          seamless and intuitive platform for exploring geographical data with
          ease. With features like interactive drawing tools, undo/redo
          functionality, and a clear map option, users can customize their map
          experience to suit their needs. Don{"'"}t just take our word for it{" "}
          {"-"}
          hear what our satisfied users have to say in our testimonials section.
          Need more information or want access to our map project?
        </p>
        <br />
        <p className="text-justify lg:text-xl">
          Simply hit The Chat Icon, down the Page the right hand side, and our
          team will be in touch with you shortly. Our topographical section
          highlights the clarity of our maps, particularly beneficial for
          drivers navigating unfamiliar terrain. Experience the clarity and
          detail of our maps firsthand, and discover a new way to explore the
          world around you. Thank you for considering our map project, and we
          look forward to sharing the journey with you.
        </p>
      </div>
      <div className="w-full h-full flex items-center justify-center lg:items-end lg:justify-end">
        <Image
          src="/about-us.png"
          alt="about-us"
          width={2000}
          height={100}
          className="w-full h-full lg:w-[1800px] xl:w-[500px] md:w-[500px] rounded-lg"
        />
      </div>
    </div>
  );
};

export default AboutUs;
