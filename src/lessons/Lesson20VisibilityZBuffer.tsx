import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson20Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type CyclicMode = 'zbuffer' | 'ABC' | 'BCA' | 'CAB' | 'CBA';
type GBufferView = 'lit' | 'depth' | 'normal' | 'overdraw';

const PINWHEEL_TRIS: Record<
  'A' | 'B' | 'C',
  { col: [number, number, number]; v: { x: number; y: number; z: number }[] }
> = {
  A: {
    col: [239, 68, 68],
    v: [
      { x: 145, y: 70, z: 5.2 },
      { x: 375, y: 75, z: 1.8 },
      { x: 315, y: 140, z: 2.2 }
    ]
  },
  B: {
    col: [16, 185, 129],
    v: [
      { x: 355, y: 55, z: 5.2 },
      { x: 260, y: 265, z: 1.8 },
      { x: 225, y: 190, z: 2.2 }
    ]
  },
  C: {
    col: [59, 130, 246],
    v: [
      { x: 295, y: 255, z: 5.2 },
      { x: 130, y: 95, z: 1.8 },
      { x: 220, y: 115, z: 2.2 }
    ]
  }
};

function barycentricZ(
  tri: { v: { x: number; y: number; z: number }[] },
  px: number,
  py: number
): number | null {
  const [v0, v1, v2] = tri.v;
  const det = (v1.y - v2.y) * (v0.x - v2.x) + (v2.x - v1.x) * (v0.y - v2.y);
  const l0 = ((v1.y - v2.y) * (px - v2.x) + (v2.x - v1.x) * (py - v2.y)) / det;
  const l1 = ((v2.y - v0.y) * (px - v2.x) + (v0.x - v2.x) * (py - v2.y)) / det;
  const l2 = 1.0 - l0 - l1;
  if (l0 >= 0 && l1 >= 0 && l2 >= 0) {
    return l0 * v0.z + l1 * v1.z + l2 * v2.z;
  }
  return null;
}

