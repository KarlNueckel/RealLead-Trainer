# AI Call Ending Feature

## Overview
The AI can now intelligently end calls and play a disconnect tone (beep beep beep) when hanging up, just like a real phone call.

## How It Works

### 1. **Automatic Detection**
The system automatically detects when the AI wants to end the call by looking for common ending phrases in the AI's response:

- "goodbye" / "good bye"
- "have a great/good/nice day"
- "talk to you later"
- "take care"
- "I'll let you go"
- "thanks for your time"
- "not interested"
- "I'm hanging up"
- "don't call again"
- And more...

### 2. **Call Ending Sequence**
When the AI says a goodbye phrase:

1. ✅ AI speaks the final message
2. 📞 Disconnect tone plays (beep beep beep)
3. 🏁 Call automatically ends
4. 📊 User sees the session summary with transcript

### 3. **Disconnect Sound**

The system has **two options** for the disconnect tone:

#### Option A: Generated Tone (Default - No files needed!)
- Uses Web Audio API to generate a realistic disconnect beep tone
- Three beeps at 480 Hz (standard busy signal frequency)
- Works automatically out of the box
- No additional files required

#### Option B: Custom Sound File (Optional)
If you want to use a specific disconnect sound:

1. Get a disconnect tone audio file (MP3 format recommended)
2. Name it `disconnect-tone.mp3`
3. Place it in the `public/` folder
4. The system will automatically use it instead of the generated tone

**Where to get a disconnect tone:**
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/search/phone-disconnect/)
- [Freesound.org](https://freesound.org/search/?q=phone+disconnect)
- [Zapsplat](https://www.zapsplat.com/sound-effect-category/phone-disconnect/)

## Testing the Feature

### Quick Test:
1. Start a call simulation
2. Say something like: "Actually, I'm not interested. Goodbye."
3. The AI should respond with a goodbye message
4. You'll hear the disconnect tone
5. Call will end automatically

### What the AI Might Say:
- "Alright, I understand. Have a great day! Goodbye."
- "No problem, I'll let you go. Take care!"
- "I appreciate your time. Goodbye!"
- "Understood, I won't call again. Have a nice day."

## Technical Details

### Files Modified:
- `src/components/CallSimulationPage.tsx`
  - Added `playDisconnectTone()` function
  - Added `isCallEndingMessage()` detection
  - Modified `generateElevenLabsAudio()` to handle call endings

### Key Features:
- ✅ Prevents multiple overlapping audio (already fixed)
- ✅ Detects call-ending phrases intelligently
- ✅ Plays realistic disconnect tone
- ✅ Graceful fallback if custom sound fails
- ✅ Proper cleanup and state management
- ✅ Console logging for debugging

### Debug Console Output:
When AI ends a call, you'll see:
```
📞 AI is ending the call - will play disconnect tone after message
✅ ElevenLabs audio playback complete
📞 Playing disconnect tone...
📞 Playing generated disconnect tone (beep beep beep)
📞 AI ended the call
```

## Customization

### Adjust Ending Phrases
Edit the `isCallEndingMessage()` function in `CallSimulationPage.tsx` to add/remove phrases:

```typescript
const endingPhrases = [
  'goodbye',
  'have a great day',
  // Add your custom phrases here
];
```

### Adjust Disconnect Tone
Edit `playGeneratedTone()` in `CallSimulationPage.tsx`:

```typescript
oscillator.frequency.value = 480; // Change frequency
playBeep(now);                    // First beep timing
playBeep(now + 0.5);              // Second beep timing
playBeep(now + 1.0);              // Third beep timing
```

## Troubleshooting

### Disconnect tone not playing?
- Check browser console for errors
- Make sure AudioContext is initialized
- Try refreshing the page

### AI not ending calls?
- Check if the AI's message contains ending phrases
- Look for console message: "📞 AI is ending the call"
- Try being more explicit: "I'm not interested, goodbye"

### Want to disable auto-ending?
Comment out the call-ending check in `generateElevenLabsAudio()`:
```typescript
// const isEnding = isCallEndingMessage(text);
const isEnding = false; // Always false = never auto-end
```

## Future Enhancements

Potential additions:
- Different disconnect tones for different scenarios
- Visual "Call Ended" overlay animation
- Configurable ending behavior (auto-end vs manual)
- AI persona-specific ending styles

