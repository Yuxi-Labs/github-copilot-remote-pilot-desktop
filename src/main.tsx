import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ContextMenuProvider } from "./components/ContextMenu";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ContextMenuProvider>
        <App />
      </ContextMenuProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
