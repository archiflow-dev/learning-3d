import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson10Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Pt2 = [number, number];
type Scheme = 'chaikin' | 'cubic' | 'fourpt';

function subdivideStep(pts: Pt2[], scheme: Scheme, closed = true): Pt2[] {
  const n = pts.length;
  if (n < 3) return pts;
  const out: Pt2[] = [];
  const getPt = (idx: number): Pt2 => {
    if (closed) return pts[((idx % n) + n) % n];
    return pts[Math.max(0, Math.min(n - 1, idx))];
  };

  const edgeCount = closed ? n : n - 1;
  if (scheme === 'chaikin') {
    for (let i = 0; i < edgeCount; i++) {
      const p0 = getPt(i), p1 = getPt(i + 1);
      out.push([0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]]);
      out.push([0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]]);
    }
  } else if (scheme === 'cubic') {
    for (let i = 0; i < n; i++) {
      if (!closed && (i === 0 || i === n - 1)) {
        out.push([pts[i][0], pts[i][1]]);
      } else {
        const pm1 = getPt(i - 1), p0 = getPt(i), pp1 = getPt(i + 1);
        out.push([
          (pm1[0] + 6 * p0[0] + pp1[0]) / 8,
          (pm1[1] + 6 * p0[1] + pp1[1]) / 8
        ]);
      }
      if (closed || i < n - 1) {
        const p0 = getPt(i), p1 = getPt(i + 1);
        out.push([0.5 * p0[0] + 0.5 * p1[0], 0.5 * p0[1] + 0.5 * p1[1]]);
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      const p0 = getPt(i);
      out.push([p0[0], p0[1]]);
      if (closed || i < n - 1) {
        const pm1 = getPt(i - 1), p1 = getPt(i + 1), p2 = getPt(i + 2);
        out.push([
          (-pm1[0] + 9 * p0[0] + 9 * p1[0] - p2[0]) / 16,
          (-pm1[1] + 9 * p0[1] + 9 * p1[1] - p2[1]) / 16
        ]);
      }
    }
  }
  return out;
}

