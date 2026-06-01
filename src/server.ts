import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI style generation will be limited.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint for AI generating custom VTuber themes
app.post('/api/gemini/generate-style', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Промпт порожній або некоректний.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Конфігурація ШІ недоступна. Будь ласка, перевірте наявність GEMINI_API_KEY в налаштуваннях та спробуйте ще раз.'
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Створи детальну художнью конфігурацію VTuber аватара відповідно до запиту користувача: "${prompt}".
       Поверни кольори виключно в форматі HEX (наприклад: "#ff0077" або "#1a1a2e").
       Lore та Name повинні бути українською мовою з детальним, цікавим текстом для Twitch-стрімера. Текст лору повинен бути затишним чи креативним з гумором.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinColor: { type: Type.STRING, description: "HEX color. Normal skin tones (e.g., #fbe2d3), pale gothic tones, or fantasy colors." },
            eyeColor: { type: Type.STRING, description: "HEX glowing eye iris color" },
            pupilStyle: { type: Type.STRING, enum: ['round', 'star', 'heart', 'slit'], description: "pupil contour shape" },
            pupilColor: { type: Type.STRING, description: "Inner pupil HEX color, usually darker or bright contrast" },
            eyebrowStyle: { type: Type.STRING, enum: ['normal', 'thick', 'thin', 'sad'] },
            eyebrowColor: { type: Type.STRING, description: "HEX color matching or contrasting hair" },
            hairStyleBang: { type: Type.STRING, enum: ['classic', 'side', 'center-part', 'short'] },
            hairStyleBack: { type: Type.STRING, enum: ['straight', 'tails', 'short', 'curly'] },
            hairColor: { type: Type.STRING, description: "Primary hair HEX color" },
            hairHighlightColor: { type: Type.STRING, description: "Hair glow arc highlights HEX color" },
            clothingStyle: { type: Type.STRING, enum: ['hoodie', 'kimono', 'suit', 'cyber-armor'] },
            clothingColor1: { type: Type.STRING, description: "Primary clothes HEX color" },
            clothingColor2: { type: Type.STRING, description: "Secondary clothing accents HEX color" },
            accessoryStyle: { type: Type.STRING, enum: ['none', 'headphones', 'horns', 'glasses', 'neko-ears'] },
            accessoryColor: { type: Type.STRING, description: "HEX color of accessory item" },
            backgroundStyle: { type: Type.STRING, enum: ['gaming', 'nebula', 'green-screen', 'dark-studio'] },
            name: { type: Type.STRING, description: "Креативне ім'я для VTuber-а українською мовою" },
            lore: { type: Type.STRING, description: "Коротка, весела та затишна передісторія стрімера українською мовою (2-3 речення), наприклад чим займається, фірмові фрази стрімера." }
          },
          required: [
            'skinColor', 'eyeColor', 'pupilStyle', 'pupilColor', 'eyebrowStyle', 'eyebrowColor',
            'hairStyleBang', 'hairStyleBack', 'hairColor', 'hairHighlightColor', 'clothingStyle',
            'clothingColor1', 'clothingColor2', 'accessoryStyle', 'accessoryColor', 'backgroundStyle',
            'name', 'lore'
          ]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Отримано порожню відповідь від моделі.');
    }

    const configData = JSON.parse(text.trim());
    res.json(configData);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Помилка під час генерації у Gemini.' });
  }
});

// Serve frontend assets
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in DEVELOPMENT mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Static server loaded in PRODUCTION mode serving from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VTuber Studio Express server active on: http://0.0.0.0:${PORT}`);
  });
};

startServer();
