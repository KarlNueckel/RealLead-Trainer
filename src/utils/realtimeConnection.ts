// Minimal WebRTC connector for OpenAI Realtime (browser)
// Requires an ephemeral key (Bearer) fetched from your backend.

export type RealtimeConnection = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  remoteAudio: HTMLAudioElement;
  send: (msg: any) => void;
  close: () => void;
};

export async function connectRealtimeWebRTC(ephemeralKey: string, model = "gpt-4o-realtime-preview"): Promise<RealtimeConnection> {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  });

  const dc = pc.createDataChannel("oai-events");
  dc.onopen = () => console.log("📡 DataChannel open");
  dc.onerror = (e) => console.error("DataChannel error", e);

  const remoteAudio = document.createElement("audio");
  remoteAudio.autoplay = true;
  pc.ontrack = (e) => {
    console.log("🔊 Remote track received");
    remoteAudio.srcObject = e.streams[0];
  };

  // Add mic track
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const [track] = stream.getAudioTracks();
  pc.addTrack(track, stream);

  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
  await pc.setLocalDescription(offer);

  const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
      Accept: "application/sdp",
    },
    body: offer.sdp,
  });

  if (!sdpResponse.ok) {
    const text = await sdpResponse.text().catch(() => "");
    throw new Error(`SDP exchange failed: ${sdpResponse.status} ${text}`);
  }

  const answerSdp = await sdpResponse.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  const send = (msg: any) => {
    if (dc.readyState === "open") dc.send(JSON.stringify(msg));
  };

  const close = () => {
    try { dc.close(); } catch {}
    try { pc.close(); } catch {}
    try { track.stop(); } catch {}
    if (remoteAudio.srcObject) {
      const s = remoteAudio.srcObject as MediaStream;
      s.getTracks().forEach(t => t.stop());
      remoteAudio.srcObject = null as any;
    }
  };

  return { pc, dc, remoteAudio, send, close };
}

