import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { normalizeTextForVoice } from '@/lib/voiceNormalizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory audio buffer cache for instant 0ms playback on repeated phrases
const audioCache = new Map<string, Buffer>();

// Pre-warm the cache with standard Aria greetings for zero-latency instant start
async function prewarmCache() {
  const commonPhrases = [
    "Namaste! I am Aria from Aura Skincare. How can I assist you with your orders or skincare questions today?",
    "Namaste! I am Aria from Aura Skincare. How can I assist you with your order today?",
    "I am checking your order right now.",
    "I experienced a brief connection delay. Could you please repeat that?"
  ];

  for (const phrase of commonPhrases) {
    const key = normalizeTextForVoice(phrase).slice(0, 300).trim().toLowerCase();
    if (!audioCache.has(key)) {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata('en-IN-NeerjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(phrase);
        const chunks: Buffer[] = [];
        for await (const chunk of audioStream) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        audioCache.set(key, Buffer.concat(chunks));
        tts.close();
      } catch (_) {}
    }
  }
}

// Kick off prewarming in background
prewarmCache().catch(() => {});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawText = searchParams.get('text');

  if (!rawText) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  try {
    const text = normalizeTextForVoice(rawText).slice(0, 350).trim();
    const cacheKey = text.toLowerCase();

    // 1. Instant RAM Cache HIT (0ms latency)
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cached.length.toString(),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Cache': 'HIT',
          'X-Voice': 'en-IN-NeerjaNeural'
        }
      });
    }

    // 2. High-speed synthesis using authentic Indian Female voice en-IN-NeerjaNeural (<800ms)
    const tts = new MsEdgeTTS();
    await tts.setMetadata('en-IN-NeerjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    tts.close();

    // Store in cache (limit to 100 items to conserve memory)
    if (audioCache.size > 100) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioBuffer);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Cache': 'MISS',
        'X-Voice': 'en-IN-NeerjaNeural'
      }
    });
  } catch (error: any) {
    console.error('Edge TTS error, falling back:', error?.message);
    return NextResponse.json(
      { error: 'TTS_GENERATION_FAILED', message: error?.message },
      { status: 500 }
    );
  }
}
