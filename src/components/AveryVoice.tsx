import React, { useEffect, useRef, useState } from "react";
import Vapi, * as VapiNS from "@vapi-ai/web";

type Status = "idle" | "loading" | "ready" | "error";

export default function AveryVoice() {
  console.log("🟢 AveryVoice rendering");
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY as string | undefined;
  const assistantId = import.meta.env.VITE_AVERY_ASSISTANT_ID as string | undefined;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<InstanceType<typeof Vapi> | null>(null);
  const mountedRef = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔹 AveryVoice useEffect running");
    if (mountedRef.current) return;
    mountedRef.current = true;

    (async () => {
      try {
        console.log("🔹 Keys present:", !!publicKey, !!assistantId);
        console.log("🔹 Container before mount:", containerRef.current);
        if (!publicKey || !assistantId) {
          setErr("Missing Vapi credentials. Check .env.local for keys.");
          setStatus("error");
          return;
        }

        if (!containerRef.current) {
          setErr("Voice container not found.");
          setStatus("error");
          return;
        }

        setStatus("loading");
        const anyNS: any = VapiNS as any;
        let mounted = false;

        // Pattern 1: class/function default export with instance methods
        if (typeof (Vapi as unknown) === "function") {
          const client: any = new (Vapi as any)(publicKey);
          console.log("🔹 Client created:", !!client);
          clientRef.current = client;
          if (client && typeof client.mountWidget === "function") {
            await client.mountWidget(containerRef.current, { assistantId, theme: "light" });
            mounted = true;
          } else if (client && typeof client.widget === "function") {
            await client.widget({ container: containerRef.current, assistantId, theme: "light" });
            mounted = true;
          }
        }

        // Pattern 2: named/static creator
        if (!mounted && typeof anyNS?.createWidget === "function") {
          await anyNS.createWidget({ publicKey, assistantId, container: containerRef.current, theme: "light" });
          mounted = true;
        }
        if (!mounted && typeof (Vapi as any)?.createWidget === "function") {
          await (Vapi as any).createWidget({ publicKey, assistantId, container: containerRef.current, theme: "light" });
          mounted = true;
        }

        // Pattern 3: Web component custom element (vapi-widget / vapi-assistant)
        if (!mounted && containerRef.current) {
          const tagNames = ["vapi-widget", "vapi-assistant"];
          for (const name of tagNames) {
            try {
              const el = document.createElement(name) as any;
              if (el) {
                // try both property and attribute assignment
                el.publicKey = publicKey;
                el.assistantId = assistantId;
                el.setAttribute?.("public-key", publicKey);
                el.setAttribute?.("assistant-id", assistantId);
                containerRef.current.innerHTML = "";
                containerRef.current.appendChild(el);
                mounted = true;
                break;
              }
            } catch (_) {}
          }
        }

        if (!mounted) {
          throw new Error("Vapi widget mount API not found (mountWidget/widget/createWidget/web component). Update @vapi-ai/web or check docs.");
        }
        console.log("🎤 Mounted widget successfully");

        setStatus("ready");
      } catch (e: any) {
        console.error("Vapi init error:", e);
        setErr(e?.message || "Failed to initialize Vapi widget.");
        setStatus("error");
      }
    })();

    return () => {
      clientRef.current?.destroy?.();
      clientRef.current = null;
      mountedRef.current = false;
    };
  }, [publicKey, assistantId]);

  return (
    <div style={{ width: "100%,", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 12px", fontWeight: 600 }}>Avery (Vapi)</div>

      {status !== "ready" && (
        <div
          style={{
            margin: 12,
            padding: 12,
            borderRadius: 12,
            background: status === "error" ? "#ffe6e6" : "#eef6ff",
            color: status === "error" ? "#b30000" : "#245ea6",
          }}
        >
          {status === "idle" && "Preparing voice widget…"}
          {status === "loading" && "Loading assistant…"}
          {status === "error" && (err || "Something went wrong.")}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 360,
          borderRadius: 16,
          background: "#f9fbff",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
