import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Calendar, Flame, Coffee, Smile, Frown, Compass, Heart, Loader2, ArrowRight } from 'lucide-react';
import { Mood, Category, EnglishStyle, Episode } from '../types';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';

interface EpisodeEditorProps {
  onStoryCreated: (episode: Episode) => void;
  onCancel?: () => void;
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

export const EpisodeEditor: React.FC<EpisodeEditorProps> = ({ onStoryCreated }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState<Mood>('excited');
  const [category, setCategory] = useState<Category>('commute');
  const [style, setStyle] = useState<EnglishStyle>('vivid');
  const [rawContent, setRawContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognizerRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null);

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
      alert('현재 브라우저 환경에서는 음성 인식을 지원하지 않습니다. 키보드로 입력해주세요!');
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      recognizerRef.current = createSpeechRecognizer({
        lang: 'ko-KR',
        onResult: (text) => {
          setRawContent((prev) => (prev ? `${prev} ${text}` : text));
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

  const handleApplyInspiration = (insp: (typeof PROMPT_INSPIRATIONS)[0]) => {
    setRawContent(insp.text);
    setMood(insp.mood);
    setCategory(insp.category);
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
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="mb-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI English Episode Transformer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            오늘 당신에게는 어떤 일이 있었나요?
          </h1>
          <p className="mt-2 text-indigo-200 text-sm leading-relaxed">
            한국어로 생각나는 대로 가볍게 털어놓으세요. 원어민들이 감탄하는 자연스러운 표현과 섀도잉 학습 자료로 만들어드립니다.
          </p>
        </div>
        <div className="hidden sm:block">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/20">
            ✍️
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleGenerate} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
        {/* Step 1: Date & Mood Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>날짜 & 오늘 나의 무드</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  mood === m.id
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1">{m.emoji}</div>
                <div className="text-xs font-bold text-slate-800">{m.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Category Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">
            에피소드 분야 (어디서 일어난 일인가요?)
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
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

        {/* Step 3: Raw Episode Notes + Voice Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>오늘의 일과 & 에피소드 기록</span>
              <span className="text-xs font-normal text-slate-500">(한국어 또는 짧은 메모)</span>
            </label>

            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-mic-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>음성 녹음 중... (클릭해 멈춤)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-indigo-600" />
                  <span>마이크 음성 받아쓰기</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="예) 오늘 출근길에 커피를 쏟을 뻔했는데 옆자리 승객이 티슈를 건네줘서 너무 고마웠다. 세상은 아직 따뜻해!&#10;혹은&#10;팀 미팅에서 내 아이디어가 채택되어 다음 주부터 프로젝트 리드를 맡게 되었다. 떨리지만 설렌다."
              rows={5}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm leading-relaxed placeholder:text-slate-400"
            />
            <div className="text-right mt-1.5 text-xs text-slate-400">
              {rawContent.length}자 입력됨
            </div>
          </div>

          {/* Quick inspiration chips */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500 mb-2">💡 아이디어가 고민된다면? 예시 에피소드 클릭:</div>
            <div className="flex flex-wrap gap-2">
              {PROMPT_INSPIRATIONS.map((insp, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyInspiration(insp)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-700 text-xs font-medium border border-indigo-100 transition-colors"
                >
                  ✨ {insp.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: English Style & Level Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">
            원하는 영어 스토리 스타일 & 난이도
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {STYLES.map((st) => (
              <button
                type="button"
                key={st.id}
                onClick={() => setStyle(st.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  style === st.id
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-900">{st.label}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {st.level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base flex items-center justify-center space-x-2 shadow-lg transition-all ${
              loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-200 active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {loadingStep === 1 && '오늘의 에피소드 분석 및 맥락 파악 중...'}
                  {loadingStep === 2 && '원어민 뉘앙스 스토리 영작 & 관용구 추출 중...'}
                  {loadingStep === 3 && '섀도잉 발음 코칭 및 퀴즈 생성 완료 중...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>AI 영어 스토리 & 스터디 생성하기</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            작성된 에피소드는 내 스토리북에 자동 저장되며 언제든 섀도잉 및 복습이 가능합니다.
          </p>
        </div>
      </form>
    </div>
  );
};
