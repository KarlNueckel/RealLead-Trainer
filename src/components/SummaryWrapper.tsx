import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SessionSummaryPage } from "./SessionSummaryPage";

interface TranscriptEntry {
  speaker: "user" | "ai" | string;
  message: string;
  timestamp?: number;
}

type NavState = {
  transcript?: TranscriptEntry[];
  duration?: number;
  scenario?: string;
  difficulty?: string;
  persona?: any;
};

export default function SummaryWrapper() {
  const { state } = useLocation() as { state?: NavState };
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState<TranscriptEntry[] | undefined>(state?.transcript);
  const [duration, setDuration] = useState<number | undefined>(state?.duration);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Pass through any extra meta if present
  const scenario = state?.scenario;
  const difficulty = state?.difficulty;
  const persona = state?.persona;

  useEffect(() => {
    // If no transcript was passed from the simulator, fetch from backend
    if (!state?.transcript || state.transcript.length === 0) {
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      const callId = params.get('callId');

      const fetchLatest = () =>
        fetch("/api/transcript")
          .then((res) => res.json())
          .then((data) => {
            console.log("Fetched /api/transcript payload:", data);
            if (Array.isArray(data)) {
              setTranscript(data);
            } else if (Array.isArray((data as any)?.transcript)) {
              setTranscript((data as any).transcript);
            } else {
              console.warn("⚠️ No transcript data received from backend.");
              setTranscript([]);
            }
          });

      const fetchById = (id: string) =>
        fetch(`/api/transcripts/${encodeURIComponent(id)}`)
          .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Call ${id} not found`)))
          .then((rec) => {
            console.log("Fetched /api/transcripts/:callId payload:", rec);
            if (Array.isArray(rec?.transcript)) {
              setTranscript(rec.transcript);
              // Prefer server duration if we didn’t have it
              if (typeof duration !== 'number' && typeof rec.durationMs === 'number') {
                setDuration(Math.round(rec.durationMs / 1000));
              }
            } else {
              console.warn("⚠️ No transcript in record for callId", id);
              setTranscript([]);
            }
          });

      const start = callId ? fetchById(callId) : fetchLatest();

      start
        .then(() => {
          // If still empty after first fetch, poll for a few seconds for late-arriving webhook
          if (!state?.transcript && (!transcript || transcript.length === 0)) {
            setPolling(true);
            let attempts = 0;
            const timer = setInterval(async () => {
              attempts += 1;
              try {
                const r = await fetch("/api/transcript");
                const data = await r.json();
                if (Array.isArray(data) && data.length > 0) {
                  console.log("Polling got transcript:", data);
                  setTranscript(data);
                  clearInterval(timer);
                  setPolling(false);
                } else if (Array.isArray((data as any)?.transcript) && (data as any).transcript.length > 0) {
                  console.log("Polling got transcript object:", data);
                  setTranscript((data as any).transcript);
                  clearInterval(timer);
                  setPolling(false);
                } else if (attempts >= 12) {
                  clearInterval(timer);
                  setPolling(false);
                }
              } catch (e) {
                if (attempts >= 12) {
                  clearInterval(timer);
                  setPolling(false);
                }
              }
            }, 1000);
          }
        })
        .catch((err) => {
          console.error("❌ Error fetching transcript:", err);
          setTranscript([]);
        })
        .finally(() => setLoading(false));
    }
  }, [state, duration]);

  if (!transcript && (loading || polling)) {
    return <div className="p-6 text-gray-600">Loading transcript…</div>;
  }

  return (
    <SessionSummaryPage
      transcript={transcript || []}
      duration={typeof duration === "number" ? duration : 0}
      scenario={scenario}
      difficulty={difficulty}
      persona={persona}
      onBackToHome={() => navigate("/")}
      onNewSession={() => navigate("/scenarios")}
    />
  );
}
