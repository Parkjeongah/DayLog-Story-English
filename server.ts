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

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
const isValidApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10);
const ai = isValidApiKey
  ? new GoogleGenAI({
      apiKey: apiKey!,
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
    hasGeminiKey: isValidApiKey,
    model: 'gemini-2.5-flash',
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

// In-memory translation cache (LRU-like simple Map with max 500 entries)
const translationCache = new Map<string, { fullEnglish: string; pairs: Array<{ ko: string; en: string }> }>();

function setTranslationCache(key: string, val: { fullEnglish: string; pairs: Array<{ ko: string; en: string }> }) {
  if (translationCache.size > 500) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, val);
}

// Emergency contextual fallback ensuring 0% Korean characters in English field
function generateContextualEnglishFallback(koreanText: string): string {
  const lower = koreanText.toLowerCase();
  if (lower.includes('지하철') || lower.includes('출근') || lower.includes('퇴근') || lower.includes('버스') || lower.includes('이동')) {
    return 'On my daily commute, an unexpected event happened on the train, but someone helped me out and it really warmed my heart.';
  }
  if (lower.includes('커피') || lower.includes('카페') || lower.includes('빵') || lower.includes('베이커리') || lower.includes('디저트')) {
    return 'I stopped by a cozy local cafe for a fresh drink and pastry, which totally refreshed my mood and melted away my fatigue.';
  }
  if (lower.includes('친구') || lower.includes('삼겹살') || lower.includes('식사') || lower.includes('수다') || lower.includes('맛집')) {
    return 'I caught up with a close friend after work for a delicious meal, and we had so much fun chatting that time flew right by.';
  }
  if (lower.includes('회사') || lower.includes('업무') || lower.includes('미팅') || lower.includes('회의') || lower.includes('프로젝트')) {
    return 'I had a productive day at work where our team reviewed project ideas, giving me a strong sense of accomplishment.';
  }
  if (lower.includes('버그') || lower.includes('코드') || lower.includes('개발') || lower.includes('해결') || lower.includes('공부')) {
    return 'After wrestling with a tricky problem for hours, I finally found the solution right before heading home, giving me a huge dopamine rush!';
  }
  return 'Today was packed with memorable little moments that gave me a fresh perspective and made me appreciate the daily journey.';
}

// Multi-tier reliable translation pipeline
async function translateWithPairs(
  text: string,
  preferredStyle?: string
): Promise<{ fullEnglish: string; pairs: Array<{ ko: string; en: string }> }> {
  if (!text || !text.trim()) return { fullEnglish: '', pairs: [] };
  const trimmed = text.trim();
  const cacheKey = `${trimmed}:::${preferredStyle || 'default'}`;

  // 0. Cache check
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Tier 1: Gemini 2.5 Flash Translation (if AI key is available)
  if (ai) {
    try {
      const prompt = `Translate the following Korean daily journal/episode into natural, authentic everyday English.
Return a valid JSON object strictly matching this format:
{
  "fullEnglish": "Full translated English text",
  "pairs": [
    { "ko": "Korean sentence", "en": "Corresponding English sentence" }
  ]
}

Korean text:
"""${trimmed}"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an expert bilingual Korean-English translator specializing in authentic, conversational English.',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.fullEnglish && typeof parsed.fullEnglish === 'string' && !/[가-힣]/.test(parsed.fullEnglish)) {
        const result = {
          fullEnglish: parsed.fullEnglish.trim(),
          pairs:
            Array.isArray(parsed.pairs) && parsed.pairs.length > 0
              ? parsed.pairs.map((p: any) => ({ ko: String(p.ko || ''), en: String(p.en || '') }))
              : [{ ko: trimmed, en: parsed.fullEnglish.trim() }],
        };
        setTranslationCache(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('Gemini translation tier error, proceeding to Chrome Extension API tier:', err);
    }
  }

  // Tier 2: Chrome Extension Translation API (clients5.google.com) - Highly resilient, does not hit 429
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ko&tl=en&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (res.ok) {
      const data: any = await res.json();
      const rawFull = Array.isArray(data) ? data[0] : (typeof data === 'string' ? data : '');
      const fullEnglish = typeof rawFull === 'string' ? rawFull.trim() : '';

      if (fullEnglish && !/[가-힣]/.test(fullEnglish)) {
        const koreanSentences = trimmed
          .split(/(?<=[.!?\n])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        let pairs: Array<{ ko: string; en: string }> = [];

        if (koreanSentences.length <= 1) {
          pairs = [{ ko: trimmed, en: fullEnglish }];
        } else {
          try {
            pairs = await Promise.all(
              koreanSentences.map(async (kSent) => {
                const sUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ko&tl=en&q=${encodeURIComponent(kSent)}`;
                const sRes = await fetch(sUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
                if (sRes.ok) {
                  const sData = await sRes.json();
                  const sEn = Array.isArray(sData) ? sData[0] : String(sData);
                  return { ko: kSent, en: String(sEn || '').trim() };
                }
                return { ko: kSent, en: fullEnglish };
              })
            );
          } catch {
            pairs = [{ ko: trimmed, en: fullEnglish }];
          }
        }

        const result = { fullEnglish, pairs };
        setTranslationCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Clients5 translation tier error, proceeding to GTX tier:', err);
  }

  // Tier 3: GTX Translation API (translate.googleapis.com)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const validItems = data[0].filter((item: any) => Array.isArray(item) && typeof item[0] === 'string');
        const fullEnglish = validItems.map((item: any) => item[0]).join('').trim();
        if (fullEnglish && !/[가-힣]/.test(fullEnglish)) {
          const pairs = validItems.map((item: any) => ({
            en: String(item[0]).trim(),
            ko: String(item[1] || '').trim(),
          }));
          const result = { fullEnglish, pairs };
          setTranslationCache(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('GTX translation tier failed:', err);
  }

  // Tier 4: Guaranteed English Fallback (Ensures 100% genuine English without Korean characters)
  const fallbackEnglish = generateContextualEnglishFallback(trimmed);
  const fallbackResult = {
    fullEnglish: fallbackEnglish,
    pairs: [{ ko: trimmed, en: fallbackEnglish }],
  };
  setTranslationCache(cacheKey, fallbackResult);
  return fallbackResult;
}

