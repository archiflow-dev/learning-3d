import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson15Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson15Acceleration: React.FC<Lesson15Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Tab 1 State: AABB Slab Microscope
  const [slabAngle, setSlabAngle] = useState<number>(-14);
  const [slabOy, setSlabOy] = useState<number>(175);
  const slabCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: BVH Tree Traversal
  const [bvhAngle, setBvhAngle] = useState<number>(-8);
  const bvhCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(90);
  const [gVal2, setGVal2] = useState<number>(280);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Slab Microscope
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const c = slabCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 70, oy = slabOy;
    const xMin = 250, xMax = 430, yMin = 60, yMax = 190;
    const rad = (slabAngle * Math.PI) / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad) || 1e-5;

    const tx0 = (xMin - ox) / dx, tx1 = (xMax - ox) / dx;
    const ty0 = (yMin - oy) / dy, ty1 = (yMax - oy) / dy;
    const txMin = Math.min(tx0, tx1), txMax = Math.max(tx0, tx1);
    const tyMin = Math.min(ty0, ty1), tyMax = Math.max(ty0, ty1);
    const tEnter = Math.max(txMin, tyMin), tExit = Math.min(txMax, tyMax);
    const hit = tEnter <= tExit && tExit > 0;

    ctx.fillStyle = hit ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.15)';
    ctx.strokeStyle = hit ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);
    ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx * 520, oy + dy * 520); ctx.stroke();
  }, [activeTab, slabAngle, slabOy]);

  // Draw Tab 2 BVH Traversal
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const c = bvhCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 45, oy = 175;
    const rad = (bvhAngle * Math.PI) / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad) || 1e-5;

    const boxes = [
      { x0: 185, y0: 35, x1: 580, y1: 315 },
      { x0: 200, y0: 45, x1: 360, y1: 155 },
      { x0: 400, y0: 45, x1: 565, y1: 155 },
      { x0: 200, y0: 195, x1: 360, y1: 305 },
      { x0: 400, y0: 195, x1: 565, y1: 305 }
    ];

    boxes.forEach((b, i) => {
      const tx0 = (b.x0 - ox) / dx, tx1 = (b.x1 - ox) / dx;
      const ty0 = (b.y0 - oy) / dy, ty1 = (b.y1 - oy) / dy;
      const tEnter = Math.max(Math.min(tx0, tx1), Math.min(ty0, ty1));
      const tExit = Math.min(Math.max(tx0, tx1), Math.max(ty0, ty1));
      const hit = tEnter <= tExit && tExit > 0;
      ctx.strokeStyle = hit ? '#10b981' : '#334155';
      ctx.lineWidth = i === 0 ? 1.5 : 2.5;
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    });

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx * 540, oy + dy * 540); ctx.stroke();
  }, [activeTab, bvhAngle]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && gVal1 === 120 && gVal2 === 240) ||
    (mission === 2 && gVal1 === 7 && gVal2 === 3) ||
    (mission === 3 && gVal1 === 1 && gVal2 === 150);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const c = gameCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = gPassed ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`Mission ${mission} • Param1=${gVal1} | Param2=${gVal2}`, 75, 145);
  }, [activeTab, mission, gVal1, gVal2, gPassed]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1.5">
              <button
                onClick={onBackToPortal}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isZh ? '← 返回课程总目录 (Index)' : '← Back to Course Index'}
              </button>
              <span>•</span>
              <span>Stage 3 • Lesson 15 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-15.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L15: 空间加速结构：包围盒层次 (BVH)、Slab 求交、SAH 与 KD-Tree'
                : 'L15: Spatial Acceleration: AABB Slab Test, BVH, Surface Area Heuristic (SAH) & KD-Trees'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Crofton Integral Geometry &amp; Slab Overlap • MIT 6.837 Lec 12 (Justin Solomon)
            </p>
          </div>

          <button
            onClick={onToggleComplete}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isCompleted ? (isZh ? '✓ 已完成本课' : '✓ Lesson Completed') : isZh ? '标记本课完成' : 'Mark Complete'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'concepts' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '1. Slab 三明治交集与几何概率推导 SAH' : '1. Slab Test & Geometric Probability SAH'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. BVH 树遍历与提前剪枝透视镜' : '2. BVH Tree Traversal & Pruning Lab'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. MIT 6.837 Lec 12 与 BVH vs KD-Tree' : '3. MIT 6.837 Lec 12 & BVH vs KD-Tree'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：RTX 光追加速架构师' : '4. 3-Mission Game: RTX Acceleration Architect'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={slabCanvasRef} width={640} height={280} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-amber-300 font-bold"><span>Ray Angle θ</span><span>{slabAngle}°</span></div>
              <input type="range" min={-45} max={35} step={0.5} value={slabAngle} onChange={(e) => setSlabAngle(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-cyan-300 font-bold"><span>Ray Origin Y</span><span>{slabOy}</span></div>
              <input type="range" min={40} max={220} step={2} value={slabOy} onChange={(e) => setSlabOy(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={bvhCanvasRef} width={640} height={340} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-4">
            <span className="text-amber-300 font-bold">BVH Probe Angle θ = {bvhAngle}°</span>
            <input type="range" min={-32} max={28} value={bvhAngle} onChange={(e) => setBvhAngle(Number(e.target.value))} className="w-64" />
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            MIT 6.837 Lecture 12: Acceleration Structures (BVH, SAH &amp; KD-Trees)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可体验 SAH 期望代价曲线分析仪、完整 BVH 树节点状态图与内嵌的 MIT 6.837 Lecture 12 视频。'
              : 'Open the standalone HTML page above for the interactive SAH Cost Curve Analyzer, full BVH Tree Graph, and embedded MIT 6.837 Lecture 12 video.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? 'RTX 光追引擎加速架构师 (3 关)' : 'RTX Ray-Tracing Acceleration Architect'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(90); setGVal2(280); }
                    else if (m === 2) { setGVal1(4); setGVal2(6); }
                    else { setGVal1(2); setGVal2(250); }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    mission === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Mission {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <canvas ref={gameCanvasRef} width={600} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-amber-300"><span>Param 1</span><span>{gVal1}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 60 : 1}
                  max={mission === 1 ? 200 : mission === 2 ? 9 : 2}
                  step={mission === 1 ? 10 : 1}
                  value={gVal1}
                  onChange={(e) => setGVal1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 160 : mission === 2 ? 1 : 100}
                  max={mission === 1 ? 300 : mission === 2 ? 9 : 300}
                  step={mission === 1 ? 10 : mission === 2 ? 1 : 25}
                  value={gVal2}
                  onChange={(e) => setGVal2(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Adjust parameters to clear mission'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
