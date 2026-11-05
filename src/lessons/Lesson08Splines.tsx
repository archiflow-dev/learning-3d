import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson08Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Pt2 = [number, number];

function evalBezierSegment(P0: Pt2, P1: Pt2, P2: Pt2, P3: Pt2, t: number) {
  const u = 1 - t;
  const b0 = u * u * u;
  const b1 = 3 * u * u * t;
  const b2 = 3 * u * t * t;
  const b3 = t * t * t;
  const pos: Pt2 = [
    b0 * P0[0] + b1 * P1[0] + b2 * P2[0] + b3 * P3[0],
    b0 * P0[1] + b1 * P1[1] + b2 * P2[1] + b3 * P3[1]
  ];
  const d1: Pt2 = [
    3 * u * u * (P1[0] - P0[0]) + 6 * u * t * (P2[0] - P1[0]) + 3 * t * t * (P3[0] - P2[0]),
    3 * u * u * (P1[1] - P0[1]) + 6 * u * t * (P2[1] - P1[1]) + 3 * t * t * (P3[1] - P2[1])
  ];
  const d2: Pt2 = [
    6 * u * (P2[0] - 2 * P1[0] + P0[0]) + 6 * t * (P3[0] - 2 * P2[0] + P1[0]),
    6 * u * (P2[1] - 2 * P1[1] + P0[1]) + 6 * t * (P3[1] - 2 * P2[1] + P1[1])
  ];
  return { pos, d1, d2 };
}

function catmullRomToBezier(Pm1: Pt2, P0: Pt2, P1: Pt2, P2: Pt2): [Pt2, Pt2, Pt2, Pt2] {
  const B0 = P0;
  const B1: Pt2 = [P0[0] + (P1[0] - Pm1[0]) / 6, P0[1] + (P1[1] - Pm1[1]) / 6];
  const B2: Pt2 = [P1[0] - (P2[0] - P0[0]) / 6, P1[1] - (P2[1] - P0[1]) / 6];
  const B3 = P1;
  return [B0, B1, B2, B3];
}

function bSplineToBezier(Pm1: Pt2, P0: Pt2, P1: Pt2, P2: Pt2): [Pt2, Pt2, Pt2, Pt2] {
  const B0: Pt2 = [(Pm1[0] + 4 * P0[0] + P1[0]) / 6, (Pm1[1] + 4 * P0[1] + P1[1]) / 6];
  const B1: Pt2 = [(4 * P0[0] + 2 * P1[0]) / 6, (4 * P0[1] + 2 * P1[1]) / 6];
  const B2: Pt2 = [(2 * P0[0] + 4 * P1[0]) / 6, (2 * P0[1] + 4 * P1[1]) / 6];
  const B3: Pt2 = [(P0[0] + 4 * P1[0] + P2[0]) / 6, (P0[1] + 4 * P1[1] + P2[1]) / 6];
  return [B0, B1, B2, B3];
}

function drawCurvatureComb(
  ctx: CanvasRenderingContext2D,
  B0: Pt2,
  B1: Pt2,
  B2: Pt2,
  B3: Pt2,
  scale = 4800
) {
  const steps = 26;
  const tips: Pt2[] = [];
  ctx.strokeStyle = 'rgba(232, 121, 249, 0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const { pos, d1, d2 } = evalBezierSegment(B0, B1, B2, B3, t);
    const speed = Math.hypot(d1[0], d1[1]);
    if (speed < 1e-3) continue;
    const kappa = (d1[0] * d2[1] - d1[1] * d2[0]) / Math.pow(speed, 3);
    const nx = -d1[1] / speed;
    const ny = d1[0] / speed;
    const len = Math.max(-90, Math.min(90, kappa * scale));
    const tx = pos[0] + nx * len;
    const ty = pos[1] + ny * len;
    tips.push([tx, ty]);
    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  if (tips.length > 1) {
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    tips.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();
  }
}

