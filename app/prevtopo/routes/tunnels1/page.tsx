import React from "react";
import "@/app/globals.css";
import { TunnelsURLs } from "@/constants/prevroutesurls/iframeURLsMain";

const page = () => {
  const urlObject = TunnelsURLs[1 - 1];

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
