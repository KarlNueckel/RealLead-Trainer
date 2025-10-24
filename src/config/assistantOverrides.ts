// Central mapping for assistant overrides by scenario flag + persona
// Only affects which Vapi assistant_id is used; UI remains unchanged.

export const ASSISTANT_OVERRIDES = {
  seller_referral2: {
    avery: "041f6d15-639c-40fc-97f7-d732cbbf3a57",
  },
} as const;

export function getAssistantOverrideFromSearch(search: string, personaId?: string) {
  try {
    const params = new URLSearchParams(search);
    if (params.get("seller_referral2") === "true" && personaId === "avery") {
      return ASSISTANT_OVERRIDES.seller_referral2.avery;
    }
  } catch {}
  return undefined;
}
