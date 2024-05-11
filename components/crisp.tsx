"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("5f272e6b-c5c4-404d-ab7c-33b0f47b0065");
  });

  return null;
};

export default CrispChat;
