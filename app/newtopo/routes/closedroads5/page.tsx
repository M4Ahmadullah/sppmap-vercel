import React from "react";
import "@/app/globals.css";
import { ClosedRoadsURLs } from "@/constants/newroutesurls/iframeURLsMain";
import ProtectedMapRoute from "@/components/ProtectedMapRoute";

const page = () => {
  const urlObject = ClosedRoadsURLs[5 - 1];

  if (urlObject) {
    return (
      <ProtectedMapRoute routeName="uclosedroads Route 5">
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
      <ProtectedMapRoute routeName="uclosedroads Route 5">
        <div>There is No Route in This Page</div>
      </ProtectedMapRoute>
    );
  }
};

export default page;
