import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Calendar,
  Volume2,
  Square,
  Copy,
  Check,
  RotateCcw,
  Split,
  FileText,
  Zap,
  Loader2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Mood, Category, EnglishStyle, Episode } from '../types';
import { createSpeechRecognizer, isSpeechRecognitionSupported, speechService } from '../utils/speech';

interface EpisodeEditorProps {
  onStoryCreated: (episode: Episode) => void;
  onCancel?: () => void;
  initialDate?: string;
}

interface SentencePair {
  ko: string;
  en: string;
}

interface TranslationData {
  originalKorean: string;
  literalEnglish: string;
  naturalEnglish: string;
  styleDrafts?: Record<string, string>;
  sentencePairs: SentencePair[];
}

const MOODS: Array<{ id: Mood; label: string; emoji: string; desc: string }> = [
  { id: 'excited', label: '신남/설렘', emoji: '🎉', desc: '기분 좋은 이벤트' },
  { id: 'peaceful', label: '평온/힐링', emoji: '☕', desc: '여유로운 쉼' },
  { id: 'funny', label: '웃김/황당썰', emoji: '🤣', desc: '재미난 에피소드' },
  { id: 'proud', label: '열정/뿌듯', emoji: '🔥', desc: '성취와 보람' },
  { id: 'tired', label: '피곤/지침', emoji: '😫', desc: '힘겨웠던 하루' },
  { id: 'sentimental', label: '센치/사색', emoji: '🌧️', desc: '생각에 잠긴 밤' },
];

const CATEGORIES: Array<{ id: Category; label: string; icon: string }> = [
  { id: 'commute', label: '출퇴근/이동', icon: '🚇' },
  { id: 'work', label: '업무/공부', icon: '💼' },
  { id: 'cafe', label: '카페/맛집', icon: '🍰' },
  { id: 'home', label: '집/휴식', icon: '🛋️' },
  { id: 'social', label: '만남/수다', icon: '👥' },
  { id: 'hobby', label: '운동/취미', icon: '🏃' },
];

const STYLES: Array<{ id: EnglishStyle; label: string; level: string; desc: string }> = [
  {
    id: 'casual',
    label: '편안한 일상대화체',
    level: 'A2-B1',
    desc: '친구와 카페에서 수다 떨듯 자연스러운 생활 영어',
  },
  {
    id: 'vivid',
    label: '생생한 썰 풀기',
    level: 'B2',
    desc: '감정과 현장감이 살아있는 드라마틱한 스토리텔링',
  },
  {
    id: 'professional',
    label: '비즈니스 & 성찰체',
    level: 'C1',
    desc: '격식 있고 세련된 어휘로 완성하는 품격 있는 글',
  },
  {
    id: 'short_reel',
    label: '3줄 숏폼 일기',
    level: 'Quick',
    desc: '핵심만 임팩트 있게 담아 빠르게 외우기 좋은 3문장',
  },
];

const PROMPT_INSPIRATIONS = [
  {
    title: '출퇴근길 썰',
    text: '오늘 아침 만원 지하철에서 급정거 때문에 커피를 쏟을 뻔했는데 옆사람이 가방으로 막아주고 물티슈를 챙겨줘서 감동받았음.',
    mood: 'funny' as Mood,
    category: 'commute' as Category,
  },
  {
    title: '성취와 보람',
    text: '어제부터 계속 발생하던 코드 버그 때문에 3시간 동안 모니터만 노려보다가 퇴근 직전 커피 한 잔 마시고 드디어 해결함! 도파민 폭발!',
    mood: 'proud' as Mood,
    category: 'work' as Category,
  },
  {
    title: '골목길 카페 발견',
    text: '골목길 산책하다가 고소한 빵 냄새에 이끌려 들어간 작은 베이커리. 갓 구운 크루아상에 바닐라 라떼 마시며 스트레스 싹 날림.',
    mood: 'peaceful' as Mood,
    category: 'cafe' as Category,
  },
  {
    title: '점심시간 맛집 투어',
    text: '회사 근처에 새로 생긴 파스타 가게에 갔는데 웨이팅 30분 한 보람이 있었음. 매콤한 로제 파스타가 완전 내 취향 저격.',
    mood: 'excited' as Mood,
    category: 'cafe' as Category,
  },
];

