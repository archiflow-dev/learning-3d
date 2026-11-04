import React, { useEffect, useState } from 'react';
import { LESSONS, STAGES, LessonItem } from './data/curriculum';
import { Lesson01Vectors } from './lessons/Lesson01Vectors';

const STORAGE_KEY = 'learning_3d_completed_lessons_v1';
const LANG_KEY = 'learning_3d_lang_v1';

export type Language = 'zh' | 'en';

export const App: React.FC = () => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | 'ALL'>('ALL');
  const [courseFilter, setCourseFilter] = useState<'ALL' | 'UCD' | 'MIT'>('ALL');
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      return saved === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // ignore storage errors
    }
  }, [completedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'zh' ? 'en' : 'zh'));
  };

  const toggleLessonComplete = (id: string) => {
    setCompletedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const filteredLessons = LESSONS.filter(lesson => {
    const stageOk = selectedStage === 'ALL' || lesson.stageId === selectedStage;
    const courseOk =
      courseFilter === 'ALL' || lesson.videos.some(v => v.course === courseFilter);
    return stageOk && courseOk;
  });

  const progressPct = Math.round((completedIds.length / LESSONS.length) * 100);
  const isZh = lang === 'zh';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div
            onClick={() => setSelectedLessonId(null)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-black text-white shadow">
              3D
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight">
                {isZh ? '3D 交互式全栈学习门户 (Interactive 3D Portal)' : 'Interactive 3D Learning Portal'}
              </div>
              <div className="text-xs text-slate-400">
                3D Math • UC Davis ECS 175 (21 Lectures) • MIT 6.837 (22 Lectures) • Modern 3D Foundation
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400">{isZh ? '学习进度:' : 'Progress:'}</span>
              <span className="font-bold text-indigo-400">
                {completedIds.length} / {LESSONS.length} {isZh ? '课' : 'Lessons'} ({progressPct}%)
              </span>
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {selectedLessonId !== 'L01' && (
              <button
                onClick={() => setSelectedLessonId('L01')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                {isZh ? '进入 Lesson 01 →' : 'Open Lesson 01 →'}
              </button>
            )}

            {/* Top-Right Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100 transition shadow-sm"
              title="Switch Language / 切换中英文"
            >
              <span>🌐</span>
              <span>{isZh ? 'EN / English' : '中文 / Chinese'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {selectedLessonId === 'L01' ? (
          <Lesson01Vectors
            lang={lang}
            isCompleted={completedIds.includes('L01')}
            onToggleComplete={() => toggleLessonComplete('L01')}
            onBackToPortal={() => setSelectedLessonId(null)}
          />
        ) : (
          <div className="space-y-8">
            {/* Hero Overview Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-xl">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Learn in Public · 32 Interactive Web Artifacts (Bilingual 中/EN)
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {isZh
                    ? '从 3D 数学与经典图形学，到现代渲染管线与 3D Foundation'
                    : 'From 3D Math & Classical Computer Graphics to Modern Rendering & 3D Foundation'}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {isZh ? (
                    <>
                      本网站将 <b>UC Davis ECS 175 (Fall 2009 全部 21 讲)</b> 的几何直觉与{' '}
                      <b>MIT 6.837 (Fall 2021 全部 22 讲)</b> 的现代图形学体系 100% 融合。每一课都配备可实时操控的 3D 交互沙盒、公式直觉拆解与配套课程视频。
                    </>
                  ) : (
                    <>
                      This portal synthesizes 100% of <b>UC Davis ECS 175 (Fall 2009, all 21 lectures)</b> with{' '}
                      <b>MIT 6.837 (Fall 2021, all 22 lectures)</b>. Every lesson features an interactive 3D sandbox, mathematical intuition breakdown, and embedded lecture references.
                    </>
                  )}
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedLessonId('L01')}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
                  >
                    {isZh
                      ? '🚀 立即开始 Lesson 01: 图形学全景与 3D 向量几何'
                      : '🚀 Start Lesson 01: CG Panorama & 3D Vector Geometry'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stage Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STAGES.map(stage => {
                const stageLessons = LESSONS.filter(l => l.stageId === stage.id);
                const doneCount = stageLessons.filter(l => completedIds.includes(l.id)).length;
                const isSelected = selectedStage === stage.id;
                return (
                  <div
                    key={stage.id}
                    onClick={() => setSelectedStage(isSelected ? 'ALL' : stage.id)}
                    className={`cursor-pointer rounded-2xl border p-5 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-900 shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${stage.badgeColor}`}
                      >
                        Stage {stage.id}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {doneCount} / {stageLessons.length} {isZh ? '已完成' : 'Completed'}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-white">
                      {isZh ? stage.title : `Stage ${stage.id}: ${stage.englishTitle}`}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {isZh ? stage.description : stage.englishTitle}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">{isZh ? '阶段筛选:' : 'Stage Filter:'}</span>
                <button
                  onClick={() => setSelectedStage('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedStage === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isZh ? '全部 32 课' : 'All 32 Lessons'}
                </button>
                {STAGES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStage(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedStage === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Stage {s.id}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{isZh ? '课程来源核对:' : 'Course Source:'}</span>
                {[
                  { id: 'ALL', label: isZh ? '全部融合课程' : 'All Merged' },
                  { id: 'UCD', label: isZh ? 'UC Davis 2009 (全 21 讲)' : 'UC Davis (21 Lectures)' },
                  { id: 'MIT', label: isZh ? 'MIT 6.837 2021 (全 22 讲)' : 'MIT 6.837 (22 Lectures)' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCourseFilter(c.id as typeof courseFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      courseFilter === c.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLessons.map((lesson: LessonItem) => {
                const done = completedIds.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                      lesson.isImplemented
                        ? 'border-indigo-500/60 bg-slate-900 shadow-md'
                        : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-indigo-400">
                            {lesson.id}
                          </span>
                          <span className="text-xs text-slate-400">Stage {lesson.stageId}</span>
                          {lesson.isImplemented && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Interactive Lab Ready
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleLessonComplete(lesson.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                            done
                              ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          {done ? (isZh ? '✓ 已掌握' : '✓ Completed') : isZh ? '标记完成' : 'Mark Done'}
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">
                          {isZh ? lesson.title : lesson.subtitle}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isZh ? lesson.subtitle : lesson.title}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {lesson.concepts.map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-xs bg-slate-950 text-slate-300 border border-slate-800"
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1">
                        <div className="text-xs font-semibold text-indigo-300">
                          🎮 Interactive Artifact: {lesson.playgroundTitle}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {lesson.playgroundDescription}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.videos.map((v, i) => (
                          <a
                            key={i}
                            href={v.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${
                              v.course === 'UCD'
                                ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                                : v.course === 'MIT'
                                ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/50'
                                : 'bg-purple-950/50 text-purple-300 border-purple-800/60'
                            }`}
                          >
                            ▶ {v.code}: {v.title.split(':')[0]}
                          </a>
                        ))}
                      </div>

                      {lesson.isImplemented && (
                        <button
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                        >
                          {isZh ? '打开交互实验室 →' : 'Open Interactive Lab →'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
