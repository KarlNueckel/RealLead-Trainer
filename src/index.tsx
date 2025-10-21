import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// Suppress noisy extension warning during rapid navigations in dev
if (import.meta.env?.DEV) {
  window.addEventListener('error', (e) => {
    const msg = (e as ErrorEvent)?.message || '';
    if (typeof msg === 'string' && msg.includes('A listener indicated an asynchronous response')) {
      e.stopImmediatePropagation();
    }
  });
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// NOTE: React.StrictMode disabled to prevent double WebSocket sessions
// StrictMode intentionally mounts components twice in development,
// which creates duplicate OpenAI Realtime API sessions and doubles API costs.
// Since we're using external paid APIs (OpenAI Realtime), we can't afford double sessions.
root.render(
  <App />
);
