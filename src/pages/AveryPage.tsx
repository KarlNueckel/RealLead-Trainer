import React, { useEffect, useState } from "react";

export default function AveryPage() {
  const [chatActive, setChatActive] = useState(false);

  useEffect(() => {
    // Dynamically load the Vapi SDK script once
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const toggleChat = () => {
    const widget = document.getElementById("vapiWidget") as any;
    setChatActive((prev) => {
      const newState = !prev;
      widget.style.display = newState ? "block" : "none";
      if (newState && widget?.start) widget.start();
      if (!newState && widget?.end) widget.end();
      return newState;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#eaf3ff] text-center p-6">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Talk with Avery
      </h1>
      <button
        onClick={toggleChat}
        className={`px-6 py-3 rounded-lg text-white font-medium transition ${
          chatActive ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {chatActive ? "End Voice Chat 🔇" : "🎤 Start Talking with Avery"}
      </button>

      <vapi-widget
        id="vapiWidget"
        assistant-id="80afc02e-adde-440d-b93c-dce41722a56f"
        public-key="079cf384-f6b0-4c56-a7b5-6843b494e4fa"
        mode="voice"
        theme="light"
        style={{ display: "none", marginTop: "30px" }}
      ></vapi-widget>
    </div>
  );
}
