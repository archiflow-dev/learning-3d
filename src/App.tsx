import React, { useEffect, useState } from 'react';
import { LESSONS, STAGES, LessonItem } from './data/curriculum';
import { Lesson01Vectors } from './lessons/Lesson01Vectors';
import { Lesson02Frames } from './lessons/Lesson02Frames';
import { Lesson03Rotations } from './lessons/Lesson03Rotations';
import { Lesson04Quaternions } from './lessons/Lesson04Quaternions';
import { Lesson05Hierarchical } from './lessons/Lesson05Hierarchical';
import { Lesson06Camera } from './lessons/Lesson06Camera';
import { Lesson07Bezier } from './lessons/Lesson07Bezier';
import { Lesson08Splines } from './lessons/Lesson08Splines';
import { Lesson09Patches } from './lessons/Lesson09Patches';
import { Lesson10Subdivision1 } from './lessons/Lesson10Subdivision1';
import { Lesson11Subdivision2 } from './lessons/Lesson11Subdivision2';
import { Lesson12RayCasting } from './lessons/Lesson12RayCasting';
import { Lesson13BarycentricCSG } from './lessons/Lesson13BarycentricCSG';
import { Lesson14RayTracing } from './lessons/Lesson14RayTracing';
import { Lesson15Acceleration } from './lessons/Lesson15Acceleration';
import { Lesson16Antialiasing } from './lessons/Lesson16Antialiasing';
import { Lesson17GlobalIllumination } from './lessons/Lesson17GlobalIllumination';

const STORAGE_KEY = 'learning_3d_completed_lessons_v1';
const LANG_KEY = 'learning_3d_lang_v1';

export type Language = 'zh' | 'en';

function getLessonIdFromHash(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith('#lesson=')) {
    return hash.replace('#lesson=', '').trim();
  }
  return null;
}

