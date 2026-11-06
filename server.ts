// Enforce disabled HMR in AI Studio sandbox environment to prevent WebSocket disconnection errors
process.env.DISABLE_HMR = 'true';

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    model: 'gemini-3.8-flash',
  });
});

// Story generation response schema
const STORY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Engaging, catchy English title for the story',
    },
    koreanTitle: {
      type: Type.STRING,
      description: 'Natural Korean title capturing the episode flavor',
    },
    summary: {
      type: Type.STRING,
      description: 'One concise Korean sentence summarizing the story',
    },
    paragraphs: {
      type: Type.ARRAY,
      description: 'Paragraphs of the story with English text and authentic Korean translation',
      items: {
        type: Type.OBJECT,
        properties: {
          en: { type: Type.STRING, description: 'Natural idiomatic English paragraph' },
          ko: { type: Type.STRING, description: 'Natural Korean translation' },
        },
        required: ['en', 'ko'],
      },
    },
    keyExpressions: {
      type: Type.ARRAY,
      description: '3 to 5 high-yield native idioms, phrasal verbs, or colloquial phrases used in the story',
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING, description: 'The idiom or phrase in English' },
          meaning: { type: Type.STRING, description: 'Korean meaning and practical nuance' },
          usageExample: { type: Type.STRING, description: 'A realistic everyday example sentence using this phrase' },
          nuanceExplanation: { type: Type.STRING, description: 'Why native speakers use this phrase and the emotional image it conveys' },
          category: {
            type: Type.STRING,
            enum: ['idiom', 'phrasal_verb', 'colloquial', 'connector'],
            description: 'Category of expression',
          },
        },
        required: ['phrase', 'meaning', 'usageExample', 'nuanceExplanation', 'category'],
      },
    },
    nuanceUpgrades: {
      type: Type.ARRAY,
      description: '2 to 3 comparisons showing common Konglish/awkward phrasing vs. native English',
      items: {
        type: Type.OBJECT,
        properties: {
          awkwardOrKonglish: { type: Type.STRING, description: 'How a beginner might awkwardly express it' },
          naturalNative: { type: Type.STRING, description: 'How a native English speaker would naturally say it' },
          whyBetter: { type: Type.STRING, description: 'Clear Korean explanation of the nuance difference' },
        },
        required: ['awkwardOrKonglish', 'naturalNative', 'whyBetter'],
      },
    },
    shadowingSentences: {
      type: Type.ARRAY,
      description: '2 to 4 key rhythmic sentences from the story ideal for speech shadowing and pronunciation practice',
      items: {
        type: Type.OBJECT,
        properties: {
          en: { type: Type.STRING, description: 'English sentence to shadow' },
          ko: { type: Type.STRING, description: 'Korean translation' },
          focusPoint: { type: Type.STRING, description: 'Pronunciation, stress, and intonation coaching tip in Korean' },
        },
        required: ['en', 'ko', 'focusPoint'],
      },
    },
    quizQuestions: {
      type: Type.ARRAY,
      description: '2 multiple-choice questions to test recall of the key idioms or grammar nuance',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: 'Korean question testing one of the expressions' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '4 answer choices',
          },
          answerIndex: { type: Type.INTEGER, description: 'Index of correct answer (0-3)' },
          explanation: { type: Type.STRING, description: 'Detailed Korean explanation' },
        },
        required: ['question', 'options', 'answerIndex', 'explanation'],
      },
    },
  },
  required: [
    'title',
    'koreanTitle',
    'summary',
    'paragraphs',
    'keyExpressions',
    'nuanceUpgrades',
    'shadowingSentences',
    'quizQuestions',
  ],
};

