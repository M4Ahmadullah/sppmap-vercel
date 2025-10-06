import React from "react";
import "@/app/globals.css";
import { TunnelsURLs } from "@/constants/newroutesurls/iframeURLsMain";
import ProtectedMapRoute from "@/components/ProtectedMapRoute";

const page = () => {
  const urlObject = TunnelsURLs[6 - 1];

  if (urlObject) {
    return (
      <ProtectedMapRoute routeName="utunnels Route 6">
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
      <ProtectedMapRoute routeName="utunnels Route 6">
        <div>There is No Route in This Page</div>
      </ProtectedMapRoute>
    );
  }
};

export default page;
