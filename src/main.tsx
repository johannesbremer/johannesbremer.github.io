import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import { Toaster } from "@/components/ui/sonner";

import App from "./App";
import { ErrorFallback } from "./ErrorFallback";
import "./main.css";
import "./styles/theme.css";
import "./index.css";

const container = document.querySelector("#root");
if (!container) {
  throw new Error("#root container not found");
}
createRoot(container).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
    <Toaster />
  </ErrorBoundary>,
);
