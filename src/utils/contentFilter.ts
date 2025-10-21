// Content filter to censor inappropriate words from transcriptions
// Handles transcription errors that may produce profanity

const DISALLOWED_WORDS = [
  // Profanity
  'fuck', 'fucking', 'fucked', 'fucker', 'fck', 'fuk',
  'shit', 'shit', 'sht',
  'bitch', 'btch',
  'ass', 'asshole', 'arse',
  'damn', 'dammit',
  'hell',
  'crap',
  'piss', 'pissed',
  'bastard',
  'dick', 'cock', 'penis',
  'pussy', 'cunt', 'vagina',
  'whore', 'slut',
  'nigger', 'nigga',
  'fag', 'faggot',
  'retard', 'retarded',
  // Common mishearings
  'suck', 'sucking', 'sucked',
  'motherfucker', 'motherfucking',
  // Add more as needed
];

/**
 * Censors disallowed words by replacing them with asterisks
 * @param text - The text to filter
 * @returns Filtered text with profanity replaced by ***
 */
export function filterProfanity(text: string): string {
  if (!text) return text;
  
  let filtered = text;
  
  // Create regex for each word (case-insensitive, whole word matching)
  DISALLOWED_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  
  return filtered;
}

/**
 * Checks if text contains any disallowed words
 * @param text - The text to check
 * @returns true if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return DISALLOWED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}



