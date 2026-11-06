/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { EpisodeEditor } from './components/EpisodeEditor';
import { StoryView } from './components/StoryView';
import { EpisodeList } from './components/EpisodeList';
import { ShadowingStudio } from './components/ShadowingStudio';
import { VocabNotebook } from './components/VocabNotebook';
import { Episode, KeyExpression, SavedWord } from './types';
import {
  loadEpisodes,
  saveEpisodes,
  loadSavedWords,
  saveSavedWords,
  loadCompletedShadowing,
  saveCompletedShadowing,
} from './utils/storage';
import { calculateStudyStats } from './utils/studyLogic';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'create' | 'stories' | 'shadowing' | 'vocab'>('create');
  const [episodes, setEpisodes] = useState<Episode[]>(() => loadEpisodes());
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => loadSavedWords());
  const [completedShadowIds, setCompletedShadowIds] = useState<string[]>(() => loadCompletedShadowing());

  // Active viewed episode (null means showing EpisodeList under 'stories' tab)
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(() => {
    const list = loadEpisodes();
    return list.length ? list[0].id : null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check query params for autostart / direct navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'stories' || tabParam === 'shadowing' || tabParam === 'vocab' || tabParam === 'create') {
        setCurrentTab(tabParam);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Compute study stats
  const stats = useMemo(() => {
    return calculateStudyStats(episodes, savedWords, completedShadowIds);
  }, [episodes, savedWords, completedShadowIds]);

  // Set of saved word IDs for fast lookup
  const savedWordIds = useMemo(() => {
    return new Set(savedWords.map((w) => w.id));
  }, [savedWords]);

  const completedShadowSet = useMemo(() => {
    return new Set(completedShadowIds);
  }, [completedShadowIds]);

  const activeEpisode = useMemo(() => {
    if (!activeEpisodeId) return null;
    return episodes.find((e) => e.id === activeEpisodeId) || null;
  }, [episodes, activeEpisodeId]);

  // Handlers
  const handleStoryCreated = (newEpisode: Episode) => {
    const updated = [newEpisode, ...episodes];
    setEpisodes(updated);
    saveEpisodes(updated);
    setActiveEpisodeId(newEpisode.id);
    setCurrentTab('stories');
    showToast('✨ 새로운 하루 일과 스토리가 완성되었습니다!');
  };

  const handleToggleSaveWord = (expression: KeyExpression, episode: Episode) => {
    const exists = savedWords.find((w) => w.id === expression.id);
    let updated: SavedWord[];
    if (exists) {
      updated = savedWords.filter((w) => w.id !== expression.id);
      showToast(`'${expression.phrase}' 표현이 단어장에서 제외되었습니다.`);
    } else {
      const newWord: SavedWord = {
        ...expression,
        episodeId: episode.id,
        episodeTitle: episode.title,
        savedAt: new Date().toISOString(),
        reviewCount: 0,
        mastered: false,
      };
      updated = [newWord, ...savedWords];
      showToast(`💡 '${expression.phrase}' 표현이 단어장에 저장되었습니다!`);
    }
    setSavedWords(updated);
    saveSavedWords(updated);
  };

  const handleToggleMastered = (wordId: string) => {
    const updated = savedWords.map((w) =>
      w.id === wordId ? { ...w, mastered: !w.mastered } : w
    );
    setSavedWords(updated);
    saveSavedWords(updated);
  };

  const handleRemoveWord = (wordId: string) => {
    const updated = savedWords.filter((w) => w.id !== wordId);
    setSavedWords(updated);
    saveSavedWords(updated);
    showToast('단어장에서 삭제되었습니다.');
  };

  const handleCompleteSentence = (sentenceId: string) => {
    if (!completedShadowIds.includes(sentenceId)) {
      const updated = [...completedShadowIds, sentenceId];
      setCompletedShadowIds(updated);
      saveCompletedShadowing(updated);
      showToast('🌟 섀도잉 문장 학습 완료!');
    }
  };

  const handleDeleteEpisode = (episodeId: string) => {
    const updated = episodes.filter((e) => e.id !== episodeId);
    setEpisodes(updated);
    saveEpisodes(updated);
    if (activeEpisodeId === episodeId) {
      setActiveEpisodeId(updated.length ? updated[0].id : null);
    }
    showToast('에피소드가 삭제되었습니다.');
  };

  const handleGoToShadowing = (episodeId: string) => {
    setActiveEpisodeId(episodeId);
    setCurrentTab('shadowing');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Offline Status Alert */}
      <OfflineIndicator />

      {/* Global Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'stories') {
            // keep activeEpisodeId if exists
          }
        }}
        stats={stats}
        onNewEpisodeClick={() => setCurrentTab('create')}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'create' && (
          <EpisodeEditor onStoryCreated={handleStoryCreated} />
        )}

        {currentTab === 'stories' && (
          <>
            {activeEpisode ? (
              <StoryView
                episode={activeEpisode}
                onBack={() => setActiveEpisodeId(null)}
                onGoToShadowing={handleGoToShadowing}
                onToggleSaveWord={handleToggleSaveWord}
                savedWordIds={savedWordIds}
              />
            ) : (
              <EpisodeList
                episodes={episodes}
                onSelectEpisode={(ep) => setActiveEpisodeId(ep.id)}
                onGoToShadowing={handleGoToShadowing}
                onDeleteEpisode={handleDeleteEpisode}
                onCreateNewClick={() => setCurrentTab('create')}
              />
            )}
          </>
        )}

        {currentTab === 'shadowing' && (
          <ShadowingStudio
            episodes={episodes}
            initialEpisodeId={activeEpisodeId || undefined}
            onCompleteSentence={handleCompleteSentence}
            completedSentenceIds={completedShadowSet}
          />
        )}

        {currentTab === 'vocab' && (
          <VocabNotebook
            savedWords={savedWords}
            onToggleMastered={handleToggleMastered}
            onRemoveWord={handleRemoveWord}
            onNavigateToStory={(epId) => {
              setActiveEpisodeId(epId);
              setCurrentTab('stories');
            }}
          />
        )}
      </main>
    </div>
  );
}
