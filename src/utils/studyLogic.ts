import { Episode, SavedWord, StudyStats } from '../types';

/**
 * Normalizes text for comparison by removing punctuation and converting to lowercase.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Evaluates pronunciation/shadowing similarity between user speech and target sentence.
 * Returns a score (0 to 100) and details on matched/missed words.
 */
export function calculatePronunciationSimilarity(
  spoken: string,
  target: string
): {
  score: number;
  matchedWords: string[];
  missedWords: string[];
  wordResults: Array<{ word: string; matched: boolean }>;
} {
  const cleanSpoken = normalizeText(spoken);
  const cleanTarget = normalizeText(target);

  if (!cleanTarget) {
    return { score: 0, matchedWords: [], missedWords: [], wordResults: [] };
  }

  if (!cleanSpoken) {
    const targetWords = cleanTarget.split(' ').filter(Boolean);
    return {
      score: 0,
      matchedWords: [],
      missedWords: targetWords,
      wordResults: targetWords.map((word) => ({ word, matched: false })),
    };
  }

  const spokenWords = cleanSpoken.split(' ').filter(Boolean);
  const targetWords = cleanTarget.split(' ').filter(Boolean);

  const matchedWords: string[] = [];
  const missedWords: string[] = [];
  const wordResults: Array<{ word: string; matched: boolean }> = [];

  const spokenUsed = new Array(spokenWords.length).fill(false);

  for (const tWord of targetWords) {
    // Find closest match in spokenWords that hasn't been used yet
    let bestIndex = -1;
    let minDistance = Infinity;

    for (let j = 0; j < spokenWords.length; j++) {
      if (spokenUsed[j]) continue;
      const dist = levenshteinDistance(tWord, spokenWords[j]);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = j;
      }
    }

    // Allow 1 typo for words longer than 4 characters, 0 for shorter
    const threshold = tWord.length > 4 ? 1 : 0;
    const isMatched = minDistance <= threshold && bestIndex !== -1;

    if (isMatched) {
      spokenUsed[bestIndex] = true;
      matchedWords.push(tWord);
      wordResults.push({ word: tWord, matched: true });
    } else {
      missedWords.push(tWord);
      wordResults.push({ word: tWord, matched: false });
    }
  }

  // Combine word hit ratio with overall character edit similarity
  const wordRatio = matchedWords.length / targetWords.length;
  const maxLen = Math.max(cleanSpoken.length, cleanTarget.length);
  const charDistance = levenshteinDistance(cleanSpoken, cleanTarget);
  const charRatio = Math.max(0, 1 - charDistance / maxLen);

  const finalScore = Math.round((wordRatio * 0.7 + charRatio * 0.3) * 100);

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    matchedWords,
    missedWords,
    wordResults,
  };
}

/**
 * Splits continuous English text into clean sentences.
 */
export function tokenizeSentences(text: string): string[] {
  if (!text) return [];
  // Match sentences ending in ., !, or ?
  const raw = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  return raw
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Calculates current streak and max streak based on logged date strings (YYYY-MM-DD).
 */
export function calculateStreak(
  dateStrings: string[],
  referenceDate: Date = new Date()
): {
  currentStreak: number;
  maxStreak: number;
  isTodayLogged: boolean;
} {
  if (!dateStrings.length) {
    return { currentStreak: 0, maxStreak: 0, isTodayLogged: false };
  }

  // Normalize unique dates in YYYY-MM-DD
  const uniqueDates = Array.from(new Set(dateStrings.map((d) => d.slice(0, 10)))).sort();
  if (!uniqueDates.length) {
    return { currentStreak: 0, maxStreak: 0, isTodayLogged: false };
  }

  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  const isTodayLogged = uniqueDates.includes(todayStr);

  // Compute maximum streak across all recorded history
  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else {
      currentRun = 1;
    }
  }

  // Compute current streak ending today or yesterday
  let currentStreak = 0;
  if (isTodayLogged || uniqueDates.includes(yesterdayStr)) {
    let checkDate = isTodayLogged ? new Date(referenceDate) : yesterday;
    while (true) {
      const dateCheckStr = formatYMD(checkDate);
      if (uniqueDates.includes(dateCheckStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    isTodayLogged,
  };
}

/**
 * Filter episodes by search query, mood, and category.
 */
export function filterEpisodes(
  episodes: Episode[],
  options: { query?: string; mood?: string; category?: string }
): Episode[] {
  const query = (options.query || '').trim().toLowerCase();
  const mood = options.mood;
  const category = options.category;

  return episodes.filter((ep) => {
    if (mood && mood !== 'all' && ep.mood !== mood) return false;
    if (category && category !== 'all' && ep.category !== category) return false;
    if (!query) return true;

    const matchTitle = ep.title.toLowerCase().includes(query) || ep.koreanTitle.toLowerCase().includes(query);
    const matchRaw = ep.rawContent.toLowerCase().includes(query);
    const matchSummary = ep.summary.toLowerCase().includes(query);
    const matchExpressions = ep.keyExpressions.some(
      (e) => e.phrase.toLowerCase().includes(query) || e.meaning.toLowerCase().includes(query)
    );

    return matchTitle || matchRaw || matchSummary || matchExpressions;
  });
}

/**
 * Aggregates overall study stats.
 */
export function calculateStudyStats(
  episodes: Episode[],
  savedWords: SavedWord[],
  completedShadowIds: string[] = []
): StudyStats {
  const streakInfo = calculateStreak(episodes.map((e) => e.date));

  return {
    totalEpisodes: episodes.length,
    currentStreak: streakInfo.currentStreak,
    maxStreak: streakInfo.maxStreak,
    savedWordsCount: savedWords.length,
    completedShadowingCount: completedShadowIds.length,
    isTodayLogged: streakInfo.isTodayLogged,
  };
}

export interface CalendarDayCell {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}

/**
 * Computes a standard 7-column calendar matrix for the specified year and month (0-indexed).
 */
export function getCalendarGrid(year: number, monthIndex: number, referenceDate: Date = new Date()): CalendarDayCell[] {
  const todayStr = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(referenceDate.getDate()).padStart(2, '0')}`;

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  const cells: CalendarDayCell[] = [];

  // Previous month padding days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, monthIndex - 1, day);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: prevMonthDate.getDay(),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currDate = new Date(year, monthIndex, day);
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dayOfWeek: currDate.getDay(),
    });
  }

  // Next month padding days to complete rows (up to multiple of 7, min 35 or 42)
  const remaining = (7 - (cells.length % 7)) % 7;
  const targetTotal = cells.length + remaining < 35 ? cells.length + remaining + 7 : cells.length + remaining;

  let nextMonthDay = 1;
  while (cells.length < targetTotal) {
    const nextDate = new Date(year, monthIndex + 1, nextMonthDay);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextMonthDay).padStart(2, '0')}`;
    cells.push({
      date: dateStr,
      dayNumber: nextMonthDay,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: nextDate.getDay(),
    });
    nextMonthDay++;
  }

  return cells;
}

/**
 * Formats a YYYY-MM-DD string into friendly Korean date (e.g. "2026년 11월 6일 금요일").
 */
export function formatKoreanDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length < 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month - 1, day);
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday = weekdays[date.getDay()] || '';

  return `${year}년 ${month}월 ${day}일 ${weekday}`;
}

