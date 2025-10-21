import { turnManager } from "@/state/turnManager";
import { ttsQueue } from "@/audio/ttsQueue";

/**
 * Public API you call from your UI/realtime handlers
 * to transition cleanly between turns.
 */

export function onUserSpeechStart() {
  console.log("🎤 User speech START detected");
  
  // DON'T interrupt AI while they're speaking - let them finish
  // The AI will naturally finish and then user can speak
  if (turnManager.get() === "AI_SPEAKING") {
    console.log("⏸️ AI is speaking, ignoring user speech start (no barge-in)");
    return; // Ignore user speech while AI is talking
  }
  
  turnManager.set("USER_TALKING");
}

export function onUserSpeechEnd() {
  console.log("🛑 User speech END");
  
  // Guard: if AI is busy, ignore accidental endings
  if (turnManager.isBusy()) {
    console.log("⚠️ AI is busy, ignoring speech end");
    return;
  }
  
  turnManager.set("AI_THINKING");
  // Note: The actual transcript sending happens in the WebSocket handler
}

export function onAIResponseReady(audioBlob: Blob, text: string) {
  console.log("🤖 AI response ready:", text.substring(0, 50) + "...");
  
  // If another response already took over, drop this one
  if (turnManager.get() !== "AI_THINKING") {
    console.log("⚠️ Turn state changed, dropping AI response");
    return;
  }

  ttsQueue.enqueue({
    id: crypto.randomUUID(),
    blob: audioBlob,
    onStart: () => {
      console.log("🎙️ AI started speaking");
      turnManager.set("AI_SPEAKING");
    },
    onEnd: () => {
      console.log("✅ AI finished speaking");
      turnManager.set("IDLE");
    },
  });
}

export function onAIResponseReadyBuffer(arrayBuf: ArrayBuffer, text: string) {
  console.log("🤖 AI response ready (buffer):", text.substring(0, 50) + "...");
  
  // If another response already took over, drop this one
  if (turnManager.get() !== "AI_THINKING") {
    console.log("⚠️ Turn state changed, dropping AI response");
    return;
  }

  ttsQueue.enqueue({
    id: crypto.randomUUID(),
    arrayBuf: arrayBuf,
    onStart: () => {
      console.log("🎙️ AI started speaking");
      turnManager.set("AI_SPEAKING");
    },
    onEnd: () => {
      console.log("✅ AI finished speaking");
      turnManager.set("IDLE");
    },
  });
}

export function cancelAll() {
  console.log("❌ Cancelling all turns");
  ttsQueue.clear(true);
  turnManager.set("IDLE");
}

