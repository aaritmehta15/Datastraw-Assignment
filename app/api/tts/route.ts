import { NextRequest, NextResponse } from 'next/server';
import { generateSecMsGec } from '@/lib/secMsGec';
import { WebSocket } from 'ws';
import crypto from 'crypto';
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
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/[<>&]/g, ' ')
    .trim();

  return new Promise<Buffer>((resolve, reject) => {
    const token = generateSecMsGec('6A5AA1D4EAFF4E9FB37E23D68491D6F4');
    const connId = crypto.randomUUID().replace(/-/g, '');
    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=2-143.0.3650.75&ConnectionId=${connId}`;

    const ws = new WebSocket(url, {
      origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });

    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      reject(new Error('TTS_TIMEOUT'));
    }, 8000);

    ws.on('open', () => {
      const ts = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -1);
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`,
      );

      const reqId = crypto.randomUUID().replace(/-/g, '');
      const voice = 'Microsoft Server Speech Text to Speech Voice (en-IN, NeerjaNeural)';
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(cleanText)}</prosody></voice></speak>`;
      ws.send(
        `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${ssml}`,
      );
    });

    ws.on('message', (data: any, isBinary: boolean) => {
      if (isBinary) {
        const headerLen = (data[0] << 8) | data[1];
        const audio = data.slice(2 + headerLen);
        if (audio.length > 0) {
          chunks.push(Buffer.isBuffer(audio) ? audio : Buffer.from(audio));
        }
      } else {
        const str = data.toString();
        if (str.includes('Path:turn.end')) {
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
