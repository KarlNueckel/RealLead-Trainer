import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import { CallConfig } from "./ConfigurationPage";
import { UserTalkingPage } from "./callUI/UserTalkingPage";
import { AITalkingPage } from "./callUI/AITalkingPage";

export type ScriptChunk = {
  speaker: "user" | "ai";
  text: string;
  label?: string;
};

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
  const callStartTimeRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<string>("Initializing...");
  // Track current speaking role and conversational turns to improve attribution
  const [currentRole, setCurrentRole] = useState<"user" | "ai" | null>(null);
  const [turn, setTurn] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [shouldEndCall, setShouldEndCall] = useState(false);
  
  // Script state
  const [scriptChunks, setScriptChunks] = useState<ScriptChunk[]>([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const userSilenceCallbackRef = useRef<(() => void) | null>(null);
  const aiFinishCallbackRef = useRef<(() => void) | null>(null);
  const userSilenceTimeoutRef = useRef<number | null>(null);
  const lastUserSpeechTimeRef = useRef<number>(Date.now());
  const hasUserSpokenRef = useRef<boolean>(false);
  const initialGreetingTimeoutRef = useRef<number | null>(null);
  const silenceCountRef = useRef<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const apiFinishedSendingRef = useRef(false); // Track when API stops sending chunks
  const playbackSafetyTimeoutRef = useRef<number | null>(null); // Safety fallback after API done
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // Track current playing audio
  const currentAudioUrlRef = useRef<string | null>(null); // Track blob URL for cleanup

  // Avery via Vapi SDK (no widget)
  const [callActive, setCallActive] = useState(false);
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);

  // ===== Transcript builder helpers (role inference, turn tracking, de-dupe) =====
  const normalizeText = (s: string) =>
    String(s || "")
      .toLowerCase()
      .replace(/[\p{Cf}]/gu, "")
      .replace(/[\p{P}\p{S}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const recentByRoleRef = useRef<{ user: string; ai: string }>({ user: "", ai: "" });
  const currentSpeakerRef = useRef<"user" | "ai" | null>(null);
  const lastSpokeRef = useRef<"user" | "assistant">("user");
  const lastEntryRef = useRef<{ text: string; role: "user" | "assistant"; time: number }>({
    text: "",
    role: "user",
    time: 0,
  });
  const lastEventTypeRef = useRef<string | null>(null);

  const appendFinal = useCallback(
    (role: "user" | "ai", text: string, source: string) => {
      const norm = normalizeText(text);
      if (!norm) return;
      const lastNorm = recentByRoleRef.current[role];
      if (norm === lastNorm) {
        console.log("🟡 Skip duplicate", { role, text });
        return;
      }
      recentByRoleRef.current[role] = norm;

      const actualElapsed = callStartTimeRef.current > 0
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : timeElapsed;

      console.log(`💬 FINAL ${role.toUpperCase()} (turn ${turn}) [${source}]:`, text);
      setTranscript((prev) => [
        ...prev,
        { speaker: role, message: text, timestamp: actualElapsed },
      ]);
    },
    [turn, timeElapsed]
  );

  // Smarter appender that uses currentRole/lastSpoke and flips or drops echo lines
  const appendFinalSmart = useCallback(
    (event: any, source: string) => {
      type Role = "user" | "assistant";
      let role: Role = ((event?.role as Role) || (currentRole ? (currentRole === 'ai' ? 'assistant' : 'user') : undefined) || (lastSpokeRef.current ?? 'user')) as Role;
      const text: string | undefined = event?.transcript || event?.input || event?.text || undefined;
      if (!text) return;

      const norm = normalizeText(text);
      const lastNorm = normalizeText(lastEntryRef.current.text);
      const now = Date.now();

      if (norm && lastNorm && norm === lastNorm && (now - lastEntryRef.current.time) < 2000) {
        if (lastEntryRef.current.role === 'user' && role === 'user') {
          // likely assistant echo without proper role → flip
          role = 'assistant';
          console.log("🔁 Flipped role to ASSISTANT for echo line:", text);
        } else {
          console.log("🟡 Dropping duplicate:", text);
          return;
        }
      }

      lastEntryRef.current = { text, role, time: now };
      const speaker: "user" | "ai" = role === 'assistant' ? 'ai' : 'user';
      appendFinal(speaker, text, source);
    },
    [appendFinal, currentRole]
  );

  // Pretty console logs for user vs AI
  const logUserSpeech = (text: string, source: string, t: number) => {
    console.log(`%c🎙️ USER (turn ${t}) [${source}]`, "color:#2196F3; font-weight:bold", text);
  };
  const logAISpeech = (text: string, source: string, t: number) => {
    console.log(`%c🤖 AI (turn ${t}) [${source}]`, "color:#4CAF50; font-weight:bold", text);
  };

  // Initialize Vapi for Avery persona and wire events to UI state
  useEffect(() => {
    // Debug: log transcript on every change
    try {
      console.log("📜 Current transcript:", transcript);
    } catch {}
  }, [transcript]);

  useEffect(() => {
    if (config?.persona?.id !== 'avery') return;
    try {
      const client = new (Vapi as any)("079cf384-f6b0-4c56-a7b5-6843b494e4fa");
      client.on?.('call-start', () => setIsConnected(true));
      client.on?.('call-end', () => { setIsConnected(false); setIsAISpeaking(false); setCallActive(false); });
      client.on?.('speech-start', () => setIsAISpeaking(true));
      client.on?.('speech-end', () => setIsAISpeaking(false));
      // Optional: drive local mic indicator if present in this build
      client.on?.('volume-level', (volume: number) => {
        try {
          const active = Number(volume) > 0.06;
          if (active !== isRecording) setIsRecording(active);
        } catch {}
      });
      // Capture messages from Vapi SDK into local transcript
      client.on?.('message', (msg: any) => {
        try {
          console.log("🗣️ Raw message event:", msg);
          const prevType = lastEventTypeRef.current;
          lastEventTypeRef.current = msg?.type || null;
          // Heuristic channel/source detection to separate mic vs AI audio
          const isFromMic = (
            msg?.source === 'user' ||
            msg?.type === 'voice-input' ||
            msg?.input_audio_buffer !== undefined ||
            msg?.inputAudioBuffer !== undefined ||
            msg?.channel === 'input_audio_buffer'
          );
          const isFromAI = (
            msg?.source === 'assistant' ||
            msg?.source === 'tts' ||
            msg?.output_audio !== undefined ||
            msg?.outputAudio !== undefined ||
            msg?.channel === 'output_audio'
          );

          // Use speech-update events to track who is speaking and turn boundaries
          if (msg?.type === 'speech-update') {
            const raw = String(msg?.role || '').toLowerCase();
            const roleMapped: 'user' | 'ai' = (raw === 'assistant' || raw === 'agent' || raw === 'ai') ? 'ai' : 'user';
            if (msg?.status === 'started') {
              setCurrentRole(roleMapped);
              lastSpokeRef.current = roleMapped === 'ai' ? 'assistant' : 'user';
              currentSpeakerRef.current = roleMapped;
              console.log(`🎙️ ${roleMapped.toUpperCase()} started speaking (turn ${turn})`);
            } else if (msg?.status === 'stopped') {
              console.log(`🛑 ${roleMapped.toUpperCase()} stopped speaking`);
              setCurrentRole(null);
              currentSpeakerRef.current = null;
              setTurn((prev) => prev + 1);
            }
            return; // handled
          }

          // Preferred: explicit transcript events coming through the message channel
          if (msg?.type === 'transcript' && (msg?.transcriptType === 'final' || msg?.final === true)) {
            const roleFromEvent = String(msg?.role || '').toLowerCase();
            let speaker: 'user' | 'ai' | null = null;
            if (isFromMic) speaker = 'user';
            else if (isFromAI) speaker = 'ai';
            else if (roleFromEvent === 'user') speaker = 'user';
            else if (roleFromEvent === 'assistant' || roleFromEvent === 'agent' || roleFromEvent === 'ai') speaker = 'ai';
            else if (currentRole) speaker = currentRole;
            else speaker = classifySpeaker(msg) || 'ai';

            const active = currentSpeakerRef.current;
            const text = msg?.transcript || msg?.text || '';
            if (text) {
              if (active && speaker && speaker !== active) {
                console.log("🚫 Ignored transcript (role mismatch)", { role: speaker, active, text });
                return;
              }
              appendFinal(speaker, text, 'transcript.final');
              if (speaker === 'user') logUserSpeech(text, 'transcript.final', turn);
              else logAISpeech(text, 'transcript.final', turn);
            }
            return;
          }

          // Optional: voice-input handler just for user mic input (suppress assistant echoes)
          if (msg?.type === 'voice-input') {
            // Debug: show source/role for voice-input origin
            console.log(`🎧 VOICE INPUT received from ${msg?.role || 'unknown'} (source=${msg?.source || 'n/a'})`, msg?.input || msg?.text || '');
            // Skip AI voice-input echoes and when assistant is speaking or after model-output tokenization
            const isUserByMeta = (msg?.role === 'user') || (msg?.source === 'microphone') || (msg?.channel === 'microphone') || (typeof msg?.turn === 'number' && (msg.turn % 2 === 1));
            const isEchoByContext = isFromAI || currentSpeakerRef.current === 'ai' || lastSpokeRef.current === 'assistant' || prevType === 'model-output' || prevType === 'response.delta';
            if (!isUserByMeta || isEchoByContext) {
              console.log('🚫 Skipping AI voice-input echo');
              return;
            }
            const text = msg?.input || msg?.text || '';
            if (text) {
              appendFinal('user', text, 'voice-input');
              logUserSpeech(text, 'voice-input', turn);
              return;
            }
          }

          // Model/output token streams: do not persist to transcript (debug only)
          if (msg?.type === 'model-output' || msg?.type === 'response.delta') {
            return;
          }

          // Generic fallback: capture simple role/text messages if present (no pretty log)
          const role = (msg?.role || msg?.sender || '').toLowerCase();
          const text = msg?.text || msg?.content || msg?.message || '';
          if (!text) return;
          let speaker = classifySpeaker(msg);
          if (!speaker && currentRole) speaker = currentRole;
          appendFinal(speaker, text, 'fallback');
        } catch {}
      });
      // Some SDKs emit transcript/update events; capture conservatively if present
      client.on?.('transcript', (evt: any) => {
        try {
          console.log("🗣️ Raw transcript event:", evt);
          const text = evt?.text || evt?.transcript;
          if (!text) return;
          const isUser = !!(evt?.is_user || evt?.from === 'user');
          const speaker = isUser ? 'user' : 'ai';
          console.log(`💬 ${speaker.toUpperCase()}:`, text);
          appendFinal(speaker, text, 'transcript.channel');
        } catch {}
      });
      vapiRef.current = client;
      // Auto-start Avery call to ensure transcript events flow without user clicking the toggle
      (async () => {
        try {
          if (!callActive) {
            await (client as any).start("80afc02e-adde-440d-b93c-dce41722a56f");
            setCallActive(true);
          }
        } catch (err) {
          console.error('Auto-start Avery call failed', err);
        }
      })();
    } catch (e) {
      console.error('Failed to init Vapi client', e);
    }
    return () => {
      try { vapiRef.current?.removeAllListeners?.(); vapiRef.current?.stop?.(); } catch {}
      vapiRef.current = null;
    };
  }, [config?.persona?.id]);

  const handleToggleVapiCall = async () => {
    if (config?.persona?.id !== 'avery') return;
    const client = vapiRef.current as any;
    if (!client) return;
    try {
      if (!callActive) {
        await client.start("80afc02e-adde-440d-b93c-dce41722a56f");
        setCallActive(true);
      } else {
        await client.stop();
        setCallActive(false);
      }
    } catch (e) {
      console.error('Vapi start/stop failed', e);
    }
  };

  // Parse script into KaraokeCall chunks on mount - ONLY USER LINES
  useEffect(() => {
    console.log("🔍 Script parsing effect triggered");
    console.log("🔍 config.script:", config.script);
    console.log("🔍 config.script?.content:", config.script?.content);
    
    if (config.script?.content) {
      const chunks: ScriptChunk[] = [];
      let currentLabel = "";

      // Split by double newlines to get sections
      const sections = config.script.content.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
      
      console.log("📝 Found sections:", sections.length);
      
      for (const section of sections) {
        const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
        
        // Check if first line is a label/header
        const firstLine = lines[0];
        if (firstLine.match(/^(Introduction|Opening|Purpose|Value|Question|Response|Closing|Next Steps|Qualifying Questions|Reconnection|Recap|Call to Action|Market Expertise|Unique Value|Value Proposition|Acknowledgment|Value Question|Positioning|Empathy Opening|Direct Question|Solution Positioning|Qualifying Question|Objection Response):/i)) {
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
      console.log("⚠️ No script content to parse - script will not be displayed");
      console.log("⚠️ Config:", config);
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

  // Initialize WebSocket connection (skip for Avery)
  useEffect(() => {
    if (config?.persona?.id === 'avery') { setIsInitializing(false); return; }
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
                prefix_padding_ms: 300,  // Reduced - enough to capture first word without delay
                silence_duration_ms: 600, // Reduced from 1200ms - faster response, still allows natural pauses
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

    // Set call start time
    callStartTimeRef.current = Date.now();

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected]);

  // Handle AI-initiated call ending
  useEffect(() => {
    if (shouldEndCall) {
      console.log('🚨 shouldEndCall triggered - ending call via useEffect');
      const finalTranscript = [...transcript];
      const finalDuration = timeElapsed;
      
      console.log('📊 Final transcript length:', finalTranscript.length);
      console.log('📊 Final transcript:', finalTranscript);
      console.log('⏱️ Final duration:', finalDuration);
      
      // Stop any playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      
      // Close connections
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Then navigate
      console.log('🔄 Calling onEndCall...');
      onEndCall(finalTranscript, finalDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldEndCall]);

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
              console.log("💬 ASSISTANT:", aiMessage);
              
              // Calculate actual elapsed time
              const actualElapsed = callStartTimeRef.current > 0 
                ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
                : timeElapsed;
              
              setTranscript((prev) => {
                const updated = [
                  ...prev,
                  { speaker: "ai", message: aiMessage, timestamp: actualElapsed },
                ];
                console.log("📝 Transcript updated:", updated);
                return updated;
              });
              
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
          // Calculate actual elapsed time
          const actualElapsed = callStartTimeRef.current > 0 
            ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
            : timeElapsed;
          
          console.log("💬 USER:", userMessage);
          setTranscript((prev) => {
            const updated = [
              ...prev,
              { speaker: "user", message: userMessage, timestamp: actualElapsed },
            ];
            console.log("📝 Transcript updated:", updated);
            return updated;
          });
        }
        break;

      case "input_audio_buffer.speech_started":
        console.log("🎤 User started speaking");
        setIsRecording(true);
        lastUserSpeechTimeRef.current = Date.now();
        hasUserSpokenRef.current = true;
        
        // Reset silence count when user speaks
        silenceCountRef.current = 0;
        
        // Clear initial greeting timeout if user speaks
        if (initialGreetingTimeoutRef.current) {
          clearTimeout(initialGreetingTimeoutRef.current);
          initialGreetingTimeoutRef.current = null;
        }
        
        // Clear any existing silence timeout
        if (userSilenceTimeoutRef.current) {
          clearTimeout(userSilenceTimeoutRef.current);
          userSilenceTimeoutRef.current = null;
        }
        
        // Stop AI audio if it's still playing (user is interrupting)
        stopCurrentAudio();
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("🛑 User stopped speaking");
        console.log("🔍 Silence callback ref exists?", !!userSilenceCallbackRef.current);
        setIsRecording(false);
        lastUserSpeechTimeRef.current = Date.now();
        
        // Trigger user silence callback for KaraokeCall
        if (userSilenceCallbackRef.current) {
          console.log("🎯 Triggering user silence callback");
          userSilenceCallbackRef.current();
        } else {
          console.log("❌ No silence callback registered!");
        }
        
        // Start silence timeout - if user doesn't speak, AI prompts them or hangs up
        if (userSilenceTimeoutRef.current) {
          clearTimeout(userSilenceTimeoutRef.current);
        }
        
        // Determine timeout duration based on silence count
        const timeoutDuration = silenceCountRef.current === 0 ? 5000 : 15000; // 5s first, then 15s more (20s total)
        
        userSilenceTimeoutRef.current = window.setTimeout(() => {
          const timeSinceLastSpeech = Date.now() - lastUserSpeechTimeRef.current;
          console.log(`⏰ Silence timeout triggered (${timeoutDuration}ms)`);
          console.log("⏰ Time since last speech:", timeSinceLastSpeech, "ms");
          console.log("⏰ Silence count:", silenceCountRef.current);
          
          // Only trigger if user hasn't spoken
          const requiredSilence = silenceCountRef.current === 0 ? 4500 : 14500;
          if (timeSinceLastSpeech >= requiredSilence) {
            silenceCountRef.current++;
            console.log("🤖 User has been silent too long - silence count now:", silenceCountRef.current);
            
            // Send a message to the AI to prompt the user or hang up
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              let promptText = "";
              
              if (silenceCountRef.current === 1) {
                // First silence (5 seconds) - prompt the user
                promptText = "[User has been silent for 5 seconds - prompt them naturally to continue the conversation. Based on your persona, say something like 'Hello? Are you still there?' or 'I'm still here. What else did you want to discuss?']";
              } else {
                // Second silence (total 20 seconds) - hang up immediately
                promptText = "[User has been silent for 20 seconds total after you already prompted them. You've had enough - hang up NOW. Say a brief dismissive ending like 'I don't have time for this. Goodbye.' or just 'Goodbye.' and END THE CALL immediately.]";
              }
              
              wsRef.current.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{
                    type: "input_text",
                    text: promptText
                  }]
                }
              }));
              
              // Trigger response
              wsRef.current.send(JSON.stringify({
                type: "response.create"
              }));
            }
          }
        }, timeoutDuration);
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
        
        // Start 5-second initial greeting timeout
        // If user doesn't speak within 5 seconds, AI will say "Hello?"
        initialGreetingTimeoutRef.current = window.setTimeout(() => {
          if (!hasUserSpokenRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("⏰ 5-second initial greeting timeout - AI will greet first");
            
            wsRef.current.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [{
                  type: "input_text",
                  text: "[Agent hasn't spoken yet - greet them briefly to start the conversation. Say something like 'Hello?' or 'Is anyone there?']"
                }]
              }
            }));
            
            // Trigger response
            wsRef.current.send(JSON.stringify({
              type: "response.create"
            }));
          }
        }, 5000);
      }, 300);
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("Microphone access denied");
      setIsInitializing(false);
    }
  };

  // Stop any currently playing audio
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      console.log('🛑 Stopping currently playing audio');
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current = null;
    }
    
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
  };

  // Generate disconnect beep tone (beep beep beep)
  const playDisconnectTone = () => {
    return new Promise<void>((resolve) => {
      // Option 1: Try to load custom disconnect sound from public folder
      const customSoundPath = '/disconnect-tone.mp3'; // Place file in public/ folder if you want custom sound
      
      const tryCustomSound = async () => {
        try {
          const response = await fetch(customSoundPath);
          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              resolve();
            };
            
            audio.onerror = () => {
              URL.revokeObjectURL(audioUrl);
              // Fallback to generated tone
              playGeneratedTone();
            };
            
            await audio.play();
            console.log('📞 Playing custom disconnect sound');
            return; // Custom sound playing, don't call playGeneratedTone
          }
        } catch (err) {
          // Error fetching custom sound, fall back to generated tone
        }
        
        // If we get here, custom sound didn't work - use generated tone
        playGeneratedTone();
      };
      
      // Option 2: Generate tone programmatically (fallback)
      const playGeneratedTone = () => {
        if (!audioContextRef.current) {
          resolve();
          return;
        }

        const audioContext = audioContextRef.current;
        const now = audioContext.currentTime;
        
        // Create oscillator for beep sound
        const playBeep = (startTime: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Busy signal frequency (around 480 Hz + 620 Hz, but we'll use 480 Hz for simplicity)
          oscillator.frequency.value = 480;
          oscillator.type = 'sine';
          
          // Beep envelope
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.25);
          gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
        };
        
        // Play 3 beeps with gaps (typical disconnect sound)
        playBeep(now);
        playBeep(now + 0.5);
        playBeep(now + 1.0);
        
        console.log('📞 Playing generated disconnect tone (beep beep beep)');
        
        // Resolve after all beeps are done
        setTimeout(() => resolve(), 1500);
      };
      
      // Try custom sound first, fall back to generated tone
      tryCustomSound();
    });
  };

  // Check if AI message indicates call ending
  const isCallEndingMessage = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    const endingPhrases = [
      'goodbye',
      'good bye',
      'have a great day',
      'have a good day',
      'have a nice day',
      'talk to you later',
      'speak to you later',
      'take care',
      "i'll let you go",
      "i will let you go",
      'thanks for your time',
      'thank you for your time',
      "i won't take up more of your time",
      "i won't take any more of your time",
      'not interested',
      "i'm not interested",
      "don't call again",
      "don't contact me",
      "remove me from your list",
      "i'm hanging up",
      "i am hanging up",
      // Frustration-based endings
      "i think i'll keep looking",
      "this isn't a good fit",
      "not on the same page",
      "don't think this is going to work",
      "not worth my time",
      "you don't know what you're doing",
      "clearly don't know",
      "this conversation isn't worth",
      "i'll reach out if i change my mind",
      "good luck",
      "thanks anyway",
      "thank you anyway",
      // Silence-triggered endings
      "i don't have time for this",
      "don't have time for this",
      "wasting my time",
      "this is wasting my time",
      "i should go",
      "not the right time",
      "call back later",
      "i'll call back",
      // Abrupt endings
      "*click*",
      "[hangs up]",
      "[call ends]",
    ];
    
    // Check if message contains any ending phrases
    // Also check if it's near the end of the message (last 150 chars)
    const messageEnd = lowerMessage.slice(-150);
    
    // Check for ending phrases in the message or at the end
    const hasEndingPhrase = endingPhrases.some(phrase => 
      messageEnd.includes(phrase) || lowerMessage.includes(phrase)
    );
    
    // Also detect if the message is very short and dismissive (likely hanging up)
    const isDismissive = (
      message.length < 30 && 
      (lowerMessage.includes('bye') || 
       lowerMessage.includes('done') || 
       lowerMessage.includes('enough'))
    );
    
    return hasEndingPhrase || isDismissive;
  };

  // Apply audio post-processing filter for mature voice (removes brightness)
  const applyMatureVoiceFilter = async (audioBlob: Blob): Promise<string> => {
    try {
      // Only apply filter for Quinn persona (hard difficulty)
      if (config.persona?.id !== 'quinn') {
        return URL.createObjectURL(audioBlob);
      }

      console.log('🎛️ Applying mature voice filter to reduce brightness...');

      if (!audioContextRef.current) {
        return URL.createObjectURL(audioBlob);
      }

      const audioContext = audioContextRef.current;
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      // Low-pass filter at 4.2 kHz to remove "sparkle"
      const lowpass = offlineContext.createBiquadFilter();
      lowpass.type = 'lowshelf';
      lowpass.frequency.value = 4200;
      lowpass.gain.value = -3; // Reduce high frequencies

      // Reduce presence around 2 kHz (removes brightness)
      const midCut = offlineContext.createBiquadFilter();
      midCut.type = 'peaking';
      midCut.frequency.value = 2000;
      midCut.Q.value = 1.0;
      midCut.gain.value = -2;

      // Slight compression for more grounded sound
      const compressor = offlineContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 2;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      // Connect the chain
      source.connect(lowpass);
      lowpass.connect(midCut);
      midCut.connect(compressor);
      compressor.connect(offlineContext.destination);

      source.start();
      const renderedBuffer = await offlineContext.startRendering();

      // Convert back to blob
      const wavBlob = await bufferToWave(renderedBuffer);
      return URL.createObjectURL(wavBlob);

    } catch (err) {
      console.warn('⚠️ Audio filter failed, using original:', err);
      return URL.createObjectURL(audioBlob);
    }
  };

  // Convert AudioBuffer to WAV Blob
  const bufferToWave = (buffer: AudioBuffer): Promise<Blob> => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    // "RIFF" chunk descriptor
    setUint32(0x46464952);
    setUint32(36 + length);
    setUint32(0x45564157);

    // "fmt " sub-chunk
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);

    // "data" sub-chunk
    setUint32(0x61746164);
    setUint32(length);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length + 44) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][offset]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
      offset++;
    }

    return Promise.resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
  };

  // Generate and play ElevenLabs TTS audio
  const generateElevenLabsAudio = async (text: string) => {
    try {
      console.log(`🎙️ Generating ElevenLabs audio for: "${text.substring(0, 50)}..."`);
      
      // Check if AI is ending the call
      const isEnding = isCallEndingMessage(text);
      if (isEnding) {
        console.log('📞 AI is ending the call - will play disconnect tone after message');
      }
      
      // CRITICAL: Stop any currently playing audio before starting new one
      stopCurrentAudio();
      
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
      
      // Apply audio post-processing for Quinn to reduce brightness
      const audioUrl = await applyMatureVoiceFilter(audioBlob);
      
      console.log('✅ ElevenLabs audio ready, playing...');

      // Play audio
      const audio = new Audio(audioUrl);
      
      // Store references for cleanup
      currentAudioRef.current = audio;
      currentAudioUrlRef.current = audioUrl;
      
      audio.onended = () => {
        console.log('✅ ElevenLabs audio playback complete');
        
        // Cleanup
        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          currentAudioUrlRef.current = null;
        }
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        
        // AI stopped speaking
        setIsAISpeaking(false);
        
        // Advance to next script chunk after a brief pause
        setTimeout(() => {
          setCurrentScriptIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex < scriptChunks.length) {
              console.log(`📖 Advancing to script chunk ${nextIndex}/${scriptChunks.length}`);
              return nextIndex;
            }
            return prev;
          });
        }, 500);
        
        // If AI is ending the call, play disconnect tone then end
        if (isEnding) {
          console.log('📞 Playing disconnect tone...');
          
          // Play disconnect tone, then end call
          playDisconnectTone().then(() => {
            console.log('📞 AI ended the call - setting shouldEndCall to true');
            
            // Trigger end call via state (React-friendly way)
            setTimeout(() => {
              console.log('📞 Setting shouldEndCall = true...');
              setShouldEndCall(true);
            }, 500);
          });
          return;
        }
        
        // Start silence timeout after AI finishes speaking
        console.log('🎵 AI finished speaking, starting silence timeout');
        lastUserSpeechTimeRef.current = Date.now();
        
        // Clear any existing timeout
        if (userSilenceTimeoutRef.current) {
          clearTimeout(userSilenceTimeoutRef.current);
        }
        
        // Determine timeout duration based on silence count
        const timeoutDuration = silenceCountRef.current === 0 ? 5000 : 15000;
        
        userSilenceTimeoutRef.current = window.setTimeout(() => {
          const timeSinceLastSpeech = Date.now() - lastUserSpeechTimeRef.current;
          console.log(`⏰ Silence timeout triggered after AI spoke (${timeoutDuration}ms)`);
          console.log("⏰ Time since AI finished:", timeSinceLastSpeech, "ms");
          console.log("⏰ Silence count:", silenceCountRef.current);
          
          const requiredSilence = silenceCountRef.current === 0 ? 4500 : 14500;
          if (timeSinceLastSpeech >= requiredSilence) {
            silenceCountRef.current++;
            console.log("🤖 User has been silent too long - silence count now:", silenceCountRef.current);
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              let promptText = "";
              
              if (silenceCountRef.current === 1) {
                promptText = "[User has been silent for 5 seconds - prompt them naturally to continue the conversation. Based on your persona, say something like 'Hello? Are you still there?' or 'I'm still here. What else did you want to discuss?']";
              } else {
                promptText = "[User has been silent for 20 seconds total after you already prompted them. You've had enough - hang up NOW. Say a brief dismissive ending like 'I don't have time for this. Goodbye.' or just 'Goodbye.' and END THE CALL immediately.]";
              }
              
              wsRef.current.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "message",
                  role: "user",
                  content: [{
                    type: "input_text",
                    text: promptText
                  }]
                }
              }));
              
              wsRef.current.send(JSON.stringify({
                type: "response.create"
              }));
            }
          }
        }, timeoutDuration);
        
        // Trigger callback for KaraokeCall
        if (aiFinishCallbackRef.current) {
          console.log('🎯 Triggering AI finish callback after audio ended');
          const callback = aiFinishCallbackRef.current;
          aiFinishCallbackRef.current = null;
          callback();
        }
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        
        // AI stopped speaking
        setIsAISpeaking(false);
        
        // Cleanup
        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          currentAudioUrlRef.current = null;
        }
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        
        // Still trigger callback to continue flow
        if (aiFinishCallbackRef.current) {
          const callback = aiFinishCallbackRef.current;
          aiFinishCallbackRef.current = null;
          callback();
        }
      };

      // Set AI speaking state when audio starts
      setIsAISpeaking(true);
      
      await audio.play();
      
    } catch (error) {
      console.error('❌ ElevenLabs TTS error:', error);
      setIsAISpeaking(false);
      
      // Cleanup
      stopCurrentAudio();
      
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
    // Stop any playing audio
    stopCurrentAudio();
    
    // Clear silence timeout
    if (userSilenceTimeoutRef.current) {
      clearTimeout(userSilenceTimeoutRef.current);
      userSilenceTimeoutRef.current = null;
    }
    
    // Clear initial greeting timeout
    if (initialGreetingTimeoutRef.current) {
      clearTimeout(initialGreetingTimeoutRef.current);
      initialGreetingTimeoutRef.current = null;
    }
    
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

  const handleEndCall = async () => {
    console.log('🔴 handleEndCall called');
    console.log('📊 Transcript entries (pre-wait):', transcript.length);
    console.log('📊 Full transcript (pre-wait):', transcript);
    console.log('⏱️ Time elapsed:', timeElapsed);

    // If transcript looks empty, give a brief window for any in-flight updates
    if (transcript.length === 0) {
      console.warn('No transcript found, waiting briefly to flush pending updates...');
      await new Promise((r) => setTimeout(r, 600));
      console.log('📊 Transcript entries (post-wait):', transcript.length);
    }

    // Defer navigation/cleanup to the effect that watches shouldEndCall
    setShouldEndCall(true);
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

  // If script is available, use new UI interface
  if (config.script && scriptChunks.length > 0) {
    const currentChunk = scriptChunks[currentScriptIndex];
    const contactName = config.persona?.displayName || "AI Prospect";
    const profileImage = config.persona?.image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
    const callDuration = formatTime(timeElapsed);
    
    return (
      <>
        {(isInitializing && config.persona?.id !== 'avery') && <LoadingOverlay />}
        {(config.persona?.id === 'avery' || !isInitializing) && (
          isAISpeaking ? (
            <AITalkingPage
              contactName={contactName}
              profileImage={profileImage}
              onEndCall={handleEndCall}
              callDuration={callDuration}
            />
          ) : (
            <UserTalkingPage
              contactName={contactName}
              profileImage={profileImage}
              scriptText={currentChunk?.text || "Ready to start..."}
              onEndCall={handleEndCall}
              callDuration={callDuration}
            />
          )
        )}
        {/* Avery: Start/End Call toggle (voice-only via SDK) */}
        {config.persona?.id === 'avery' && (
          <button
            onClick={handleToggleVapiCall}
            className={`fixed bottom-6 right-6 px-6 py-3 text-lg font-semibold rounded-full shadow-lg transition ${
              callActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white z-50`}
          >
            {callActive ? 'End Call 🔴' : 'Start Call 🎤'}
          </button>
        )}
      </>
    );
  }

  // Fallback: regular transcript view
  return (
    <>
      {(isInitializing && config.persona?.id !== 'avery') && <LoadingOverlay />}
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
                {entry.speaker === "user" ? "You" : config.persona?.displayName || "AI Prospect"}
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
  // Heuristic speaker classifier for various SDK/realtime payloads
  const classifySpeaker = (payload: any): "user" | "ai" => {
    try {
      const fields = [
        payload?.role,
        payload?.speaker,
        payload?.sender,
        payload?.from,
        payload?.source,
        payload?.author,
        payload?.participant?.role,
      ]
        .filter(Boolean)
        .map((s: string) => String(s).toLowerCase());

      const has = (needle: string) => fields.some((f) => f.includes(needle));

      if (payload?.is_user === true) return "user";
      if (has("assistant") || has("agent") || has("ai") || has("bot")) return "ai";
      if (has("user") || has("client") || has("human") || has("caller")) return "user";

      // Event-type based hints
      if (payload?.type === "conversation.item.input_audio_transcription.completed") return "user";
      if (payload?.type === "response.output_item.done") return "ai";
      if (payload?.type === "transcript") {
        const role = String(payload?.role || "").toLowerCase();
        if (role === "user") return "user";
        if (role === "assistant" || role === "agent" || role === "ai") return "ai";
      }

      // Fallback: prefer 'ai' only when clearly marked; otherwise assume user to reduce false AI attribution
      return "user";
    } catch {
      return "user";
    }
  };


