import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Mic,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Episode, KeyExpression } from '../types';
import { speechService } from '../utils/speech';

interface StoryViewProps {
  episode: Episode;
  onBack?: () => void;
  onGoToShadowing: (episodeId: string) => void;
  onToggleSaveWord: (expression: KeyExpression, episode: Episode) => void;
  savedWordIds: Set<string>;
}

export const StoryView: React.FC<StoryViewProps> = ({
  episode,
  onBack,
  onGoToShadowing,
  onToggleSaveWord,
  savedWordIds,
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'expressions' | 'nuance' | 'quiz'>('story');
  const [viewMode, setViewMode] = useState<'bilingual' | 'english_only'>('bilingual');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US');
  const [copied, setCopied] = useState(false);
  const [expandedDialogues, setExpandedDialogues] = useState<Record<string, any>>({});
  const [loadingDialogueId, setLoadingDialogueId] = useState<string | null>(null);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<Record<string, boolean>>({});

  const handlePlayFullStory = () => {
    if (isPlaying) {
      speechService.stop();
      setIsPlaying(false);
      return;
    }

    const fullText = episode.paragraphs.map((p) => p.en).join(' ');
    setIsPlaying(true);
    speechService.speak(fullText, {
      rate: playbackSpeed,
      accent,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handlePlaySingle = (text: string) => {
    speechService.speak(text, {
      rate: playbackSpeed,
      accent,
    });
  };

  const handleCopyStory = () => {
    const text = `[${episode.title}]\n\n` + episode.paragraphs.map((p) => `${p.en}\n(${p.ko})`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExpandExpression = async (expr: KeyExpression) => {
    if (expandedDialogues[expr.id]) {
      // Toggle collapse
      setExpandedDialogues((prev) => {
        const copy = { ...prev };
        delete copy[expr.id];
        return copy;
      });
      return;
    }

    setLoadingDialogueId(expr.id);
    try {
      const response = await fetch('/api/expand-expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: expr.phrase, meaning: expr.meaning }),
      });
      const data = await response.json();
      setExpandedDialogues((prev) => ({ ...prev, [expr.id]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDialogueId(null);
    }
  };

  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setShowQuizResults((prev) => ({ ...prev, [questionId]: true }));
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Navigation */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>에피소드 목록으로 돌아가기</span>
        </button>
      )}

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            📅 {episode.date}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            🏷️ {episode.category}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
            ✨ {episode.mood}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold">
            🎯 {episode.englishStyle}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {episode.title}
        </h1>
        <p className="text-base sm:text-lg font-bold text-indigo-700 mt-1">
          {episode.koreanTitle}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
          💡 {episode.summary}
        </p>

        {/* Audio Player & Quick Actions Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePlayFullStory}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap shrink-0 transition-all ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>스토리 전체 듣기</span>
                </>
              )}
            </button>

            {/* Speed & Accent Controller */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1 text-xs font-bold text-slate-700 shrink-0">
              <button
                onClick={() => setPlaybackSpeed(0.8)}
                className={`px-2 py-1 rounded-lg ${playbackSpeed === 0.8 ? 'bg-white shadow-xs text-indigo-600' : ''}`}
              >
                0.8x
              </button>
              <button
                onClick={() => setPlaybackSpeed(1.0)}
                className={`px-2 py-1 rounded-lg ${playbackSpeed === 1.0 ? 'bg-white shadow-xs text-indigo-600' : ''}`}
              >
                1.0x
              </button>
              <button
                onClick={() => setPlaybackSpeed(1.2)}
                className={`px-2 py-1 rounded-lg ${playbackSpeed === 1.2 ? 'bg-white shadow-xs text-indigo-600' : ''}`}
              >
                1.2x
              </button>
            </div>

            <select
              value={accent}
              onChange={(e) => setAccent(e.target.value as 'en-US' | 'en-GB')}
              className="px-2.5 py-1.5 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shrink-0"
            >
              <option value="en-US">🇺🇸 미국식</option>
              <option value="en-GB">🇬🇧 영국식</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onGoToShadowing(episode.id)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors whitespace-nowrap"
            >
              <Mic className="w-4 h-4" />
              <span>섀도잉 연습 ({episode.shadowingSentences.length}문장)</span>
            </button>

            <button
              onClick={handleCopyStory}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료' : '텍스트 복사'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('story')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'story'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📖 스토리 본문
        </button>
        <button
          onClick={() => setActiveTab('expressions')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'expressions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💡 핵심 표현 & 관용구 ({episode.keyExpressions.length})
        </button>
        <button
          onClick={() => setActiveTab('nuance')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'nuance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🎯 원어민 뉘앙스 교정 ({episode.nuanceUpgrades.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'quiz'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📝 기억 퀴즈 ({episode.quizQuestions.length})
        </button>
      </div>

      {/* Tab 1: Story Content */}
      {activeTab === 'story' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>문장을 클릭하면 원어민 발음을 바로 들을 수 있습니다.</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('bilingual')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  viewMode === 'bilingual' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                한영 대조
              </button>
              <button
                onClick={() => setViewMode('english_only')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  viewMode === 'english_only' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                영어 몰입
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {episode.paragraphs.map((para, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                      {para.en}
                    </p>
                    {viewMode === 'bilingual' && (
                      <p className="text-sm text-slate-600 leading-relaxed font-normal pt-2 border-t border-slate-100">
                        {para.ko}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePlaySingle(para.en)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors shrink-0"
                    title="이 문단 발음 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* User's Original Raw Input Drawer */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-700">✍️ 내가 작성했던 일과 메모:</span>
            <p className="mt-1 text-slate-600 italic">"{episode.rawContent}"</p>
          </div>
        </div>
      )}

      {/* Tab 2: Key Expressions & Idioms */}
      {activeTab === 'expressions' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            오늘 스토리에서 추출한 핵심 생활 표현들입니다. 단어장에 저장해두고 언제든 복습하세요.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {episode.keyExpressions.map((expr) => {
              const isSaved = savedWordIds.has(expr.id);
              const expanded = expandedDialogues[expr.id];
              const isLoadingExpanded = loadingDialogueId === expr.id;

              return (
                <div
                  key={expr.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                          {expr.phrase}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wide">
                          {expr.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-700 mt-1">
                        {expr.meaning}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handlePlaySingle(expr.phrase)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                        title="표현 발음 듣기"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onToggleSaveWord(expr, episode)}
                        className={`p-2 rounded-xl transition-colors ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                        }`}
                        title={isSaved ? '단어장에 저장됨' : '단어장에 추가'}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Nuance coaching */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-800">💡 원어민 뉘앙스: </span>
                    {expr.nuanceExplanation}
                  </div>

                  {/* Example sentence */}
                  <div className="flex items-center justify-between text-xs bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/60">
                    <div>
                      <span className="font-bold text-indigo-900">예문: </span>
                      <span className="text-slate-800 font-medium">"{expr.usageExample}"</span>
                    </div>
                    <button
                      onClick={() => handlePlaySingle(expr.usageExample)}
                      className="text-indigo-600 hover:text-indigo-800 p-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expand dialogue exchanges */}
                  <div>
                    <button
                      onClick={() => handleExpandExpression(expr)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{expanded ? '실생활 대화 닫기' : '실생활 대화 2가지 더보기'}</span>
                      {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isLoadingExpanded && (
                      <p className="text-xs text-slate-400 mt-2 animate-pulse">
                        대화 예시를 불러오는 중...
                      </p>
                    )}

                    {expanded && (
                      <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                        <div className="font-bold text-slate-700">🗣️ 실생활 회화 속 활용:</div>
                        {expanded.dialogues?.map((d: any, idx: number) => (
                          <div key={idx} className="space-y-1 pl-2 border-l-2 border-indigo-300">
                            <div><strong className="text-slate-800">A:</strong> {d.speakerA}</div>
                            <div><strong className="text-indigo-700">B:</strong> {d.speakerB}</div>
                          </div>
                        ))}
                        {expanded.culturalTip && (
                          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            💬 {expanded.culturalTip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Nuance Upgrades (Konglish vs Native) */}
      {activeTab === 'nuance' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            한국인 학습자가 무의식적으로 직역하기 쉬운 어색한 문장과, 세련된 원어민 표현을 1:1로 비교해보세요.
          </div>

          <div className="space-y-4">
            {episode.nuanceUpgrades.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Awkward */}
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                    <div className="flex items-center space-x-1.5 text-rose-700 text-xs font-bold mb-1">
                      <span>❌ 어색한 직역 / 콩글리시</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      "{item.awkwardOrKonglish}"
                    </p>
                  </div>

                  {/* Native Upgrade */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-emerald-700 text-xs font-bold">
                        ✅ 자연스러운 원어민 표현
                      </span>
                      <button
                        onClick={() => handlePlaySingle(item.naturalNative)}
                        className="text-emerald-700 hover:text-emerald-900"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      "{item.naturalNative}"
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-100 leading-relaxed">
                  <span className="font-bold text-indigo-700">💡 왜 더 좋을까요? </span>
                  {item.whyBetter}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="text-xs text-slate-500">
            오늘의 에피소드 핵심 표현을 확실하게 내 것으로 만드는 2문제 스피드 퀴즈입니다!
          </div>

          <div className="space-y-5">
            {episode.quizQuestions.map((q, qIndex) => {
              const selectedAnswer = userAnswers[q.id];
              const isAnswered = showQuizResults[q.id];
              const isCorrect = selectedAnswer === q.answerIndex;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start space-x-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                      Q{qIndex + 1}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {q.question}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.options.map((opt, optIndex) => {
                      const isOptionSelected = selectedAnswer === optIndex;
                      const isOptionCorrect = optIndex === q.answerIndex;

                      let btnStyle = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800';
                      if (isAnswered) {
                        if (isOptionCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                        } else if (isOptionSelected && !isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-800';
                        } else {
                          btnStyle = 'border-slate-200 opacity-60 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => handleSelectQuizOption(q.id, optIndex)}
                          className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${btnStyle}`}
                        >
                          <span className="mr-2 text-slate-400">{optIndex + 1}.</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      className={`p-4 rounded-xl text-xs leading-relaxed ${
                        isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="font-bold flex items-center space-x-1.5 mb-1">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>정답입니다! 완벽해요 🎉</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-4 h-4 text-rose-600" />
                            <span>아쉬워요! 정답은 {q.answerIndex + 1}번입니다.</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
