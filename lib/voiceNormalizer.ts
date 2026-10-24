/**
 * Voice Text Normalizer
 * Prepares LLM text output for natural speech synthesis:
 * - Strips all markdown syntax (asterisks, bullet points, headers, tables)
 * - Converts currency symbols (₹499 -> 499 Rupees)
 * - Phonetically formats Order IDs (ORD-101 -> Order O-R-D 101)
 * - Expands acronyms (COD -> Cash on Delivery, UPI -> U-P-I)
 */
export function normalizeTextForVoice(input: string): string {
  if (!input) return '';

  let text = input;

  // 1. Remove markdown bold/italic asterisks and underscores
  text = text.replace(/[*_~`]/g, '');

  // 2. Remove markdown list bullets and numbers at line start
  text = text.replace(/^[\s]*[-+*]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // 3. Remove markdown headers (### Header)
  text = text.replace(/^#+\s+/gm, '');

  // 4. Remove markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 5. Currency conversion: ₹XXX or Rs. XXX -> XXX Rupees (requires word boundary and leading digit)
  text = text.replace(/₹\s*(\d[\d,]*)/g, '$1 Rupees');
  text = text.replace(/\bRs\.?\s*(\d[\d,]*)/gi, '$1 Rupees');
  text = text.replace(/\bINR\s*(\d[\d,]*)/gi, '$1 Rupees');

  // 6. Order ID phonetic spacing: ORD-101 -> Order O-R-D 101 (supports 3-5 digits)
  text = text.replace(/\bORD-(\d{3,5})\b/gi, 'Order O-R-D $1');

  // 7. Expand telecom / payment acronyms for clear voice
  text = text.replace(/\bCOD\b/g, 'Cash on Delivery');
  text = text.replace(/\bUPI\b/g, 'U-P-I');

  // 8. Clean up extra punctuation, brackets, and multiple spaces
  text = text.replace(/[\[\]{}()]/g, '');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}
