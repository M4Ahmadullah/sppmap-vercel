import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { FaLocationDot } from "react-icons/fa6";
import { IoMdMail } from "react-icons/io";
import { FaPhoneAlt } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaFacebookF } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";

const Links = [
  {
    title: "Home",
    link: "/",
  },
  {
    title: "Topographical Map",
    link: "/topo",
  },
  {
    title: "FAQ's",
    link: "/faqs",
  },
  {
    title: "Contact",
    link: "/contact",
  },
  {
    title: "Login",
    link: "/login",
  },
];

const contacts = [
  {
    title: "email",
    contact: "hello@streetploterprime.co.uk",
    icon: <IoMdMail />,
  },
  {
    title: "location",
    contact: "London",
    icon: <FaLocationDot />,
  },

  {
    title: "Number",
    contact: "+44123456789",
    icon: <FaPhoneAlt />,
  },
];

const follow = [
  {
    title: "Youtube",
    link: "",
    icon: <FaYoutube />,
  },
  {
    title: "Facebook",
    link: "",
    icon: <FaFacebookF />,
  },
  {
    title: "X",
    link: "",
    icon: <FaSquareXTwitter />,
  },
];
const Footer = () => {
  return (
    <footer className="w-full h-fit bg-black flex flex-col items-center lg:items-start justify-center lg:flex-row lg:flex-wrap text-white lg:justify-between lg:p-16 lg:pb-8">
      <div
        className="flex flex-col items-center justify-center mt-20 lg:mt-0 xl:pl-40 lg:pl-20"
        id="links"
      >
        <h1 className="font-semibold text text-4xl mb-10">
          Use Full <span className="text-red-600">Links</span>
        </h1>
        {Links.map((link) => (
          <Link key={link.title} href={link.link} className="mb-5 lg:mb-2">
            <Button className="text-xl hover:text-red-600 font-semibold">
              {link.title}
            </Button>
          </Link>
        ))}
      </div>
      <div
        className="flex flex-col items-center justify-center mt-20 lg:mt-0"
        id="contact"
      >
        <h1 className="font-semibold text text-4xl mb-10 text-red-600 ">
          Contact
        </h1>
        {contacts.map((contact) => (
          <Link
            key={contact.title}
            href={contact.contact}
            className="mb-5 lg:mb-2 flex items-center justify-center hover:text-red-600"
          >
            <div className="text-2xl ">{contact.icon}</div>
            <Button className="text-xl font-semibold">{contact.title}</Button>
          </Link>
        ))}
      </div>
      <div id="follow" className="xl:pr-40 lg:pr-20">
        <h1 className="font-semibold text text-4xl mb-2 text-red-600 mt-14 lg:mt-0">
          Follow Us
        </h1>
        {follow.map((link) => (
          <Link
            key={link.title}
            href={link.link}
            className="mb-5 lg:mb-2 flex items-center justify-center hover:text-red-600"
          >
            <Button className="text-4xl mt-10">{link.icon}</Button>
          </Link>
        ))}
      </div>
      <hr className="w-full h-[10px] mt-10" />
      <div className="w-full flex flex-row justify-between pb-5 pt-2 lg:pt-5 px-5">
        <h3>&copy; Copyright 2024</h3>
        <h3>All Rights Reserved</h3>
      </div>
    </footer>
  );
};

export default Footer;
