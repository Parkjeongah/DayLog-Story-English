import React from 'react';
import { BookOpen, Mic, Bookmark, Sparkles, Flame, PlusCircle, History, Calendar } from 'lucide-react';
import { StudyStats } from '../types';

interface NavbarProps {
  currentTab: 'create' | 'calendar' | 'stories' | 'shadowing' | 'vocab';
  onSelectTab: (tab: 'create' | 'calendar' | 'stories' | 'shadowing' | 'vocab') => void;
  stats: StudyStats;
  onNewEpisodeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  onNewEpisodeClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('create')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">DayLog</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase tracking-wider">
                  Story English
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">하루 일과로 만드는 나만의 영어 스토리</p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="hidden md:flex items-center space-x-3">
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                stats.currentStreak > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="연속 기록 스트릭"
            >
              <Flame className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span>{stats.currentStreak}일 연속 학습</span>
            </div>

            <div
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
              title="누적 작성된 에피소드"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>{stats.totalEpisodes}개 에피소드</span>
            </div>

            <div
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
              title="단어장에 저장된 핵심 표현"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
              <span>{stats.savedWordsCount}개 표현</span>
            </div>
          </div>

          {/* New Episode Action Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewEpisodeClick}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>일과 기록하기</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-100 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => onSelectTab('create')}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'create'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 일과 작성</span>
          </button>

          <button
            onClick={() => onSelectTab('calendar')}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'calendar'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>학습 달력 & 일지</span>
          </button>

          <button
            onClick={() => onSelectTab('stories')}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'stories'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>스토리 타임라인 ({stats.totalEpisodes})</span>
          </button>

          <button
            onClick={() => onSelectTab('shadowing')}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'shadowing'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>섀도잉 스튜디오</span>
          </button>

          <button
            onClick={() => onSelectTab('vocab')}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'vocab'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>표현 단어장 & 퀴즈 ({stats.savedWordsCount})</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

