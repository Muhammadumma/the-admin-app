import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(express.json());

// Lazy-init Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini Admin Assistant Endpoint
app.post('/api/gemini/assist', async (req, res) => {
  try {
    const { prompt, contextData, userRole, userName } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to environment.',
      });
    }

    const systemInstruction = `You are CLEARPASS AI, a senior administrative intelligence assistant for the CLEARPASS Student Digital Clearance System.
Your job is to assist university administrators and departmental review staff with:
- Explaining and analyzing student clearance statistics, completion rates, and bottlenecks.
- Summarizing pending submissions across the 8 institutional stages (Admission, Library, Faculty, Bursary, Sports, Accommodation, Student Affairs, Graduation).
- Highlighting common document rejection reasons and suggesting procedural improvements.
- Helping administrative staff navigate and prioritize their daily review queues.

STRICT SECURITY & GOVERNANCE RULES:
- You are an advisory assistant, NOT an approval authority. You NEVER approve or reject documents directly.
- You must maintain academic privacy and confidentiality.
- Provide clear, professional, structured, concise answers suitable for academic leadership.
- The current user requesting assistance is ${userName || 'Administrator'} (Role: ${userRole || 'ADMIN'}).`;

    const fullPrompt = `System Context & Current Clearance Data:
${JSON.stringify(contextData || {}, null, 2)}

User Question:
${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const reply = response.text || 'No response generated.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini Assist Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate assistance response',
    });
  }
});

// Setup Vite / Static handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLEARPASS Admin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