// Fallback generator when AI key is missing or quota is exceeded
function generateFallbackStory(
  rawContent: string,
  mood: string,
  category: string,
  englishStyle: string
) {
  const title = `My Daily Story: ${category.toUpperCase()}`;
  const koreanTitle = `오늘의 ${category} 일기: ${mood}`;
  
  return {
    title,
    koreanTitle,
    summary: `오늘 일상에서 겪은 소중한 경험을 기록하고 영어로 표현해본 하루`,
    paragraphs: [
      {
        en: `Today turned out to be quite memorable. ${rawContent ? `Looking back on what happened: ${rawContent.slice(0, 80)}...` : 'It was a day full of unexpected little moments.'}`,
        ko: `오늘은 꽤나 기억에 남는 하루였습니다. 오늘 있었던 일을 돌아보며 마음속에 남았던 생각들을 정리해보았어요.`,
      },
      {
        en: `Even in the middle of a bustling day, taking a moment to pause and reflect really helped clear my mind. Everything seemed to fall into place.`,
        ko: `바쁜 일상 속에서도 잠시 멈추어 생각을 정리하니 마음이 한결 가벼워졌습니다. 모든 일들이 서서히 제자리를 찾아가는 것 같았어요.`,
      },
      {
        en: `At the end of the day, it's these everyday episodes that make life rich and meaningful. Tomorrow is another fresh start!`,
        ko: `결국 하루를 풍요롭고 의미 있게 만드는 건 이런 소소한 일상 에피소드들인 것 같아요. 내일은 또 새로운 시작입니다!`,
      },
    ],
    keyExpressions: [
      {
        id: `expr-fall-into-place-${Date.now()}`,
        phrase: 'fall into place',
        meaning: '딱딱 들어맞다, 순조롭게 풀리다',
        usageExample: 'Once we sorted out the schedule, everything fell into place.',
        nuanceExplanation: '혼란스럽던 일들이 자연스럽게 제자리를 찾아 순조롭게 정리될 때 씁니다.',
        category: 'idiom',
      },
      {
        id: `expr-at-end-of-day-${Date.now()}`,
        phrase: 'at the end of the day',
        meaning: '결국, 궁극적으로는',
        usageExample: 'At the end of the day, peace of mind is what matters most.',
        nuanceExplanation: '모든 것을 감안하고 결론을 내릴 때 쓰는 가장 보편적인 원어민 연결구입니다.',
        category: 'connector',
      },
      {
        id: `expr-clear-mind-${Date.now()}`,
        phrase: 'clear my mind',
        meaning: '머리를 식히다, 복잡한 생각을 비우다',
        usageExample: 'A quick walk during lunch helped me clear my mind.',
        nuanceExplanation: '복잡한 잡념을 털어내고 재충전할 때 자주 사용합니다.',
        category: 'colloquial',
      },
    ],
    nuanceUpgrades: [
      {
        awkwardOrKonglish: 'Today had many things, so I think a lot.',
        naturalNative: 'Looking back on today, it was full of memorable moments.',
        whyBetter: '"Had many things" 대신 "full of memorable moments"를 쓰면 글의 품격이 훨씬 높아집니다.',
      },
      {
        awkwardOrKonglish: 'All things became good.',
        naturalNative: 'Everything finally fell into place.',
        whyBetter: '"Fell into place"는 마치 퍼즐 조각이 딱 맞춰지는 듯한 원어민 특유의 감각적 표현입니다.',
      },
    ],
    shadowingSentences: [
      {
        id: `sh-fb-1-${Date.now()}`,
        en: 'Taking a moment to pause and reflect really helped clear my mind.',
        ko: '잠시 멈춰 생각을 정리하니 머리가 한결 맑아졌습니다.',
        focusPoint: 'pause and reflect의 라임과 clear my mind의 억양 흐름을 의식해보세요.',
      },
      {
        id: `sh-fb-2-${Date.now()}`,
        en: "At the end of the day, it's these everyday episodes that make life meaningful.",
        ko: '결국 이런 일상의 소소한 에피소드들이 삶을 의미 있게 만들어줍니다.',
        focusPoint: 'At the end of the day는 원어민처럼 한 호흡으로 굴리듯 발음하세요.',
      },
    ],
    quizQuestions: [
      {
        id: `q-fb-1-${Date.now()}`,
        question: '"복잡했던 일들이 순조롭게 딱딱 맞아떨어지다"를 의미하는 숙어는?',
        options: ['fall into place', 'jump the gun', 'bite the bullet', 'burn the candle'],
        answerIndex: 0,
        explanation: '"fall into place"는 혼란스럽던 조각들이 제자리에 맞아떨어져 순조롭게 해결되는 모습을 뜻합니다.',
      },
    ],
  };
}

