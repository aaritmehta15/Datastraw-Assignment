import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'memo-node-edge-tts';
import { randomBytes } from 'crypto';
import { normalizeTextForVoice } from '@/lib/voiceNormalizer';

// Must be Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-process RAM cache: phrase → Buffer (max 100 entries, ~5MB)
const cache = new Map<string, Buffer>();

// Pre-warm frequently used Aria phrases at server startup
const PREWARM = [
  'Namaste! I am Aria from Aura Skincare. How can I help with your orders or skincare questions today?',
  'Namaste! I am Aria from Aura Skincare. How can I assist you with your order today?',
  'I am checking that for you right now.',
  'I experienced a brief connection delay. Could you please repeat that?',
];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

async function synthesize(text: string): Promise<Buffer> {
  // Clean special characters and parentheses that break SSML parsing
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/[<>&]/g, ' ')
    .trim();

  const tts = new EdgeTTS({
    voice: 'en-IN-NeerjaNeural',
    lang: 'en-IN',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    timeout: 8000,
  });

  const ws = await (tts as any)._connectWebSocket();

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      reject(new Error('TTS_TIMEOUT'));
    }, 7500);

    ws.on('message', (data: any, isBinary: boolean) => {
      if (isBinary) {
        const sep = 'Path:audio\r\n';
        const idx = data.indexOf(sep);
        if (idx !== -1) {
          chunks.push(data.subarray(idx + sep.length));
        }
      } else {
        const msg = data.toString();
        if (msg.includes('Path:turn.end')) {
          clearTimeout(timeout);
          try { ws.close(); } catch (_) {}
          resolve(Buffer.concat(chunks));
        }
      }
    });

    ws.on('error', (err: any) => {
      clearTimeout(timeout);
      try { ws.close(); } catch (_) {}
      reject(err);
    });

    const reqId = randomBytes(16).toString('hex');
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN">
  <voice name="en-IN-NeerjaNeural">
    <prosody rate="default" pitch="default" volume="default">
      ${escapeXml(cleanText)}
    </prosody>
  </voice>
</speak>`;

    ws.send(
      `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`,
    );
  });
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