export const Lesson10Subdivision1: React.FC<Lesson10Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'topology' | 'game'>('concepts');

  // Tab 1 State: Eigen-Mode Decomposer
  const [powerK, setPowerK] = useState<number>(0);
  const [eigenPts] = useState<Pt2[]>([
    [110, 250],
    [300, 65],
    [490, 235]
  ]);
  const eigenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: Subdivision Curve Lab
  const [scheme, setScheme] = useState<Scheme>('cubic');
  const [level, setLevel] = useState<number>(3);
  const [showEigen, setShowEigen] = useState<boolean>(true);
  const [labPts, setLabPts] = useState<Pt2[]>([
    [140, 320],
    [115, 130],
    [245, 235],
    [370, 90],
    [495, 235],
    [625, 130],
    [600, 320]
  ]);
  const [dragIdx, setDragIdx] = useState<number>(-1);
  const labCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 3 State: 3D Mesh Topology Inspector
  const [topoKind, setTopoKind] = useState<'cube' | 'octa' | 'torus' | 'nonmanifold'>('cube');

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(0.55);
  const [gVal2, setGVal2] = useState<number>(0.45);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Eigen Canvas
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = eigenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1e293b';
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const [pm1, p0, pp1] = eigenPts;
    const pInf: Pt2 = [(pm1[0] + 4 * p0[0] + pp1[0]) / 6, (pm1[1] + 4 * p0[1] + pp1[1]) / 6];
    const c1: Pt2 = [0.5 * (pp1[0] - pm1[0]), 0.5 * (pp1[1] - pm1[1])];
    const c2: Pt2 = [(pm1[0] - 2 * p0[0] + pp1[0]) / 3, (pm1[1] - 2 * p0[1] + pp1[1]) / 3];

    const lam1 = Math.pow(0.5, powerK);
    const lam2 = Math.pow(0.25, powerK);

    const km1: Pt2 = [pInf[0] - lam1 * c1[0] + lam2 * c2[0], pInf[1] - lam1 * c1[1] + lam2 * c2[1]];
    const k0: Pt2 = [pInf[0] - lam2 * c2[0], pInf[1] - lam2 * c2[1]];
    const kp1: Pt2 = [pInf[0] + lam1 * c1[0] + lam2 * c2[0], pInf[1] + lam1 * c1[1] + lam2 * c2[1]];

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.beginPath();
    ctx.moveTo(pm1[0], pm1[1]); ctx.lineTo(p0[0], p0[1]); ctx.lineTo(pp1[0], pp1[1]);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(km1[0], km1[1]); ctx.lineTo(k0[0], k0[1]); ctx.lineTo(kp1[0], kp1[1]);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(pInf[0], pInf[1], 8, 0, Math.PI * 2); ctx.fill();
  }, [activeTab, powerK, eigenPts]);

  // Draw Tab 2 Lab
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const canvas = labCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1e293b';
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    let cur = labPts;
    for (let k = 0; k < level; k++) {
      cur = subdivideStep(cur, scheme, true);
    }

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    labPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    cur.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.closePath();
    ctx.stroke();

    if (showEigen && scheme === 'cubic') {
      const n = labPts.length;
      for (let i = 0; i < n; i++) {
        const pm1 = labPts[(i - 1 + n) % n];
        const p0 = labPts[i];
        const pp1 = labPts[(i + 1) % n];
        const lim: Pt2 = [(pm1[0] + 4 * p0[0] + pp1[0]) / 6, (pm1[1] + 4 * p0[1] + pp1[1]) / 6];
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(lim[0], lim[1], 6, 0, Math.PI * 2); ctx.stroke();
      }
    }

    labPts.forEach((p) => {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, Math.PI * 2); ctx.fill();
    });
  }, [activeTab, labPts, scheme, level, showEigen]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && Math.abs(gVal1 - 0.75) <= 0.03 && Math.abs(gVal2 - 0.25) <= 0.03) ||
    (mission === 2 && Math.hypot((140 + 4 * gVal1 + 500) / 6 - 320, (240 + 4 * gVal2 + 240) / 6 - 140) < 12) ||
    (mission === 3 && gVal1 === 44 && gVal2 === 1);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = gPassed ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Mission ${mission} • Param1=${gVal1.toFixed(2)} | Param2=${gVal2.toFixed(2)}`, 70, 120);
  }, [activeTab, mission, gVal1, gVal2, gPassed]);

  return (
    <div className="space-y-6">
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
              <span>Stage 2 • Lesson 10 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-10.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L10: 细分曲面 (Part 1)：从 Chaikin 切角、细分矩阵特征值到网格拓扑'
                : 'L10: Subdivision (Part 1): Chaikin Corner-Cutting, Eigen-Analysis & Mesh Topology'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Subdivision Matrix Eigen-Limits • UC Davis ECS 175 Lec 16 (Kenneth Joy)
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
            {isZh ? '1. Chaikin 切角与细分矩阵特征值极限 S^k' : '1. Chaikin & Matrix Eigen-Limits'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 多方案细分曲线放大镜' : '2. Subdivision Curve Microscope'}
          </button>
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'topology' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. 3D 网格拓扑检验台 (V-E+F=2-2g)' : '3. 3D Mesh Topology Inspector'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：细分雕塑家与拓扑医生' : '4. 3-Mission Game: Subdivision & Topology'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '交互透视镜：细分矩阵幂次 S^k x⁽⁰⁾ 与特征模式 (λ₀=1, λ₁=1/2, λ₂=1/4) 收敛'
                : 'Interactive Visualizer: Subdivision Matrix Power S^k & Eigen-Convergence'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <span>Power k = {powerK.toFixed(2)}</span>
              <input
                type="range"
                min={0}
                max={6}
                step={0.1}
                value={powerK}
                onChange={(e) => setPowerK(Number(e.target.value))}
              />
            </div>
          </div>
          <canvas ref={eigenCanvasRef} width={600} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas
            ref={labCanvasRef}
            width={740}
            height={420}
            onPointerDown={(e) => {
              const c = labCanvasRef.current;
              if (!c) return;
              const r = c.getBoundingClientRect();
              const mx = (e.clientX - r.left) * (c.width / r.width);
              const my = (e.clientY - r.top) * (c.height / r.height);
              labPts.forEach((p, idx) => {
                if (Math.hypot(p[0] - mx, p[1] - my) < 20) setDragIdx(idx);
              });
            }}
            onPointerMove={(e) => {
              if (dragIdx < 0) return;
              const c = labCanvasRef.current;
              if (!c) return;
              const r = c.getBoundingClientRect();
              const mx = Math.max(25, Math.min(c.width - 25, (e.clientX - r.left) * (c.width / r.width)));
              const my = Math.max(25, Math.min(c.height - 25, (e.clientY - r.top) * (c.height / r.height)));
              setLabPts((prev) => {
                const next = [...prev];
                next[dragIdx] = [mx, my];
                return next;
              });
            }}
            onPointerUp={() => setDragIdx(-1)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-pointer"
          />

          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {(['chaikin', 'cubic', 'fourpt'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScheme(s)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  scheme === s ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-bold">Level k = {level}</span>
              <input type="range" min={0} max={6} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <input type="checkbox" checked={showEigen} onChange={(e) => setShowEigen(e.target.checked)} />
              <span>Eigen-Limit P_i^∞ (1/6, 4/6, 1/6)</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'topology' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="flex flex-wrap gap-2">
            {(['cube', 'octa', 'torus', 'nonmanifold'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTopoKind(k)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  topoKind === k ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可体验 3D 交互旋转的网格拓扑检验台（Cube / Octahedron / Icosahedron / Torus / Non-Manifold T-Fin）与 UC Davis ECS 175 Lecture 16 视频。'
              : 'Open the standalone HTML page above for the interactive 3D Mesh Topology Inspector and UC Davis ECS 175 Lecture 16.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '细分雕塑家与网格拓扑医生 (3 关)' : 'Subdivision Sculptor & Topology Doctor'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(0.55); setGVal2(0.45); }
                    else if (m === 2) { setGVal1(220); setGVal2(220); }
                    else { setGVal1(40); setGVal2(2); }
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
                  min={mission === 1 ? 0.05 : mission === 2 ? 80 : 36}
                  max={mission === 1 ? 0.95 : mission === 2 ? 560 : 56}
                  step={mission === 1 ? 0.01 : 2}
                  value={gVal1}
                  onChange={(e) => setGVal1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 0.05 : mission === 2 ? 40 : 0}
                  max={mission === 1 ? 0.95 : mission === 2 ? 310 : 3}
                  step={mission === 1 ? 0.01 : mission === 2 ? 2 : 1}
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