// Generate Story Endpoint
app.post('/api/generate-story', async (req: Request, res: Response) => {
  try {
    const { rawContent, mood = 'peaceful', category = 'daily', englishStyle = 'casual' } = req.body;

    if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
      res.status(400).json({ error: '일과 에피소드 내용을 입력해주세요.' });
      return;
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY is not set. Using intelligent fallback story generator.');
      const fallback = generateFallbackStory(rawContent, mood, category, englishStyle);
      res.json(fallback);
      return;
    }

    const styleInstructions: Record<string, string> = {
      casual: 'Casual everyday English (A2-B1): Natural spoken idioms, comfortable conversational rhythm, like chatting with a close friend over coffee.',
      vivid: 'Vivid storyteller style (B2): Engaging, dramatic, punchy descriptions, humor, colorful adjectives, storytelling reactions (e.g. "My jaw dropped", "Out of nowhere").',
      professional: 'Polite & reflective professional tone (C1): Sophisticated vocabulary, elegant phrasal verbs, structured reflections suitable for a career blog or workplace discussion.',
      short_reel: 'Punchy 3-sentence social reel/short diary: Super catchy, concise, high-impact phrasing perfect for quick memorization and Instagram/Twitter caption.',
    };

    const prompt = `
You are an expert English language coach and professional storyteller for Korean learners.
Transform the user's daily life episode/notes into an engaging English story and a structured English study lesson.

User Episode Context:
- User's Daily Notes / Episode: """${rawContent}"""
- Mood: ${mood}
- Category: ${category}
- Desired English Style: ${englishStyle} (${styleInstructions[englishStyle] || styleInstructions.casual})

Instructions:
1. Craft an authentic, natural English story (2 to 4 paragraphs) that directly reflects what happened in the user's notes.
2. Provide a warm, natural Korean translation for each paragraph (not literal machine translation).
3. Extract 3 to 5 key idioms, phrasal verbs, or colloquial expressions actually used in the story.
4. Provide 2 to 3 "Nuance Upgrades" showing how Korean speakers typically say something awkwardly (Konglish/literal) vs. how a native English speaker phrases it with natural nuance.
5. Select 2 to 4 prime sentences for Shadowing / Pronunciation practice with Korean coaching tips.
6. Provide 2 multiple-choice quiz questions based on the expressions in the story.

Produce valid JSON matching the schema strictly.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: STORY_SCHEMA,
        systemInstruction: 'You are an inspiring, warm, and highly skilled bilingual English learning mentor.',
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsed = JSON.parse(text);
    // Enrich with IDs
    const result = {
      ...parsed,
      keyExpressions: (parsed.keyExpressions || []).map((ke: any, idx: number) => ({
        ...ke,
        id: `expr-${Date.now()}-${idx}`,
      })),
      shadowingSentences: (parsed.shadowingSentences || []).map((sh: any, idx: number) => ({
        ...sh,
        id: `sh-${Date.now()}-${idx}`,
      })),
      quizQuestions: (parsed.quizQuestions || []).map((q: any, idx: number) => ({
        ...q,
        id: `q-${Date.now()}-${idx}`,
      })),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error generating story with Gemini API:', error);
    // Fallback gracefully so user flow is uninterrupted
    const { rawContent = '', mood = 'peaceful', category = 'daily', englishStyle = 'casual' } = req.body || {};
    const fallback = generateFallbackStory(rawContent, mood, category, englishStyle);
    res.json({
      ...fallback,
      warning: 'AI 서비스 연결 지연으로 추천 기본 템플릿으로 생성되었습니다.',
    });
  }
});

// Expand Expression with Conversational Dialogue
app.post('/api/expand-expression', async (req: Request, res: Response) => {
  try {
    const { phrase, meaning } = req.body;
    if (!phrase) {
      res.status(400).json({ error: 'Phrase is required' });
      return;
    }

    if (!ai) {
      res.json({
        phrase,
        dialogues: [
          { speakerA: "How's your new project going?", speakerB: `Great! Everything is starting to ${phrase}.` },
          { speakerA: "Did you talk to Sarah?", speakerB: `Yes, we agreed that at this point we just have to ${phrase}.` },
        ],
        culturalTip: `원어민들이 일상 대화나 직장에서 격식 없이 즐겨 사용하는 표현입니다.`,
      });
      return;
    }

    const prompt = `Provide 2 realistic everyday 2-line dialogue exchanges using the English expression "${phrase}" (${meaning || ''}), plus 1 short Korean cultural nuance tip.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speakerA: { type: Type.STRING },
                  speakerB: { type: Type.STRING },
                },
                required: ['speakerA', 'speakerB'],
              },
            },
            culturalTip: { type: Type.STRING },
          },
          required: ['dialogues', 'culturalTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ phrase, ...parsed });
  } catch (error) {
    console.error('Error expanding expression:', error);
    res.json({
      phrase: req.body?.phrase,
      dialogues: [
        { speakerA: "Have you tried this before?", speakerB: `Yeah, it really helped me ${req.body?.phrase}.` },
      ],
      culturalTip: '일상 회화에서 감정을 강조하거나 친근한 분위기를 형성할 때 유용하게 쓰입니다.',
    });
  }
});

// Setup Vite dev server or serve production build
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (${isDev ? 'development' : 'production'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
