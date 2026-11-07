import React, { useState } from 'react';
import { Search, Calendar, Sparkles, BookOpen, Mic, Trash2, ArrowRight, Filter } from 'lucide-react';
import { Episode, Mood, Category } from '../types';
import { filterEpisodes } from '../utils/studyLogic';

interface EpisodeListProps {
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  onGoToShadowing: (episodeId: string) => void;
  onDeleteEpisode: (episodeId: string) => void;
  onCreateNewClick: () => void;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  onSelectEpisode,
  onGoToShadowing,
  onDeleteEpisode,
  onCreateNewClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  const filtered = filterEpisodes(episodes, {
    query: searchQuery,
    category: selectedCategory,
    mood: selectedMood,
  });

  const moodEmojis: Record<string, string> = {
    excited: '🎉',
    peaceful: '☕',
    funny: '🤣',
    proud: '🔥',
    tired: '😫',
    sentimental: '🌧️',
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Episode Archive</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            나의 영어 에피소드 스토리북
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            기록했던 하루하루가 살아있는 영어 교재가 됩니다. ({episodes.length}개의 기록)
          </p>
        </div>

        <button
          onClick={onCreateNewClick}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>오늘 일과 기록하기</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 내용, 표현 검색..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category & Mood Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>분야:</span>
          </span>
          {[
            { id: 'all', label: '전체' },
            { id: 'commute', label: '🚇 출퇴근' },
            { id: 'work', label: '💼 업무' },
            { id: 'cafe', label: '🍰 카페/맛집' },
            { id: 'home', label: '🛋️ 집/휴식' },
            { id: 'social', label: '👥 만남' },
            { id: 'hobby', label: '🏃 운동' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes Timeline / Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">일치하는 에피소드가 없습니다</h3>
            <p className="text-xs text-slate-500">
              새로운 하루 일과를 작성하거나 검색 조건을 변경해보세요!
            </p>
          </div>
        ) : (
          filtered.map((ep) => (
            <div
              key={ep.id}
              onClick={() => onSelectEpisode(ep)}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl" title={ep.mood}>
                    {moodEmojis[ep.mood] || '✨'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ep.date}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    {ep.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                    {ep.englishStyle}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('이 에피소드를 정말 삭제하시겠습니까?')) {
                        onDeleteEpisode(ep.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="에피소드 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {ep.title}
                </h3>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">
                  {ep.koreanTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {ep.summary}
                </p>
              </div>

              {/* Key Expression Badges Preview */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {ep.keyExpressions.slice(0, 3).map((ke) => (
                  <span
                    key={ke.id}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold"
                  >
                    #{ke.phrase}
                  </span>
                ))}
                {ep.keyExpressions.length > 3 && (
                  <span className="text-[11px] text-slate-400 self-center">
                    +{ep.keyExpressions.length - 3}개 더보기
                  </span>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400 font-medium">
                  {ep.paragraphs.length}개 문단 · {ep.shadowingSentences.length}개 섀도잉 코칭
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoToShadowing(ep.id);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>섀도잉 연습</span>
                  </button>

                  <span className="inline-flex items-center text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>자세히 보기</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
