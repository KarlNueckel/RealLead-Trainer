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
  seller_referral_contract: {
    // Contract Negotiations assistants
    avery: "9b0702ae-b67e-4de5-96e9-017b53512de3",
    morgan: "0d7f6bdd-d03f-4aa6-a84e-0a51d041bf4b",
    quinn: "7c38f9f7-3832-4355-8c33-6c1ae1486ea8",
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
    if (params.get("seller_referral_contract") === "true") {
      if (personaId === "morgan") return ASSISTANT_OVERRIDES.seller_referral_contract.morgan;
      if (personaId === "avery") return ASSISTANT_OVERRIDES.seller_referral_contract.avery;
      if (personaId === "quinn") return ASSISTANT_OVERRIDES.seller_referral_contract.quinn;
    }
  } catch {}
  return undefined;
}
