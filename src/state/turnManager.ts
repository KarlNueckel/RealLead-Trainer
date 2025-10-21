// Simple finite-state turn manager (no external libs)
export type TurnState = "IDLE" | "USER_TALKING" | "AI_THINKING" | "AI_SPEAKING";

type Listener = (s: TurnState) => void;

class TurnManager {
  private state: TurnState = "IDLE";
  private listeners = new Set<Listener>();

  get() { 
    return this.state; 
  }
  
  set(next: TurnState) {
    if (next === this.state) return;
    console.log(`🔄 Turn state: ${this.state} → ${next}`);
    this.state = next;
    this.listeners.forEach(l => l(this.state));
  }
  
  on(fn: Listener): () => void { 
    this.listeners.add(fn); 
    return () => { 
      this.listeners.delete(fn); 
    }; 
  }
  
  isBusy() { 
    return this.state === "AI_THINKING" || this.state === "AI_SPEAKING"; 
  }
}

export const turnManager = new TurnManager();

