import { Episode, SavedWord } from '../types';
import { INITIAL_EPISODES } from './sampleData';

const EPISODES_KEY = 'daylog_episodes_v1';
const SAVED_WORDS_KEY = 'daylog_saved_words_v1';
const COMPLETED_SHADOWING_KEY = 'daylog_completed_shadowing_v1';

export function loadEpisodes(): Episode[] {
  try {
    const raw = localStorage.getItem(EPISODES_KEY);
    if (!raw) {
      saveEpisodes(INITIAL_EPISODES);
      return INITIAL_EPISODES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : INITIAL_EPISODES;
  } catch {
    return INITIAL_EPISODES;
  }
}

export function saveEpisodes(episodes: Episode[]): void {
  try {
    localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes));
  } catch (err) {
    console.error('Failed to save episodes to localStorage:', err);
  }
}

export function loadSavedWords(): SavedWord[] {
  try {
    const raw = localStorage.getItem(SAVED_WORDS_KEY);
    if (!raw) {
      // Extract initially saved words from initial episodes
      const initialSaved: SavedWord[] = [];
      INITIAL_EPISODES.forEach((ep) => {
        ep.keyExpressions
          .filter((ke) => ke.isSaved)
          .forEach((ke) => {
            initialSaved.push({
              ...ke,
              episodeId: ep.id,
              episodeTitle: ep.title,
              savedAt: ep.createdAt,
              reviewCount: 0,
              mastered: false,
            });
          });
      });
      saveSavedWords(initialSaved);
      return initialSaved;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSavedWords(words: SavedWord[]): void {
  try {
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(words));
  } catch (err) {
    console.error('Failed to save words to localStorage:', err);
  }
}

export function loadCompletedShadowing(): string[] {
  try {
    const raw = localStorage.getItem(COMPLETED_SHADOWING_KEY);
    return raw ? JSON.parse(raw) : ['sh-1'];
  } catch {
    return ['sh-1'];
  }
}

export function saveCompletedShadowing(sentenceIds: string[]): void {
  try {
    localStorage.setItem(COMPLETED_SHADOWING_KEY, JSON.stringify(sentenceIds));
  } catch (err) {
    console.error('Failed to save completed shadowing:', err);
  }
}
