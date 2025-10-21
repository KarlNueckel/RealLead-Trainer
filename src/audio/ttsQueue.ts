// A single exclusive, cancelable TTS playback queue
type Item = { 
  id: string; 
  url?: string; 
  blob?: Blob;
  arrayBuf?: ArrayBuffer; 
  playbackRate?: number; // optional per-item playback rate (e.g., 1.06 for slightly higher pitch)
  onStart?: () => void; 
  onEnd?: () => void; 
};

class TTSQueue {
  private q: Item[] = [];
  private playing = false;
  private audioCtx?: AudioContext;
  private source?: AudioBufferSourceNode;
  private abort?: AbortController;
  private currentAudio?: HTMLAudioElement;

  enqueue(item: Item) { 
    console.log(`🎵 Enqueuing TTS item ${item.id}`);
    this.q.push(item); 
    this.kick(); 
  }
  
  clear(cancelCurrent = true) {
    console.log(`🧹 Clearing TTS queue (cancelCurrent: ${cancelCurrent})`);
    this.q = [];
    if (cancelCurrent) this.stop();
  }
  
  isPlaying() { 
    return this.playing; 
  }

  async kick() {
    if (this.playing || this.q.length === 0) return;
    const next = this.q.shift()!;
    this.playing = true;

    console.log(`▶️ Playing TTS item ${next.id}`);

    try {
      next.onStart?.();

      // Get the audio blob
      let audioBlob: Blob;
      
      if (next.blob) {
        // Direct blob provided
        console.log(`📦 Using direct blob, size: ${next.blob.size} bytes, type: ${next.blob.type}`);
        audioBlob = next.blob;
      } else if (next.arrayBuf) {
        // ArrayBuffer provided - convert to blob
        console.log(`📦 Converting ArrayBuffer to blob, size: ${next.arrayBuf.byteLength} bytes`);
        audioBlob = new Blob([next.arrayBuf], { type: 'audio/mpeg' });
      } else if (next.url) {
        // URL provided - fetch it
        console.log(`📦 Fetching from URL: ${next.url}`);
        this.abort = new AbortController();
        const resp = await fetch(next.url, { signal: this.abort.signal });
        audioBlob = await resp.blob();
        console.log(`📦 Fetched blob, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      } else {
        throw new Error("TTS item missing data");
      }

      if (audioBlob.size === 0) {
        throw new Error("Audio blob is empty (0 bytes)");
      }

      // Create blob URL for HTML5 Audio
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(`🔗 Created blob URL: ${audioUrl}`);
      
      this.currentAudio = new Audio(audioUrl);
      if (typeof next.playbackRate === 'number' && isFinite(next.playbackRate) && next.playbackRate > 0) {
        try {
          this.currentAudio.playbackRate = next.playbackRate;
          console.log(`🎚️ Applied playbackRate=${next.playbackRate.toFixed(2)} to Audio`);
        } catch {}
      }
      console.log(`🎵 Created Audio element, attempting to play...`);
      
      await new Promise<void>((resolve, reject) => {
        this.currentAudio!.onended = () => {
          console.log(`✅ Audio ended naturally`);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        this.currentAudio!.onerror = (e) => {
          console.error('❌ Audio playback error:', e);
          console.error('Audio element state:', {
            src: this.currentAudio?.src,
            readyState: this.currentAudio?.readyState,
            networkState: this.currentAudio?.networkState,
            error: this.currentAudio?.error
          });
          URL.revokeObjectURL(audioUrl);
          reject(e);
        };
        
        this.currentAudio!.play()
          .then(() => {
            console.log(`▶️ Audio.play() succeeded, now playing...`);
          })
          .catch((err) => {
            console.error('❌ Audio.play() failed:', err);
            console.error('Error name:', err.name);
            console.error('Error message:', err.message);
            reject(err);
          });
      });

      console.log(`✅ Finished playing TTS item ${next.id}`);
      next.onEnd?.();
    } catch (e) {
      // cancelled or playback error – swallow
      console.log(`⏭️ TTS playback cancelled or error:`, e);
    } finally {
      this.stop(false); // cleanup but don't mark as externally canceled
      this.playing = false;
      this.kick();
    }
  }

  stop(closeQueueToo = true) {
    try { this.abort?.abort(); } catch {}
    
    if (this.currentAudio) {
      try { 
        this.currentAudio.pause(); 
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = undefined;
    }
    
    try { this.source?.stop(); } catch {}
    try { this.source?.disconnect(); } catch {}
    
    this.source = undefined;
    this.abort = undefined;
    
    if (closeQueueToo) this.q = [];
  }
}

export const ttsQueue = new TTSQueue();

