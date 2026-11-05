import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson09Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Vec3 = [number, number, number];

function bernstein(t: number): [number, number, number, number] {
  const s = 1 - t;
  return [s * s * s, 3 * s * s * t, 3 * s * t * t, t * t * t];
}

function dBernstein(t: number): [number, number, number, number] {
  const s = 1 - t;
  return [
    -3 * s * s,
    3 * s * s - 6 * s * t,
    6 * s * t - 3 * t * t,
    3 * t * t
  ];
}

function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function norm3(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function evalPatch(grid: Vec3[][], u: number, v: number, flipOrder = false) {
  const Bu = bernstein(u), Bv = bernstein(v);
  const dBu = dBernstein(u), dBv = dBernstein(v);
  const pos: Vec3 = [0, 0, 0];
  const du: Vec3 = [0, 0, 0];
  const dv: Vec3 = [0, 0, 0];
  const Qv: Vec3[] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const p = grid[i][j];
      const w = Bu[i] * Bv[j];
      const wu = dBu[i] * Bv[j];
      const wv = Bu[i] * dBv[j];
      pos[0] += w * p[0]; pos[1] += w * p[1]; pos[2] += w * p[2];
      du[0] += wu * p[0]; du[1] += wu * p[1]; du[2] += wu * p[2];
      dv[0] += wv * p[0]; dv[1] += wv * p[1]; dv[2] += wv * p[2];
      Qv[i][0] += Bv[j] * p[0];
      Qv[i][1] += Bv[j] * p[1];
      Qv[i][2] += Bv[j] * p[2];
    }
  }
  const rawN = flipOrder ? cross3(dv, du) : cross3(du, dv);
  const N = norm3(rawN);
  return { pos, du, dv, N, Qv };
}

function makePresetGrid(preset: 'dome' | 'saddle' | 'wave' | 'rim'): Vec3[][] {
  const g: Vec3[][] = [];
  for (let i = 0; i < 4; i++) {
    g[i] = [];
    for (let j = 0; j < 4; j++) {
      const x = (i - 1.5) * 1.15;
      const z = (j - 1.5) * 1.15;
      let y = 0;
      if (preset === 'dome') {
        y = (i === 1 || i === 2) && (j === 1 || j === 2) ? 1.55 : -0.25;
      } else if (preset === 'saddle') {
        y = ((i - 1.5) * (i - 1.5) - (j - 1.5) * (j - 1.5)) * 0.48;
      } else if (preset === 'wave') {
        y = Math.sin(i * 1.4) * 0.85 + Math.cos(j * 1.4) * 0.65;
      } else {
        if (i === 0) {
          g[i][j] = [0, 1.4, 0];
          continue;
        }
        const r = i * 0.68;
        const ang = (j / 3) * Math.PI * 0.85 - Math.PI * 0.425;
        g[i][j] = [Math.sin(ang) * r, 1.4 - i * 0.55, Math.cos(ang) * r - 0.5];
        continue;
      }
      g[i][j] = [x, y, z];
    }
  }
  return g;
}

function project3D(p: Vec3, W: number, H: number, yaw = 0.62, pitch = 0.45, scale = 96): [number, number, number] {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = p[0] * cy - p[2] * sy;
  const z1 = p[0] * sy + p[2] * cy;
  const y2 = p[1] * cp - z1 * sp;
  const z2 = p[1] * sp + z1 * cp;
  const persp = 5.5 / (5.5 + z2 * 0.35);
  return [W * 0.5 + x1 * scale * persp, H * 0.54 - y2 * scale * persp, z2];
}

