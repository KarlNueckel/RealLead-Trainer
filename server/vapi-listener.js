import http from "http";
import { URL } from "url";

// Local cache for debugging and quick checks
let latestTranscript = [];
let lastModelOutputText = "";

const BACKEND_HOST = "localhost";
const BACKEND_PORT = 3001;
const BACKEND_PATH = "/webhook";

function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data));
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function forwardToBackend(originalReq, bodyBuffer, cb) {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: BACKEND_PATH,
    method: originalReq.method || "POST",
    headers: {
      "Content-Type": originalReq.headers["content-type"] || "application/json",
      "Content-Length": Buffer.byteLength(bodyBuffer),
    },
  };
  const proxyReq = http.request(options, (proxyRes) => {
    // Drain response; we don't need its body for the tunnel
    proxyRes.on("data", () => {});
    proxyRes.on("end", () => cb(null));
  });
  proxyReq.on("error", (err) => cb(err));
  proxyReq.write(bodyBuffer);
  proxyReq.end();
}

const server = http.createServer((req, res) => {
  try {
    console.log(`📡 Incoming ${req.method} ${req.url}`);

    // CORS preflight for completeness
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    const url = new URL(req.url || "http://localhost/", "http://localhost");

    // Provide a debug GET endpoint to read the last transcript captured by the listener
    if (req.method === "GET" && url.pathname === "/api/transcript") {
      return sendJson(res, 200, latestTranscript || []);
    }

    // Read request body (for webhook POST from Vapi)
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const bodyBuffer = Buffer.concat(chunks);
      let parsed = null;
      try {
        parsed = JSON.parse(bodyBuffer.toString("utf8") || "{}");
      } catch {}

      // If it looks like an end-of-call-report, capture transcript for debug
      const type = parsed?.type || parsed?.event;
      const text = parsed?.data?.text || parsed?.data?.transcript || parsed?.text || parsed?.message || "";
      // Track last model output text
      if (type === "model-output" && text) {
        lastModelOutputText = String(text);
      }
      // Filter voice-input echoes that exactly repeat last model output
      if (type === "voice-input" && text && lastModelOutputText && String(text) === lastModelOutputText) {
        console.log("🚫 Skipping echo from model-output in listener");
        return sendJson(res, 200, { ok: true, skipped: true });
      }
      if (type === "end-of-call-report") {
        const data = parsed?.data || parsed?.payload || {};
        const raw = data?.transcript || data?.artifacts?.transcript || [];
        latestTranscript = Array.isArray(raw) ? raw : [];
        console.log("✅ Stored transcript with", latestTranscript.length, "entries");
      }

      // Forward the webhook to the backend regardless, so backend cache stays authoritative
      forwardToBackend(req, bodyBuffer, (err) => {
        if (err) {
          console.error("❌ Forwarding to backend failed:", err.message || err);
          return sendJson(res, 502, { error: "forward_failed" });
        }
        return sendJson(res, 200, { ok: true });
      });
    });
  } catch (e) {
    console.error("Listener error:", e);
    return sendJson(res, 500, { error: "listener_failed" });
  }
});

server.listen(4242, () => {
  console.log("✅ Listening on port 4242");
  console.log(`➡️ Forwarding Vapi events to http://${BACKEND_HOST}:${BACKEND_PORT}${BACKEND_PATH}`);
});