export const Lesson20VisibilityZBuffer: React.FC<Lesson20Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1A state: Cyclic Overlap vs Z-Buffer
  const [cyclicMode, setCyclicMode] = useState<CyclicMode>('zbuffer');
  const cyclicCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 1B state: BSP Camera X
  const [bspCamX, setBspCamX] = useState<number>(130);
  const bspCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 state: Early-Z & Deferred G-Buffer
  const [gbView, setGbView] = useState<GBufferView>('lit');
  const [drawOrder, setDrawOrder] = useState<'f2b' | 'b2f'>('f2b');
  const [earlyZ, setEarlyZ] = useState<boolean>(true);
  const [arch, setArch] = useState<'forward' | 'deferred'>('deferred');
  const [telemetry, setTelemetry] = useState<{ overdraw: number; savedPct: number; lights: number }>({
    overdraw: 1.0,
    savedPct: 68.5,
    lights: 32.0
  });
  const pipelineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Mini-Game state
  const [m1Ans, setM1Ans] = useState<string>('none');
  const [m2Ans, setM2Ans] = useState<string>('b2f');
  const [m3Ans, setM3Ans] = useState<string>('wrong1');

  const m1Passed = m1Ans === 'zbuf';
  const m2Passed = m2Ans === 'f2b_earlyz';
  const m3Passed = m3Ans === 'correct';

  // Draw Tab 1A: Cyclic Overlap vs Z-Buffer
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = cyclicCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const step = 2;
    const order = (cyclicMode === 'zbuffer' ? ['A', 'B', 'C'] : cyclicMode.split('')) as (
      | 'A'
      | 'B'
      | 'C'
    )[];

    for (let py = 35; py < H - 20; py += step) {
      for (let px = 100; px < W - 100; px += step) {
        let bestZ = 1e9;
        let winCol: [number, number, number] | null = null;
        for (const k of order) {
          const tri = PINWHEEL_TRIS[k];
          const z = barycentricZ(tri, px, py);
          if (z !== null) {
            if (cyclicMode === 'zbuffer') {
              if (z < bestZ) {
                bestZ = z;
                winCol = tri.col;
              }
            } else {
              winCol = tri.col;
            }
          }
        }
        if (winCol) {
          ctx.fillStyle = `rgb(${winCol[0]}, ${winCol[1]}, ${winCol[2]})`;
          ctx.fillRect(px, py, step, step);
        }
      }
    }

    Object.values(PINWHEEL_TRIS).forEach(tri => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      tri.v.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();
    });
  }, [activeTab, cyclicMode]);

  // Draw Tab 1B: BSP Tree
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = bspCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const rootX = 260;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.55)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(rootX, 15);
    ctx.lineTo(rootX, H - 15);
    ctx.stroke();
    ctx.setLineDash([]);

    const walls = [
      { id: 'W0 (Root)', x0: 260, y0: 70, x1: 260, y1: 170, col: '#818cf8' },
      { id: 'W1 (H⁻ Left)', x0: 85, y0: 60, x1: 200, y1: 135, col: '#38bdf8' },
      { id: 'W2 (H⁺ Right)', x0: 320, y0: 135, x1: 440, y1: 65, col: '#34d399' }
    ];
    walls.forEach(w => {
      ctx.strokeStyle = w.col;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w.x0, w.y0);
      ctx.lineTo(w.x1, w.y1);
      ctx.stroke();
      ctx.fillStyle = w.col;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(w.id, (w.x0 + w.x1) * 0.5 - 30, (w.y0 + w.y1) * 0.5 - 12);
    });

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bspCamX, 195, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, bspCamX]);

  // Draw Tab 2: Early-Z & Deferred G-Buffer
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = pipelineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const spheres = [
      { cx: 225, cy: 185, r: 88, z: 0.22, col: [56, 189, 248] },
      { cx: 265, cy: 165, r: 92, z: 0.45, col: [16, 185, 129] },
      { cx: 305, cy: 145, r: 98, z: 0.68, col: [251, 191, 36] },
      { cx: 345, cy: 125, r: 104, z: 0.88, col: [244, 63, 94] }
    ];

    const ordered = drawOrder === 'f2b' ? spheres.slice() : spheres.slice().reverse();
    const step = 3;
    let totalActive = 0;
    let totalShaded = 0;
    let totalRejected = 0;

    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        let zBuf = 1.0;
        let finalCol = [15, 23, 42];
        let finalNorm = [0, 0, 1];
        let shadedHere = 0;
        let coveredHere = false;

        for (const sp of ordered) {
          const dx = (px - sp.cx) / sp.r;
          const dy = (py - sp.cy) / sp.r;
          const r2 = dx * dx + dy * dy;
          if (r2 <= 1.0) {
            coveredHere = true;
            const nz = Math.sqrt(1.0 - r2);
            const fragZ = sp.z - nz * 0.08;
            if (earlyZ) {
              if (fragZ < zBuf) {
                zBuf = fragZ;
                shadedHere++;
                finalCol = sp.col;
                finalNorm = [dx, -dy, nz];
              } else {
                totalRejected++;
              }
            } else {
              shadedHere++;
              if (fragZ < zBuf) {
                zBuf = fragZ;
                finalCol = sp.col;
                finalNorm = [dx, -dy, nz];
              }
            }
          }
        }

        if (coveredHere) {
          totalActive++;
          totalShaded += shadedHere;
        }

        let outR = 15;
        let outG = 23;
        let outB = 42;
        if (coveredHere) {
          if (gbView === 'lit') {
            const ndotl = Math.max(0.18, finalNorm[0] * 0.4 + finalNorm[1] * 0.5 + finalNorm[2] * 0.76);
            outR = Math.round(finalCol[0] * ndotl);
            outG = Math.round(finalCol[1] * ndotl);
            outB = Math.round(finalCol[2] * ndotl);
          } else if (gbView === 'depth') {
            const d = Math.round((1.0 - zBuf) * 255);
            outR = d;
            outG = d;
            outB = d;
          } else if (gbView === 'normal') {
            outR = Math.round((finalNorm[0] * 0.5 + 0.5) * 255);
            outG = Math.round((finalNorm[1] * 0.5 + 0.5) * 255);
            outB = Math.round((finalNorm[2] * 0.5 + 0.5) * 255);
          } else {
            if (shadedHere === 1) {
              outR = 16;
              outG = 185;
              outB = 129;
            } else if (shadedHere === 2) {
              outR = 56;
              outG = 189;
              outB = 248;
            } else if (shadedHere === 3) {
              outR = 251;
              outG = 191;
              outB = 36;
            } else {
              outR = 244;
              outG = 63;
              outB = 94;
            }
          }
        }
        ctx.fillStyle = `rgb(${outR}, ${outG}, ${outB})`;
        ctx.fillRect(px, py, step, step);
      }
    }

    const avgOverdraw = totalActive > 0 ? totalShaded / totalActive : 1.0;
    const totalTests = totalShaded + totalRejected;
    const savedPct = totalTests > 0 ? (totalRejected / totalTests) * 100 : 0;
    setTelemetry({
      overdraw: avgOverdraw,
      savedPct,
      lights: arch === 'deferred' ? 32.0 : avgOverdraw * 32.0
    });
  }, [activeTab, gbView, drawOrder, earlyZ, arch]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1.5">
            <button
              onClick={onBackToPortal}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              {isZh ? '← 返回课程总目录' : '← Back to Index'}
            </button>
            <span>•</span>
            <span>Stage 4 • Lesson 20 / 32</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isZh
              ? 'L20: 可见面判定算法与现代深度缓冲管线'
              : 'L20: Visible Surface Algorithms, Z-Buffer, Early-Z & Deferred Shading'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Painter&apos;s Algorithm & Cyclic Overlap Paradox • BSP Trees • Per-Pixel Z-Buffer •
            Hardware Early-Z & Overdraw • Deferred Shading G-Buffer
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="lessons/lesson-20.html"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 transition"
          >
            {isZh ? '↗ 全屏打开独立 HTML 课件' : '↗ Open Standalone HTML'}
          </a>
          <button
            onClick={onToggleComplete}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:text-white'
            }`}
          >
            {isCompleted ? (isZh ? '✓ 已完成本课' : '✓ Completed') : isZh ? '标记完成' : 'Mark Complete'}
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 1, zh: '1. 📐 3B1B 循环遮挡悖论、BSP 与 Z-Buffer', en: '1. 📐 3B1B Cyclic Overlap, BSP & Z-Buffer' },
          { id: 2, zh: '2. 🖥️ Early-Z 过绘制与 G-Buffer 实验室', en: '2. 🖥️ Early-Z & Deferred G-Buffer Lab' },
          { id: 3, zh: '3. 🎥 UCD L14 / MIT L18 & Early-Z 铁律', en: '3. 🎥 UCD L14 / MIT L18 & Early-Z Rules' },
          { id: 4, zh: '4. 🎮 3 关可见性与管线架构师挑战', en: '4. 🎮 3-Mission Visibility Pipeline Game' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 1 | 2 | 3 | 4)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {isZh ? t.zh : t.en}
          </button>
        ))}
      </div>

      {/* TAB 1 */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-indigo-300">
                {isZh
                  ? '1. 画家算法循环遮挡悖论 (A ≺ B ≺ C ≺ A) vs. 逐像素 Z-Buffer'
                  : "1. Painter's Algorithm Cyclic Overlap Paradox vs. Per-Pixel Z-Buffer"}
              </h2>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {(['zbuffer', 'ABC', 'BCA', 'CAB', 'CBA'] as CyclicMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setCyclicMode(m)}
                    className={`px-2.5 py-1 rounded font-bold ${
                      cyclicMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m === 'zbuffer' ? '✓ Per-Pixel Z-Buffer' : `Painter: ${m}`}
                  </button>
                ))}
              </div>
            </div>
            <canvas
              ref={cyclicCanvasRef}
              width={520}
              height={285}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh
                ? '2. BSP 二叉空间分割树视角自适应中序遍历'
                : '2. Binary Space Partitioning (BSP Tree) View-Dependent Traversal'}
            </h2>
            <canvas
              ref={bspCanvasRef}
              width={520}
              height={240}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex items-center gap-4 text-xs">
              <span>Camera X Position:</span>
              <input
                type="range"
                min={40}
                max={480}
                value={bspCamX}
                onChange={e => setBspCamX(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-400"
              />
              <span className="font-mono text-amber-300">
                {bspCamX >= 260 ? 'Order: W1 → W0 → W2' : 'Order: W2 → W0 → W1'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              🖥️ Early-Z Overdraw & Deferred Shading G-Buffer Inspector
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(['lit', 'depth', 'normal', 'overdraw'] as GBufferView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setGbView(v)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase ${
                    gbView === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <select
              value={drawOrder}
              onChange={e => setDrawOrder(e.target.value as 'f2b' | 'b2f')}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            >
              <option value="f2b">Front-to-Back (Optimal Early-Z)</option>
              <option value="b2f">Back-to-Front (Severe Overdraw)</option>
            </select>
            <select
              value={earlyZ ? 'on' : 'off'}
              onChange={e => setEarlyZ(e.target.value === 'on')}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            >
              <option value="on">Hardware Early-Z ON</option>
              <option value="off">Early-Z OFF (discard / gl_FragDepth)</option>
            </select>
            <select
              value={arch}
              onChange={e => setArch(e.target.value as 'forward' | 'deferred')}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            >
              <option value="deferred">Deferred G-Buffer (1x Lighting)</option>
              <option value="forward">Forward Shading (Overdraw × Lights)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <canvas
                ref={pipelineCanvasRef}
                width={500}
                height={340}
                className="w-full rounded-xl bg-slate-950 border border-slate-800"
              />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span>Fragment Overdraw Ratio:</span>
                  <strong className="font-mono text-emerald-400">
                    {telemetry.overdraw.toFixed(2)}x
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Early-Z Rejected Fragments:</span>
                  <strong className="font-mono text-cyan-400">
                    {telemetry.savedPct.toFixed(1)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Light Evaluations / Pixel:</span>
                  <strong className="font-mono text-amber-300">
                    {telemetry.lights.toFixed(1)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h2 className="text-lg font-bold text-amber-300">
            🎥 UC Davis ECS 175 Lecture 14 & MIT 6.837 Lecture 18 (Visible Surface Algorithms)
          </h2>
          <p className="leading-relaxed">
            {isZh
              ? '现代 GPU 先按从近到远 (Front-to-Back) 顺序渲染不透明物体，利用硬件 Early-Z 提前剔除被遮挡片元；或通过延迟渲染 (Deferred Shading) 将几何光栅化写入 G-Buffer，使多光源着色复杂度从 O(Objects × Lights) 解耦为 O(Objects + Lights)！'
              : 'Modern GPUs sort opaque geometry Front-to-Back to maximize Early-Z culling, and use Deferred Shading G-Buffers to decouple scene geometry complexity from dynamic lighting complexity.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh
                ? '🎮 3 关可见性与深度管线总架构师挑战赛'
                : '🎮 3-Mission Visibility & Depth Pipeline Game'}
            </h2>
            <div className="flex gap-2 text-xs font-bold">
              <span
                className={`px-3 py-1 rounded-full border ${
                  m1Passed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                M1: {m1Passed ? '✓' : '...'}
              </span>
              <span
                className={`px-3 py-1 rounded-full border ${
                  m2Passed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                M2: {m2Passed ? '✓' : '...'}
              </span>
              <span
                className={`px-3 py-1 rounded-full border ${
                  m3Passed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                M3: {m3Passed ? '✓' : '...'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-cyan-400">Mission 1: Cyclic Overlap Paradox</div>
              <select
                value={m1Ans}
                onChange={e => setM1Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="none">Select mechanism...</option>
                <option value="centroid">Sort by centroid Z</option>
                <option value="zbuf">Per-Pixel Z-Buffer</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400">Mission 2: Eliminate 4x Overdraw</div>
              <select
                value={m2Ans}
                onChange={e => setM2Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="b2f">Back-to-Front + Early-Z</option>
                <option value="f2b_earlyz">Front-to-Back + Hardware Early-Z</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400">Mission 3: Opaque + Transparent Pass</div>
              <select
                value={m3Ans}
                onChange={e => setM3Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="wrong1">All ZWrite ON, Back-to-Front</option>
                <option value="correct">
                  Opaque (F2B, ZWrite=ON) → Transparent (B2F, ZTest=ON, ZWrite=OFF)
                </option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