export const App: React.FC = () => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(() => getLessonIdFromHash());
  const [selectedStage, setSelectedStage] = useState<number | 'ALL'>('ALL');
  const [courseFilter, setCourseFilter] = useState<'ALL' | 'UCD' | 'MIT'>('ALL');
  const [viewMode, setViewMode] = useState<'directory' | 'cards'>('directory');

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
    const onHashChange = () => {
      setSelectedLessonId(getLessonIdFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateToLesson = (lessonId: string | null) => {
    if (lessonId) {
      window.location.hash = `lesson=${lessonId}`;
      setSelectedLessonId(lessonId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
      setSelectedLessonId(null);
    }
  };

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
  const activeLessonObj = selectedLessonId ? LESSONS.find(l => l.id === selectedLessonId) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div
            onClick={() => navigateToLesson(null)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-black text-white shadow">
              3D
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight">
                {isZh ? '3D 交互式全栈学习门户 (Course Index)' : 'Interactive 3D Learning Portal (Index)'}
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

            {selectedLessonId !== null && (
              <button
                onClick={() => navigateToLesson(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isZh ? '🏠 课程总目录 (Index)' : '🏠 Course Index'}
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
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L02' ? (
          <Lesson02Frames
            lang={lang}
            isCompleted={completedIds.includes('L02')}
            onToggleComplete={() => toggleLessonComplete('L02')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L03' ? (
          <Lesson03Rotations
            lang={lang}
            isCompleted={completedIds.includes('L03')}
            onToggleComplete={() => toggleLessonComplete('L03')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L04' ? (
          <Lesson04Quaternions
            lang={lang}
            isCompleted={completedIds.includes('L04')}
            onToggleComplete={() => toggleLessonComplete('L04')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L05' ? (
          <Lesson05Hierarchical
            lang={lang}
            isCompleted={completedIds.includes('L05')}
            onToggleComplete={() => toggleLessonComplete('L05')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L06' ? (
          <Lesson06Camera
            lang={lang}
            isCompleted={completedIds.includes('L06')}
            onToggleComplete={() => toggleLessonComplete('L06')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L07' ? (
          <Lesson07Bezier
            lang={lang}
            isCompleted={completedIds.includes('L07')}
            onToggleComplete={() => toggleLessonComplete('L07')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L08' ? (
          <Lesson08Splines
            lang={lang}
            isCompleted={completedIds.includes('L08')}
            onToggleComplete={() => toggleLessonComplete('L08')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L09' ? (
          <Lesson09Patches
            lang={lang}
            isCompleted={completedIds.includes('L09')}
            onToggleComplete={() => toggleLessonComplete('L09')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L10' ? (
          <Lesson10Subdivision1
            lang={lang}
            isCompleted={completedIds.includes('L10')}
            onToggleComplete={() => toggleLessonComplete('L10')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L11' ? (
          <Lesson11Subdivision2
            lang={lang}
            isCompleted={completedIds.includes('L11')}
            onToggleComplete={() => toggleLessonComplete('L11')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L12' ? (
          <Lesson12RayCasting
            lang={lang}
            isCompleted={completedIds.includes('L12')}
            onToggleComplete={() => toggleLessonComplete('L12')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L13' ? (
          <Lesson13BarycentricCSG
            lang={lang}
            isCompleted={completedIds.includes('L13')}
            onToggleComplete={() => toggleLessonComplete('L13')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L14' ? (
          <Lesson14RayTracing
            lang={lang}
            isCompleted={completedIds.includes('L14')}
            onToggleComplete={() => toggleLessonComplete('L14')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L15' ? (
          <Lesson15Acceleration
            lang={lang}
            isCompleted={completedIds.includes('L15')}
            onToggleComplete={() => toggleLessonComplete('L15')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L16' ? (
          <Lesson16Antialiasing
            lang={lang}
            isCompleted={completedIds.includes('L16')}
            onToggleComplete={() => toggleLessonComplete('L16')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : selectedLessonId === 'L17' ? (
          <Lesson17GlobalIllumination
            lang={lang}
            isCompleted={completedIds.includes('L17')}
            onToggleComplete={() => toggleLessonComplete('L17')}
            onBackToPortal={() => navigateToLesson(null)}
          />
        ) : activeLessonObj ? (
          /* Lesson Syllabus Preview Page for L03-L32 */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
                  <button
                    onClick={() => navigateToLesson(null)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    {isZh ? '← 返回全部 32 课总目录 (Index)' : '← Back to Course Index'}
                  </button>
                  <span>•</span>
                  <span>Stage {activeLessonObj.stageId}</span>
                  <span>•</span>
                  <span>{activeLessonObj.id} / L32</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {activeLessonObj.id}: {isZh ? activeLessonObj.title : activeLessonObj.subtitle}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {isZh ? activeLessonObj.subtitle : activeLessonObj.title}
                </p>
              </div>

              <button
                onClick={() => toggleLessonComplete(activeLessonObj.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  completedIds.includes(activeLessonObj.id)
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {completedIds.includes(activeLessonObj.id)
                  ? isZh
                    ? '✓ 已完成'
                    : '✓ Completed'
                  : isZh
                  ? '标记本课完成'
                  : 'Mark Complete'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-indigo-300">
                  {isZh ? '📚 核心概念清单 (Core Concepts)' : '📚 Core Concepts'}
                </h3>
                <ul className="space-y-2 text-xs text-slate-300 list-disc pl-4">
                  {activeLessonObj.concepts.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-300">
                  🎮 {isZh ? '本课交互沙盒与通关小游戏设计' : 'Interactive Sandbox & Mini-Game Spec'}
                </h3>
                <div className="text-sm font-semibold text-white">
                  {activeLessonObj.playgroundTitle}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeLessonObj.playgroundDescription}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-amber-300">
                🎥 {isZh ? '配套名校公开课视频链接' : 'Mapped University Lecture Videos'}
              </h3>
              <div className="flex flex-wrap gap-3">
                {activeLessonObj.videos.map((v, i) => (
                  <a
                    key={i}
                    href={v.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition"
                  >
                    ▶ [{v.code}] {v.title} ↗
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {activeLessonObj.number > 1 ? (
                <a
                  href={`#lesson=L${String(activeLessonObj.number - 1).padStart(2, '0')}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  ← Lesson {String(activeLessonObj.number - 1).padStart(2, '0')}
                </a>
              ) : (
                <div />
              )}
              {activeLessonObj.number < 32 && (
                <a
                  href={`#lesson=L${String(activeLessonObj.number + 1).padStart(2, '0')}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Lesson {String(activeLessonObj.number + 1).padStart(2, '0')} →
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Overview Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-xl">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Learn in Public · 32 Interactive Web Artifacts & Mini-Games (中/EN)
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
                      <b>MIT 6.837 (Fall 2021 全部 22 讲)</b> 的现代图形学体系 100% 融合，并融入{' '}
                      <b>3Blue1Brown《线性代数的本质》</b>深度几何推导。每一课都配备可实时操控的 3D 交互沙盒、最后一个板块的<b>互动通关小游戏</b>与双课程视频索引。
                    </>
                  ) : (
                    <>
                      This portal synthesizes 100% of <b>UC Davis ECS 175 (Fall 2009, all 21 lectures)</b> with{' '}
                      <b>MIT 6.837 (Fall 2021, all 22 lectures)</b> and <b>3Blue1Brown</b> geometric derivations. Every lesson features an interactive 3D sandbox, a playable mini-game, and embedded lecture references.
                    </>
                  )}
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href="#lesson=L01"
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
                  >
                    {isZh ? '🚀 Lesson 01: 向量与点积/叉积' : '🚀 Lesson 01: Vectors & Dot/Cross'}
                  </a>
                  <a
                    href="#lesson=L02"
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
                  >
                    {isZh
                      ? '🔥 最新上线 Lesson 02: 仿射标架与 4×4 齐次矩阵'
                      : '🔥 New Lesson 02: Frames & 4×4 Homogeneous Matrices'}
                  </a>
                  <a
                    href="./lessons/lesson-02.html"
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 transition"
                  >
                    {isZh ? '📄 打开 Lesson 02 独立网页 (.html) ↗' : '📄 Standalone Lesson 02 (.html) ↗'}
                  </a>
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

            {/* Filter & View Mode Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 mr-1">{isZh ? '阶段筛选:' : 'Stage:'}</span>
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

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: isZh ? '全部融合课程' : 'All Merged' },
                  { id: 'UCD', label: isZh ? 'UC Davis (21讲)' : 'UC Davis (21)' },
                  { id: 'MIT', label: isZh ? 'MIT 6.837 (22讲)' : 'MIT 6.837 (22)' }
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

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  onClick={() => setViewMode(viewMode === 'directory' ? 'cards' : 'directory')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
                >
                  {viewMode === 'directory'
                    ? isZh
                      ? '切换为：卡片详情视图'
                      : 'Switch to Cards View'
                    : isZh
                    ? '切换为：全课程链接索引表'
                    : 'Switch to Directory Table'}
                </button>
              </div>
            </div>

            {/* Complete Course Link Index Table OR Detailed Cards */}
            {viewMode === 'directory' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {isZh
                        ? '📋 全部 32 节交互式课程总目录索引 (Complete Course Index & Links)'
                        : '📋 Complete 32-Lesson Interactive Course Directory & Links'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isZh
                        ? '点击任意课程标题链接可直接进入该课交互页面或大纲；已上线课程同时提供独立 HTML 网页直链'
                        : 'Click any lesson link to open its interactive lab or syllabus preview'}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <th className="py-3 px-4 font-semibold">{isZh ? '课次' : 'No.'}</th>
                        <th className="py-3 px-4 font-semibold">{isZh ? '课程链接 (Lesson Link)' : 'Lesson Title & Link'}</th>
                        <th className="py-3 px-4 font-semibold">{isZh ? '交互沙盒 & 通关小游戏' : 'Interactive Lab & Mini-Game'}</th>
                        <th className="py-3 px-4 font-semibold">{isZh ? '对应名校课程 (UCD / MIT)' : 'Course Mapping'}</th>
                        <th className="py-3 px-4 font-semibold text-right">{isZh ? '入口链接' : 'Action Links'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredLessons.map(lesson => {
                        const done = completedIds.includes(lesson.id);
                        const htmlPath = `./lessons/lesson-${String(lesson.number).padStart(2, '0')}.html`;
                        return (
                          <tr
                            key={lesson.id}
                            className={`hover:bg-slate-800/40 transition ${
                              lesson.isImplemented ? 'bg-indigo-950/20' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                              <a href={`#lesson=${lesson.id}`} className="hover:underline">
                                {lesson.id}
                              </a>
                              <div className="text-[11px] font-normal text-slate-500">
                                Stage {lesson.stageId}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <a
                                href={`#lesson=${lesson.id}`}
                                className="font-bold text-sm text-white hover:text-indigo-400 transition block"
                              >
                                {isZh ? lesson.title : lesson.subtitle}
                              </a>
                              <div className="text-slate-400 mt-0.5">
                                {isZh ? lesson.subtitle : lesson.title}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 max-w-xs">
                              <div className="font-medium text-indigo-300">{lesson.playgroundTitle}</div>
                              <div className="text-slate-500 line-clamp-1 mt-0.5">
                                {lesson.playgroundDescription}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {lesson.videos.map((v, i) => (
                                  <a
                                    key={i}
                                    href={v.youtubeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`px-2 py-0.5 rounded font-mono border ${
                                      v.course === 'UCD'
                                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                                        : v.course === 'MIT'
                                        ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                                        : 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                                    }`}
                                  >
                                    {v.code} ↗
                                  </a>
                                ))}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                {lesson.isImplemented ? (
                                  <>
                                    <a
                                      href={`#lesson=${lesson.id}`}
                                      className="px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                                    >
                                      {isZh ? '🎮 进入实验室' : '🎮 Launch Lab'}
                                    </a>
                                    <a
                                      href={htmlPath}
                                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                      title="Standalone HTML Page"
                                    >
                                      .HTML ↗
                                    </a>
                                  </>
                                ) : (
                                  <a
                                    href={`#lesson=${lesson.id}`}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                  >
                                    {isZh ? '查看大纲 →' : 'Syllabus →'}
                                  </a>
                                )}
                                <button
                                  onClick={() => toggleLessonComplete(lesson.id)}
                                  className={`px-2 py-1.5 rounded-lg border ${
                                    done
                                      ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                                  }`}
                                  title={isZh ? '标记完成' : 'Mark Completed'}
                                >
                                  ✓
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Detailed Cards Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLessons.map((lesson: LessonItem) => {
                  const done = completedIds.includes(lesson.id);
                  const htmlPath = `./lessons/lesson-${String(lesson.number).padStart(2, '0')}.html`;
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
                            <a
                              href={`#lesson=${lesson.id}`}
                              className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-indigo-400 hover:underline"
                            >
                              {lesson.id}
                            </a>
                            <span className="text-xs text-slate-400">Stage {lesson.stageId}</span>
                            {lesson.isImplemented && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Interactive Lab + Game Ready
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
                          <a
                            href={`#lesson=${lesson.id}`}
                            className="text-base font-bold text-white hover:text-indigo-400 transition block"
                          >
                            {isZh ? lesson.title : lesson.subtitle}
                          </a>
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
                              ▶ {v.code}
                            </a>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {lesson.isImplemented && (
                            <a
                              href={htmlPath}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            >
                              .HTML ↗
                            </a>
                          )}
                          <a
                            href={`#lesson=${lesson.id}`}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                              lesson.isImplemented
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {lesson.isImplemented
                              ? isZh
                                ? '打开交互实验室 →'
                                : 'Open Lab & Game →'
                              : isZh
                              ? '查看课程大纲 →'
                              : 'View Syllabus →'}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
