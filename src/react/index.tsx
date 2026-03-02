import { createRoot } from "react-dom/client";
import { App } from "./app";

let container: HTMLDivElement | null = null;

function setupReact() {
  container = document.getElementById("react-root") as HTMLDivElement | null;

  if (!container) {
    console.error("Can't find root");
    return;
  }

  const root = createRoot(container);

  root.render(<App />);
}

export { setupReact };
