import "@/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const go = new window.Go();
const wasm = await WebAssembly.instantiateStreaming(
  fetch("/simulation.wasm"),
  go.importObject,
);
go.run(wasm.instance);

const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
