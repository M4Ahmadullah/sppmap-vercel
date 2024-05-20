import React from "react";
import "../../globals.css";

const page = () => {
  return (
    <div>
      <iframe
        src="https://spp-map.com/map.php?startX=20&startY=20&endX=22&endY=21"
        className="app__iframe"
        title="Map"
        allowFullScreen
      />
    </div>
  );
};

export default page;
