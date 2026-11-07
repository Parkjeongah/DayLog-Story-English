import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Volume2,
  Search,
  CheckCircle,
  RotateCw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { SavedWord } from '../types';
import { speechService } from '../utils/speech';

interface VocabNotebookProps {
  savedWords: SavedWord[];
  onToggleMastered: (wordId: string) => void;
  onRemoveWord: (wordId: string) => void;
  onNavigateToStory: (episodeId: string) => void;
}

export const VocabNotebook: React.FC<VocabNotebookProps> = ({
  savedWords,
  onToggleMastered,
  onRemoveWord,
  onNavigateToStory,
}) => {
  const [activeMode, setActiveMode] = useState<'list' | 'flashcard'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const filteredWords = savedWords.filter((w) => {
    if (selectedCategory !== 'all' && w.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.phrase.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q) ||
      w.nuanceExplanation.toLowerCase().includes(q)
    );
  });

  const handleSpeak = (text: string) => {
    speechService.speak(text, { rate: 1.0 });
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev < filteredWords.length - 1 ? prev + 1 : 0));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev > 0 ? prev - 1 : filteredWords.length - 1));
  };

  const currentFlashcard = filteredWords[cardIndex];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Vocab Archive</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            나만의 일상 표현 단어장
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            내 일상 스토리에서 발견한 알짜배기 관용구와 숙어들을 반복 학습하세요.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'list' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>목록 모드 ({savedWords.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('flashcard');
              setIsFlipped(false);
              setCardIndex(0);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'flashcard' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>플래시카드 암기</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="표현 또는 한국어 뜻 검색..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: 'all', label: '전체' },
            { id: 'idiom', label: '관용구 (Idiom)' },
            { id: 'colloquial', label: '구어체 (Colloquial)' },
            { id: 'phrasal_verb', label: '구동사 (Phrasal Verb)' },
            { id: 'connector', label: '연결구 (Connector)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Flashcard View */}
      {activeMode === 'flashcard' && (
        <div className="max-w-xl mx-auto py-4">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
              <p className="text-slate-500 text-sm">해당 조건에 맞는 저장된 단어가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[300px] bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-indigo-200/80 p-8 shadow-md flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-all text-center relative select-none"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {currentFlashcard.category}
                  </span>
                  <span>
                    {cardIndex + 1} / {filteredWords.length}
                  </span>
                </div>

                {/* Card Content (Front vs Back) */}
                <div className="py-6 space-y-4">
                  {!isFlipped ? (
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {currentFlashcard.phrase}
                      </div>
                      <p className="text-xs text-slate-400 mt-3 font-medium">
                        (클릭하면 뜻과 원어민 뉘앙스를 확인합니다)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xl sm:text-2xl font-extrabold text-indigo-700">
                        {currentFlashcard.meaning}
                      </div>
                      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                        💡 {currentFlashcard.nuanceExplanation}
                      </p>
                      <p className="text-xs font-semibold text-slate-700 italic">
                        "{currentFlashcard.usageExample}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom hint */}
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(currentFlashcard.phrase);
                    }}
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center space-x-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>발음</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    {isFlipped ? '다시 클릭하면 영어가 보입니다' : '터치하여 뒤집기'}
                  </span>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevCard}
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>이전 카드</span>
                </button>

                <button
                  onClick={() => onToggleMastered(currentFlashcard.id)}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentFlashcard.mastered
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{currentFlashcard.mastered ? '마스터 완료 🌟' : '완전 암기 표시'}</span>
                </button>

                <button
                  onClick={handleNextCard}
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  <span>다음 카드</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: List View */}
      {activeMode === 'list' && (
        <div className="space-y-3">
          {filteredWords.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">단어장이 비어 있습니다</h3>
              <p className="text-xs text-slate-500 mt-1">
                에피소드 스토리에서 마음에 드는 핵심 표현을 북마크하여 저장해보세요!
              </p>
            </div>
          ) : (
            filteredWords.map((word) => (
              <div
                key={word.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  word.mastered ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {word.phrase}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                      {word.category}
                    </span>
                    {word.mastered && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        마스터
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-indigo-700">
                    {word.meaning}
                  </p>

                  <p className="text-xs text-slate-500 leading-snug">
                    {word.nuanceExplanation}
                  </p>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-medium inline-block">
                    💬 "{word.usageExample}"
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleSpeak(word.phrase)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
                    title="발음 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onToggleMastered(word.id)}
                    className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                      word.mastered
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={word.mastered ? '복습 필요 상태로 변경' : '마스터 완료로 표시'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveWord(word.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="단어장에서 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
