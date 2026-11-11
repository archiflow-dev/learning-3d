import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson19Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

interface Pt2D {
  x: number;
  y: number;
}

const R_GRID = 16;

function evalEdge2D(a: Pt2D, b: Pt2D, p: Pt2D): number {
  return (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
}

export const Lesson19Rasterization: React.FC<Lesson19Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1A state: Bresenham
  const [bresDy, setBresDy] = useState<number>(4);
  const [bresStep, setBresStep] = useState<number>(3);
  const bresCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 1B state: Top-Left Rule
  const [tieRule, setTieRule] = useState<'inclusive' | 'strict' | 'topleft'>('topleft');
  const topLeftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 state: GPU Edge-Function Rasterizer
  const [triVerts, setTriVerts] = useState<Pt2D[]>([
    { x: 2.5, y: 13.2 },
    { x: 13.8, y: 11.4 },
    { x: 6.4, y: 2.2 }
  ]);
  const [inspectPx, setInspectPx] = useState<{ x: number; y: number }>({ x: 7, y: 8 });
  const [showQuads, setShowQuads] = useState<boolean>(true);
  const [quadMetrics, setQuadMetrics] = useState<{ active: number; lanes: number; eff: number }>({
    active: 42,
    lanes: 64,
    eff: 65.6
  });
  const gpuCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Mini-Game state
  const [m1Ans, setM1Ans] = useState<string>('none');
  const [m2Ans, setM2Ans] = useState<string>('inc');
  const [m3Ans, setM3Ans] = useState<string>('affine');

  const m1Passed = m1Ans === 'east';
  const m2Passed = m2Ans === 'topleft';
  const m3Passed = m3Ans === 'persp';

  // Draw Tab 1A: Bresenham Midpoint Line
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = bresCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const dx = 9;
    let d = 2 * bresDy - dx;
    let y = 0;
    const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (let x = 0; x < dx; x++) {
      if (d < 0) {
        d += 2 * bresDy;
      } else {
        y += 1;
        d += 2 * bresDy - 2 * dx;
      }
      pts.push({ x: x + 1, y });
    }

    const cell = 23;
    const ox = 36;
    const oy = H - 26;
    const toSc = (gx: number, gy: number) => ({ sx: ox + gx * cell, sy: oy - gy * cell });

    ctx.strokeStyle = '#1e293b';
    for (let i = 0; i < 10; i++) {
      const a = toSc(i, 0);
      const b = toSc(i, 9);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();

      const c = toSc(0, i);
      const e = toSc(9, i);
      ctx.beginPath();
      ctx.moveTo(c.sx, c.sy);
      ctx.lineTo(e.sx, e.sy);
      ctx.stroke();
    }

    const s0 = toSc(0, 0);
    const s1 = toSc(dx, bresDy);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s0.sx, s0.sy);
    ctx.lineTo(s1.sx, s1.sy);
    ctx.stroke();

    pts.forEach((p, idx) => {
      const sc = toSc(p.x, p.y);
      ctx.fillStyle = idx === bresStep ? '#fbbf24' : 'rgba(16, 185, 129, 0.38)';
      ctx.strokeStyle = idx === bresStep ? '#fbbf24' : '#10b981';
      ctx.lineWidth = 1.5;
      ctx.fillRect(sc.sx - cell * 0.4, sc.sy - cell * 0.4, cell * 0.8, cell * 0.8);
      ctx.strokeRect(sc.sx - cell * 0.4, sc.sy - cell * 0.4, cell * 0.8, cell * 0.8);
    });
  }, [activeTab, bresDy, bresStep]);

  // Draw Tab 1B: Top-Left Rule
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = topLeftCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const N = 8;
    const cell = 28;
    const ox = 140;
    const oy = 14;
    for (let py = 0; py < N; py++) {
      for (let px = 0; px < N; px++) {
        const sx = ox + px * cell;
        const sy = oy + py * cell;
        let hitT1 = false;
        let hitT2 = false;
        if (px < py) hitT1 = true;
        else if (px > py) hitT2 = true;
        else {
          if (tieRule === 'inclusive') {
            hitT1 = true;
            hitT2 = true;
          } else if (tieRule === 'strict') {
            hitT1 = false;
            hitT2 = false;
          } else {
            hitT2 = true;
          }
        }

        if (hitT1 && hitT2) ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
        else if (!hitT1 && !hitT2) ctx.fillStyle = '#020617';
        else if (hitT1) ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        else ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';

        ctx.fillRect(sx + 1, sy + 1, cell - 2, cell - 2);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(sx, sy, cell, cell);
      }
    }
  }, [activeTab, tieRule]);

  // Draw Tab 2: GPU Edge-Function Rasterizer
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = gpuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cell = W / R_GRID;
    const areaSign = evalEdge2D(triVerts[0], triVerts[1], triVerts[2]) >= 0 ? 1 : -1;
    const totalArea = Math.max(1e-4, Math.abs(evalEdge2D(triVerts[0], triVerts[1], triVerts[2])));

    const insideAt = (px: number, py: number) => {
      const p = { x: px + 0.5, y: py + 0.5 };
      const e01 = evalEdge2D(triVerts[0], triVerts[1], p) * areaSign;
      const e12 = evalEdge2D(triVerts[1], triVerts[2], p) * areaSign;
      const e20 = evalEdge2D(triVerts[2], triVerts[0], p) * areaSign;
      return e01 >= 0 && e12 >= 0 && e20 >= 0;
    };

    let activeCount = 0;
    let quadLanes = 0;

    for (let qy = 0; qy < R_GRID; qy += 2) {
      for (let qx = 0; qx < R_GRID; qx += 2) {
        const quadActive =
          insideAt(qx, qy) ||
          insideAt(qx + 1, qy) ||
          insideAt(qx, qy + 1) ||
          insideAt(qx + 1, qy + 1);
        if (quadActive) quadLanes += 4;

        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const px = qx + dx;
            const py = qy + dy;
            const hit = insideAt(px, py);
            if (hit) activeCount++;

            const sx = px * cell;
            const sy = py * cell;
            if (hit) {
              const p = { x: px + 0.5, y: py + 0.5 };
              const a = (evalEdge2D(triVerts[1], triVerts[2], p) * areaSign) / totalArea;
              const b = (evalEdge2D(triVerts[2], triVerts[0], p) * areaSign) / totalArea;
              const c = (evalEdge2D(triVerts[0], triVerts[1], p) * areaSign) / totalArea;
              ctx.fillStyle = `rgba(${Math.round(a * 230 + 25)}, ${Math.round(b * 230 + 25)}, ${Math.round(c * 230 + 25)}, 0.65)`;
            } else if (quadActive && showQuads) {
              ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
            } else {
              ctx.fillStyle = '#0f172a';
            }
            ctx.fillRect(sx + 1, sy + 1, cell - 2, cell - 2);
            ctx.strokeStyle = '#1e293b';
            ctx.strokeRect(sx, sy, cell, cell);
          }
        }

        if (quadActive && showQuads) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(qx * cell + 1, qy * cell + 1, cell * 2 - 2, cell * 2 - 2);
        }
      }
    }

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(inspectPx.x * cell + 2, inspectPx.y * cell + 2, cell - 4, cell - 4);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    triVerts.forEach((v, i) => {
      if (i === 0) ctx.moveTo(v.x * cell, v.y * cell);
      else ctx.lineTo(v.x * cell, v.y * cell);
    });
    ctx.closePath();
    ctx.stroke();

    setQuadMetrics({
      active: activeCount,
      lanes: quadLanes,
      eff: quadLanes > 0 ? (activeCount / quadLanes) * 100 : 0
    });
  }, [activeTab, triVerts, inspectPx, showQuads]);

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
            <span>Stage 4 • Lesson 19 / 32</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isZh
              ? 'L19: 扫描转换 (Scan Conversion) 与三角形光栅化'
              : 'L19: Scan Conversion, Bresenham & GPU Triangle Rasterization'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bresenham Integer Midpoint Line • Pineda Parallel Edge Functions • Top-Left Rule • 2×2
            Quad Helper Lanes • Perspective-Correct Interpolation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="lessons/lesson-19.html"
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
          { id: 1, zh: '1. 📐 3B1B 整数画线与 Top-Left 规则', en: '1. 📐 3B1B Bresenham & Top-Left Rule' },
          { id: 2, zh: '2. 🖥️ GPU 边缘函数与 2×2 Quad 模拟器', en: '2. 🖥️ GPU Edge Functions & 2×2 Quads' },
          { id: 3, zh: '3. 🎥 UCD L12 / MIT L18 & 透视校正插值', en: '3. 🎥 UCD L12 / MIT L18 & Perspective UV' },
          { id: 4, zh: '4. 🎮 3 关 GPU 光栅化架构师挑战', en: '4. 🎮 3-Mission GPU Rasterizer Game' }
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
            <h2 className="text-lg font-bold text-indigo-300">
              {isZh
                ? '1. Bresenham 中点整数画线法 (零浮点、零除法判别式 d_k)'
                : '1. Bresenham Midpoint Integer Line Drawing (Zero Floats, Zero Division)'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <canvas
                  ref={bresCanvasRef}
                  width={520}
                  height={250}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800"
                />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span>Endpoint Δy (Δx = 9):</span>
                    <span className="font-mono font-bold text-cyan-400">{bresDy}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={9}
                    step={1}
                    value={bresDy}
                    onChange={e => setBresDy(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between">
                    <span>Inspect Step k:</span>
                    <span className="font-mono font-bold text-amber-300">{bresStep}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={bresStep}
                    onChange={e => setBresStep(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-emerald-300">
                {isZh
                  ? '2. 相邻三角形公共边压线仲裁：Top-Left 填充规则'
                  : '2. Shared-Edge Tie-Breaking: The Top-Left Rule'}
              </h2>
              <div className="flex gap-2 text-xs">
                {(['inclusive', 'strict', 'topleft'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setTieRule(r)}
                    className={`px-3 py-1 rounded-lg font-bold uppercase ${
                      tieRule === r ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <canvas
              ref={topLeftCanvasRef}
              width={520}
              height={250}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              🖥️ GPU Parallel Edge Functions & 2×2 Quad Helper Lanes
            </h2>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() =>
                  setTriVerts([
                    { x: 1.8, y: 14.2 },
                    { x: 14.4, y: 2.4 },
                    { x: 13.2, y: 1.5 }
                  ])
                }
                className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-200 border border-rose-700 font-bold"
              >
                🗡️ Sliver Triangle
              </button>
              <button
                onClick={() =>
                  setTriVerts([
                    { x: 2.5, y: 13.2 },
                    { x: 13.8, y: 11.4 },
                    { x: 6.4, y: 2.2 }
                  ])
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-bold"
              >
                📐 Balanced Triangle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <canvas
                ref={gpuCanvasRef}
                width={448}
                height={448}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor(((e.clientX - rect.left) / rect.width) * R_GRID);
                  const y = Math.floor(((e.clientY - rect.top) / rect.height) * R_GRID);
                  setInspectPx({
                    x: Math.max(0, Math.min(R_GRID - 1, x)),
                    y: Math.max(0, Math.min(R_GRID - 1, y))
                  });
                }}
                className="w-full aspect-square rounded-xl bg-slate-950 border border-slate-800 cursor-crosshair"
              />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span>Active Covered Pixels:</span>
                  <strong className="font-mono text-emerald-400">{quadMetrics.active}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total 2×2 Quad Threads Invoked:</span>
                  <strong className="font-mono text-amber-300">{quadMetrics.lanes}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Quad Utilization Efficiency:</span>
                  <strong className="font-mono text-cyan-400">{quadMetrics.eff.toFixed(1)}%</strong>
                </div>
              </div>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={showQuads}
                  onChange={e => setShowQuads(e.target.checked)}
                />
                <span>Highlight 2×2 Quad footprints & helper lanes</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h2 className="text-lg font-bold text-amber-300">
            🎥 UC Davis ECS 175 Lecture 12 & MIT 6.837 Lecture 18 (Scan Conversion & Edge Equations)
          </h2>
          <p className="leading-relaxed">
            {isZh
              ? '现代 GPU 通过并行计算三个有向边函数 E_12, E_20, E_01 同时完成像素覆盖判定与二维屏幕重心坐标计算；为了消除透视除法带来的仿射纹理扭曲，硬件必须对 (u/w_c, v/w_c, 1/w_c) 进行屏幕线性插值并在每个像素处除以插值后的 1/w_c。'
              : 'Modern GPUs evaluate three signed Pineda edge functions in parallel across 2×2 pixel quads, and interpolate (u/w_c, v/w_c, 1/w_c) linearly in screen space to achieve perspective-correct texture mapping.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh ? '🎮 3 关 GPU 光栅化首席架构师挑战赛' : '🎮 3-Mission GPU Rasterizer Game'}
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
              <div className="font-bold text-cyan-400">Mission 1: Bresenham d₀ (Δx=7, Δy=3)</div>
              <select
                value={m1Ans}
                onChange={e => setM1Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="none">Select d₀ & step...</option>
                <option value="east">d₀ = -1 &lt; 0 ⇒ Step East (1, 0)</option>
                <option value="ne">d₀ = +1 ≥ 0 ⇒ Step North-East (1, 1)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400">Mission 2: Shared Edge Tie-Breaker</div>
              <select
                value={m2Ans}
                onChange={e => setM2Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="inc">Inclusive E ≥ 0 (Overdraw!)</option>
                <option value="strict">Strict E &gt; 0 (Cracks!)</option>
                <option value="topleft">Top-Left Rule (Zero Overdraw, Zero Cracks)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400">Mission 3: Perspective-Correct UV</div>
              <select
                value={m3Ans}
                onChange={e => setM3Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="affine">Interpolate (u, v) directly in 2D</option>
                <option value="persp">Interpolate (u/w_c, v/w_c, 1/w_c) & divide</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
