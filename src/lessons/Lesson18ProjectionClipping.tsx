import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson18Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

interface Pt2D {
  x: number;
  y: number;
}

const CS_BOX = { xmin: 150, xmax: 370, ymin: 70, ymax: 215 };
const SH_BOX = { xmin: 140, xmax: 390, ymin: 75, ymax: 305 };

function evalZndc(ze: number, n: number, f: number): number {
  return (f + n) / (f - n) + (2 * f * n) / ((f - n) * ze);
}

function computeOutcode(p: Pt2D): number {
  let c = 0;
  if (p.x < CS_BOX.xmin) c |= 1;
  if (p.x > CS_BOX.xmax) c |= 2;
  if (p.y > CS_BOX.ymax) c |= 4;
  if (p.y < CS_BOX.ymin) c |= 8;
  return c;
}

function fmtBits(c: number): string {
  return `${(c >> 3) & 1}${(c >> 2) & 1}${(c >> 1) & 1}${c & 1}`;
}

function clipSHSide(poly: Pt2D[], side: 'left' | 'right' | 'bottom' | 'top'): Pt2D[] {
  if (poly.length === 0) return [];
  const out: Pt2D[] = [];
  const inside = (p: Pt2D) => {
    if (side === 'left') return p.x >= SH_BOX.xmin;
    if (side === 'right') return p.x <= SH_BOX.xmax;
    if (side === 'bottom') return p.y <= SH_BOX.ymax;
    return p.y >= SH_BOX.ymin;
  };
  const intersect = (a: Pt2D, b: Pt2D): Pt2D => {
    if (side === 'left' || side === 'right') {
      const x = side === 'left' ? SH_BOX.xmin : SH_BOX.xmax;
      const t = (x - a.x) / (b.x - a.x);
      return { x, y: a.y + t * (b.y - a.y) };
    }
    const y = side === 'bottom' ? SH_BOX.ymax : SH_BOX.ymin;
    const t = (y - a.y) / (b.y - a.y);
    return { x: a.x + t * (b.x - a.x), y };
  };

  for (let i = 0; i < poly.length; i++) {
    const S = poly[i];
    const E = poly[(i + 1) % poly.length];
    const inS = inside(S);
    const inE = inside(E);
    if (inS && inE) {
      out.push(E);
    } else if (inS && !inE) {
      out.push(intersect(S, E));
    } else if (!inS && inE) {
      out.push(intersect(S, E));
      out.push(E);
    }
  }
  return out;
}

