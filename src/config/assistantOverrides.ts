// Central mapping for assistant overrides by scenario flag + persona
// Only affects which Vapi assistant_id is used; UI remains unchanged.

export const ASSISTANT_OVERRIDES = {
  seller_referral2: {
    avery: "041f6d15-639c-40fc-97f7-d732cbbf3a57",
    // Morgan – Listing Consultation (Vapi assistant)
    morgan: "db32938d-2a29-42ae-a576-28df1bdcc1f4",
    // Quinn – Listing Consultation (Vapi assistant)
    quinn: "c33bade0-4e42-4150-8400-22d2aa6369cb",
  },
} as const;

export function getAssistantOverrideFromSearch(search: string, personaId?: string) {
  try {
    const params = new URLSearchParams(search);
    if (params.get("seller_referral2") === "true") {
      if (personaId === "morgan") return ASSISTANT_OVERRIDES.seller_referral2.morgan;
      if (personaId === "avery") return ASSISTANT_OVERRIDES.seller_referral2.avery;
      if (personaId === "quinn") return ASSISTANT_OVERRIDES.seller_referral2.quinn;
    }
  } catch {}
  return undefined;
}
