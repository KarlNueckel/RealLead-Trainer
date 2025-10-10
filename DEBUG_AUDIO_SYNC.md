# 🔍 Debug Prompt for OpenAI Realtime API Audio Sync Issue

## Problem Statement

In the RealLead Trainer voice call app, the UI needs to detect when the AI finishes speaking to advance the script automatically. Currently, the AI audio plays correctly, but the phase doesn't switch back from "AI speaking" to "User's turn" after the audio finishes.

## Architecture Overview

### Audio Flow:
1. **User speaks** → OpenAI Realtime API via WebSocket
2. **API responds** → Sends audio chunks as base64 PCM16 via `response.audio.delta` events
3. **Audio chunks** → Decoded and queued in `audioQueueRef`
4. **Playback** → Web Audio API plays chunks sequentially from queue
5. **Finish detection** → Should trigger `aiFinishCallbackRef` when ALL audio finishes playing

### Current Implementation:

**File: `src/components/CallSimulationPage.tsx`**

#### Event Handlers:
- `response.created` → Sets `apiFinishedSendingRef.current = false`
- `response.audio.delta` → Queues audio chunks
- `response.audio.done` → Sets `apiFinishedSendingRef.current = true`
- `playNextAudio()` → Plays queue recursively, triggers callback when queue empty AND API finished

#### Key State Variables:
- `audioQueueRef` - Array of AudioBuffer objects to play
- `isPlayingRef` - Boolean tracking if audio is currently playing
- `apiFinishedSendingRef` - Boolean tracking if API finished sending all chunks
- `aiFinishCallbackRef` - Callback from KaraokeCall to trigger when done

## Debugging Questions

### 1. Event Sequence
**Check browser console logs - do you see this sequence?**
```
🤖 AI response created
🎵 Received audio delta, queueing... (multiple times)
▶️ Playing audio buffer (X remaining in queue)
🔊 Audio buffer finished, checking queue...
✅ Audio response complete (API finished sending, queue may still be playing)
📊 Current queue length: X buffers
🔊 Audio buffer finished, checking queue... (repeated until queue empty)
🎵 Audio queue empty
✅ API finished sending + queue empty = AI completely done!
🎯 Triggering AI finish callback (onend) - KaraokeCall will advance
```

**If you see "⏳ Queue empty but API still sending":**
- The queue is draining too fast (audio chunks arrive slower than playback)
- This is the streaming race condition

**If you see "⚠️ No AI finish callback registered":**
- The callback isn't being stored properly
- Check if `speakAI` function is being called

### 2. Timing Issues
**Questions:**
- Does `response.audio.done` fire BEFORE or AFTER the last audio chunk plays?
- How many audio deltas arrive (check console count)?
- What's the typical queue length when `response.audio.done` fires?

### 3. KaraokeCall Integration
**Check if:**
- `speakAI` function is called when switching to AI phase
- The callback parameter (`onend`) is stored in `aiFinishCallbackRef`
- The phase stays on "ai" while audio plays

## Potential Root Causes

### Issue 1: Race Condition (Queue Empties Too Early)
**Symptom:** Queue empties while API is still sending chunks

**Why:** Audio plays faster than chunks arrive over network

**Fix:**
```typescript
// Only trigger when BOTH:
// 1. API explicitly says "I'm done sending" (response.audio.done)
// 2. Queue is completely drained (length === 0)
if (apiFinishedSendingRef.current && audioQueueRef.current.length === 0) {
  callback();
}
```

### Issue 2: Wrong Event Being Used
**Symptom:** Using `response.done` instead of `response.audio.done`

**Why:** `response.done` fires for the entire response (including text), not just audio

**Current code uses:** `response.audio.done` ✅

### Issue 3: Callback Not Persisting
**Symptom:** Callback gets cleared or overwritten before it fires

**Check:**
- Is `speakAI` being called multiple times?
- Is `aiFinishCallbackRef.current` being set to null too early?

### Issue 4: Audio Context Issues
**Symptom:** Audio plays but `source.onended` never fires

**Possible causes:**
- AudioContext suspended
- Source node disconnected prematurely
- Multiple audio contexts created

### Issue 5: KaraokeCall State Machine
**Symptom:** Component unmounts or phase changes before callback fires

**Check:**
- Does the component re-render during audio playback?
- Is the phase being changed by something else?

## Diagnostic Code to Add

### Add to `playAudioDelta`:
```typescript
console.log("📥 Added to queue, new length:", audioQueueRef.current.length);
console.log("🔍 isPlaying:", isPlayingRef.current, "apiFinished:", apiFinishedSendingRef.current);
```

### Add to `response.audio.done` handler:
```typescript
console.log("🛑 API STOPPED SENDING AUDIO");
console.log("📊 Final queue check:", {
  queueLength: audioQueueRef.current.length,
  isPlaying: isPlayingRef.current,
  hasCallback: !!aiFinishCallbackRef.current
});
```

### Add to KaraokeCall `speakAI`:
```typescript
speakAI={(_text, onend) => {
  console.log("🎵 speakAI CALLED - text:", _text.substring(0, 50));
  console.log("🎵 Storing onend callback:", typeof onend);
  aiFinishCallbackRef.current = onend;
}}
```

## Alternative Approach: Use a Different Signal

Instead of trying to detect when audio queue empties, use the **response.audio_transcript.done** event:

```typescript
case "response.audio_transcript.done":
  console.log("✅ AI transcript complete - audio should be nearly done");
  // Wait a bit for audio to finish (safety margin)
  setTimeout(() => {
    if (aiFinishCallbackRef.current) {
      aiFinishCallbackRef.current();
      aiFinishCallbackRef.current = null;
    }
  }, 1000); // 1 second safety buffer
  break;
```

## Nuclear Option: Time-Based Detection

If event-based detection fails, fall back to estimated timing:

```typescript
case "response.audio.done":
  const estimatedDuration = audioQueueRef.current.reduce((sum, buf) => sum + buf.duration, 0);
  console.log(`⏱️ Estimated ${estimatedDuration}s of audio remaining`);
  
  setTimeout(() => {
    console.log("⏰ Timer finished, triggering callback");
    if (aiFinishCallbackRef.current) {
      aiFinishCallbackRef.current();
    }
  }, (estimatedDuration + 0.5) * 1000); // Add 500ms buffer
  break;
```

## Questions to Answer

1. **In browser console**, when you speak and AI responds:
   - Do you see "🎵 speakAI called"?
   - Do you see "🎯 Triggering user silence callback"?
   - Do you see "✅ Audio response complete"?
   - Do you see "🎵 Audio queue empty"?
   - Do you see "✅ API finished sending + queue empty"?
   - Do you see "🎯 Triggering AI finish callback"?

2. **What happens instead?**
   - Does the soundwave stay forever?
   - Does it switch back too early?
   - Does nothing happen?

3. **Check the KaraokeCall component:**
   - Add console.log in the `useEffect` for AI phase
   - Check if `speakAI` function is actually being called
   - Check if the phase is switching at all

## Test This

Add this temporary button to manually trigger the callback:

```typescript
// In KaraokeCall component, add a debug button:
<button
  onClick={() => {
    console.log("🔴 MANUAL TRIGGER");
    if (aiFinishCallbackRef?.current) {
      aiFinishCallbackRef.current();
    }
  }}
  className="fixed top-20 right-20 bg-red-500 text-white px-4 py-2"
>
  DEBUG: Trigger AI Finish
</button>
```

Click this button while AI is speaking - does the script advance?
- **Yes** → The callback works, event detection is the issue
- **No** → The callback isn't wired up properly


