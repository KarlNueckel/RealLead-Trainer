# 🎙️ Voice Call Setup Guide

## Overview
Your RealLead Trainer now supports real-time voice conversations using OpenAI's Realtime API. This provides a much more realistic training experience compared to text-based chat.

## Prerequisites

### 1. OpenAI API Key
Make sure you have added your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

**Important:** The Realtime API is currently in beta and requires:
- An OpenAI account with API access
- The `gpt-4o-realtime-preview-2024-10-01` model enabled
- Sufficient API credits (voice calls consume more tokens than text)

### 2. Microphone Access
Your browser will request microphone permissions when you start a call. Make sure to allow access.

## Running the Application

### Start Both Servers
Run the development server which starts both the frontend and backend:

```bash
npm run dev
```

This will start:
- **Frontend (Vite):** http://localhost:5173
- **Backend (Express):** http://localhost:3001

### Individual Commands (Optional)
If you need to run them separately:

```bash
# Backend only
npm run server

# Frontend only  
npm run client
```

## How It Works

### Architecture
1. **Backend Server** (`server/index.js`)
   - Generates temporary session tokens from OpenAI
   - Keeps your API key secure (never exposed to the client)
   - Endpoint: `GET /api/realtime-session`

2. **Frontend** (`src/components/CallSimulationPage.tsx`)
   - Connects to OpenAI's Realtime API via WebSocket
   - Captures audio from your microphone
   - Streams audio in real-time (PCM16 format)
   - Plays AI responses automatically
   - Displays live transcript

### Voice Features
- ✅ **Real-time conversation** - No delay between speaking and AI response
- ✅ **Automatic turn detection** - AI knows when you finish speaking
- ✅ **Live transcription** - See what you and the AI are saying
- ✅ **Natural voice** - Uses OpenAI's "verse" voice (professional and clear)
- ✅ **Echo cancellation** - Prevents feedback from AI audio
- ✅ **Context-aware** - AI adapts based on your scenario and difficulty settings

## Usage

1. **Launch the app** - Navigate to http://localhost:5173
2. **Configure your call** - Select scenario, difficulty, and duration
3. **Start the call** - Click "Start Call"
4. **Wait for connection** - You'll see "Connected - Ready to talk"
5. **Start speaking** - The AI will automatically respond
6. **View transcript** - See your conversation in real-time
7. **End call** - Click "End Call" to see the summary

## Troubleshooting

### "Connection error" or "Failed to get session token"
- Check that your `OPENAI_API_KEY` is correctly set in `.env.local`
- Verify the backend server is running on port 3001
- Check the terminal for error messages

### "Microphone access denied"
- Allow microphone permissions in your browser
- Chrome: Settings → Privacy and Security → Site Settings → Microphone
- Firefox: about:preferences#privacy → Permissions → Microphone

### No audio from AI
- Check your system volume
- Verify your audio output device is working
- Check browser console for audio playback errors

### AI not responding
- Make sure you're speaking clearly and loudly enough
- The AI uses voice activity detection (VAD) - pause briefly after speaking
- Check the console for WebSocket errors

### WebSocket connection failed
- Verify you have access to OpenAI's Realtime API (it's in beta)
- Check your internet connection
- Try refreshing the page

## Cost Considerations

The Realtime API is more expensive than standard API calls:
- **Input audio:** ~$0.06 per minute
- **Output audio:** ~$0.24 per minute
- **Total:** Roughly $0.30 per minute of conversation

A 5-minute training call costs approximately **$1.50**.

## Technical Details

### Audio Format
- **Codec:** PCM16 (16-bit Linear PCM)
- **Sample Rate:** 24,000 Hz
- **Channels:** Mono (1 channel)
- **Bitrate:** 384 kbps

### WebSocket Protocol
- **Endpoint:** `wss://api.openai.com/v1/realtime`
- **Model:** `gpt-4o-realtime-preview-2024-10-01`
- **Authentication:** Ephemeral session token (60 seconds)

### Browser Compatibility
- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Firefox 88+
- ✅ Safari 14.1+
- ⚠️ Requires WebSocket and WebRTC support

## Next Steps (Future Enhancements)

- [ ] Add voice selection (alloy, shimmer, echo, etc.)
- [ ] Show real-time audio waveform
- [ ] Add call recording and playback
- [ ] Support for custom instructions per call
- [ ] Integration with analytics and scoring
- [ ] Multi-language support

## Resources

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

