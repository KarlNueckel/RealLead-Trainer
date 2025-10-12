import { useState, useEffect, useRef } from "react";
import { CallConfig } from "./ConfigurationPage";
import KaraokeCall, { ScriptChunk } from "./KaraokeCall";

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
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  
  // Script state
  const [scriptChunks, setScriptChunks] = useState<ScriptChunk[]>([]);
  const userSilenceCallbackRef = useRef<(() => void) | null>(null);
  const aiFinishCallbackRef = useRef<(() => void) | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const apiFinishedSendingRef = useRef(false); // Track when API stops sending chunks
  const playbackSafetyTimeoutRef = useRef<number | null>(null); // Safety fallback after API done

  // Parse script into KaraokeCall chunks on mount - ONLY USER LINES
  useEffect(() => {
    if (config.script?.content) {
      const chunks: ScriptChunk[] = [];
      let currentLabel = "";

      // Split by double newlines to get sections
      const sections = config.script.content.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
      
      for (const section of sections) {
        const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Check if first line is a label/header
        const firstLine = lines[0];
        if (firstLine.match(/^(Introduction|Opening|Purpose|Value|Question|Response|Closing|Next Steps|Qualifying Questions|Reconnection|Recap|Call to Action|Market Expertise|Unique Value):/i)) {
          currentLabel = firstLine.replace(/:.*/, ''); // Extract label
          
          // Join remaining lines as the text
          const text = lines.slice(1).join('\n').replace(/^[""]|[""]$/g, '').trim();
          if (text) {
            // ONLY add user script lines - AI responds dynamically
            chunks.push({
              speaker: "user",
              text: text,
              label: currentLabel
            });
          }
        } else {
          // Regular text without label - treat as user line
          const text = section.replace(/^[""]|[""]$/g, '').trim();
          if (text) {
            chunks.push({
              speaker: "user",
              text: text,
              label: currentLabel
            });
          }
        }
      }

      setScriptChunks(chunks);
      console.log("📚 Parsed script chunks (USER ONLY):", chunks.length, "chunks");
      console.log("📚 Full chunks:", chunks.map((c, i) => `\n${i}: [${c.label}] ${c.text.substring(0, 50)}...`).join(""));
    } else {
      console.log("⚠️ No script content to parse");
    }
  }, [config.script]);

  // System prompt based on configuration
  const getSystemPrompt = () => {
    // If persona is selected, use its custom prompt with scenario context
    if (config.persona) {
      const scenarioContext = {
        "fsbo": "The scenario is a FSBO (For Sale By Owner) - you're a homeowner selling without an agent.",
        "expired": "The scenario is an expired listing - you're a frustrated homeowner whose listing just expired.",
        "buyer-consult": "The scenario is a buyer consultation - you're a prospective home buyer.",
        "seller-consult": "The scenario is a seller consultation - you're a homeowner considering selling.",
        "cold-call": "The scenario is a cold call - you're a homeowner receiving an unexpected call.",
        "circle-prospect": "The scenario is circle prospecting - you're a homeowner in a neighborhood with recent sales.",
      };
      
      return `${config.persona.gptSystemPrompt}

${scenarioContext[config.scenario as keyof typeof scenarioContext]}

Keep responses conversational and realistic. Respond naturally as if in a real phone conversation. Stay in character throughout the call.`;
    }

    // Fallback to old system (if no persona selected)
    const scenarioPrompts = {
      "fsbo": "You are a homeowner selling your house without a real estate agent (FSBO). You're fielding calls from agents trying to convince you to list with them.",
      "expired": "You are a frustrated homeowner whose listing just expired without selling. You're disappointed but may be open to relisting with the right agent.",
      "buyer-consult": "You are a prospective home buyer who reached out to learn about working with an agent. You have questions about the buying process.",
      "seller-consult": "You are a homeowner considering selling your property. You're interviewing agents to see who would be the best fit.",
      "cold-call": "You are a homeowner receiving an unexpected call from a real estate agent. You're busy and initially resistant.",
      "circle-prospect": "You are a homeowner in a neighborhood where a property recently sold. An agent is calling about it.",
    };

    const moodModifiers = {
      "friendly": "Be warm, open, and receptive to the conversation. Show genuine interest.",
      "neutral": "Be cautiously interested but reserved. You need to be convinced before committing.",
      "skeptical": "Be resistant, doubtful, and require strong convincing. Question their motives.",
    };

    const difficultyModifiers = {
      "easy": "Keep objections simple and easy to overcome. Be reasonable.",
      "medium": "Present moderate challenges and objections. Make them work for it.",
      "hard": "Be very challenging with complex objections. Push back hard and test their skills.",
    };

    return `${scenarioPrompts[config.scenario as keyof typeof scenarioPrompts]} ${moodModifiers[config.mood as keyof typeof moodModifiers]} ${difficultyModifiers[config.difficulty as keyof typeof difficultyModifiers]} Keep responses conversational and realistic. Respond naturally as if in a real phone conversation. Stay in character throughout the call.`;
  };

  // Initialize WebSocket connection
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      try {
        setInitProgress(20);
        setStatus("Requesting session token...");
        
        // Get session token from backend with selected voice
        const voiceParam = config.voice || 'verse';
        const response = await fetch(`/api/realtime-session?voice=${voiceParam}`);
        if (!response.ok) {
          throw new Error("Failed to get session token");
        }
        
        setInitProgress(40);
        const sessionData = await response.json();
        const ephemeralKey = sessionData.client_secret?.value;
        
        if (!ephemeralKey) {
          throw new Error("No ephemeral key received");
        }

        setInitProgress(50);
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
          setInitProgress(70);
          setStatus("Configuring session...");

          // Configure session for text-only (we'll use ElevenLabs for TTS)
          console.log(`🎙️ Configuring session for text-only mode (ElevenLabs TTS)`);
          
          ws.send(JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text"], // Text only - no audio output from OpenAI
              instructions: getSystemPrompt(),
              input_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 1000, // Increased from 300ms to capture first word
                silence_duration_ms: 1200, // Increased from 700ms for more natural pauses
              },
            },
          }));

          setInitProgress(85);
          setStatus("Starting microphone...");
          
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

      case "response.output_item.added":
        console.log("📝 Output item added:", event.item);
        break;

      case "response.output_item.done":
        // Complete AI response in text-only mode
        console.log("✅ Output item done:", event.item);
        if (event.item?.type === "message" && event.item?.role === "assistant") {
          const content = event.item.content;
          if (Array.isArray(content)) {
            // Find text content
            const textContent = content.find((c: any) => c.type === "text");
            if (textContent?.text) {
              const aiMessage = textContent.text;
              console.log("🎤 AI response text:", aiMessage);
              
              setTranscript((prev) => [
                ...prev,
                {
                  speaker: "ai",
                  message: aiMessage,
                  timestamp: timeElapsed,
                },
              ]);
              
              // Generate audio with ElevenLabs
              await generateElevenLabsAudio(aiMessage);
            }
          }
        }
        break;

      case "response.text.delta":
        // Real-time text deltas (partial) - for streaming
        console.log("📝 AI text delta:", event.delta);
        break;

      case "response.text.done":
        // Alternative event for text completion
        console.log("✅ AI text complete:", event.text);
        break;

      case "response.audio.delta":
        // Not used in text-only mode
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
        console.log("🔍 Silence callback ref exists?", !!userSilenceCallbackRef.current);
        setIsRecording(false);
        // Trigger user silence callback for KaraokeCall
        if (userSilenceCallbackRef.current) {
          console.log("🎯 Triggering user silence callback");
          userSilenceCallbackRef.current();
        } else {
          console.log("❌ No silence callback registered!");
        }
        break;

      case "input_audio_buffer.committed":
        console.log("✅ Audio buffer committed");
        break;

      case "response.created":
        console.log("🤖 AI response created");
        break;

      case "response.audio.done":
        // Not used in text-only mode (ElevenLabs handles audio)
        console.log("ℹ️ response.audio.done (ignored in text-only mode)");
        break;

      case "response.done":
        console.log("✅ Full response done");
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
      setInitProgress(100);
      setStatus("Ready - Start speaking!");
      
      // Hide loading screen after a brief moment
      setTimeout(() => {
        setIsInitializing(false);
      }, 300);
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("Microphone access denied");
      setIsInitializing(false);
    }
  };

  // Generate and play ElevenLabs TTS audio
  const generateElevenLabsAudio = async (text: string) => {
    try {
      console.log(`🎙️ Generating ElevenLabs audio for: "${text.substring(0, 50)}..."`);
      
      const voiceId = config.voice || 'EXAVITQu4vr4xnSDxMaL';
      const voiceSettings = config.persona?.voiceSettings;
      
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          voice_settings: voiceSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('✅ ElevenLabs audio ready, playing...');

      // Play audio
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('✅ ElevenLabs audio playback complete');
        URL.revokeObjectURL(audioUrl);
        
        // Trigger callback for KaraokeCall
        if (aiFinishCallbackRef.current) {
          const callback = aiFinishCallbackRef.current;
          aiFinishCallbackRef.current = null;
          callback();
        }
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      
    } catch (error) {
      console.error('❌ ElevenLabs TTS error:', error);
      
      // Still trigger callback to continue flow
      if (aiFinishCallbackRef.current) {
        const callback = aiFinishCallbackRef.current;
        aiFinishCallbackRef.current = null;
        callback();
      }
    }
  };


  // Play queued audio
  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      console.log("🎵 Audio queue empty");
      
      // ONLY trigger callback if API has finished sending AND queue is empty
      if (apiFinishedSendingRef.current) {
        console.log("✅ API finished sending + queue empty = AI completely done!");
        
        if (aiFinishCallbackRef.current) {
          console.log("🎯 Triggering AI finish callback (onend) - KaraokeCall will advance");
          const callback = aiFinishCallbackRef.current;
          aiFinishCallbackRef.current = null;
          apiFinishedSendingRef.current = false; // Reset flag
          if (playbackSafetyTimeoutRef.current) {
            clearTimeout(playbackSafetyTimeoutRef.current);
            playbackSafetyTimeoutRef.current = null;
          }
          callback();
        } else {
          console.log("⚠️ No AI finish callback registered");
        }
      } else {
        console.log("⏳ Queue empty but API still sending, waiting for more chunks...");
      }
      return;
    }

    isPlayingRef.current = true;
    console.log(`▶️ Playing audio buffer (${audioQueueRef.current.length} remaining in queue)`);
    const audioBuffer = audioQueueRef.current.shift()!;

    const source = audioContextRef.current!.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current!.destination);
    
    source.onended = () => {
      console.log("🔊 Audio buffer finished, checking queue...");
      playNextAudio(); // Recursively play next or trigger callback
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

  // Loading overlay
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-600/95 via-purple-600/95 to-violet-600/95 backdrop-blur-sm">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block p-4 bg-white/10 rounded-full backdrop-blur-md">
            <svg className="w-16 h-16 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-3">
          Setting Up Your Call
        </h2>
        <p className="text-xl text-indigo-100 mb-8">
          {status}
        </p>
        
        {/* Progress bar */}
        <div className="w-80 mx-auto">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-white to-indigo-200 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${initProgress}%` }}
            />
          </div>
          <div className="mt-3 text-white/80 text-sm">
            {initProgress}%
          </div>
        </div>
      </div>
    </div>
  );

  // If script is available, use KaraokeCall interface
  if (config.script && scriptChunks.length > 0) {
    return (
      <>
        {isInitializing && <LoadingOverlay />}
        <KaraokeCall
        title="🎙️ Voice Call Practice"
        scriptTitle={config.script.name}
        chunks={scriptChunks}
        onEndCall={handleEndCall}
        onStartUserListening={() => {
          console.log("📝 Ready for user speech");
        }}
        onStopUserListening={() => {
          console.log("📝 User finished speaking");
        }}
        onUserSilence={(cb) => {
          console.log("🤫 onUserSilence called - storing silence callback");
          userSilenceCallbackRef.current = cb;
        }}
        speakAI={(_text, onend) => {
          console.log("🎵 speakAI called - AI will respond via WebSocket, storing onend callback");
          aiFinishCallbackRef.current = onend;
        }}
        showTimerText={formatTime(timeElapsed)}
        isUserSpeaking={isRecording}
      />
      </>
    );
  }

  // Fallback: regular transcript view
  return (
    <>
      {isInitializing && <LoadingOverlay />}
      <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎙️ Voice Call in Progress</h2>
            <p className="text-sm text-gray-600">
              {config.scenario.toUpperCase()} • {config.mood} mood • {config.difficulty} difficulty
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
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="text-center text-xs text-gray-500">
          💡 Speak naturally - the AI will detect when you start and stop talking.
        </div>
      </div>
    </div>
    </>
  );
}
