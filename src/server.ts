import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';

dotenv.config({ quiet: true });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = readPositiveInteger(process.env.GEMINI_TIMEOUT_MS, 25_000);
const GEMINI_RETRY_ATTEMPTS = readPositiveInteger(process.env.GEMINI_RETRY_ATTEMPTS, 2);
const MAX_PROMPT_LENGTH = 600;

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function log(level: 'info' | 'warn' | 'error', event: string, details: Record<string, unknown> = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  });
  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'APIConnectionTimeoutError' || /timed? ?out/i.test(error.message));
}

// Cap request body size to avoid memory abuse.
app.use(express.json({ limit: '16kb' }));

// Minimal security headers (avoids pulling in helmet as a dependency).
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

/**
 * Lightweight in-memory rate limiter (per IP, fixed window). Good enough for a
 * single-instance deployment; swap for a shared store if scaled horizontally.
 */
function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      return res.status(429).json({ code: 'rate_limited', error: 'Too many requests. Please wait a moment.' });
    }
    entry.count++;
    next();
  };
}

const aiLimiter = createRateLimiter(60_000, 15); // 15 generations / minute / IP

// Initialize server-side Gemini client (lazy, so a missing key only fails AI calls).
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log('warn', 'gemini.disabled', { reason: 'missing_api_key' });
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'v-studio' },
      timeout: GEMINI_TIMEOUT_MS,
      retryOptions: { attempts: GEMINI_RETRY_ATTEMPTS },
    },
  });
};

// Health check for container orchestration / uptime probes.
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', ai: Boolean(process.env.GEMINI_API_KEY) });
});

// API Endpoint for AI generating custom VTuber themes
app.post('/api/gemini/generate-style', aiLimiter, async (req, res) => {
  const { prompt } = req.body ?? {};
  const requestId = randomUUID();

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ code: 'prompt_empty', error: 'The prompt is empty or invalid.' });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(413).json({
      code: 'prompt_too_long',
      max: MAX_PROMPT_LENGTH,
      error: `The prompt is too long (max ${MAX_PROMPT_LENGTH} characters).`,
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      code: 'ai_unavailable',
      error: 'AI configuration is unavailable. Check that GEMINI_API_KEY is set.',
    });
  }

  try {
    const startedAt = Date.now();
    log('info', 'gemini.generate.started', {
      requestId,
      model: GEMINI_MODEL,
      promptLength: prompt.length,
    });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Створи детальну художню конфігурацію VTuber аватара відповідно до запиту користувача: "${prompt}".
       Поверни кольори виключно в форматі HEX (наприклад: "#ff0077" або "#1a1a2e").
       Lore та Name повинні бути українською мовою з детальним, цікавим текстом для Twitch-стрімера. Текст лору повинен бути затишним чи креативним з гумором.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinColor: {
              type: Type.STRING,
              description: 'HEX color. Normal skin tones (e.g., #fbe2d3), pale gothic tones, or fantasy colors.',
            },
            eyeColor: { type: Type.STRING, description: 'HEX glowing eye iris color' },
            pupilStyle: {
              type: Type.STRING,
              enum: ['round', 'star', 'heart', 'slit'],
              description: 'pupil contour shape',
            },
            pupilColor: { type: Type.STRING, description: 'Inner pupil HEX color, usually darker or bright contrast' },
            eyebrowStyle: { type: Type.STRING, enum: ['normal', 'thick', 'thin', 'sad'] },
            eyebrowColor: { type: Type.STRING, description: 'HEX color matching or contrasting hair' },
            hairStyleBang: {
              type: Type.STRING,
              enum: ['classic', 'side', 'center-part', 'short', 'hime', 'spiky', 'curly-bangs', 'cross-bangs'],
            },
            hairStyleBack: {
              type: Type.STRING,
              enum: ['straight', 'tails', 'short', 'curly', 'braids', 'hime-long', 'drill-tails', 'wavy'],
            },
            hairColor: { type: Type.STRING, description: 'Primary hair HEX color' },
            hairHighlightColor: { type: Type.STRING, description: 'Hair glow arc highlights HEX color' },
            clothingStyle: {
              type: Type.STRING,
              enum: [
                'hoodie',
                'kimono',
                'suit',
                'cyber-armor',
                'goth-dress',
                'druid-cloak',
                'sailor-fuku',
                'sweater',
                'maid',
              ],
            },
            clothingColor1: { type: Type.STRING, description: 'Primary clothes HEX color' },
            clothingColor2: { type: Type.STRING, description: 'Secondary clothing accents HEX color' },
            accessoryStyle: {
              type: Type.STRING,
              enum: ['none', 'headphones', 'horns', 'glasses', 'neko-ears', 'angel-halo', 'fox-mask'],
            },
            accessoryColor: { type: Type.STRING, description: 'HEX color of accessory item' },
            backgroundStyle: { type: Type.STRING, enum: ['gaming', 'nebula', 'green-screen', 'dark-studio'] },
            blushColor: { type: Type.STRING, description: 'Blush / makeup HEX color' },
            blushOpacity: { type: Type.NUMBER, description: 'Blush strength 0 to 1' },
            hasFangs: { type: Type.BOOLEAN, description: 'Whether the character has vampire fangs' },
            earStyle: { type: Type.STRING, enum: ['normal', 'elf', 'pointy'] },
            hairGradient: { type: Type.STRING, enum: ['none', 'linear', 'sunset', 'indigo-fade'] },
            accessoryGlow: { type: Type.BOOLEAN, description: 'Neon glow on the accessory' },
            clothingPrint: { type: Type.STRING, enum: ['none', 'cat', 'star', 'heart', 'cyber', 'cross'] },
            artStyle: { type: Type.STRING, enum: ['classic', 'anime', 'retro'] },
            name: { type: Type.STRING, description: "Креативне ім'я для VTuber-а українською мовою" },
            lore: {
              type: Type.STRING,
              description: 'Коротка, весела та затишна передісторія стрімера українською мовою (2-3 речення).',
            },
          },
          required: [
            'skinColor',
            'eyeColor',
            'pupilStyle',
            'pupilColor',
            'eyebrowStyle',
            'eyebrowColor',
            'hairStyleBang',
            'hairStyleBack',
            'hairColor',
            'hairHighlightColor',
            'clothingStyle',
            'clothingColor1',
            'clothingColor2',
            'accessoryStyle',
            'accessoryColor',
            'backgroundStyle',
            'name',
            'lore',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Received an empty response from the model.');

    log('info', 'gemini.generate.completed', {
      requestId,
      model: GEMINI_MODEL,
      durationMs: Date.now() - startedAt,
    });
    res.json(JSON.parse(text.trim()));
  } catch (error: unknown) {
    const timedOut = isTimeoutError(error);
    log('error', 'gemini.generate.failed', {
      requestId,
      model: GEMINI_MODEL,
      timedOut,
      error: getErrorMessage(error),
    });
    res.status(timedOut ? 504 : 502).json({
      code: timedOut ? 'gemini_timeout' : 'gemini_error',
      error: timedOut
        ? 'Gemini did not respond in time. Please try again.'
        : 'Something went wrong during Gemini generation.',
    });
  }
});

