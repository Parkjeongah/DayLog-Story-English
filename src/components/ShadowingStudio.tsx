import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Trophy,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Episode, ShadowingSentence } from '../types';
import { speechService, createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { calculatePronunciationSimilarity } from '../utils/studyLogic';

interface ShadowingStudioProps {
  episodes: Episode[];
  initialEpisodeId?: string;
  onCompleteSentence: (sentenceId: string) => void;
  completedSentenceIds: Set<string>;
}

export const ShadowingStudio: React.FC<ShadowingStudioProps> = ({
  episodes,
  initialEpisodeId,
  onCompleteSentence,
  completedSentenceIds,
}) => {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(() => {
    return initialEpisodeId || (episodes.length ? episodes[0].id : '');
  });

  const activeEpisode = episodes.find((e) => e.id === selectedEpisodeId) || episodes[0];

  const sentences: ShadowingSentence[] = activeEpisode?.shadowingSentences || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Audio / Speech State
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [evalResult, setEvalResult] = useState<ReturnType<typeof calculatePronunciationSimilarity> | null>(null);
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US');
  const [showCelebration, setShowCelebration] = useState(false);

  const recognizerRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null);

  // Reset when episode or sentence changes
  useEffect(() => {
    setCurrentIndex(0);
    setUserTranscript('');
    setEvalResult(null);
    setShowCelebration(false);
  }, [selectedEpisodeId]);

  useEffect(() => {
    setUserTranscript('');
    setEvalResult(null);
  }, [currentIndex]);

  const currentSentence = sentences[currentIndex];

  const handleListen = (speed = 1.0) => {
    if (!currentSentence) return;
    speechService.speak(currentSentence.en, {
      rate: speed,
      accent,
    });
  };

  const handleToggleRecord = () => {
    if (!isSpeechRecognitionSupported()) {
      // Graceful fallback for environments without mic support
      const simulatedText = prompt(
        '마이크 입력이 지원되지 않는 브라우저입니다. 연습삼아 말한 영어를 직접 입력해보시겠어요?',
        currentSentence?.en || ''
      );
      if (simulatedText) {
        setUserTranscript(simulatedText);
        evaluateSpeech(simulatedText);
      }
      return;
    }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      setUserTranscript('');
      setEvalResult(null);
      recognizerRef.current = createSpeechRecognizer({
        lang: accent === 'en-GB' ? 'en-GB' : 'en-US',
        onResult: (text, isFinal) => {
          setUserTranscript(text);
          if (isFinal) {
            evaluateSpeech(text);
          }
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

  const evaluateSpeech = (spoken: string) => {
    if (!currentSentence) return;
    const result = calculatePronunciationSimilarity(spoken, currentSentence.en);
    setEvalResult(result);

    if (result.score >= 60) {
      onCompleteSentence(currentSentence.id);
      if (currentIndex === sentences.length - 1) {
        setShowCelebration(true);
      }
    }
  };

  if (!activeEpisode || !sentences.length) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">아직 등록된 섀도잉 문장이 없습니다</h2>
        <p className="text-sm text-slate-500 mt-2">
          먼저 하루 일과 에피소드를 작성하여 나만의 맞춤 섀도잉 문장을 생성해보세요!
        </p>
      </div>
    );
  }

  const isCurrentSentenceCompleted = currentSentence && completedSentenceIds.has(currentSentence.id);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Shadowing Studio</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            생생 섀도잉 & 발음 트레이닝
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            원어민 음성을 듣고 따라 말해보세요. 음성 인식이 발음 일치도를 채점해드립니다.
          </p>
        </div>

        {/* Episode Dropdown */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedEpisodeId}
            onChange={(e) => setSelectedEpisodeId(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {ep.date} - {ep.koreanTitle}
              </option>
            ))}
          </select>

          <select
            value={accent}
            onChange={(e) => setAccent(e.target.value as 'en-US' | 'en-GB')}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="en-US">🇺🇸 US</option>
            <option value="en-GB">🇬🇧 UK</option>
          </select>
        </div>
      </div>

      {/* Main Flashcard Shadowing Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-1.5">
            {sentences.map((st, i) => (
              <div
                key={st.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  i === currentIndex
                    ? 'w-8 bg-indigo-600'
                    : completedSentenceIds.has(st.id)
                    ? 'w-4 bg-emerald-500'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`문장 ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {isCurrentSentenceCompleted && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>완료됨</span>
              </span>
            )}
            <span className="text-xs font-bold text-slate-400">
              {currentIndex + 1} / {sentences.length}
            </span>
          </div>
        </div>

        {/* Sentence Text */}
        <div className="text-center py-4 space-y-4">
          <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
            "{currentSentence.en}"
          </p>

          <p className="text-sm sm:text-base font-semibold text-indigo-700">
            {currentSentence.ko}
          </p>

          {/* Coaching tip */}
          <div className="max-w-lg mx-auto bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 text-xs text-amber-900 text-left flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">발음 & 억양 코칭 포인트: </span>
              <span>{currentSentence.focusPoint}</span>
            </div>
          </div>
        </div>

        {/* Audio Listen Buttons */}
        <div className="flex items-center justify-center space-x-3 pt-6 border-t border-slate-100">
          <button
            onClick={() => handleListen(1.0)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>원어민 보통 속도 (1.0x)</span>
          </button>

          <button
            onClick={() => handleListen(0.75)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
          >
            <span>🐢 느리게 듣기 (0.75x)</span>
          </button>
        </div>

        {/* Microphone Shadowing Recording Box */}
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <div className="mb-4">
            <button
              onClick={handleToggleRecord}
              className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg transition-all active:scale-95 ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 animate-mic-pulse ring-4 ring-rose-200'
                  : 'bg-gradient-to-tr from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-200'
              }`}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <p className="text-xs font-bold text-slate-700 mt-2">
              {isListening ? '말씀하고 계십니다... (다 말씀하시면 클릭)' : '마이크를 누르고 직접 따라 말해보세요'}
            </p>
          </div>

          {/* User Spoken Transcript & Evaluation */}
          {userTranscript && (
            <div className="max-w-xl mx-auto bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">인식된 나의 발음:</span>
                {evalResult && (
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      evalResult.score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : evalResult.score >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    일치도 점수: {evalResult.score}점
                  </span>
                )}
              </div>

              {/* Word-by-word visual highlight */}
              {evalResult ? (
                <div className="flex flex-wrap gap-1.5 text-sm sm:text-base font-semibold">
                  {evalResult.wordResults.map((wr, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.5 rounded ${
                        wr.matched ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-800 line-through opacity-75'
                      }`}
                    >
                      {wr.word}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-800 italic">
                  "{userTranscript}"
                </p>
              )}

              {/* Feedback comment */}
              {evalResult && (
                <p className="text-xs font-medium text-slate-600 pt-2 border-t border-slate-200">
                  {evalResult.score >= 85
                    ? '🎉 완벽한 억양과 발음입니다! 원어민 수준의 자연스러움이에요.'
                    : evalResult.score >= 60
                    ? '👍 좋은 시도입니다! 강조할 단어의 강세를 살려 한 번 더 도전해보세요.'
                    : '💪 괜찮습니다. 느린 재생으로 억양을 다시 듣고 차근차근 따라 해보세요!'}
                </p>
              )}
            </div>
          )}

          {/* Manual input trigger for testability */}
          <div className="mt-3">
            <button
              onClick={() => {
                const text = prompt('음성 대신 텍스트로 발음을 테스트해보세요:', currentSentence.en);
                if (text) {
                  setUserTranscript(text);
                  evaluateSpeech(text);
                }
              }}
              className="text-[11px] text-slate-400 hover:text-indigo-600 underline font-medium"
            >
              텍스트로 발음 채점 테스트하기
            </button>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={`inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold ${
              currentIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전 문장</span>
          </button>

          <button
            onClick={() => {
              handleListen(1.0);
            }}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>다시 듣기</span>
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(sentences.length - 1, prev + 1))}
            disabled={currentIndex === sentences.length - 1}
            className={`inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold ${
              currentIndex === sentences.length - 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <span>다음 문장</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completion Banner */}
      {showCelebration && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 text-center space-y-2 shadow-lg animate-in fade-in">
          <Trophy className="w-10 h-10 mx-auto text-amber-300" />
          <h3 className="text-xl font-extrabold">오늘의 섀도잉 코스 완료!</h3>
          <p className="text-xs sm:text-sm text-emerald-100">
            모든 문장의 발음 연습을 끝마쳤습니다. 꾸준한 반복이 자연스러운 원어민 스피킹을 만듭니다!
          </p>
        </div>
      )}
    </div>
  );
};
