import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// If deployed (not localhost), use the Render API URL
if (window.location.hostname !== "localhost") {
  setBaseUrl("https://lakshmi-hostel-api.onrender.com");
}

createRoot(document.getElementById("root")!).render(<App />);
