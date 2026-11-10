import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson13Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Pt2 = [number, number];

function signedArea2D(p1: Pt2, p2: Pt2, p3: Pt2) {
  return 0.5 * ((p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]));
}

export const Lesson13BarycentricCSG: React.FC<Lesson13Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Tab 1 State: Normal Matrix (M vs (M^-1)^T)
  const [sx, setSx] = useState<number>(2.2);
  const [sy, setSy] = useState<number>(0.55);
  const [sh, setSh] = useState<number>(0.3);
  const normCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: Barycentric + CSG
  const [baryP, setBaryP] = useState<Pt2>([270, 210]);
  const [csgOp, setCsgOp] = useState<'union' | 'intersect' | 'diff'>('diff');
  const [csgBx, setCsgBx] = useState<number>(255);
  const baryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const csgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(0.15);
  const [gVal2, setGVal2] = useState<number>(0.55);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Normal Matrix Visualizer
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const c = normCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.54, R = 80;
    const applyM = (x: number, y: number): Pt2 => [sx * x + sh * y, sy * y];
    const det = sx * sy;
    const applyInvT = (nx: number, ny: number): Pt2 => [sy * nx / det, (-sh * nx + sx * ny) / det];

    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const ang = (i / 72) * Math.PI * 2;
      const [tx, ty] = applyM(Math.cos(ang) * R, Math.sin(ang) * R);
      if (i === 0) ctx.moveTo(cx + tx, cy - ty);
      else ctx.lineTo(cx + tx, cy - ty);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const theta = Math.PI / 4;
    const pDef = applyM(Math.cos(theta) * R, Math.sin(theta) * R);
    const tDef = applyM(-Math.sin(theta), Math.cos(theta));
    const nWrong = applyM(Math.cos(theta), Math.sin(theta));
    const nRight = applyInvT(Math.cos(theta), Math.sin(theta));

    const norm2 = (v: Pt2): Pt2 => {
      const l = Math.hypot(v[0], v[1]) || 1;
      return [v[0] / l, v[1] / l];
    };
    const tHat = norm2(tDef);
    const nwHat = norm2(nWrong);
    const nrHat = norm2(nRight);
    const px = cx + pDef[0], py = cy - pDef[1];

    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px - tHat[0] * 90, py + tHat[1] * 90); ctx.lineTo(px + tHat[0] * 90, py - tHat[1] * 90); ctx.stroke();

    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nwHat[0] * 80, py - nwHat[1] * 80); ctx.stroke();

    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nrHat[0] * 80, py - nrHat[1] * 80); ctx.stroke();
  }, [activeTab, sx, sy, sh]);

  // Draw Tab 2 Labs
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const bc = baryCanvasRef.current;
    if (bc) {
      const ctx = bc.getContext('2d');
      if (ctx) {
        const W = bc.width, H = bc.height;
        ctx.clearRect(0, 0, W, H);
        const A: Pt2 = [250, 45], B: Pt2 = [80, 290], C: Pt2 = [420, 290];
        const total = signedArea2D(A, B, C);
        const alpha = signedArea2D(baryP, B, C) / total;
        const beta = signedArea2D(A, baryP, C) / total;
        const gamma = 1 - alpha - beta;

        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.stroke();

        const r = Math.max(0, Math.min(255, Math.round(alpha * 244 + beta * 16 + gamma * 56)));
        const g = Math.max(0, Math.min(255, Math.round(alpha * 63 + beta * 185 + gamma * 189)));
        const b = Math.max(0, Math.min(255, Math.round(alpha * 94 + beta * 129 + gamma * 248)));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath(); ctx.arc(baryP[0], baryP[1], 9, 0, Math.PI * 2); ctx.fill();
      }
    }

    const cc = csgCanvasRef.current;
    if (cc) {
      const ctx = cc.getContext('2d');
      if (ctx) {
        const W = cc.width, H = cc.height;
        ctx.clearRect(0, 0, W, H);
        const ax = 190, ay = 140, ar = 75;
        const by = 140, br = 70;
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath(); ctx.arc(csgBx, by, br, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(ax - ar, 140); ctx.lineTo(csgOp === 'diff' ? Math.min(ax + ar, csgBx - br) : ax + ar, 140); ctx.stroke();
      }
    }
  }, [activeTab, baryP, csgOp, csgBx]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && Math.abs(gVal1 - 0.33) <= 0.03 && Math.abs(gVal2 - 0.33) <= 0.03) ||
    (mission === 2 && Math.abs(gVal1 - 0.5) <= 0.05 && Math.abs(gVal2 - 2.0) <= 0.05) ||
    (mission === 3 && gVal1 === 260 && gVal2 === 60);

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
    ctx.fillText(`Mission ${mission} • Param1=${gVal1.toFixed(2)} | Param2=${gVal2.toFixed(2)}`, 75, 145);
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
              <span>Stage 3 • Lesson 13 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-13.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L13: 重心坐标 (Barycentric Coordinates)、Möller–Trumbore 三角形求交与 CSG'
                : 'L13: Barycentric Coordinates, Möller–Trumbore, Inverse-Transpose Normals & CSG'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Determinant Volumes &amp; Covector Dual Space • MIT 6.837 Lec 10 (Justin Solomon)
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
            {isZh ? '1. 面积比重心坐标、克拉默求交与 (M⁻¹)ᵀ 法线' : '1. Area Ratios, Cramer & (M⁻¹)ᵀ Normals'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 重心坐标插值 + CSG 射线布尔实验室' : '2. Barycentric + CSG Boolean Lab'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. MIT 6.837 Lec 10 与 Möller–Trumbore 代码' : '3. MIT 6.837 Lec 10 & MT Kernel'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：重心、法线与 CSG 雕刻师' : '4. 3-Mission Game: Barycentric & CSG Sculptor'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={normCanvasRef} width={600} height={310} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-amber-300 font-bold"><span>Scale s_x</span><span>{sx.toFixed(2)}</span></div>
              <input type="range" min={0.5} max={2.6} step={0.05} value={sx} onChange={(e) => setSx(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-cyan-300 font-bold"><span>Scale s_y</span><span>{sy.toFixed(2)}</span></div>
              <input type="range" min={0.35} max={2.0} step={0.05} value={sy} onChange={(e) => setSy(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-purple-300 font-bold"><span>Shear k_xy</span><span>{sh.toFixed(2)}</span></div>
              <input type="range" min={-1} max={1} step={0.05} value={sh} onChange={(e) => setSh(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white">Barycentric Area Interpolation</h3>
            <canvas
              ref={baryCanvasRef}
              width={500}
              height={320}
              onPointerDown={(e) => {
                const c = baryCanvasRef.current;
                if (!c) return;
                const r = c.getBoundingClientRect();
                setBaryP([
                  ((e.clientX - r.left) / r.width) * c.width,
                  ((e.clientY - r.top) / r.height) * c.height
                ]);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-pointer"
            />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">CSG 1D Ray Interval Booleans</h3>
              <div className="flex gap-1.5 text-xs">
                {(['union', 'intersect', 'diff'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => setCsgOp(op)}
                    className={`px-2.5 py-1 rounded font-bold ${
                      csgOp === op ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {op.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <canvas ref={csgCanvasRef} width={500} height={260} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            <input type="range" min={180} max={360} value={csgBx} onChange={(e) => setCsgBx(Number(e.target.value))} className="w-full" />
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            MIT 6.837 Lecture 10: Ray Casting II (Barycentric Coordinates, Möller–Trumbore &amp; CSG)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可观看内嵌的 MIT 6.837 Lecture 10 视频与完整的 Möller–Trumbore 快速三角形求交核代码。'
              : 'Open the standalone HTML page above for the embedded MIT 6.837 Lecture 10 video and full Möller–Trumbore GLSL/C++ reference.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '重心插值、法线修复与 CSG 透镜雕刻师 (3 关)' : 'Barycentric, Normal Fix & CSG Sculptor'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(0.15); setGVal2(0.55); }
                    else if (m === 2) { setGVal1(2.0); setGVal2(0.5); }
                    else { setGVal1(340); setGVal2(50); }
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
                <div className="flex justify-between text-amber-300"><span>Param 1</span><span>{gVal1.toFixed(2)}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 0.05 : mission === 2 ? 0.2 : 180}
                  max={mission === 1 ? 0.85 : mission === 2 ? 2.5 : 360}
                  step={mission === 1 ? 0.01 : mission === 2 ? 0.1 : 5}
                  value={gVal1}
                  onChange={(e) => setGVal1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2.toFixed(2)}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 0.05 : mission === 2 ? 0.2 : 30}
                  max={mission === 1 ? 0.85 : mission === 2 ? 2.5 : 95}
                  step={mission === 1 ? 0.01 : mission === 2 ? 0.1 : 5}
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