/**
 * Live state relay between the editor tab and OBS overlay clients. The editor
 * streams `config`/`rig` messages; the relay caches the latest of each and
 * fans them out to overlay clients (which run in OBS's separate browser
 * process, so localStorage/BroadcastChannel can't reach them). Editors receive
 * a `status` message with the current overlay count.
 */
function setupOverlayRelay(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const overlays = new Set<WebSocket>();
  const editors = new Set<WebSocket>();
  let lastConfig: unknown = null;
  let lastRig: unknown = null;

  const broadcastStatus = () => {
    const msg = JSON.stringify({ t: 'status', overlays: overlays.size });
    editors.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(msg));
  };

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      switch (msg.t) {
        case 'hello':
          if (msg.role === 'overlay') {
            overlays.add(ws);
            if (lastConfig) ws.send(JSON.stringify({ t: 'config', config: lastConfig }));
            if (lastRig) ws.send(JSON.stringify({ t: 'rig', rig: lastRig }));
            broadcastStatus();
          } else {
            editors.add(ws);
            ws.send(JSON.stringify({ t: 'status', overlays: overlays.size }));
          }
          break;
        case 'config':
          lastConfig = msg.config;
          overlays.forEach((o) => o.readyState === WebSocket.OPEN && o.send(raw.toString()));
          break;
        case 'rig':
          lastRig = msg.rig;
          overlays.forEach((o) => o.readyState === WebSocket.OPEN && o.send(raw.toString()));
          break;
      }
    });

    ws.on('close', () => {
      overlays.delete(ws);
      editors.delete(ws);
      broadcastStatus();
    });
  });

  log('info', 'overlay.relay.ready', { path: '/ws' });
}

// Serve frontend assets
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    log('info', 'server.assets.ready', { mode: 'development' });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    log('info', 'server.assets.ready', { mode: 'production', directory: 'dist' });
  }

  const server = http.createServer(app);
  setupOverlayRelay(server);
  server.listen(PORT, '0.0.0.0', () => {
    log('info', 'server.ready', { host: '0.0.0.0', port: PORT });
  });
};

startServer().catch((error: unknown) => {
  log('error', 'server.start.failed', { error: getErrorMessage(error) });
  process.exitCode = 1;
});
