import React from "react";
import "@/app/globals.css";
import { iframeURLs } from "@/constants/iframeURLsMain";

const page = () => {
  const urlObject = iframeURLs[20 - 1];

  if (urlObject) {
    return (
      <iframe
        src={urlObject.href}
        className="app__iframe"
        title="Map"
        allowFullScreen
      />
    );
  } else {
    return <div>There is No Route in This Page</div>;
  }
};

export default page;
