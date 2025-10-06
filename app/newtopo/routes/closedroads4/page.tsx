import React from "react";
import "@/app/globals.css";
import { ClosedRoadsURLs } from "@/constants/newroutesurls/iframeURLsMain";
import ProtectedMapRoute from "@/components/ProtectedMapRoute";

const page = () => {
  const urlObject = ClosedRoadsURLs[4 - 1];

  if (urlObject) {
    return (
      <ProtectedMapRoute routeName="uclosedroads Route 4">
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
      <ProtectedMapRoute routeName="uclosedroads Route 4">
        <div>There is No Route in This Page</div>
      </ProtectedMapRoute>
    );
  }
};

export default page;
