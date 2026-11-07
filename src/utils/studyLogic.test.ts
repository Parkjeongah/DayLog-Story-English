import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  levenshteinDistance,
  calculatePronunciationSimilarity,
  tokenizeSentences,
  calculateStreak,
  filterEpisodes,
  getCalendarGrid,
  formatKoreanDate,
} from './studyLogic';
import { Episode } from '../types';

test('normalizeText strips punctuation and handles whitespace and casing', () => {
  const result = normalizeText('  Hello, World! This is "Great"...  ');
  assert.equal(result, "hello world this is great");
});

test('levenshteinDistance calculates correct edit distances', () => {
  assert.equal(levenshteinDistance('', ''), 0);
  assert.equal(levenshteinDistance('kitten', 'sitting'), 3);
  assert.equal(levenshteinDistance('book', 'back'), 2);
  assert.equal(levenshteinDistance('coffee', 'coffee'), 0);
});

test('calculatePronunciationSimilarity returns high score for exact match', () => {
  const target = 'I almost spilled my hot latte on the crowded subway train.';
  const spoken = 'I almost spilled my hot latte on the crowded subway train.';
  const evalResult = calculatePronunciationSimilarity(spoken, target);

  assert.equal(evalResult.score, 100);
  assert.equal(evalResult.missedWords.length, 0);
  assert.equal(evalResult.wordResults.every((w) => w.matched), true);
});

test('calculatePronunciationSimilarity handles minor differences gracefully', () => {
  const target = 'I rushed to catch the express train.';
  const spoken = 'I rush to catched the express train';
  const evalResult = calculatePronunciationSimilarity(spoken, target);

  assert.ok(evalResult.score >= 70, `Score was ${evalResult.score}, expected >= 70`);
  assert.ok(evalResult.matchedWords.includes('train'));
  assert.ok(evalResult.matchedWords.includes('express'));
});

test('calculatePronunciationSimilarity handles empty spoken input', () => {
  const target = 'Practice makes perfect.';
  const evalResult = calculatePronunciationSimilarity('', target);

  assert.equal(evalResult.score, 0);
  assert.equal(evalResult.matchedWords.length, 0);
  assert.equal(evalResult.missedWords.length, 3);
});

test('tokenizeSentences splits text correctly on punctuation', () => {
  const text = 'Today was a hectic morning! I barely made it on time. Did you see that? Yes, absolutely.';
  const sentences = tokenizeSentences(text);

  assert.equal(sentences.length, 4);
  assert.equal(sentences[0], 'Today was a hectic morning!');
  assert.equal(sentences[1], 'I barely made it on time.');
  assert.equal(sentences[2], 'Did you see that?');
  assert.equal(sentences[3], 'Yes, absolutely.');
});

test('calculateStreak computes continuous days and detects current streak', () => {
  const refDate = new Date('2026-11-06T10:00:00Z');
  // Logged on 4th, 5th, and 6th (today)
  const dates = ['2026-11-04', '2026-11-05', '2026-11-06'];
  const streak = calculateStreak(dates, refDate);

  assert.equal(streak.isTodayLogged, true);
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.maxStreak, 3);
});

test('calculateStreak detects broken streak if missed yesterday and today', () => {
  const refDate = new Date('2026-11-06T10:00:00Z');
  // Logged last week
  const dates = ['2026-10-30', '2026-10-31'];
  const streak = calculateStreak(dates, refDate);

  assert.equal(streak.isTodayLogged, false);
  assert.equal(streak.currentStreak, 0);
  assert.equal(streak.maxStreak, 2);
});

test('filterEpisodes filters by keyword and category correctly', () => {
  const mockEpisodes: Episode[] = [
    {
      id: 'ep-1',
      createdAt: '2026-11-05T09:00:00Z',
      date: '2026-11-05',
      rawContent: '지하철에서 커피를 쏟을 뻔함',
      mood: 'funny',
      category: 'commute',
      englishStyle: 'casual',
      title: 'Close Call with Hot Coffee',
      koreanTitle: '지하철 커피 아찔했던 순간',
      summary: '지하철에서 커피를 쏟을 뻔했으나 다행히 무사했던 아침 일과',
      paragraphs: [{ en: 'I had a close call today.', ko: '오늘 아찔한 순간이 있었어요.' }],
      keyExpressions: [
        {
          id: 'k1',
          phrase: 'close call',
          meaning: '아슬아슬한 위기 모면',
          usageExample: 'That was a close call!',
          nuanceExplanation: '위험한 일을 간신히 피했을 때',
          category: 'idiom',
        },
      ],
      nuanceUpgrades: [],
      shadowingSentences: [],
      quizQuestions: [],
    },
    {
      id: 'ep-2',
      createdAt: '2026-11-06T12:00:00Z',
      date: '2026-11-06',
      rawContent: '야근하면서 버그 잡음 성공적',
      mood: 'proud',
      category: 'work',
      englishStyle: 'vivid',
      title: 'Debugging Victory at Midnight',
      koreanTitle: '심야의 버그 소탕 대작전',
      summary: '어려운 버그를 마침내 해결하고 성취감을 느낌',
      paragraphs: [{ en: 'We finally fixed the bug.', ko: '마침내 버그를 고쳤어요.' }],
      keyExpressions: [
        {
          id: 'k2',
          phrase: 'crack the code',
          meaning: '해결의 실마리를 찾다',
          usageExample: 'We finally cracked the code.',
          nuanceExplanation: '어려운 문제 해결',
          category: 'idiom',
        },
      ],
      nuanceUpgrades: [],
      shadowingSentences: [],
      quizQuestions: [],
    },
  ];

  const searchCoffee = filterEpisodes(mockEpisodes, { query: 'coffee' });
  assert.equal(searchCoffee.length, 1);
  assert.equal(searchCoffee[0].id, 'ep-1');

  const searchCategory = filterEpisodes(mockEpisodes, { category: 'work' });
  assert.equal(searchCategory.length, 1);
  assert.equal(searchCategory[0].id, 'ep-2');
});

test('getCalendarGrid returns full 7-column calendar matrix with valid day counts', () => {
  // Test November 2026 (November 1, 2026 is Sunday, 30 days)
  const grid = getCalendarGrid(2026, 10, new Date('2026-11-06T10:00:00Z'));
  assert.ok(grid.length >= 35, `Grid length was ${grid.length}, expected >= 35`);
  assert.equal(grid.length % 7, 0);

  const nov6 = grid.find((cell) => cell.date === '2026-11-06');
  assert.ok(nov6, 'Nov 6 should be in calendar grid');
  assert.equal(nov6?.dayNumber, 6);
  assert.equal(nov6?.isToday, true);
  assert.equal(nov6?.isCurrentMonth, true);
});

test('formatKoreanDate produces human-readable Korean date with day of week', () => {
  const result = formatKoreanDate('2026-11-06');
  assert.equal(result, '2026년 11월 6일 금요일');
});

