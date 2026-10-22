import { NextRequest, NextResponse } from 'next/server';

// In-memory audio buffer cache for instant 0ms playback on repeated phrases
const audioCache = new Map<string, ArrayBuffer>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  try {
    const safeText = text.slice(0, 300).trim();
    const cacheKey = safeText.toLowerCase();

    // 1. Check in-memory cache
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return new NextResponse(cached, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cached.byteLength.toString(),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Cache': 'HIT'
        }
      });
    }

    // 2. Fetch authentic Indian English female voice audio from Google TTS
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(safeText)}&tl=en-IN&client=tw-ob`;

    const res = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`TTS upstream responded with status ${res.status}`);
    }

    const audioBuffer = await res.arrayBuffer();

    // Store in cache (limit to 100 items to avoid memory bloat)
    if (audioCache.size > 100) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioBuffer);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Cache': 'MISS'
      }
    });
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    return NextResponse.json(
      { error: 'TTS_GENERATION_FAILED', message: error?.message },
      { status: 500 }
    );
  }
}
