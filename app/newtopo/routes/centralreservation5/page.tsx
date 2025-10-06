import React from "react";
import "@/app/globals.css";
import { iframeURLs } from "@/constants/newroutesurls/iframeURLsMain";
import ProtectedMapRoute from "@/components/ProtectedMapRoute";

const page = () => {
  const urlObject = iframeURLs[30 - 1];

  if (urlObject) {
    return (
      <ProtectedMapRoute routeName="ucentralreservation Route 5">
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
      <ProtectedMapRoute routeName="ucentralreservation Route 5">
        <div>There is No Route in This Page</div>
      </ProtectedMapRoute>
    );
  }
};

export default page;