export const EpisodeEditor: React.FC<EpisodeEditorProps> = ({ onStoryCreated, initialDate }) => {
  const [date, setDate] = useState(() => initialDate || new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState<Mood>('excited');
  const [category, setCategory] = useState<Category>('commute');
  const [style, setStyle] = useState<EnglishStyle>('vivid');
  const [rawContent, setRawContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Instant Real-time Translation States
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationData, setTranslationData] = useState<TranslationData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [viewMode, setViewMode] = useState<'full' | 'pairs'>('full');

  // Debounce and request lifecycle
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef<number>(0);
  const recognizerRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null);

  // Sync date when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      speechService.stop();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Instant Translate Worker Function
  const fetchTranslation = useCallback(async (text: string, currentStyle: EnglishStyle) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setTranslationData(null);
      setIsTranslating(false);
      return;
    }

    const requestId = ++latestRequestIdRef.current;
    setIsTranslating(true);

    try {
      const res = await fetch('/api/instant-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: trimmed, englishStyle: currentStyle }),
      });

      // Ignore if a newer request was dispatched while waiting
      if (requestId !== latestRequestIdRef.current) return;

      if (!res.ok) {
        throw new Error('번역 실패');
      }

      const data = await res.json();
      setTranslationData({
        originalKorean: data.originalKorean || trimmed,
        literalEnglish: data.literalEnglish || '',
        naturalEnglish: data.naturalEnglish || data.literalEnglish || '',
        styleDrafts: data.styleDrafts,
        sentencePairs: data.sentencePairs || [],
      });
    } catch (err) {
      console.error('Instant translation error:', err);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsTranslating(false);
      }
    }
  }, []);

  // Automatic Debounced Translation on typing
  const handleContentChange = (val: string) => {
    setRawContent(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setTranslationData(null);
      setIsTranslating(false);
      return;
    }

    // Set immediate translating indicator for snappy responsive feedback
    setIsTranslating(true);

    debounceTimerRef.current = setTimeout(() => {
      fetchTranslation(val, style);
    }, 450); // 450ms smooth debounce
  };

  // Re-translate when style changes if we have content
  const handleStyleChange = (newStyle: EnglishStyle) => {
    setStyle(newStyle);
    if (rawContent.trim()) {
      fetchTranslation(rawContent, newStyle);
    }
  };

  // Instant translation when clicking inspiration chip
  const handleApplyInspiration = (insp: (typeof PROMPT_INSPIRATIONS)[0]) => {
    setRawContent(insp.text);
    setMood(insp.mood);
    setCategory(insp.category);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchTranslation(insp.text, style);
  };

  // Audio Playback for translated English
  const handleToggleSpeak = () => {
    if (!translationData?.literalEnglish) return;

    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speechService.speak(translationData.literalEnglish, {
        rate: 0.95,
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  // Copy translated English
  const handleCopyEnglish = async () => {
    if (!translationData?.literalEnglish) return;
    try {
      await navigator.clipboard.writeText(translationData.literalEnglish);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Loading step simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(1);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const toggleSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('현재 브라우저 환경에서는 음성 인식을 지원하지 않습니다. 텍스트로 편리하게 입력해보세요!');
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      recognizerRef.current = createSpeechRecognizer({
        lang: 'ko-KR',
        onResult: (text) => {
          setRawContent((prev) => {
            const nextVal = prev ? `${prev} ${text}` : text;
            // Debounce translate for voice input
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              fetchTranslation(nextVal, style);
            }, 500);
            return nextVal;
          });
        },
        onError: () => {
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
      recognizerRef.current.start();
      setIsListening(true);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawContent.trim()) {
      setError('오늘 하루 있었던 일과 에피소드를 적어주세요!');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          rawContent: rawContent.trim(),
          mood,
          category,
          englishStyle: style,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류 (${response.status})`);
      }

      const data = await response.json();

      const newEpisode: Episode = {
        id: `ep-${Date.now()}`,
        createdAt: new Date().toISOString(),
        date,
        rawContent: rawContent.trim(),
        mood,
        category,
        englishStyle: style,
        title: data.title || 'My Daily Story',
        koreanTitle: data.koreanTitle || '오늘의 에피소드',
        summary: data.summary || '오늘 일과를 담은 이야기',
        paragraphs: data.paragraphs || [],
        keyExpressions: data.keyExpressions || [],
        nuanceUpgrades: data.nuanceUpgrades || [],
        shadowingSentences: data.shadowingSentences || [],
        quizQuestions: data.quizQuestions || [],
        isFavorite: false,
      };

      onStoryCreated(newEpisode);
    } catch (err: any) {
      console.error('Failed to generate story:', err);
      setError('스토리를 생성하는 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="mb-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>실시간 자동 영작 & AI 에피소드 스튜디오</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            하루 일과를 쓰면 즉시 영어로 변환됩니다!
          </h1>
          <p className="mt-2 text-indigo-200 text-sm leading-relaxed">
            한국어로 타이핑하거나 음성으로 말하면 <strong>별도 버튼 클릭 없이 즉각 영어로 번역</strong>되어 실시간으로 확인하실 수 있습니다. 확인 후 AI 원어민 스토리와 섀도잉 코스로 바로 연결됩니다.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[140px]">
          <span className="text-3xl mb-1">⚡ ➔ 🇺🇸</span>
          <span className="text-xs font-bold text-indigo-200">입력 즉시 자동 번역</span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Step 1 & 2: Quick Meta (Date, Mood, Category) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-900">날짜 & 기분 선택</span>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mood buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  mood === m.id
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-xl mb-0.5">{m.emoji}</div>
                <div className="text-xs font-bold text-slate-800">{m.label}</div>
              </button>
            ))}
          </div>

          {/* Category buttons */}
          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">어디서 일어난 일인가요?</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    category === cat.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Dual-Pane Studio: Korean Input on Left / Live English Translation on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Korean Input & Voice & Inspiration */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>한국어 일과 & 에피소드 작성</span>
              </label>

              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>음성 녹음 중... (클릭해 종료)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-600" />
                    <span>음성 말하기</span>
                  </>
                )}
              </button>
            </div>

            {/* Input Textarea */}
            <div className="relative">
              <textarea
                value={rawContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="오늘 하루 있었던 일을 편하게 적어보세요!&#10;예) 오늘 출근길에 커피를 쏟을 뻔했는데 옆사람이 가방으로 막아줘서 너무 고마웠다.&#10;혹은&#10;팀 미팅에서 내 제안이 승인되어 다음 프로젝트를 리드하게 되었다!"
                rows={7}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm leading-relaxed placeholder:text-slate-400 resize-y"
              />

              <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  {rawContent ? (
                    <button
                      type="button"
                      onClick={() => handleContentChange('')}
                      className="text-slate-400 hover:text-slate-600 underline font-medium"
                    >
                      내용 지우기
                    </button>
                  ) : (
                    <span>💡 타이핑을 멈추면 자동으로 영어가 번역됩니다.</span>
                  )}
                </div>
                <span>{rawContent.length}자 입력됨</span>
              </div>
            </div>

            {/* Quick Inspirations */}
            <div>
              <div className="text-xs font-bold text-slate-500 mb-2 flex items-center space-x-1">
                <span>💡 추천 예시 (클릭하면 바로 입력 & 실시간 영작):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_INSPIRATIONS.map((insp, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleApplyInspiration(insp)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-800 text-xs font-medium border border-indigo-100 transition-colors"
                  >
                    ✨ {insp.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live English Translation Result */}
          <div className="bg-white rounded-3xl border border-indigo-100 p-5 sm:p-6 shadow-sm space-y-4 ring-1 ring-indigo-50 relative overflow-hidden">
            {/* Top Status Header */}
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-base">🇺🇸</span>
                <span className="text-sm font-bold text-slate-900">실시간 영어 변환 결과</span>
              </div>

              {/* Status Badge */}
              {isTranslating ? (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>실시간 번역 중...</span>
                </div>
              ) : translationData ? (
                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>실시간 영어 변환 완료</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">대기 중</span>
              )}
            </div>

            {/* Translation Content Area */}
            {translationData ? (
              <div className="space-y-4">
                {/* View Mode Toggle (Full Text vs Sentence Pairs) */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setViewMode('full')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        viewMode === 'full'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>전체 영어 문장</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('pairs')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        viewMode === 'pairs'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center space-x-1">
                        <Split className="w-3.5 h-3.5" />
                        <span>문장별 대조 ({translationData.sentencePairs.length})</span>
                      </span>
                    </button>
                  </div>

                  {/* Actions: Speak & Copy */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={handleToggleSpeak}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        isPlayingAudio
                          ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      title={isPlayingAudio ? '발음 정지' : '원어민 발음 듣기 (TTS)'}
                    >
                      {isPlayingAudio ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyEnglish}
                      className="p-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                      title="영어 문장 복사"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Display Body */}
                {viewMode === 'full' ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 min-h-[140px] flex flex-col justify-between">
                    <p className="text-slate-900 text-base font-semibold leading-relaxed tracking-wide select-all">
                      "{translationData.literalEnglish}"
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-indigo-100/60 pt-2">
                      <span>단어 수: {translationData.literalEnglish.split(/\s+/).filter(Boolean).length}개</span>
                      <span>원어민 표준 영어 표현</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {translationData.sentencePairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1 hover:border-indigo-300 transition-colors"
                      >
                        <div className="text-slate-500 flex items-center space-x-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-600">{pair.ko}</span>
                        </div>
                        <div className="text-slate-900 font-bold pl-5 text-sm text-indigo-950">
                          {pair.en}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Style Quick Hint */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>선택된 톤앤매너: <strong>{STYLES.find((s) => s.id === style)?.label}</strong></span>
                  <span className="text-[11px] text-indigo-600 font-medium">아래에서 언제든 변경 가능</span>
                </div>
              </div>
            ) : (
              /* Empty state before typing */
              <div className="p-8 rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/20 text-center flex flex-col items-center justify-center min-h-[210px]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  왼쪽에 일과를 적으면 여기에 즉시 나타납니다!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  별도의 버튼을 누르지 않아도 한국어 문장이 즉각 영어로 번역되어 발음과 문장 구조를 바로 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: English Style Selection */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900">
              스토리 스타일 & 영어 레벨 선택
            </label>
            <span className="text-xs text-slate-400">선택 시 영어 표현의 톤이 달라집니다</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {STYLES.map((st) => (
              <button
                type="button"
                key={st.id}
                onClick={() => handleStyleChange(st.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  style === st.id
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">{st.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {st.level}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Big Submit Button to Generate Complete Story & Shadowing */}
        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading || !rawContent.trim()}
            className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base flex items-center justify-center space-x-2 shadow-lg transition-all ${
              loading || !rawContent.trim()
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-200 active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {loadingStep === 1 && '오늘의 에피소드 맥락 및 핵심 어휘 파악 중...'}
                  {loadingStep === 2 && '원어민 뉘앙스 스토리 영작 & 관용구 추출 중...'}
                  {loadingStep === 3 && '섀도잉 발음 코칭 및 퀴즈 생성 완료 중...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {translationData
                    ? '✨ 이 영어로 AI 스토리 & 섀도잉 코스 생성하기'
                    : '✨ AI 영어 스토리 & 섀도잉 코스 생성하기'}
                </span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400">
            생성된 스토리는 내 학습 캘린더와 스토리북에 기록되어 언제든 복습 및 발음 섀도잉을 할 수 있습니다.
          </p>
        </div>
      </form>
    </div>
  );
};