export const Lesson09Patches: React.FC<Lesson09Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'teapot' | 'game'>('concepts');

  // Visualizer 1 & 2 state
  const [uVal, setUVal] = useState<number>(0.45);
  const [vVal, setVVal] = useState<number>(0.6);
  const [flipCross, setFlipCross] = useState<boolean>(false);
  const [rimCollapse, setRimCollapse] = useState<boolean>(false);
  const tpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const normCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 state
  const [grid, setGrid] = useState<Vec3[][]>(() => makePresetGrid('dome'));
  const [selI, setSelI] = useState<number>(1);
  const [selJ, setSelJ] = useState<number>(1);
  const [tess, setTess] = useState<number>(12);
  const [showHedgehog, setShowHedgehog] = useState<boolean>(true);
  const labCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game state
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gParam1, setGParam1] = useState<number>(0.2);
  const [gParam2, setGParam2] = useState<number>(-0.8);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Visualizers
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const c1 = tpCanvasRef.current;
    if (c1) {
      const ctx = c1.getContext('2d');
      if (ctx) {
        const W = c1.width, H = c1.height;
        ctx.clearRect(0, 0, W, H);
        const g = makePresetGrid('dome');
        const ev = evalPatch(g, uVal, vVal, false);

        // Wireframe
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
        ctx.lineWidth = 1;
        for (let s = 0; s <= 8; s++) {
          const t = s / 8;
          ctx.beginPath();
          for (let k = 0; k <= 20; k++) {
            const pt = evalPatch(g, k / 20, t).pos;
            const [sx, sy] = project3D(pt, W, H);
            if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }

        // 4 v-curves
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let k = 0; k <= 24; k++) {
            const Bv = bernstein(k / 24);
            const pt: Vec3 = [0, 0, 0];
            for (let j = 0; j < 4; j++) {
              pt[0] += Bv[j] * g[i][j][0];
              pt[1] += Bv[j] * g[i][j][1];
              pt[2] += Bv[j] * g[i][j][2];
            }
            const [sx, sy] = project3D(pt, W, H);
            if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }

        // Q_i(v) points
        ev.Qv.forEach((q) => {
          const [sx, sy] = project3D(q, W, H);
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
        });

        // Final u-curve
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let k = 0; k <= 30; k++) {
          const pt = evalPatch(g, k / 30, vVal).pos;
          const [sx, sy] = project3D(pt, W, H);
          if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        const [px, py] = project3D(ev.pos, W, H);
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      }
    }

    const c2 = normCanvasRef.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const W = c2.width, H = c2.height;
        ctx.clearRect(0, 0, W, H);
        const g = makePresetGrid(rimCollapse ? 'rim' : 'saddle');
        const uUse = rimCollapse ? 0.0 : uVal;
        const ev = evalPatch(g, uUse, vVal, flipCross);

        ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
        for (let s = 0; s <= 10; s++) {
          const t = s / 10;
          ctx.beginPath();
          for (let k = 0; k <= 20; k++) {
            const pt = evalPatch(g, k / 20, t).pos;
            const [sx, sy] = project3D(pt, W, H);
            if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }

        const [ox, oy] = project3D(ev.pos, W, H);
        const [ux, uy] = project3D(
          [ev.pos[0] + ev.du[0] * 0.35, ev.pos[1] + ev.du[1] * 0.35, ev.pos[2] + ev.du[2] * 0.35],
          W, H
        );
        const [vx, vy] = project3D(
          [ev.pos[0] + ev.dv[0] * 0.35, ev.pos[1] + ev.dv[1] * 0.35, ev.pos[2] + ev.dv[2] * 0.35],
          W, H
        );
        const [nx, ny] = project3D(
          [ev.pos[0] + ev.N[0] * 1.1, ev.pos[1] + ev.N[1] * 1.1, ev.pos[2] + ev.N[2] * 1.1],
          W, H
        );

        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ux, uy); ctx.stroke();
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(vx, vy); ctx.stroke();
        ctx.strokeStyle = '#10b981';
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(nx, ny); ctx.stroke();
      }
    }
  }, [activeTab, uVal, vVal, flipCross, rimCollapse]);

  // Draw Tab 2 Lab
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const canvas = labCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    for (let iu = 0; iu < tess; iu++) {
      for (let iv = 0; iv < tess; iv++) {
        const u0 = iu / tess, u1 = (iu + 1) / tess;
        const v0 = iv / tess, v1 = (iv + 1) / tess;
        const p00 = evalPatch(grid, u0, v0);
        const p10 = evalPatch(grid, u1, v0);
        const p11 = evalPatch(grid, u1, v1);
        const p01 = evalPatch(grid, u0, v1);
        const s00 = project3D(p00.pos, W, H);
        const s10 = project3D(p10.pos, W, H);
        const s11 = project3D(p11.pos, W, H);
        const s01 = project3D(p01.pos, W, H);

        ctx.fillStyle = 'rgba(30, 64, 175, 0.35)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.beginPath();
        ctx.moveTo(s00[0], s00[1]);
        ctx.lineTo(s10[0], s10[1]);
        ctx.lineTo(s11[0], s11[1]);
        ctx.lineTo(s01[0], s01[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (showHedgehog && iu % 2 === 0 && iv % 2 === 0) {
          const tip = project3D(
            [p00.pos[0] + p00.N[0] * 0.45, p00.pos[1] + p00.N[1] * 0.45, p00.pos[2] + p00.N[2] * 0.45],
            W, H
          );
          ctx.strokeStyle = '#10b981';
          ctx.beginPath(); ctx.moveTo(s00[0], s00[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const [sx, sy] = project3D(grid[i][j], W, H);
        const isSel = i === selI && j === selJ;
        ctx.fillStyle = isSel ? '#fbbf24' : '#38bdf8';
        ctx.beginPath(); ctx.arc(sx, sy, isSel ? 8 : 5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }, [activeTab, grid, selI, selJ, tess, showHedgehog]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && Math.abs(gParam1 - 1.55) < 0.22 && Math.abs(gParam2 - 1.55) < 0.22) ||
    (mission === 2 && Math.abs(gParam1 - 0.65) < 0.2 && Math.abs(gParam2 - 0.65) < 0.2) ||
    (mission === 3 && Math.abs(gParam1 - 0.5) < 0.08 && Math.abs(gParam2 - 0.5) < 0.08);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const g = makePresetGrid('dome');
    if (mission === 1) {
      g[1][1][1] = gParam1; g[1][2][1] = gParam1;
      g[2][1][1] = gParam2; g[2][2][1] = gParam2;
    }

    ctx.strokeStyle = gPassed ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 2;
    for (let s = 0; s <= 8; s++) {
      const t = s / 8;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const pt = evalPatch(g, k / 20, t).pos;
        const [sx, sy] = project3D(pt, W, H);
        if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  }, [activeTab, mission, gParam1, gParam2, gPassed]);

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
              <span>Stage 2 • Lesson 09 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-09.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L09: 3D 参数曲面：张量积曲面 (Tensor Product Patches)、偏导法线与 Utah 茶壶'
                : 'L09: Tensor Product Bicubic Bézier Surfaces, Partial Derivatives & The Utah Teapot'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Tensor Product & Partial Derivative Intuition • UC Davis Lec 13 (Kenneth Joy) • MIT 6.837 Lec 03
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
            {isZh ? '1. 移动控制点曲线与 ∂S/∂u × ∂S/∂v 法线锻造' : '1. Moving Control Curves & Partial Derivative Normals'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 4×4 双三次曲面片捏合工坊与刺猬法线场' : '2. 4×4 Bicubic Patch Sculpting Studio'}
          </button>
          <button
            onClick={() => setActiveTab('teapot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'teapot' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. Utah Teapot 解剖室与 UC Davis Lec 13' : '3. Utah Teapot Dissector & UC Davis Lec 13'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：犹他茶壶主雕塑师' : '4. 3-Mission Game: Utah Teapot Master Sculptor'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-300">
                {isZh ? '交互透视镜 1：两次 1D 扫掠合成 2D 曲面 S(u,v)' : 'Visualizer 1: Two-Pass 1D Sweep to 2D Surface'}
              </h3>
              <canvas ref={tpCanvasRef} width={520} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-300">
                {isZh ? '交互透视镜 2：等参切向量 ∂S/∂u × ∂S/∂v 与奇异点退化' : 'Visualizer 2: Tangent Cross Product & Rim Singularity'}
              </h3>
              <canvas ref={normCanvasRef} width={520} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-amber-300 font-bold mb-1"><span>u</span><span>{uVal.toFixed(2)}</span></div>
              <input type="range" min={0} max={1} step={0.01} value={uVal} onChange={(e) => setUVal(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-cyan-300 font-bold mb-1"><span>v</span><span>{vVal.toFixed(2)}</span></div>
              <input type="range" min={0} max={1} step={0.01} value={vVal} onChange={(e) => setVVal(Number(e.target.value))} className="w-full" />
            </div>
            <button
              onClick={() => setFlipCross((prev) => !prev)}
              className="px-3 py-2 rounded-xl font-bold bg-slate-800 text-amber-300 border border-amber-500/40"
            >
              {flipCross ? '∂S/∂v × ∂S/∂u (-N)' : '∂S/∂u × ∂S/∂v (+N)'}
            </button>
            <button
              onClick={() => setRimCollapse((prev) => !prev)}
              className="px-3 py-2 rounded-xl font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40"
            >
              {rimCollapse ? 'Rim Collapsed (∂S/∂v=0)' : 'Test Teapot Rim Collapse'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <canvas ref={labCanvasRef} width={680} height={420} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-4 space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                {[0, 1, 2, 3].map((i) =>
                  [0, 1, 2, 3].map((j) => (
                    <button
                      key={`${i}-${j}`}
                      onClick={() => { setSelI(i); setSelJ(j); }}
                      className={`py-1.5 rounded font-mono font-bold ${
                        selI === i && selJ === j ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      P{i}{j}
                    </button>
                  ))
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>Height Y of P[{selI},{selJ}]</span>
                  <span>{grid[selI][selJ][1].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={-2}
                  max={2.4}
                  step={0.05}
                  value={grid[selI][selJ][1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setGrid((prev) => {
                      const next = prev.map((row) => row.map((cell) => [...cell] as Vec3));
                      next[selI][selJ][1] = val;
                      return next;
                    });
                  }}
                  className="w-full"
                />

                <div className="flex justify-between text-cyan-300 font-bold">
                  <span>Tessellation N×N</span>
                  <span>{tess}×{tess}</span>
                </div>
                <input type="range" min={4} max={20} step={2} value={tess} onChange={(e) => setTess(Number(e.target.value))} className="w-full" />

                <label className="flex items-center gap-2 text-emerald-300 font-bold">
                  <input type="checkbox" checked={showHedgehog} onChange={(e) => setShowHedgehog(e.target.checked)} />
                  <span>Show Normal Hedgehog Field</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'teapot' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            The 1975 Utah Teapot (Martin Newell) & UC Davis ECS 175 Lecture 13
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可体验完整的犹他茶壶 4 大组件交互爆炸视图、跨曲面片 G¹ 镜像手柄连续性以及内嵌的课程视频。'
              : 'Open the standalone HTML Artifact above for the interactive Utah Teapot 4-part Exploded View, cross-patch G¹ continuity inspector, and embedded lectures.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '犹他茶壶主雕塑师 (3 关)' : 'Utah Teapot Master Sculptor (3 Missions)'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGParam1(0.2); setGParam2(-0.8); }
                    else if (m === 2) { setGParam1(-0.8); setGParam2(1.4); }
                    else { setGParam1(0.15); setGParam2(0.8); }
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
                <div className="flex justify-between text-amber-300"><span>Param 1</span><span>{gParam1.toFixed(2)}</span></div>
                <input
                  type="range"
                  min={mission === 3 ? 0 : -1.5}
                  max={mission === 3 ? 1 : 2.2}
                  step={0.02}
                  value={gParam1}
                  onChange={(e) => setGParam1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gParam2.toFixed(2)}</span></div>
                <input
                  type="range"
                  min={mission === 3 ? 0 : -1.5}
                  max={mission === 3 ? 1 : 2.2}
                  step={0.02}
                  value={gParam2}
                  onChange={(e) => setGParam2(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Tune parameters to match target surface / seam / normal'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
