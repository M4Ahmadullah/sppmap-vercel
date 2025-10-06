import React from "react";
import "@/app/globals.css";
import { iframeURLs } from "@/constants/newroutesurls/iframeURLsMain";
import ProtectedMapRoute from "@/components/ProtectedMapRoute";

const page = () => {
  const urlObject = iframeURLs[18 - 1];

  if (urlObject) {
    return (
      <ProtectedMapRoute routeName="udeadends Route 1">
        <iframe
          src={urlObject.href}
          className="app__iframe"
          title="Map"
          allowFullScreen
        />
      </ProtectedMapRoute>
    );
  } else {
    return (
      <ProtectedMapRoute routeName="udeadends Route 1">
        <div>There is No Route in This Page</div>
      </ProtectedMapRoute>
    );
  }
};

export default page;
