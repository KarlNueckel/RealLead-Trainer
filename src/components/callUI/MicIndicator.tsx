interface MicIndicatorProps {
  active?: boolean; // legacy prop
  isActive?: boolean; // preferred prop for clarity
}

export function MicIndicator(_props: MicIndicatorProps) {
  // Always pulsing for now (not driven by mic input)
  return (
    <div className="mic-pulse" />
  );
}

// Alias for clearer naming in call pages
export const ListeningIndicator = MicIndicator;