export const Lesson18ProjectionClipping: React.FC<Lesson18Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1A state: Frustum to NDC & 1/z Depth
  const [morphAlpha, setMorphAlpha] = useState<number>(0.0);
  const [nearPlane, setNearPlane] = useState<number>(1.0);
  const [farPlane, setFarPlane] = useState<number>(20.0);
  const frustumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 1B state: Cohen-Sutherland
  const [csP0, setCsP0] = useState<Pt2D>({ x: 95, y: 185 });
  const [csP1, setCsP1] = useState<Pt2D>({ x: 425, y: 95 });
  const cohenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 state: Sutherland-Hodgman
  const [shStage, setShStage] = useState<number>(4);
  const [shPoly, setShPoly] = useState<Pt2D[]>([
    { x: 105, y: 175 },
    { x: 260, y: 38 },
    { x: 445, y: 150 },
    { x: 380, y: 340 },
    { x: 160, y: 330 }
  ]);
  const shCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Mini-Game state
  const [m1Near, setM1Near] = useState<number>(0.05);
  const [m2Ans, setM2Ans] = useState<string>('none');
  const [m3Ans, setM3Ans] = useState<string>('2');

  const m1Passed = m1Near >= 1.5 && m1Near <= 1.85;
  const m2Passed = m2Ans === 'reject';
  const m3Passed = m3Ans === '4';

  // Draw Tab 1A: Frustum-to-NDC & 1/z Curve
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = frustumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const camX = 32;
    const midY = H * 0.5;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const xNear = lerp(camX + 42, 72, morphAlpha);
    const xFar = lerp(camX + 220, 232, morphAlpha);
    const hNear = lerp(30, 82, morphAlpha);
    const hFar = lerp(110, 82, morphAlpha);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(
      isZh ? '俯视图：视锥棱台 → NDC 立方体变形' : 'Top-Down: Frustum → NDC Cube Morph',
      18,
      20
    );

    ctx.fillStyle = 'rgba(99, 102, 241, 0.14)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xNear, midY - hNear);
    ctx.lineTo(xFar, midY - hFar);
    ctx.lineTo(xFar, midY + hFar);
    ctx.lineTo(xNear, midY + hNear);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const numSlices = 10;
    for (let i = 1; i < numSlices; i++) {
      const uLin = i / numSlices;
      const ze = -(nearPlane + uLin * (farPlane - nearPlane));
      const uNdc = (evalZndc(ze, nearPlane, farPlane) + 1.0) * 0.5;
      const uCurr = lerp(uLin, uNdc, morphAlpha);
      const sx = lerp(xNear, xFar, uCurr);
      const sh = lerp(hNear, hFar, uCurr);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(sx, midY - sh);
      ctx.lineTo(sx, midY + sh);
      ctx.stroke();
    }

    // Right: Hyperbolic curve
    const rx0 = 305;
    const rw = W - rx0 - 20;
    const ry0 = 36;
    const rh = H - 64;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('z_ndc(-z_e) = A + B/z_e', rx0, 20);

    ctx.strokeStyle = '#334155';
    ctx.strokeRect(rx0, ry0, rw, rh);

    ctx.strokeStyle = farPlane / nearPlane > 250 ? '#f43f5e' : '#34d399';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 150; i++) {
      const u = i / 150;
      const ze = -(nearPlane + u * (farPlane - nearPlane));
      const v = (evalZndc(ze, nearPlane, farPlane) + 1.0) * 0.5;
      const px = rx0 + u * rw;
      const py = ry0 + rh - v * rh;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [activeTab, morphAlpha, nearPlane, farPlane, isZh]);

  // Draw Tab 1B: Cohen-Sutherland
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = cohenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#334155';
    ctx.setLineDash([4, 4]);
    [CS_BOX.xmin, CS_BOX.xmax].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    });
    [CS_BOX.ymin, CS_BOX.ymax].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillRect(CS_BOX.xmin, CS_BOX.ymin, CS_BOX.xmax - CS_BOX.xmin, CS_BOX.ymax - CS_BOX.ymin);
    ctx.strokeRect(CS_BOX.xmin, CS_BOX.ymin, CS_BOX.xmax - CS_BOX.xmin, CS_BOX.ymax - CS_BOX.ymin);

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(csP0.x, csP0.y);
    ctx.lineTo(csP1.x, csP1.y);
    ctx.stroke();

    const c0 = computeOutcode(csP0);
    const c1 = computeOutcode(csP1);
    [
      { p: csP0, lbl: `P0 (${fmtBits(c0)})` },
      { p: csP1, lbl: `P1 (${fmtBits(c1)})` }
    ].forEach(item => {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(item.p.x, item.p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(item.lbl, item.p.x - 26, item.p.y - 10);
    });
  }, [activeTab, csP0, csP1]);

  // Draw Tab 2: Sutherland-Hodgman
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = shCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(SH_BOX.xmin, SH_BOX.ymin, SH_BOX.xmax - SH_BOX.xmin, SH_BOX.ymax - SH_BOX.ymin);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    shPoly.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    const sides: ('left' | 'right' | 'bottom' | 'top')[] = ['left', 'right', 'bottom', 'top'];
    let curr = shPoly.slice();
    for (let s = 0; s < shStage; s++) {
      curr = clipSHSide(curr, sides[s]);
    }

    if (curr.length > 0) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      curr.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }, [activeTab, shStage, shPoly]);

  const ratio = farPlane / nearPlane;
  const c0 = computeOutcode(csP0);
  const c1 = computeOutcode(csP1);

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
            <span>Stage 4 • Lesson 18 / 32</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isZh
              ? 'L18: 投影变换与视锥体裁剪 (Projection & Clipping)'
              : 'L18: Perspective Projection Matrix, NDC Space & Clipping'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Homogeneous w = -z_e Trick • Frustum-to-NDC Deformation • Non-Linear 1/z Depth &
            Z-Fighting • Cohen–Sutherland & Sutherland–Hodgman Clipping
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="lessons/lesson-18.html"
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
          { id: 1, zh: '1. 📐 3B1B 透视矩阵、1/z 深度与编码裁剪', en: '1. 📐 3B1B Projection, 1/z & Outcodes' },
          { id: 2, zh: '2. ✂️ Sutherland–Hodgman 多边形逐边裁剪', en: '2. ✂️ Sutherland–Hodgman Polygon Clipper' },
          { id: 3, zh: '3. 🎥 UCD L06 / MIT L17 & 齐次裁剪源码', en: '3. 🎥 UCD L06 / MIT L17 & Code' },
          { id: 4, zh: '4. 🎮 3 关投影与裁剪架构师挑战', en: '4. 🎮 3-Mission Projection & Clipping Game' }
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
                ? '1. 视锥体 → NDC 立方体连续挤压变形与 1/z 非线性深度冲突 (Z-Fighting)'
                : '1. Frustum → NDC Cube Deformation & Non-Linear 1/z Depth (Z-Fighting)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isZh
                ? '透视矩阵第 4 行 [0, 0, -1, 0] 将 -z_e 搬入齐次分量 w_c，从而在透视除法后实现近大远小缩放。但这也导致标准设备深度 z_ndc = A + B/z_e 与 1/z_e 成双曲线关系：当远近比 f/n 过大时，绝大部分浮点数精度被浪费在贴近相机的一小段距离内，远处两个紧挨的表面因量化到同一深度值而发生剧烈闪烁（Z-Fighting）！'
                : 'Row 4 [0, 0, -1, 0] copies -z_e into w_c for perspective division, making z_ndc = A + B/z_e a hyperbola in 1/z_e. A huge f/n ratio wastes most depth precision right in front of the camera, causing distant surfaces to collide in the Z-buffer (Z-Fighting)!'}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <canvas
                  ref={frustumCanvasRef}
                  width={560}
                  height={300}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800"
                />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span>Morph α (Frustum → NDC):</span>
                    <span className="font-mono font-bold text-indigo-300">{morphAlpha.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={morphAlpha}
                    onChange={e => setMorphAlpha(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                  <div className="flex justify-between">
                    <span>Near Plane n:</span>
                    <span className="font-mono font-bold text-cyan-400">{nearPlane.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={2.5}
                    step={0.05}
                    value={nearPlane}
                    onChange={e => setNearPlane(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between">
                    <span>Ratio f / n:</span>
                    <span className="font-mono font-bold text-amber-300">{ratio.toFixed(1)}x</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNearPlane(0.05);
                    setFarPlane(100);
                    setMorphAlpha(1.0);
                  }}
                  className="w-full py-2 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 font-bold"
                >
                  ⚠️ Simulate Severe Z-Fighting (n=0.05, f=100)
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-emerald-300">
                2. Cohen–Sutherland 4-Bit Outcode Line Clipping
              </h2>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => {
                    setCsP0({ x: 190, y: 110 });
                    setCsP1({ x: 330, y: 185 });
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold"
                >
                  Trivial Accept
                </button>
                <button
                  onClick={() => {
                    setCsP0({ x: 90, y: 40 });
                    setCsP1({ x: 430, y: 48 });
                  }}
                  className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold"
                >
                  Trivial Reject
                </button>
              </div>
            </div>
            <canvas
              ref={cohenCanvasRef}
              width={520}
              height={270}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="text-xs font-mono text-slate-300">
              C0 = {fmtBits(c0)}, C1 = {fmtBits(c1)} | (C0 | C1) = {fmtBits(c0 | c1)} | (C0 & C1) ={' '}
              {fmtBits(c0 & c1)}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              ✂️ Sutherland–Hodgman Step-by-Step Polygon Clipper
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4].map(st => (
                <button
                  key={st}
                  onClick={() => setShStage(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    shStage === st ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Stage {st}
                </button>
              ))}
            </div>
          </div>
          <canvas
            ref={shCanvasRef}
            width={520}
            height={370}
            className="w-full rounded-xl bg-slate-950 border border-slate-800"
          />
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h2 className="text-lg font-bold text-amber-300">
            🎥 UC Davis ECS 175 Lecture 06 (Clipping) & MIT 6.837 Lecture 17 (Rasterization I)
          </h2>
          <p className="leading-relaxed">
            {isZh
              ? 'GPU 硬件固定管线在 Vertex Shader 输出 4D 齐次坐标 (x_c, y_c, z_c, w_c) 后，首先在 4D 齐次空间针对 6 个超平面 -w_c ≤ x_c, y_c, z_c ≤ +w_c 执行 Sutherland–Hodgman 多边形裁剪，彻底避免跨越相机平面 w_c = 0 引起的除零与正负号翻转，随后才执行透视除法映射入 NDC 空间！'
              : 'Hardware GPUs clip polygons in 4D Homogeneous Clip Space (-w_c ≤ x_c, y_c, z_c ≤ +w_c) using Sutherland–Hodgman BEFORE perspective division by w_c, preventing division by zero and sign inversion for geometry straddling the camera plane z_e = 0.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh
                ? '🎮 3 关投影与裁剪管线架构师挑战赛'
                : '🎮 3-Mission Projection & Clipping Architect Game'}
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
              <div className="font-bold text-cyan-400">
                {isZh ? '关卡 1：Z-Fighting 终结者 (f=150m)' : 'Mission 1: Z-Fighting Fix (f=150m)'}
              </div>
              <div>Near n = {m1Near.toFixed(2)} m (Target [1.50, 1.85] m)</div>
              <input
                type="range"
                min={0.05}
                max={2.5}
                step={0.05}
                value={m1Near}
                onChange={e => setM1Near(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400">
                {isZh ? '关卡 2：Outcode 1001 & 1010 判官' : 'Mission 2: Outcode 1001 & 1010'}
              </div>
              <select
                value={m2Ans}
                onChange={e => setM2Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="none">Select action...</option>
                <option value="accept">Trivial Accept</option>
                <option value="reject">Trivial Reject (C0 & C1 = 1000 ≠ 0)</option>
                <option value="clip">Subdivide & Intersect</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400">
                {isZh ? '关卡 3：三角形单角越界裁剪顶点数' : 'Mission 3: Clipped Triangle Vertices'}
              </div>
              <select
                value={m3Ans}
                onChange={e => setM3Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="2">2 Vertices</option>
                <option value="3">3 Vertices</option>
                <option value="4">4 Vertices (Quad)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
