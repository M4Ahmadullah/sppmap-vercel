import React from "react";
import "@/app/globals.css";
import { ShortRoutes } from "@/constants/newroutesurls/iframeURLsMain";
import ProtectedMapRoute from "@/components/ProtectedMapRoute";

const page = () => {
  const urlObject = ShortRoutes[3 - 1];

  if (urlObject) {
    return (
      <ProtectedMapRoute routeName="ushortroutes Route 3">
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
      <ProtectedMapRoute routeName="ushortroutes Route 3">
        <div>There is No Route in This Page</div>
      </ProtectedMapRoute>
    );
  }
};

export default page;
