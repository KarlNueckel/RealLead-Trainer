# 🎙️ AI Audio Flow - Complete Trace

## **THE FLOW:**

### **1. User Speaks and Stops**
```
📍 LINE 284-291: input_audio_buffer.speech_stopped event
└─> setIsRecording(false)
└─> Triggers: userSilenceCallbackRef.current()
    └─> This callback is from KaraokeCall
    └─> KaraokeCall switches phase from "user" to "ai"
```

### **2. KaraokeCall AI Phase Starts**
```
📍 FILE: KaraokeCall.tsx, LINE ~130-148
KaraokeCall useEffect detects phase === "ai"
└─> Calls: speakAI(current.text, onend)
    └─> onend is the callback that should advance script
```

### **3. speakAI() Is Called**
```
📍 LINE 482-488: speakAI function in CallSimulationPage
speakAI={(_text, onend) => {
  aiFinishCallbackRef.current = onend;  // ✅ STORES THE CALLBACK
  // Audio will play automatically via WebSocket
}}
```

**⚠️ CRITICAL: No TTS call here! Audio comes automatically from OpenAI Realtime API**

### **4. OpenAI Sends Audio (Automatic)**
```
📍 LINE 252-259: response.audio.delta event
OpenAI WebSocket sends audio chunks automatically
└─> case "response.audio.delta":
    └─> playAudioDelta(base64Audio)
```

### **5. Audio Chunks Are Queued**
```
📍 LINE 408-444: playAudioDelta() function
Receives base64 PCM16 audio
└─> Decodes to AudioBuffer
└─> Pushes to: audioQueueRef.current.push(audioBuffer)
└─> If not playing: playNextAudio()  // Start playback
```

### **6. Audio Plays from Queue**
```
📍 LINE 446-478: playNextAudio() function (RECURSIVE)

playNextAudio() {
  if (queue.length === 0) {
    ❓ CHECK: Is API done sending? (apiFinishedSendingRef.current)
    ✅ YES → Trigger: aiFinishCallbackRef.current()  // ⬅️ THIS SHOULD FIRE!
    ❌ NO  → Wait for more chunks
  } else {
    Play next buffer
    buffer.onended → playNextAudio()  // Loop until queue empty
  }
}
```

### **7. API Signals "Done Sending"**
```
📍 LINE 301-314: response.audio.done event
✅ Audio response complete
└─> Sets: apiFinishedSendingRef.current = true
└─> Checks: If queue already empty → trigger callback immediately
```

### **8. Queue Empties (The Critical Moment)**
```
When last audio buffer finishes:
source.onended fires → playNextAudio() called
└─> Queue is now empty (length === 0)
└─> apiFinishedSendingRef.current === true
└─> ✅ SHOULD TRIGGER: aiFinishCallbackRef.current()
```

### **9. Callback Fires (Should Happen)**
```
aiFinishCallbackRef.current()
└─> This is the onend from KaraokeCall
└─> KaraokeCall advances: setIndex(i + 1)
└─> KaraokeCall switches: setPhase("user")
└─> UI shows next script line
```

---

## **🔴 THE PROBLEM:**

**Step 8-9 isn't happening!** The callback isn't firing.

## **POSSIBLE CAUSES:**

### **Cause A: Queue Never Empties**
- Audio chunks keep arriving even after `response.audio.done`
- Check console: Do you see "🎵 Audio queue empty"?

### **Cause B: apiFinishedSendingRef Not Set**
- `response.audio.done` event not firing
- Check console: Do you see "✅ Audio response complete"?

### **Cause C: Callback Not Stored**
- `speakAI` not being called
- Check console: Do you see "🎵 speakAI called - storing onend callback"?

### **Cause D: Callback Cleared Too Early**
- Something sets `aiFinishCallbackRef.current = null` before it fires
- Check if there are multiple calls to speakAI

---

## **WHERE AI TTS HAPPENS:**

**There is NO separate TTS call!** OpenAI Realtime API handles everything:

```
User speaks → OpenAI Realtime API processes it
              └─> Generates response (automatic)
              └─> Sends back audio chunks (automatic)
              └─> response.audio.delta events (automatic)
```

**The AI "speaks" via:**
1. Line 252-259: `response.audio.delta` event receives audio
2. Line 408-444: `playAudioDelta()` decodes and queues it
3. Line 446-478: `playNextAudio()` plays it via Web Audio API

**AI "stops talking" detected at:**
- Line 301: `response.audio.done` → API done sending
- Line 448-465: `playNextAudio()` when queue === 0 → All audio played

---

## **DEBUG: What to Check**

Open **browser console** (F12) when AI responds and look for:

1. ✅ "🎵 speakAI called" → Callback stored?
2. ✅ "🎵 Received audio delta" → Audio arriving?
3. ✅ "✅ Audio response complete" → API done sending?
4. ✅ "🎵 Audio queue empty" → Queue drained?
5. ❌ "✅ API finished sending + queue empty" → **This is the key!**
6. ❌ "🎯 Triggering AI finish callback" → **This should fire!**

**Which logs do you see? Which are missing?**


