import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import "./app.css";

class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 560, margin: "15vh auto", padding: 24, color: "#e9eefb", fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        <p style={{ color: "#8f9bbb" }}>The game hit an unexpected error. No transaction was sent.</p>
        <pre style={{ whiteSpace: "pre-wrap", color: "#ff4d6d" }}>{this.state.error.message}</pre>
        <button onClick={() => location.reload()} style={{ padding: "10px 18px", borderRadius: 10 }}>
          Reload
        </button>
      </div>
    );
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <React.StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </React.StrictMode>,
);