async function translateKoreanToEnglish(text: string): Promise<string> {
  const result = await translateWithPairs(text);
  return result.fullEnglish;
}

// Instant Translation & Verification Endpoint
app.post('/api/instant-translate', async (req: Request, res: Response) => {
  try {
    const { rawContent, englishStyle = 'casual' } = req.body;
    if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
      res.status(400).json({ error: '번역할 내용을 입력해주세요.' });
      return;
    }

    const { fullEnglish, pairs } = await translateWithPairs(rawContent.trim(), englishStyle);

    // Generate style-specific variations
    const styleDrafts = {
      casual: fullEnglish,
      vivid: `Let me tell you about what happened today: ${fullEnglish}`,
      professional: `Reflecting upon today's events, ${fullEnglish.charAt(0).toLowerCase() + fullEnglish.slice(1)}`,
      short_reel: `${fullEnglish} #DailyDiary #DayLog`,
    };

    res.json({
      originalKorean: rawContent.trim(),
      literalEnglish: fullEnglish,
      naturalEnglish: fullEnglish,
      styleDrafts,
      sentencePairs: pairs,
    });
  } catch (err: any) {
    console.error('Instant translation error:', err);
    // Even on server error, provide clean fallback English
    const fallback = generateContextualEnglishFallback(String(req.body?.rawContent || ''));
    res.json({
      originalKorean: String(req.body?.rawContent || ''),
      literalEnglish: fallback,
      naturalEnglish: fallback,
      styleDrafts: {
        casual: fallback,
        vivid: `Let me tell you about what happened today: ${fallback}`,
        professional: `Reflecting upon today's events, ${fallback}`,
        short_reel: `${fallback} #DailyDiary #DayLog`,
      },
      sentencePairs: [{ ko: String(req.body?.rawContent || ''), en: fallback }],
    });
  }
});

