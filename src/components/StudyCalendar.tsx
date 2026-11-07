import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  BookOpen,
  Mic,
  Bookmark,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  Save,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Episode, SavedWord } from '../types';
import { getCalendarGrid, formatKoreanDate } from '../utils/studyLogic';

interface StudyCalendarProps {
  episodes: Episode[];
  savedWords: SavedWord[];
  completedSentenceIds: Set<string>;
  onSelectEpisode: (episode: Episode) => void;
  onGoToShadowing: (episodeId: string) => void;
  onCreateEpisodeForDate: (dateStr: string) => void;
  onSaveEpisodeMemo: (episodeId: string, memo: string) => void;
}

export const StudyCalendar: React.FC<StudyCalendarProps> = ({
  episodes,
  savedWords,
  completedSentenceIds,
  onSelectEpisode,
  onGoToShadowing,
  onCreateEpisodeForDate,
  onSaveEpisodeMemo,
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-indexed

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Map episodes by date (YYYY-MM-DD)
  const episodesByDate = useMemo(() => {
    const map = new Map<string, Episode>();
    episodes.forEach((ep) => {
      map.set(ep.date, ep);
    });
    return map;
  }, [episodes]);

  // Compute calendar grid
  const calendarGrid = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth, today);
  }, [currentYear, currentMonth, today]);

  // Current selected episode
  const selectedEpisode = episodesByDate.get(selectedDate);

  // Memo editing state
  const [editingMemo, setEditingMemo] = useState<string>('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoSavedToast, setMemoSavedToast] = useState(false);

  // Sync memo state when selectedDate changes
  React.useEffect(() => {
    setEditingMemo(selectedEpisode?.memo || '');
  }, [selectedDate, selectedEpisode]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const handleSaveMemo = () => {
    if (!selectedEpisode) return;
    setIsSavingMemo(true);
    onSaveEpisodeMemo(selectedEpisode.id, editingMemo);
    setTimeout(() => {
      setIsSavingMemo(false);
      setMemoSavedToast(true);
      setTimeout(() => setMemoSavedToast(false), 2000);
    }, 400);
  };

  // Month stats
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthlyEpisodes = episodes.filter((e) => e.date.startsWith(prefix));
    const shadowCount = monthlyEpisodes.reduce((acc, ep) => {
      const done = ep.shadowingSentences.filter((s) => completedSentenceIds.has(s.id)).length;
      return acc + done;
    }, 0);

    return {
      studiedDays: monthlyEpisodes.length,
      shadowCount,
    };
  }, [episodes, currentYear, currentMonth, completedSentenceIds]);

  const moodEmojis: Record<string, string> = {
    excited: '🎉',
    peaceful: '☕',
    funny: '🤣',
    proud: '🔥',
    tired: '😫',
    sentimental: '🌧️',
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Study Calendar</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            그날의 학습 달력 & 복습 일지
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            달력에서 날짜별로 기록된 일과 스토리와 학습 메모를 한눈에 확인하고 복습하세요.
          </p>
        </div>

        {/* Month Navigation & Today Jump */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <div className="flex items-center bg-slate-100 rounded-2xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-extrabold text-slate-800 min-w-[120px] text-center">
              {currentYear}년 {currentMonth + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
          >
            오늘로 이동
          </button>
        </div>
      </div>

      {/* Monthly Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400">이번 달 기록한 날</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {monthStats.studiedDays}일 <span className="text-xs font-normal text-slate-500">출석</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400">이번 달 섀도잉 완주</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            {monthStats.shadowCount}문장 <span className="text-xs font-normal text-slate-500">완료</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400">누적 저장된 표현</div>
          <div className="text-xl font-extrabold text-indigo-600 mt-1">
            {savedWords.length}개 <span className="text-xs font-normal text-slate-500">표현</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400">선택된 날짜</div>
          <div className="text-sm font-bold text-slate-800 mt-1.5 truncate">
            {selectedDate}
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-3">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 py-1 border-b border-slate-100">
          <span className="text-rose-500">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-sky-500">토</span>
        </div>

        {/* 7-column Calendar Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarGrid.map((cell) => {
            const ep = episodesByDate.get(cell.date);
            const isSelected = selectedDate === cell.date;

            let textColor = 'text-slate-800';
            if (!cell.isCurrentMonth) textColor = 'text-slate-300';
            else if (cell.dayOfWeek === 0) textColor = 'text-rose-600';
            else if (cell.dayOfWeek === 6) textColor = 'text-sky-600';

            return (
              <div
                key={cell.date}
                onClick={() => setSelectedDate(cell.date)}
                className={`min-h-[75px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                    : ep
                    ? 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/80 shadow-xs'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                {/* Cell Top Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${textColor} ${
                      cell.isToday ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : ''
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {ep && (
                    <span className="text-sm" title={ep.mood}>
                      {moodEmojis[ep.mood] || '✨'}
                    </span>
                  )}
                </div>

                {/* Episode Mini Preview or Empty Add Prompt */}
                {ep ? (
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate">
                      {ep.title}
                    </p>
                    <div className="flex items-center space-x-1">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 text-[9px] font-semibold">
                        {ep.category}
                      </span>
                      {ep.shadowingSentences.some((s) => completedSentenceIds.has(s.id)) && (
                        <span className="text-emerald-600 text-[10px]" title="섀도잉 완주">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  cell.isCurrentMonth && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-right">
                      <span className="text-[10px] text-indigo-600 font-bold">+ 기록</span>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail & Study Memo Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {formatKoreanDate(selectedDate)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedEpisode ? '그날의 영어 학습 기록 및 개인 학습 메모' : '이 날짜에 기록된 에피소드가 아직 없습니다.'}
            </p>
          </div>

          {!selectedEpisode && (
            <button
              onClick={() => onCreateEpisodeForDate(selectedDate)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>이 날짜로 일과 기록하기</span>
            </button>
          )}
        </div>

        {/* If episode exists for this date */}
        {selectedEpisode ? (
          <div className="space-y-6">
            {/* Episode Summary Preview */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{moodEmojis[selectedEpisode.mood] || '✨'}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {selectedEpisode.category}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {selectedEpisode.englishStyle}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectEpisode(selectedEpisode)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>스토리 읽기</span>
                  </button>

                  <button
                    onClick={() => onGoToShadowing(selectedEpisode.id)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>섀도잉 연습</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedEpisode.title}
                </h3>
                <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                  {selectedEpisode.koreanTitle}
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  "{selectedEpisode.summary}"
                </p>
              </div>

              {/* Key expressions pill row */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/80">
                <span className="text-xs font-bold text-slate-500 self-center mr-1">학습 표현:</span>
                {selectedEpisode.keyExpressions.map((expr) => (
                  <span
                    key={expr.id}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 shadow-2xs"
                  >
                    {expr.phrase} ({expr.meaning})
                  </span>
                ))}
              </div>
            </div>

            {/* Daily Study Reflection Memo Section */}
            <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                  <Save className="w-4 h-4 text-indigo-600" />
                  <span>그날의 학습 메모 & 나만의 복습 일지</span>
                </label>
                {memoSavedToast && (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                    ✓ 메모가 저장되었습니다!
                  </span>
                )}
              </div>

              <textarea
                value={editingMemo}
                onChange={(e) => setEditingMemo(e.target.value)}
                placeholder="예) 오늘 배운 'packed like sardines' 출퇴근길 지하철에서 혼자 소리 내어 중얼거려봄! 발음 연음이 매끄러워졌다."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-indigo-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed placeholder:text-slate-400"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  disabled={isSavingMemo}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSavingMemo ? '저장 중...' : '학습 메모 저장하기'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {formatKoreanDate(selectedDate)}에 작성된 학습 기록이 없습니다.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              이 날 있었던 일과 에피소드를 기록하고 생생한 영어 스토리로 학습해보세요!
            </p>
            <button
              onClick={() => onCreateEpisodeForDate(selectedDate)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{selectedDate} 일과 기록 시작하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
