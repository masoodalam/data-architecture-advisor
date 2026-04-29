import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const redirect = sessionStorage.getItem("data-architecture-advisor:redirect");
if (redirect) {
  sessionStorage.removeItem("data-architecture-advisor:redirect");
  if (redirect === "/aws-cost-designer") {
    window.history.replaceState({}, "", "/data-architecture-advisor/aws-cost-designer");
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