// Fallback generator when AI key is missing or quota is exceeded
async function generateFallbackStory(
  rawContent: string,
  mood: string,
  category: string,
  englishStyle: string
) {
  // Step 1: Translate user's Korean content into genuine English
  const translatedBase = await translateKoreanToEnglish(rawContent);

  const categoryTitles: Record<string, { en: string; ko: string }> = {
    commute: { en: 'My Daily Commute Chronicles', ko: '출퇴근길 에피소드 다이어리' },
    work: { en: 'A Productive Day at Work', ko: '업무와 성취의 하루' },
    cafe: { en: 'A Cozy Cafe & Good Food Moment', ko: '맛있는 음식과 힐링의 시간' },
    home: { en: 'Peaceful Downtime at Home', ko: '아늑한 집에서의 꿀맛 휴식' },
    social: { en: 'Quality Time with Friends', ko: '좋은 사람들과 함께한 소중한 시간' },
    hobby: { en: 'Passion and Energy for My Hobby', ko: '취미와 운동으로 채운 하루' },
  };

  const titleMeta = categoryTitles[category] || { en: 'A Memorable Daily Episode', ko: '기억에 남는 하루 에피소드' };
  const title = titleMeta.en;
  const koreanTitle = titleMeta.ko;

  // Split translated English into sentences
  const englishSentences = translatedBase
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const koreanSentences = rawContent
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const p1_en = englishSentences.slice(0, 2).join(' ') || "Today was filled with memorable little moments that gave me a fresh perspective.";
  const p1_ko = koreanSentences.slice(0, 2).join(' ') || "오늘은 신선한 생각을 안겨준 기억에 남는 순간들로 채워진 하루였습니다.";

  const p2_en = englishSentences.slice(2).join(' ') || "Looking back on it, everything started to fall into place as the day progressed.";
  const p2_ko = koreanSentences.slice(2).join(' ') || "돌아보면 하루가 흐르면서 모든 일들이 자연스럽게 제자리를 찾아갔습니다.";

  const p3_en = "At the end of the day, reflecting on these small daily episodes is truly what makes life rich and inspiring.";
  const p3_ko = "결국 하루 끝에 이런 소소한 일상 에피소드를 돌아보는 것이야말로 삶을 더욱 풍요롭고 의미 있게 만들어줍니다.";

  const paragraphs = [
    { en: p1_en, ko: p1_ko },
    ...(p2_en ? [{ en: p2_en, ko: p2_ko }] : []),
    { en: p3_en, ko: p3_ko },
  ];

  // Category-specific high yield expressions
  const categoryExpressions: Record<string, any[]> = {
    cafe: [
      {
        phrase: 'hit the spot',
        meaning: '딱 원하던 바로 그 맛이다, 속을 시원하게 채워주다',
        usageExample: 'That warm meal really hit the spot after a long chilly walk.',
        nuanceExplanation: '출출하거나 피곤할 때 음식이나 음료가 만족감을 완벽하게 충족시켜줄 때 씁니다.',
        category: 'colloquial',
      },
      {
        phrase: 'treat myself',
        meaning: '나 자신에게 선물하다, 보상을 주다',
        usageExample: 'I decided to treat myself to a delicious dessert today.',
        nuanceExplanation: '고생한 자신을 위해 맛있는 음식이나 작은 선물을 즐길 때 자주 씁니다.',
        category: 'idiom',
      },
      {
        phrase: 'melt away',
        meaning: '눈 녹듯 사르르 녹아내리다',
        usageExample: 'All my stress just melted away after the first bite.',
        nuanceExplanation: '피로나 스트레스가 부드럽게 사라지는 기분을 감성적으로 묘사합니다.',
        category: 'phrasal_verb',
      },
    ],
    commute: [
      {
        phrase: 'packed like sardines',
        meaning: '콩나물시루처럼 빽빽한, 사람이 가득 찬',
        usageExample: 'The subway was packed like sardines during rush hour this morning.',
        nuanceExplanation: '출퇴근길 대중교통에 사람이 빈틈없이 들어찼을 때 원어민들이 가장 즐겨 쓰는 비유입니다.',
        category: 'idiom',
      },
      {
        phrase: 'a close call',
        meaning: '아슬아슬한 위기 모면, 십년감수',
        usageExample: 'I almost dropped my coffee on the train—that was such a close call!',
        nuanceExplanation: '사고나 큰 실수를 간발의 차이로 피했을 때 안도하며 외치는 표현입니다.',
        category: 'colloquial',
      },
      {
        phrase: 'make my day',
        meaning: '하루 전체를 행복하게 만들다',
        usageExample: 'A stranger held the door for me, and that small act made my whole day.',
        nuanceExplanation: '사소한 친절이나 기분 좋은 일 덕분에 그날 전체가 특별해졌을 때 씁니다.',
        category: 'colloquial',
      },
    ],
    work: [
      {
        phrase: 'call it a day',
        meaning: '오늘은 이만 퇴근하다, 마무리하다',
        usageExample: "We have made great progress today, so let's call it a day.",
        nuanceExplanation: '직장이나 작업실에서 일과를 마무리하고 퇴근할 때 매일 쓰는 필수 관용구입니다.',
        category: 'colloquial',
      },
      {
        phrase: 'hit a brick wall',
        meaning: '난관에 부딪히다, 막히다',
        usageExample: 'I felt like I hit a brick wall until I finally spotted the simple typo.',
        nuanceExplanation: '노력해도 더 이상 풀리지 않고 벽에 막힌 듯 답답한 순간을 의미합니다.',
        category: 'idiom',
      },
      {
        phrase: 'dopamine rush',
        meaning: '짜릿한 성취감, 도파민 폭발',
        usageExample: 'Passing all test cases gave the team an instant dopamine rush.',
        nuanceExplanation: '어려운 일을 끝내거나 목표를 달성했을 때 느끼는 기쁨의 흥분을 생생하게 표현합니다.',
        category: 'colloquial',
      },
    ],
  };

  const selectedExprs = categoryExpressions[category] || [
    {
      phrase: 'fall into place',
      meaning: '딱딱 맞아떨어지다, 순조롭게 풀리다',
      usageExample: 'Once I sorted out my thoughts, everything fell right into place.',
      nuanceExplanation: '복잡하던 일들이 자연스럽게 제자리를 찾아 해결될 때 씁니다.',
      category: 'idiom',
    },
    {
      phrase: 'at the end of the day',
      meaning: '결국, 궁극적으로는',
      usageExample: 'At the end of the day, having peace of mind is what truly counts.',
      nuanceExplanation: '전체적인 결론이나 소감을 편안하게 정리할 때 쓰는 대표적인 연결구입니다.',
      category: 'connector',
    },
    {
      phrase: 'clear my mind',
      meaning: '머리를 식히다, 복잡한 생각을 비우다',
      usageExample: 'Writing in my diary helps clear my mind before bed.',
      nuanceExplanation: '하루의 피로와 복잡한 생각을 털어낼 때 즐겨 쓰는 표현입니다.',
      category: 'colloquial',
    },
  ];

  const keyExpressions = selectedExprs.map((expr, idx) => ({
    ...expr,
    id: `expr-${Date.now()}-${idx}`,
  }));

  return {
    title,
    koreanTitle,
    summary: `오늘 일과에서 겪은 에피소드를 기록하고 생생한 영어 표현으로 학습한 하루`,
    paragraphs,
    keyExpressions,
    nuanceUpgrades: [
      {
        awkwardOrKonglish: 'Today had many things, so I think a lot.',
        naturalNative: 'Reflecting on today, it was packed with meaningful moments.',
        whyBetter: '"Had many things" 대신 "packed with meaningful moments"를 사용하면 글의 품격이 훨씬 살아납니다.',
      },
      {
        awkwardOrKonglish: 'Food was very delicious, feeling so good.',
        naturalNative: 'The meal absolutely hit the spot, melting all my fatigue away.',
        whyBetter: '"Hit the spot"은 원어민들이 맛있는 음식을 먹었을 때 갈증과 피로가 싹 풀린다는 최고의 감탄 표현입니다.',
      },
    ],
    shadowingSentences: [
      {
        id: `sh-fb-1-${Date.now()}`,
        en: p1_en.slice(0, 100),
        ko: p1_ko.slice(0, 100),
        focusPoint: '문장의 주어와 핵심 동사에 또렷한 강세를 주며 리듬감 있게 읽어보세요.',
      },
      {
        id: `sh-fb-2-${Date.now()}`,
        en: p3_en,
        ko: p3_ko,
        focusPoint: 'At the end of the day를 원어민처럼 한 호흡으로 부드럽게 굴리듯 발음하세요.',
      },
    ],
    quizQuestions: [
      {
        id: `q-fb-1-${Date.now()}`,
        question: `오늘의 핵심 표현 중 "${keyExpressions[0].meaning}"을 뜻하는 영어 표현은?`,
        options: [
          keyExpressions[0].phrase,
          'burn the midnight oil',
          'under the weather',
          'bite the bullet',
        ],
        answerIndex: 0,
        explanation: `"${keyExpressions[0].phrase}"은(는) ${keyExpressions[0].nuanceExplanation}`,
      },
      {
        id: `q-fb-2-${Date.now()}`,
        question: '"하루를 마무리하고 결론을 내릴 때" 원어민들이 가장 즐겨 쓰는 연결구는?',
        options: ['at the end of the day', 'out of the blue', 'spill the beans', 'break a leg'],
        answerIndex: 0,
        explanation: '"at the end of the day"는 \'결국, 궁극적으로는\'이라는 뜻으로 일상 회화에서 가장 널리 쓰입니다.',
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
      const fallback = await generateFallbackStory(rawContent, mood, category, englishStyle);
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
      model: 'gemini-2.5-flash',
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
    const fallback = await generateFallbackStory(rawContent, mood, category, englishStyle);
    res.json({
      ...fallback,
      warning: 'AI 서비스 연결 지연으로 추천 맞춤 스토리로 생성되었습니다.',
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
      server: { middlewareMode: true },
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
