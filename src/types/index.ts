export type Mood = 'excited' | 'peaceful' | 'tired' | 'funny' | 'proud' | 'sentimental';

export type Category = 'work' | 'commute' | 'cafe' | 'home' | 'social' | 'hobby';

export type EnglishStyle = 'casual' | 'vivid' | 'professional' | 'short_reel';

export interface KeyExpression {
  id: string;
  phrase: string;
  meaning: string;
  usageExample: string;
  nuanceExplanation: string;
  category: 'idiom' | 'phrasal_verb' | 'colloquial' | 'connector';
  isSaved?: boolean;
}

export interface NuanceUpgrade {
  awkwardOrKonglish: string;
  naturalNative: string;
  whyBetter: string;
}

export interface ShadowingSentence {
  id: string;
  en: string;
  ko: string;
  focusPoint: string;
  bestScore?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface StoryParagraph {
  en: string;
  ko: string;
}

export interface Episode {
  id: string;
  createdAt: string; // ISO date string
  date: string; // YYYY-MM-DD
  rawContent: string;
  mood: Mood;
  category: Category;
  englishStyle: EnglishStyle;
  title: string;
  koreanTitle: string;
  summary: string;
  paragraphs: StoryParagraph[];
  keyExpressions: KeyExpression[];
  nuanceUpgrades: NuanceUpgrade[];
  shadowingSentences: ShadowingSentence[];
  quizQuestions: QuizQuestion[];
  isFavorite?: boolean;
  studiedAt?: string;
  memo?: string; // Daily study reflection or note
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  memo?: string;
  completedShadowingCount: number;
  savedWordsCount: number;
  studied: boolean;
}


export interface SavedWord extends KeyExpression {
  episodeId: string;
  episodeTitle: string;
  savedAt: string;
  reviewCount: number;
  mastered: boolean;
}

export interface StudyStats {
  totalEpisodes: number;
  currentStreak: number;
  maxStreak: number;
  savedWordsCount: number;
  completedShadowingCount: number;
  isTodayLogged: boolean;
}
