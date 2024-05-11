import { url } from "inspector";
import AboutMap from "@/components/About-map";
import Intro from "@/components/Intro";
import LoginPopup from "./login-popup";
import AboutUs from "./AboutUs";
import Footer from "./Footer";

const Hero = () => {
  return (
    <div className="w-full h-fit">
      <Intro />
      <AboutUs />
      <LoginPopup />
    </div>
  );
};
export default Hero;