export const Lesson08Splines: React.FC<Lesson08Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Visualizer 1 State: Joint Continuity Microscope
  const [jointMode, setJointMode] = useState<'C0' | 'G1' | 'C1' | 'C2'>('C2');
  const jointCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: Multi-Point Spline Arena
  const [arenaPts, setArenaPts] = useState<Pt2[]>([
    [70, 285],
    [165, 105],
    [280, 315],
    [390, 90],
    [505, 310],
    [615, 115],
    [700, 270]
  ]);
  const [showCR, setShowCR] = useState<boolean>(true);
  const [showBS, setShowBS] = useState<boolean>(true);
  const [showComb, setShowComb] = useState<boolean>(true);
  const [activeSeg, setActiveSeg] = useState<number>(1);
  const [dragIdx, setDragIdx] = useState<number>(-1);
  const arenaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(435);
  const [gVal2, setGVal2] = useState<number>(275);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Visualizer 1
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = jointCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const P0: Pt2 = [65, 270], P1: Pt2 = [130, 85], P2: Pt2 = [235, 130], P3: Pt2 = [310, 175];
    const dx = P3[0] - P2[0], dy = P3[1] - P2[1];
    let P4: Pt2 = [385, 220], P5: Pt2 = [465, 220];
    const P6: Pt2 = [545, 95];

    if (jointMode === 'C0') {
      P4 = [375, 85]; P5 = [475, 250];
    } else if (jointMode === 'G1') {
      P4 = [P3[0] + dx * 1.75, P3[1] + dy * 1.75]; P5 = [480, 260];
    } else if (jointMode === 'C1') {
      P4 = [P3[0] + dx, P3[1] + dy]; P5 = [485, 295];
    } else {
      P4 = [P3[0] + dx, P3[1] + dy];
      P5 = [2 * P4[0] - 2 * P2[0] + P1[0], 2 * P4[1] - 2 * P2[1] + P1[1]];
    }

    drawCurvatureComb(ctx, P0, P1, P2, P3, 5200);
    drawCurvatureComb(ctx, P3, P4, P5, P6, 5200);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]); ctx.lineTo(P4[0], P4[1]);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let s = 0; s <= 70; s++) {
      const p = evalBezierSegment(P0, P1, P2, P3, s / 70).pos;
      if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let s = 0; s <= 70; s++) {
      const p = evalBezierSegment(P3, P4, P5, P6, s / 70).pos;
      if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  }, [activeTab, jointMode]);

  // Draw Tab 2 Arena
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const canvas = arenaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    arenaPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
    ctx.stroke();

    for (let seg = 0; seg < 4; seg++) {
      const Pm1 = arenaPts[seg], P0 = arenaPts[seg + 1], P1 = arenaPts[seg + 2], P2 = arenaPts[seg + 3];
      const isHi = seg === activeSeg;
      if (showCR) {
        const [B0, B1, B2, B3] = catmullRomToBezier(Pm1, P0, P1, P2);
        ctx.strokeStyle = isHi ? '#fbbf24' : 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = isHi ? 4.5 : 2.5;
        ctx.beginPath();
        for (let s = 0; s <= 50; s++) {
          const p = evalBezierSegment(B0, B1, B2, B3, s / 50).pos;
          if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }
      if (showBS) {
        const [B0, B1, B2, B3] = bSplineToBezier(Pm1, P0, P1, P2);
        if (showComb) drawCurvatureComb(ctx, B0, B1, B2, B3, 4600);
        ctx.strokeStyle = isHi ? '#10b981' : 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = isHi ? 4.5 : 2.5;
        ctx.beginPath();
        for (let s = 0; s <= 50; s++) {
          const p = evalBezierSegment(B0, B1, B2, B3, s / 50).pos;
          if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }
    }

    arenaPts.forEach((p, idx) => {
      const inWin = idx >= activeSeg && idx <= activeSeg + 3;
      ctx.fillStyle = inWin ? '#22d3ee' : '#64748b';
      ctx.beginPath();
      ctx.arc(p[0], p[1], inWin ? 7.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [activeTab, arenaPts, showCR, showBS, showComb, activeSeg]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && Math.hypot(gVal1 - 400, gVal2 - 140) < 18) ||
    (mission === 2 && Math.abs(gVal1 - 140) < 18 && Math.abs(gVal2 - 140) < 18) ||
    (mission === 3 && Math.hypot(gVal1 - 320, gVal2 - 80) < 22);

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
      const P0: Pt2 = [80, 310], P1: Pt2 = [150, 120], P2: Pt2 = [240, 260], P3: Pt2 = [320, 200];
      const P4: Pt2 = [gVal1, gVal2], P5: Pt2 = [500, 110], P6: Pt2 = [575, 280];
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(400 - 14, 140 - 14, 28, 28);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let s = 0; s <= 50; s++) {
        const p = evalBezierSegment(P0, P1, P2, P3, s / 50).pos;
        if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();

      ctx.strokeStyle = gPassed ? '#10b981' : '#f43f5e';
      ctx.beginPath();
      for (let s = 0; s <= 50; s++) {
        const p = evalBezierSegment(P3, P4, P5, P6, s / 50).pos;
        if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    } else if (mission === 2) {
      const pts: Pt2[] = [[80, 280], [200, 140], [320, gVal1], [440, gVal2], [560, 280]];
      ctx.strokeStyle = '#10b981';
      ctx.beginPath(); ctx.arc(320, 140, 18, 0, Math.PI * 2); ctx.stroke();
      for (let seg = 0; seg < 2; seg++) {
        const [B0, B1, B2, B3] = catmullRomToBezier(pts[seg], pts[seg + 1], pts[seg + 2], pts[seg + 3]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let s = 0; s <= 50; s++) {
          const p = evalBezierSegment(B0, B1, B2, B3, s / 50).pos;
          if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      }
    } else {
      const P1: Pt2 = [180, 260], P2: Pt2 = [gVal1, gVal2], P3: Pt2 = [460, 260], P4: Pt2 = [560, 310];
      ctx.strokeStyle = '#10b981';
      ctx.beginPath(); ctx.arc(320, 140, 18, 0, Math.PI * 2); ctx.stroke();
      const [B0, B1, B2, B3] = bSplineToBezier(P1, P2, P3, P4);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let s = 0; s <= 50; s++) {
        const p = evalBezierSegment(B0, B1, B2, B3, s / 50).pos;
        if (s === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    }
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
              <span>Stage 2 • Lesson 08 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-08.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L08: 样条曲线进阶：连续性 (Cⁿ/Gⁿ)、Catmull-Rom 与 B-Splines'
                : 'L08: Splines, Continuity (Cⁿ / Gⁿ), Catmull-Rom & Uniform Cubic B-Splines'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Continuity & Curvature Comb Physics • MIT 6.837 Lec 03 (Justin Solomon) • UC Davis Lec 13
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
            {isZh ? '1. Cⁿ/Gⁿ 连续性与曲率梳显微镜' : '1. Cⁿ/Gⁿ Continuity & Curvature Microscope'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 多点样条竞技场 (Catmull-Rom vs B-Spline)' : '2. Multi-Point Spline Arena'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. MIT 6.837 Lec 03 视频与样条全对比表' : '3. MIT 6.837 Lec 03 & Master Table'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：磁悬浮过山车连续性工程师' : '4. 3-Mission Game: Maglev Coaster Engineer'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '交互透视镜：两段拼接点 (P₃) 的 C⁰ → G¹ → C¹ → C² 连续性与曲率梳显微镜'
                : 'Interactive Visualizer: Joint Continuity & Curvature Comb Microscope'}
            </h2>
            <div className="flex gap-1.5">
              {(['C0', 'G1', 'C1', 'C2'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setJointMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    jointMode === m ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <canvas ref={jointCanvasRef} width={600} height={330} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas
            ref={arenaCanvasRef}
            width={740}
            height={400}
            onPointerDown={(e) => {
              const c = arenaCanvasRef.current;
              if (!c) return;
              const rect = c.getBoundingClientRect();
              const mx = (e.clientX - rect.left) * (c.width / rect.width);
              const my = (e.clientY - rect.top) * (c.height / rect.height);
              arenaPts.forEach((p, idx) => {
                if (Math.hypot(p[0] - mx, p[1] - my) < 22) setDragIdx(idx);
              });
            }}
            onPointerMove={(e) => {
              if (dragIdx < 0) return;
              const c = arenaCanvasRef.current;
              if (!c) return;
              const rect = c.getBoundingClientRect();
              const mx = Math.max(25, Math.min(c.width - 25, (e.clientX - rect.left) * (c.width / rect.width)));
              const my = Math.max(25, Math.min(c.height - 25, (e.clientY - rect.top) * (c.height / rect.height)));
              setArenaPts((prev) => {
                const next = [...prev];
                next[dragIdx] = [mx, my];
                return next;
              });
            }}
            onPointerUp={() => setDragIdx(-1)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-pointer"
          />
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <label className="flex items-center gap-1.5 text-amber-300 font-bold">
              <input type="checkbox" checked={showCR} onChange={(e) => setShowCR(e.target.checked)} />
              <span>Catmull-Rom (C¹)</span>
            </label>
            <label className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <input type="checkbox" checked={showBS} onChange={(e) => setShowBS(e.target.checked)} />
              <span>Uniform Cubic B-Spline (C²)</span>
            </label>
            <label className="flex items-center gap-1.5 text-fuchsia-300 font-bold">
              <input type="checkbox" checked={showComb} onChange={(e) => setShowComb(e.target.checked)} />
              <span>Curvature Comb κ(t)</span>
            </label>
            <div className="flex items-center gap-2 ml-auto">
              <span>Window Seg #{activeSeg}</span>
              <input type="range" min={0} max={3} step={1} value={activeSeg} onChange={(e) => setActiveSeg(Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            MIT 6.837 Lecture 03 (Curves II: Splines & B-Splines)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可观看内嵌的 MIT 6.837 Lecture 03 视频播放器与三次样条家族终极对比表。'
              : 'Open the standalone HTML page above for the embedded MIT 6.837 Lecture 03 video player and the Master Cubic Splines Comparison Table.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '磁悬浮过山车连续性工程师 (3 关)' : 'Maglev Coaster Continuity Engineer'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(435); setGVal2(275); }
                    else if (m === 2) { setGVal1(260); setGVal2(290); }
                    else { setGVal1(320); setGVal2(220); }
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
              <canvas ref={gameCanvasRef} width={600} height={350} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-amber-300"><span>Param 1</span><span>{gVal1}</span></div>
                <input type="range" min={80} max={520} value={gVal1} onChange={(e) => setGVal1(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2}</span></div>
                <input type="range" min={50} max={340} value={gVal2} onChange={(e) => setGVal2(Number(e.target.value))} className="w-full" />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Adjust sliders to satisfy spline continuity'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
