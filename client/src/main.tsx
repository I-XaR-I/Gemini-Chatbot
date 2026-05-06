import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "katex/dist/katex.min.css";
import "./index.css";

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
