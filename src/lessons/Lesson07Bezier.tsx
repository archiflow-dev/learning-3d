import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson07Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Pt2 = [number, number];

function lerp2D(a: Pt2, b: Pt2, t: number): Pt2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function deCasteljauCubic(P0: Pt2, P1: Pt2, P2: Pt2, P3: Pt2, t: number) {
  const Q0 = lerp2D(P0, P1, t);
  const Q1 = lerp2D(P1, P2, t);
  const Q2 = lerp2D(P2, P3, t);
  const R0 = lerp2D(Q0, Q1, t);
  const R1 = lerp2D(Q1, Q2, t);
  const P = lerp2D(R0, R1, t);
  const vel: Pt2 = [3 * (R1[0] - R0[0]), 3 * (R1[1] - R0[1])];
  return { Q0, Q1, Q2, R0, R1, P, vel };
}

function bernsteinWeights(t: number, breakUnity = false): [number, number, number, number] {
  const u = 1 - t;
  return [
    u * u * u,
    (breakUnity ? 1.5 : 3) * u * u * t,
    3 * u * t * t,
    t * t * t
  ];
}

export const Lesson07Bezier: React.FC<Lesson07Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Visualizer 1: Bernstein & Partition of Unity
  const [bernT, setBernT] = useState<number>(0.35);
  const [bernShift, setBernShift] = useState<number>(0);
  const [breakUnity, setBreakUnity] = useState<boolean>(false);
  const bernCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2: de Casteljau Interactive Pyramid Lab
  const [labPts, setLabPts] = useState<[Pt2, Pt2, Pt2, Pt2]>([
    [110, 320],
    [220, 75],
    [520, 75],
    [630, 320]
  ]);
  const [labT, setLabT] = useState<number>(0.45);
  const [showPyramid, setShowPyramid] = useState<boolean>(true);
  const [showHull, setShowHull] = useState<boolean>(true);
  const [showTangent, setShowTangent] = useState<boolean>(true);
  const [showSplit, setShowSplit] = useState<boolean>(false);
  const [dragIdx, setDragIdx] = useState<number>(-1);
  const labCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gP1Y, setGP1Y] = useState<number>(300);
  const [gP2Y, setGP2Y] = useState<number>(300);
  const [gSplitT, setGSplitT] = useState<number>(0.5);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Visualizer 1
  const curWs = bernsteinWeights(bernT, breakUnity);
  const curSum = curWs[0] + curWs[1] + curWs[2] + curWs[3];

  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = bernCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const gx0 = 35, gy0 = H - 40, gw = 225, gh = 210;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gx0, gy0 - gh, gw, gh);

    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8'];
    for (let bIdx = 0; bIdx < 4; bIdx++) {
      ctx.strokeStyle = colors[bIdx];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let s = 0; s <= 100; s++) {
        const t = s / 100;
        const w = bernsteinWeights(t, breakUnity)[bIdx];
        const px = gx0 + t * gw;
        const py = gy0 - w * gh;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    const curX = gx0 + bernT * gw;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX, gy0 - gh);
    ctx.lineTo(curX, gy0);
    ctx.stroke();

    const basePts: Pt2[] = [
      [335, 260],
      [370, 75],
      [485, 75],
      [520, 260]
    ];
    const shiftedPts = basePts.map((p) => [p[0] + bernShift, p[1]] as Pt2);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    shiftedPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();

    ctx.strokeStyle = breakUnity ? '#f43f5e' : '#10b981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let s = 0; s <= 100; s++) {
      const t = s / 100;
      const ws = bernsteinWeights(t, breakUnity);
      const x = ws[0] * shiftedPts[0][0] + ws[1] * shiftedPts[1][0] + ws[2] * shiftedPts[2][0] + ws[3] * shiftedPts[3][0];
      const y = ws[0] * shiftedPts[0][1] + ws[1] * shiftedPts[1][1] + ws[2] * shiftedPts[2][1] + ws[3] * shiftedPts[3][1];
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [activeTab, bernT, bernShift, breakUnity]);

  // Draw Tab 2: de Casteljau Lab
  const dcLab = deCasteljauCubic(labPts[0], labPts[1], labPts[2], labPts[3], labT);

  useEffect(() => {
    if (activeTab !== 'lab') return;
    const canvas = labCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const [P0, P1, P2, P3] = labPts;

    if (showHull) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]); ctx.lineTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]); ctx.lineTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]);
    ctx.stroke();

    if (showPyramid) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dcLab.Q0[0], dcLab.Q0[1]); ctx.lineTo(dcLab.Q1[0], dcLab.Q1[1]); ctx.lineTo(dcLab.Q2[0], dcLab.Q2[1]);
      ctx.stroke();

      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(dcLab.R0[0], dcLab.R0[1]); ctx.lineTo(dcLab.R1[0], dcLab.R1[1]);
      ctx.stroke();
    }

    if (!showSplit) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let s = 0; s <= 100; s++) {
        const pt = deCasteljauCubic(P0, P1, P2, P3, s / 100).P;
        if (s === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let s = 0; s <= 50; s++) {
        const pt = deCasteljauCubic(P0, dcLab.Q0, dcLab.R0, dcLab.P, s / 50).P;
        if (s === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      }
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      for (let s = 0; s <= 50; s++) {
        const pt = deCasteljauCubic(dcLab.P, dcLab.R1, dcLab.Q2, P3, s / 50).P;
        if (s === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      }
      ctx.stroke();
    }

    if (showTangent) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dcLab.P[0], dcLab.P[1]);
      ctx.lineTo(dcLab.P[0] + dcLab.vel[0] * 0.25, dcLab.P[1] + dcLab.vel[1] * 0.25);
      ctx.stroke();
    }

    const ptColors = ['#f43f5e', '#f59e0b', '#10b981', '#38bdf8'];
    labPts.forEach((p, idx) => {
      ctx.fillStyle = ptColors[idx];
      ctx.beginPath(); ctx.arc(p[0], p[1], 7.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.arc(dcLab.P[0], dcLab.P[1], 7, 0, Math.PI * 2); ctx.fill();
  }, [activeTab, labPts, labT, showPyramid, showHull, showTangent, showSplit]);

  // Draw Tab 4: Mini-Game
  const gP0: Pt2 = [85, 300];
  const gP1: Pt2 = [215, gP1Y];
  const gP2: Pt2 = [425, gP2Y];
  const gP3: Pt2 = mission === 2 ? [555, 110] : [555, 300];
  const dcMid = deCasteljauCubic(gP0, gP1, gP2, gP3, 0.5);
  const dcProbe = deCasteljauCubic(gP0, gP1, gP2, gP3, gSplitT);

  const gPassed =
    (mission === 1 && Math.hypot(dcMid.P[0] - 320, dcMid.P[1] - 140) < 20) ||
    (mission === 2 && Math.abs(gP1Y - 95) < 20 && Math.abs(gP2Y - 295) < 20) ||
    (mission === 3 && Math.hypot(dcProbe.P[0] - 320, dcProbe.P[1] - 135) < 20 && Math.abs(dcProbe.R1[1] - dcProbe.R0[1]) < 16);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (mission === 1) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
      ctx.beginPath(); ctx.arc(320, 300, 48, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(320, 140, 18, 0, Math.PI * 2); ctx.stroke();
    } else if (mission === 2) {
      ctx.strokeStyle = '#fbbf24';
      ctx.strokeRect(215 - 12, 95 - 12, 24, 24);
      ctx.strokeStyle = '#22d3ee';
      ctx.strokeRect(425 - 12, 295 - 12, 24, 24);
    } else {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(320, 135, 18, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.strokeStyle = gPassed ? '#10b981' : '#6366f1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let s = 0; s <= 100; s++) {
      const pt = deCasteljauCubic(gP0, gP1, gP2, gP3, s / 100).P;
      if (s === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();

    [gP0, gP1, gP2, gP3].forEach((p, idx) => {
      ctx.fillStyle = idx === 1 ? '#f59e0b' : idx === 2 ? '#22d3ee' : '#f43f5e';
      ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI * 2); ctx.fill();
    });
  }, [activeTab, mission, gP1Y, gP2Y, gSplitT, gPassed]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
              <button
                onClick={onBackToPortal}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isZh ? '← 返回课程总目录 (Index)' : '← Back to Course Index'}
              </button>
              <span>•</span>
              <span>Stage 2 • Lesson 07 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-07.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L07: 平面参数曲线、Bernstein 多项式与 de Casteljau 递归 Bézier 几何学'
                : 'L07: Parametric Curves, Bernstein Polynomials & de Casteljau Bézier Geometry'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Polynomial Vector Space • UC Davis ECS 175 Lec 02 (Kenneth Joy) • MIT 6.837 Lec 02 (Justin Solomon)
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
              activeTab === 'concepts' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '1. 3Blue1Brown 深度概念：单位分解与基矩阵' : '1. 3Blue1Brown Intuition & Basis Matrices'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. de Casteljau 递归步进与细分交互画板' : '2. de Casteljau Pyramid & Subdivision Lab'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. UC Davis Lec 02 & MIT 6.837 Lec 02' : '3. University Lectures & Notes'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：星际跃迁轨道设计师' : '4. 3-Mission Game: Warp Trajectory Designer'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '交互透视镜：Bernstein 基函数 B₀³..B₃³(t) 与“破坏单位分解 (Σ≠1)”仿射崩塌实验'
                : 'Interactive Visualizer: Bernstein Polynomials & Partition of Unity Stress Test'}
            </h2>
            <button
              onClick={() => setBreakUnity(!breakUnity)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                breakUnity ? 'bg-rose-600 border-rose-400 text-white' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              🐞 {isZh ? `破坏单位分解 (Σ≠1): ${breakUnity ? '开' : '关'}` : `Break Partition of Unity: ${breakUnity ? 'ON' : 'OFF'}`}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-7">
              <canvas ref={bernCanvasRef} width={600} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-emerald-300 font-bold">
                  <span>Parameter t</span>
                  <span>{bernT.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={bernT} onChange={(e) => setBernT(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-cyan-300 font-bold">
                  <span>Translate Control Points (+Δx)</span>
                  <span>{bernShift} px</span>
                </div>
                <input type="range" min={-70} max={90} step={1} value={bernShift} onChange={(e) => setBernShift(Number(e.target.value))} className="w-full" />
                <div className="font-mono text-center p-2 rounded bg-slate-900 text-emerald-300">
                  Σ Bᵢ(t) = {curSum.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas
            ref={labCanvasRef}
            width={720}
            height={400}
            onPointerDown={(e) => {
              const c = labCanvasRef.current;
              if (!c) return;
              const rect = c.getBoundingClientRect();
              const mx = (e.clientX - rect.left) * (c.width / rect.width);
              const my = (e.clientY - rect.top) * (c.height / rect.height);
              labPts.forEach((p, i) => {
                if (Math.hypot(p[0] - mx, p[1] - my) < 22) setDragIdx(i);
              });
            }}
            onPointerMove={(e) => {
              if (dragIdx < 0) return;
              const c = labCanvasRef.current;
              if (!c) return;
              const rect = c.getBoundingClientRect();
              const mx = Math.max(25, Math.min(c.width - 25, (e.clientX - rect.left) * (c.width / rect.width)));
              const my = Math.max(25, Math.min(c.height - 25, (e.clientY - rect.top) * (c.height / rect.height)));
              setLabPts((prev) => {
                const next = [...prev] as [Pt2, Pt2, Pt2, Pt2];
                next[dragIdx] = [mx, my];
                return next;
              });
            }}
            onPointerUp={() => setDragIdx(-1)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-pointer"
          />
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="font-mono font-bold text-emerald-300">t = {labT.toFixed(2)}</span>
            <input type="range" min={0} max={1} step={0.01} value={labT} onChange={(e) => setLabT(Number(e.target.value))} className="flex-1" />
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showPyramid} onChange={(e) => setShowPyramid(e.target.checked)} />
              <span>Pyramid</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showHull} onChange={(e) => setShowHull(e.target.checked)} />
              <span>Convex Hull</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showTangent} onChange={(e) => setShowTangent(e.target.checked)} />
              <span>Tangent P'(t)</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={showSplit} onChange={(e) => setShowSplit(e.target.checked)} />
              <span>Subdivide [0,t] & [t,1]</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            MIT 6.837 Lecture 02 (Cubic Curves) & UC Davis ECS 175 Lecture 02 (Curves in the Plane)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可观看内嵌的 MIT 6.837 Lecture 02 视频播放器与 Kenneth Joy 教授 Bézier 五大黄金几何性质完整讲义。'
              : 'Open the standalone HTML artifact above for the embedded MIT 6.837 Lecture 02 video player and UC Davis Lecture 02 notes.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '星际跃迁轨道设计师 (3 关挑战)' : 'Interstellar Warp Trajectory Designer'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMission(m)}
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
              <canvas ref={gameCanvasRef} width={620} height={360} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-amber-300"><span>P₁.y</span><span>{gP1Y}</span></div>
                <input type="range" min={30} max={340} value={gP1Y} onChange={(e) => setGP1Y(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-cyan-300"><span>P₂.y</span><span>{gP2Y}</span></div>
                <input type="range" min={30} max={340} value={gP2Y} onChange={(e) => setGP2Y(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-emerald-300"><span>Probe t</span><span>{gSplitT.toFixed(2)}</span></div>
                <input type="range" min={0.1} max={0.9} step={0.01} value={gSplitT} onChange={(e) => setGSplitT(Number(e.target.value))} className="w-full" />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Adjust P₁.y and P₂.y to lock trajectory'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
