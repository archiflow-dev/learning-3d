import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson29Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson29ColorScience: React.FC<Lesson29Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Spectral Wavelength & CIE Negative Lobe
  const [wave, setWave] = useState<number>(500);
  const [curveMode, setCurveMode] = useState<'rgb' | 'lms'>('rgb');
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: CIE 1931 Horseshoe & Gamut Explorer
  const [cieX, setCieX] = useState<number>(0.3127);
  const [cieY, setCieY] = useState<number>(0.329);
  const cieCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: Linear vs Naive sRGB Shading & Blending
  const [lightInt, setLightInt] = useState<number>(1.25);
  const gammaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [m1R, setM1R] = useState<number>(0.42);
  const [m1G, setM1G] = useState<number>(0.32);
  const [m2Space, setM2Space] = useState<'srgb' | 'p3' | 'rec2020'>('srgb');
  const [m3Pipe, setM3Pipe] = useState<'naive' | 'linear_wf'>('naive');
  const [gameFeedback, setGameFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const gauss = (w: number, mu: number, s1: number, s2: number) => {
    const s = w < mu ? s1 : s2;
    return Math.exp(-0.5 * Math.pow((w - mu) / s, 2));
  };

  const evalCurves = (w: number, mode: 'rgb' | 'lms') => {
    if (mode === 'rgb') {
      return {
        r: 0.36 * gauss(w, 600, 32, 34) - 0.075 * gauss(w, 500, 28, 30) + 0.02 * gauss(w, 440, 18, 18),
        g: 0.22 * gauss(w, 545, 34, 36),
        b: 0.3 * gauss(w, 445, 22, 26)
      };
    }
    return {
      r: 0.34 * gauss(w, 575, 42, 46),
      g: 0.3 * gauss(w, 540, 36, 40),
      b: 0.28 * gauss(w, 445, 22, 26)
    };
  };

  // Draw Tab 1 Canvas
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = mathCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const x0 = 46;
    const x1 = W - 22;
    const yZero = H * 0.72;
    const yScale = 460;

    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.beginPath();
    ctx.moveTo(x0, yZero);
    ctx.lineTo(x1, yZero);
    ctx.stroke();

    const chs = [
      { k: 'r' as const, col: '#f43f5e' },
      { k: 'g' as const, col: '#10b981' },
      { k: 'b' as const, col: '#38bdf8' }
    ];

    chs.forEach(c => {
      ctx.strokeStyle = c.col;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let w = 390; w <= 690; w += 3) {
        const px = x0 + ((w - 390) / 300) * (x1 - x0);
        const py = yZero - evalCurves(w, curveMode)[c.k] * yScale;
        if (w === 390) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    const curX = x0 + ((wave - 390) / 300) * (x1 - x0);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(curX, 20);
    ctx.lineTo(curX, H - 20);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeTab, wave, curveMode]);

  // Draw Tab 2 Lab 1: CIE 1931 Horseshoe
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = cieCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const locus = [
      [0.174, 0.005], [0.124, 0.098], [0.045, 0.295], [0.008, 0.538],
      [0.014, 0.75], [0.074, 0.834], [0.23, 0.754], [0.373, 0.624],
      [0.512, 0.487], [0.627, 0.372], [0.735, 0.265]
    ];
    const toS = (x: number, y: number) => ({
      sx: 40 + (x / 0.8) * (W - 65),
      sy: H - 30 - (y / 0.9) * (H - 50)
    });

    ctx.fillStyle = 'rgba(30,41,59,0.75)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    locus.forEach(([x, y], i) => {
      const p = toS(x, y);
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const drawTri = (pts: number[][], col: string) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const p = toS(x, y);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath();
      ctx.stroke();
    };
    drawTri([[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]], '#10b981');
    drawTri([[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]], '#f59e0b');
    drawTri([[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]], '#38bdf8');

    const sel = toS(cieX, cieY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sel.sx, sel.sy, 7, 0, Math.PI * 2);
    ctx.stroke();
  }, [activeTab, cieX, cieY]);

  // Draw Tab 2 Lab 2: Linear vs sRGB
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = gammaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const gw = W - 40;
    for (let i = 0; i < gw; i += 2) {
      const t = i / gw;
      ctx.fillStyle = `rgb(${Math.round((1 - t) * 255)}, ${Math.round(t * 255)}, 0)`;
      ctx.fillRect(20 + i, 32, 3, 42);

      const rL = Math.round(Math.pow(1 - t, 1 / 2.2) * 255);
      const gL = Math.round(Math.pow(t, 1 / 2.2) * 255);
      ctx.fillStyle = `rgb(${rL}, ${gL}, 0)`;
      ctx.fillRect(20 + i, 108, 3, 42);
    }

    // Grayscale ramp comparison
    for (let i = 0; i < gw; i += 2) {
      const t = Math.min(1, (i / gw) * lightInt);
      const cNaive = Math.round(t * 255);
      const cLin = Math.round(Math.pow(t, 1 / 2.2) * 255);
      ctx.fillStyle = `rgb(${cNaive}, ${cNaive}, ${cNaive})`;
      ctx.fillRect(20 + i, 185, 3, 38);
      ctx.fillStyle = `rgb(${cLin}, ${cLin}, ${cLin})`;
      ctx.fillRect(20 + i, 248, 3, 38);
    }
  }, [activeTab, lightInt]);

  // Draw Tab 4 Game Canvas
  useEffect(() => {
    if (activeTab !== 4) return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const L = 0.72 * m1R + 0.42 * m1G;
    const M = 0.22 * m1R + 0.65 * m1G;
    const err = Math.hypot(L - 0.76, M - 0.58);
    const ok =
      (mission === 1 && err <= 0.045) ||
      (mission === 2 && m2Space === 'rec2020') ||
      (mission === 3 && m3Pipe === 'linear_wf');

    ctx.fillStyle = ok ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      mission === 1
        ? `Metamer Error ||ΔLMS|| = ${err.toFixed(3)} (Target ≤ 0.045)`
        : mission === 2
        ? `Gamut Space: ${m2Space.toUpperCase()} (${ok ? 'IN GAMUT ✓' : 'NEGATIVE R CLIPPED ✗'})`
        : `Pipeline: ${ok ? 'Linear Shading + Gamma 1/2.2 ✓' : 'Naive sRGB Muddy Blend ✗'}`,
      24,
      34
    );

    for (let i = 0; i < W - 60; i += 3) {
      const t = i / (W - 60);
      const r = ok ? Math.round(Math.pow(1 - t, 1 / 2.2) * 255) : Math.round((1 - t) * 255);
      const g = ok ? Math.round(Math.pow(t, 1 / 2.2) * 255) : Math.round(t * 255);
      ctx.fillStyle = `rgb(${r}, ${g}, 60)`;
      ctx.fillRect(30 + i, 90, 4, 150);
    }
  }, [activeTab, mission, m1R, m1G, m2Space, m3Pipe]);

  const verifyMission = () => {
    const L = 0.72 * m1R + 0.42 * m1G;
    const M = 0.22 * m1R + 0.65 * m1G;
    const err = Math.hypot(L - 0.76, M - 0.58);

    if (mission === 1) {
      if (err <= 0.045) {
        setPassed(prev => ({ ...prev, 1: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? `✅ 关卡 1 通过！||ΔLMS|| = ${err.toFixed(3)}，窄带 R+G OLED 与宽谱自然光达成同色异谱 (Metamerism)！`
            : `✅ Mission 1 Passed! ||ΔLMS|| = ${err.toFixed(3)} — Metamerism achieved!`
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? `⚠️ 当前 ||ΔLMS|| = ${err.toFixed(3)} > 0.045，请将 R 调至约 0.74、G 调至约 0.64！`
            : `⚠️ Current ||ΔLMS|| = ${err.toFixed(3)} > 0.045. Try R ≈ 0.74, G ≈ 0.64!`
        });
      }
    } else if (mission === 2) {
      if (m2Space === 'rec2020') {
        setPassed(prev => ({ ...prev, 2: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 2 通过！Rec.2020 广色域三角形完整容纳了深海翡翠青色度点，三原色全部非负！'
            : '✅ Mission 2 Passed! Rec.2020 encloses the emerald-cyan locus with all-positive primaries!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 该青色位于 sRGB/P3 三角形之外，红通道出现负值 (R < 0)！请切换至 Rec.2020。'
            : '⚠️ This cyan lies outside sRGB/P3 (R < 0)! Select Rec.2020.'
        });
      }
    } else {
      if (m3Pipe === 'linear_wf') {
        setPassed(prev => ({ ...prev, 3: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 3 通过！Decode 2.2 → Linear 光照 → Encode 1/2.2 完美消除红绿暗带与塑料感高光！'
            : '✅ Mission 3 Passed! Decode 2.2 → Linear Shading → Encode 1/2.2 restores photon conservation!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 直接在非线性 sRGB 空间相加会丢失超过一半物理光强！请切换为 Linear 工作流。'
            : '⚠️ Blending in nonlinear sRGB loses over half the physical luminance! Switch to Linear Workflow.'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <span>STAGE 6 · LESSON 29</span>
            <span>·</span>
            <span>MIT 6.837 LECTURE 20</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isZh
              ? '色彩科学 (Color Science)：从人眼感知到 CIE 与 Gamma'
              : 'Color Science: Human Cone Response, CIE 1931 XYZ, Gamut & sRGB Gamma'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isZh
              ? '用无穷维光谱内积投影与凸锥几何直觉推导同色异谱零空间、CIE 负值匹配函数、马蹄图色域三角形与 Linear/sRGB 渲染管线'
              : 'Hilbert-space projection for Metamerism, CIE 1931 horseshoe convex geometry, and Linear vs. sRGB Gamma 2.2 rendering'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="lessons/lesson-29.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
          >
            {isZh ? '↗ 独立全屏 HTML 实验室' : '↗ Standalone HTML Lab'}
          </a>
          <button
            onClick={onToggleComplete}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isCompleted
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {isCompleted ? (isZh ? '✓ 已完成本课' : '✓ Completed') : isZh ? '○ 标记完成' : '○ Mark Complete'}
          </button>
          <button
            onClick={onBackToPortal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            {isZh ? '← 返回目录' : '← Back'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 1 as const, zh: '📐 1. 3Blue1Brown 光谱投影与负值瓣', en: '📐 1. 3Blue1Brown Spectral Projection & CIE' },
          { id: 2 as const, zh: '🔬 2. 双实验台 (CIE 马蹄图 + Linear/sRGB)', en: '🔬 2. Dual Labs (CIE Horseshoe + Linear/sRGB)' },
          { id: 3 as const, zh: '🎥 3. MIT 6.837 L20 课堂精要', en: '🎥 3. MIT 6.837 L20 Course Companion' },
          { id: 4 as const, zh: '🎮 4. 闯关：首席色彩科学架构师 (3关)', en: '🎮 4. Game: Chief Color Architect (3 Missions)' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {isZh ? t.zh : t.en}
          </button>
        ))}
      </div>

      {/* TAB 1 */}
      {activeTab === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h3 className="text-base font-bold text-indigo-300">
                {isZh
                  ? '1. ∞ 维光谱向 3D 视锥投影与同色异谱 (Metamerism)'
                  : '1. Infinite-D Spectral Projection & Metamerism Nullspace'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '视网膜 L/M/S 视锥响应等价于光谱函数 Φ(λ) 与三个基函数的内积积分。由于线性算子 P_LMS 将 ∞ 维空间降维到 ℝ³，只要两束光之差属于无穷维零空间 ker(P_LMS)，人眼看到的 (L,M,S) 就完全相同！'
                  : 'Retinal L/M/S response is an inner-product projection from ∞-D spectral space to ℝ³. Any two spectra differing by an element of ker(P_LMS) are metamers!'}
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h3 className="text-base font-bold text-emerald-300">
                {isZh
                  ? '2. 为什么真实 RGB 匹配函数会出现负值 r̄(500nm) < 0？'
                  : '2. Why Do Physical RGB Matching Functions Have Negative Lobes?'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '单色光谱轨迹在 X+Y+Z=1 投影平面上是一条向外弯曲的马蹄形凸边界。任何三束真实物理原色张成的凸包必是一个内接三角形，无法包住外凸的青光边界 (500nm)，因此匹配纯青光必须使用“负红光”！'
                  : 'The monochromatic locus forms a curved convex horseshoe; any three physical primaries span an inscribed triangle that misses saturated 500nm cyan, requiring negative red!'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <canvas
              ref={mathCanvasRef}
              width={540}
              height={300}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex items-center justify-between gap-4 text-xs">
              <div className="flex-1">
                <span className="text-slate-300">Wavelength λ = {wave} nm</span>
                <input
                  type="range"
                  min={390}
                  max={690}
                  step={1}
                  value={wave}
                  onChange={e => setWave(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                {(['rgb', 'lms'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setCurveMode(m)}
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
                      curveMode === m
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {m === 'rgb' ? 'CIE RGB' : 'LMS / XYZ'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh ? '实验台 1：CIE 1931 马蹄图与广色域三角形' : 'Lab 1: CIE 1931 Chromaticity & Gamut Triangles'}
            </h3>
            <canvas
              ref={cieCanvasRef}
              width={500}
              height={300}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-300">x: {cieX.toFixed(3)}</span>
                <input
                  type="range"
                  min={0.02}
                  max={0.72}
                  step={0.005}
                  value={cieX}
                  onChange={e => setCieX(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">y: {cieY.toFixed(3)}</span>
                <input
                  type="range"
                  min={0.04}
                  max={0.82}
                  step={0.005}
                  value={cieY}
                  onChange={e => setCieY(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh ? '实验台 2：Linear 工作流 vs 错误 sRGB 混合对比仪' : 'Lab 2: Linear Workflow vs. Naive sRGB Blending'}
            </h3>
            <canvas
              ref={gammaCanvasRef}
              width={500}
              height={300}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="text-xs">
              <span className="text-slate-300">Light Intensity: {lightInt.toFixed(2)}</span>
              <input
                type="range"
                min={0.4}
                max={2.4}
                step={0.05}
                value={lightInt}
                onChange={e => setLightInt(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">
            {isZh
              ? 'MIT 6.837 Lecture 20：Color Science 课程精要'
              : 'MIT 6.837 Lecture 20: Color Science Course Companion'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isZh
              ? 'Justin Solomon 教授在 MIT 6.837 第 20 讲中通过无穷维函数内积诠释了格拉斯曼定律、同色异谱与 CIE 1931 标准观察者，并强调所有物理光照、半透明混合与 Mipmap 必须在 Linear 空间执行。'
              : 'Prof. Justin Solomon formulates color matching via inner products on spectral space, deriving CIE 1931 XYZ, gamut polygons, and linear-space rendering.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isZh ? '🎮 首席色彩科学架构师' : '🎮 Chief Color Science Architect'}
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                {Object.values(passed).filter(Boolean).length} / 3
              </span>
            </div>

            <div className="flex gap-2">
              {([1, 2, 3] as const).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    setGameFeedback(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    mission === m
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : passed[m]
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isZh ? `关卡 ${m}` : `Mission ${m}`} {passed[m] ? '✓' : ''}
                </button>
              ))}
            </div>

            {mission === 1 && (
              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span>OLED R: {m1R.toFixed(2)}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={m1R}
                    onChange={e => setM1R(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <span>OLED G: {m1G.toFixed(2)}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={m1G}
                    onChange={e => setM1G(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {mission === 2 && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['srgb', 'p3', 'rec2020'] as const).map(sp => (
                  <button
                    key={sp}
                    onClick={() => setM2Space(sp)}
                    className={`py-2 rounded-xl border font-bold ${
                      m2Space === sp ? 'bg-indigo-600/30 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {sp.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {mission === 3 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setM3Pipe('naive')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Pipe === 'naive' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Naive sRGB Blend
                </button>
                <button
                  onClick={() => setM3Pipe('linear_wf')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Pipe === 'linear_wf' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Linear + Gamma 1/2.2
                </button>
              </div>
            )}

            <button
              onClick={verifyMission}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              {isZh ? '⚡ 验证色彩科学管线' : '⚡ Verify Color Pipeline'}
            </button>

            {gameFeedback && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  gameFeedback.ok
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                }`}
              >
                {gameFeedback.msg}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <canvas
              ref={gameCanvasRef}
              width={560}
              height={300}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
