import { useState, useEffect, useRef } from "react";
import { CallConfig } from "./ConfigurationPage";

export interface TranscriptEntry {
  speaker: "user" | "ai";
  message: string;
  timestamp: number;
}

interface CallSimulationPageProps {
  config: CallConfig;
  onEndCall: (transcript: TranscriptEntry[], duration: number) => void;
}

export function CallSimulationPage({ config, onEndCall }: CallSimulationPageProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string>("Initializing...");
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // System prompt based on configuration
  const getSystemPrompt = () => {
    const scenarioPrompts = {
      "cold-call": "You are a skeptical business owner receiving a cold call. Be professional but cautious. Ask questions about the product/service being offered.",
      "follow-up": "You are a potential client who showed initial interest. You're open to discussion but need more details to make a decision.",
      "demo": "You are a curious prospect attending a product demo. Ask clarifying questions and express both interest and concerns.",
    };

    const difficultyModifiers = {
      "easy": "Be receptive and friendly.",
      "medium": "Be moderately skeptical but open-minded.",
      "hard": "Be very skeptical and challenging. Push back on claims and ask difficult questions.",
    };

    return `${scenarioPrompts[config.scenario as keyof typeof scenarioPrompts]} ${difficultyModifiers[config.difficulty as keyof typeof difficultyModifiers]} Keep responses conversational and realistic. Respond naturally as if in a real phone conversation.`;
  };

  // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      try {
        setStatus("Requesting session token...");
        
        // Get session token from backend
        const response = await fetch("/api/realtime-session");
        if (!response.ok) {
          throw new Error("Failed to get session token");
        }
        
        const sessionData = await response.json();
        const ephemeralKey = sessionData.client_secret?.value;
        
        if (!ephemeralKey) {
          throw new Error("No ephemeral key received");
        }

        setStatus("Connecting to OpenAI...");

        // Create WebSocket connection
        const ws = new WebSocket(
          "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
          ["realtime", `openai-insecure-api-key.${ephemeralKey}`, "openai-beta.realtime-v1"]
        );

        wsRef.current = ws;

        ws.addEventListener("open", () => {
          if (!mounted) return;
          console.log("WebSocket connected");
          setIsConnected(true);
          setStatus("Connected - Ready to talk");

          // Configure session with system prompt
          ws.send(JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: getSystemPrompt(),
              voice: "verse",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 700,
              },
            },
          }));

          // Start microphone
          startMicrophone();
        });

        ws.addEventListener("message", async (event) => {
          if (!mounted) return;
          
          try {
            const message = JSON.parse(event.data);
            handleRealtimeEvent(message);
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        });

        ws.addEventListener("error", (error) => {
          console.error("WebSocket error:", error);
          setStatus("Connection error");
        });

        ws.addEventListener("close", () => {
          console.log("WebSocket closed");
          setIsConnected(false);
          setStatus("Disconnected");
        });

      } catch (error) {
        console.error("Initialization error:", error);
        setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  // Timer
  useEffect(() => {
    if (!isConnected) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected]);

  // Handle Realtime API events
  const handleRealtimeEvent = async (event: any) => {
    // Log all events for debugging
    console.log("Realtime event:", event.type, event);

    switch (event.type) {
      case "session.created":
        console.log("✅ Session created:", event.session);
        break;

      case "session.updated":
        console.log("✅ Session updated successfully");
        break;

      case "conversation.item.created":
        console.log("💬 Item created:", event.item);
        break;

      case "response.audio_transcript.delta":
        // Real-time transcript deltas (partial)
        console.log("📝 AI transcript delta:", event.delta);
        break;

      case "response.audio_transcript.done":
        // Complete transcript from AI
        console.log("✅ AI transcript complete:", event.transcript);
        const aiMessage = event.transcript;
        if (aiMessage) {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: "ai",
              message: aiMessage,
              timestamp: timeElapsed,
            },
          ]);
        }
        break;

      case "response.audio.delta":
        // Audio data from AI
        const audioDelta = event.delta;
        if (audioDelta) {
          await playAudioDelta(audioDelta);
        }
        break;

      case "response.audio.done":
        console.log("✅ Audio response complete");
        break;

      case "conversation.item.input_audio_transcription.completed":
        // User's speech transcribed
        console.log("✅ User speech transcribed:", event.transcript);
        const userMessage = event.transcript;
        if (userMessage) {
          setTranscript((prev) => [
            ...prev,
            {
              speaker: "user",
              message: userMessage,
              timestamp: timeElapsed,
            },
          ]);
        }
        break;

      case "input_audio_buffer.speech_started":
        console.log("🎤 User started speaking");
        setIsRecording(true);
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("🛑 User stopped speaking");
        setIsRecording(false);
        break;

      case "input_audio_buffer.committed":
        console.log("✅ Audio buffer committed");
        break;

      case "response.created":
        console.log("🤖 AI response created");
        break;

      case "response.done":
        console.log("✅ AI response done");
        break;

      case "error":
        console.error("❌ Realtime API error:", event.error);
        setStatus(`Error: ${event.error.message}`);
        break;

      default:
        // Log unhandled events
        console.log("🔔 Unhandled event:", event.type);
    }
  };

  // Start microphone and stream to WebSocket
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send as base64
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(pcm16.buffer))
        );

        wsRef.current.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64,
          })
        );
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("Microphone started");
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("Microphone access denied");
    }
  };

  // Play audio delta from AI
  const playAudioDelta = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const audioBuffer = audioContextRef.current.createBuffer(
        1,
        float32Array.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Array);

      audioQueueRef.current.push(audioBuffer);

      if (!isPlayingRef.current) {
        playNextAudio();
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  // Play queued audio
  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift()!;

    const source = audioContextRef.current!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current!.destination);
    
    source.onended = () => {
      playNextAudio();
    };

    source.start();
  };

  // Cleanup
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const handleEndCall = () => {
    cleanup();
    onEndCall(transcript, timeElapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎙️ Voice Call in Progress</h2>
            <p className="text-sm text-gray-600">
              {config.scenario} • {config.difficulty}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-indigo-600">
              {formatTime(timeElapsed)}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {isConnected ? (
                <span className="text-green-600 font-semibold">● {status}</span>
              ) : (
                <span className="text-yellow-600">{status}</span>
              )}
            </div>
            <button
              onClick={handleEndCall}
              className="mt-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              End Call
            </button>
          </div>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Recording your voice...</span>
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {transcript.length === 0 && isConnected && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-lg">Start speaking to begin the conversation!</p>
            <p className="text-sm mt-2">The AI will respond automatically.</p>
          </div>
        )}
        
        {transcript.map((entry, idx) => (
          <div
            key={idx}
            className={`flex ${
              entry.speaker === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xl px-4 py-3 rounded-lg ${
                entry.speaker === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <div className="text-sm font-semibold mb-1">
                {entry.speaker === "user" ? "You" : "AI Prospect"}
              </div>
              <div>{entry.message}</div>
              <div className={`text-xs mt-1 ${
                entry.speaker === "user" ? "text-indigo-200" : "text-gray-500"
              }`}>
                {formatTime(entry.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="text-center text-sm text-gray-600">
          <p>💡 <strong>Tip:</strong> Speak naturally - the AI will detect when you start and stop talking.</p>
        </div>
      </div>
    </div>
  );
}
