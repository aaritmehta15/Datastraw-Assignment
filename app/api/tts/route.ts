import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from '@andresaya/edge-tts';
import { normalizeTextForVoice } from '@/lib/voiceNormalizer';

// Must be Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-process RAM cache: phrase → Buffer (max 100 entries, ~5MB)
const cache = new Map<string, Buffer>();

// Shared client with updated Sec-MS-GEC v2 protocol
const edgeTtsClient = new EdgeTTS();

// Pre-warm frequently used Aria phrases at server startup
const PREWARM = [
  'Namaste! I am Aria from Aura Skincare. How can I help with your orders or skincare questions today?',
  'Namaste! I am Aria from Aura Skincare. How can I assist you with your order today?',
  'I am checking that for you right now.',
  'I experienced a brief connection delay. Could you please repeat that?',
];

async function synthesize(text: string): Promise<Buffer> {
  // Clean special characters and parentheses that break SSML parsing
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/[<>&]/g, ' ')
    .trim();

  const result = await edgeTtsClient.generate(cleanText, 'en-IN-NeerjaNeural');
  return result.audio;
}

// Kick off pre-warming in background
(async () => {
  for (const phrase of PREWARM) {
    const key = normalizeTextForVoice(phrase).toLowerCase();
    if (cache.has(key)) continue;
    try {
      const buf = await synthesize(normalizeTextForVoice(phrase));
      cache.set(key, buf);
    } catch (_) { /* non-fatal */ }
  }
})();

export async function GET(req: NextRequest) {
  const rawText = new URL(req.url).searchParams.get('text');
  if (!rawText) {
    return NextResponse.json({ error: 'text param required' }, { status: 400 });
  }

  const text = normalizeTextForVoice(rawText).slice(0, 400).trim();
  if (!text) {
    return NextResponse.json({ error: 'empty text after normalization' }, { status: 400 });
  }

  const key = text.toLowerCase();

  try {
    // ── Cache HIT → instant 0ms response ────────────────────────────────
    if (cache.has(key)) {
      const buf = cache.get(key)!;
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buf.length.toString(),
          'Cache-Control': 'public, max-age=86400',
          'X-Cache': 'HIT',
          'X-Voice': 'en-IN-NeerjaNeural',
        },
      });
    }

    // ── Cache MISS → synthesize en-IN-NeerjaNeural ──────────────────────
    const buf = await synthesize(text);

    // Evict oldest entry if over limit
    if (cache.size >= 100) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
    cache.set(key, buf);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buf.length.toString(),
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'MISS',
        'X-Voice': 'en-IN-NeerjaNeural',
      },
    });
  } catch (err: any) {
    console.error('[TTS] synthesis failed:', err?.message);
    return NextResponse.json(
      { error: 'TTS_FAILED', message: err?.message },
      { status: 500 },
    );
  }
}
