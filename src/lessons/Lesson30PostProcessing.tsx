import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson30Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson30PostProcessing: React.FC<Lesson30Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Separable Blur O(2N) & Tone Mapping Curves
  const [kernelN, setKernelN] = useState<number>(21);
  const [hdrIn, setHdrIn] = useState<number>(3.2);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: 3x3 Convolution Kernel
  const [preset, setPreset] = useState<'gaussian' | 'sobel' | 'laplace' | 'sharpen'>('gaussian');
  const [centerBias, setCenterBias] = useState<number>(0);
  const convCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: HDR Bloom & ACES Tone Mapping
  const [toneMode, setToneMode] = useState<'aces' | 'reinhard' | 'clip'>('aces');
  const [exposure, setExposure] = useState<number>(1.6);
  const [bloomAmt, setBloomAmt] = useState<number>(0.65);
  const hdrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [m1Mode, setM1Mode] = useState<'brute2d' | 'sep1d'>('brute2d');
  const [m2Center, setM2Center] = useState<number>(7.0);
  const [m3Mode, setM3Mode] = useState<'hard_clip' | 'aces_bloom'>('hard_clip');
  const [gameFeedback, setGameFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const aces = (x: number) =>
    Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));

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

    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath();
    ctx.moveTo(W * 0.48, 16);
    ctx.lineTo(W * 0.48, H - 16);
    ctx.stroke();

    // Left: N^2 vs 2N bar comparison
    const taps2D = kernelN * kernelN;
    const taps1D = 2 * kernelN;
    const by0 = H - 36;
    const h2 = Math.min(200, (taps2D / 1225) * 200);
    const h1 = Math.max(8, (taps1D / 1225) * 200);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(46, by0 - h2, 62, h2);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(142, by0 - h1, 62, h1);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`2D: ${taps2D}`, 48, by0 + 16);
    ctx.fillText(`1D×2: ${taps1D}`, 140, by0 + 16);

    // Right: Tone Mapping curves
    const rx0 = W * 0.54;
    const rx1 = W - 20;
    const ry0 = 36;
    const ry1 = H - 36;
    const mapX = (x: number) => rx0 + (x / 8.0) * (rx1 - rx0);
    const mapY = (y: number) => ry1 - y * (ry1 - ry0);

    const curves = [
      { fn: (x: number) => Math.min(1, x), col: '#f43f5e' },
      { fn: (x: number) => x / (1 + x), col: '#38bdf8' },
      { fn: aces, col: '#fbbf24' }
    ];

    curves.forEach(c => {
      ctx.strokeStyle = c.col;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let x = 0; x <= 8.0; x += 0.1) {
        const sx = mapX(x);
        const sy = mapY(c.fn(x));
        if (x === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    });

    const curX = mapX(hdrIn);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(curX, ry0);
    ctx.lineTo(curX, ry1);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeTab, kernelN, hdrIn]);

  // Draw Tab 2 Lab 1: Convolution Kernel
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = convCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    let K = [
      [1 / 16, 2 / 16, 1 / 16],
      [2 / 16, 4 / 16, 2 / 16],
      [1 / 16, 2 / 16, 1 / 16]
    ];
    if (preset === 'sobel') K = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    if (preset === 'laplace') K = [[0, -1, 0], [-1, 4, -1], [0, -1, 0]];
    if (preset === 'sharpen') K = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
    K[1][1] += centerBias;

    let sumK = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        sumK += K[r][c];
        ctx.strokeStyle = 'rgba(148,163,184,0.4)';
        ctx.strokeRect(24 + c * 52, 48 + r * 52, 48, 48);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(K[r][c].toFixed(2), 32 + c * 52, 76 + r * 52);
      }
    }

    ctx.fillStyle = Math.abs(sumK - 1) < 0.05 || Math.abs(sumK) < 0.05 ? '#34d399' : '#fb7185';
    ctx.fillText(`∑ K = ${sumK.toFixed(2)}`, 24, 230);
  }, [activeTab, preset, centerBias]);

  // Draw Tab 2 Lab 2: HDR Bloom & ACES
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = hdrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const step = 8;
    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        const d1 = Math.hypot(px - W * 0.32, py - H * 0.5);
        const d2 = Math.hypot(px - W * 0.68, py - H * 0.5);
        let r = 0.06 + (d1 < 36 ? 8.5 : 0) + Math.exp(-(d1 * d1) / 2200) * bloomAmt * 4.5;
        let g = 0.08 + (d1 < 36 ? 3.2 : 0) + (d2 < 32 ? 6.4 : 0) + Math.exp(-(d2 * d2) / 2200) * bloomAmt * 3.8;
        let b = 0.15 + (d2 < 32 ? 8.2 : 0) + Math.exp(-(d2 * d2) / 2200) * bloomAmt * 4.8;
        r *= exposure;
        g *= exposure;
        b *= exposure;
        const fn = toneMode === 'aces' ? aces : toneMode === 'reinhard' ? (x: number) => x / (1 + x) : (x: number) => Math.min(1, x);
        const ro = Math.round(Math.pow(fn(r), 1 / 2.2) * 255);
        const go = Math.round(Math.pow(fn(g), 1 / 2.2) * 255);
        const bo = Math.round(Math.pow(fn(b), 1 / 2.2) * 255);
        ctx.fillStyle = `rgb(${ro}, ${go}, ${bo})`;
        ctx.fillRect(px, py, step, step);
      }
    }
  }, [activeTab, toneMode, exposure, bloomAmt]);

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

    const ok =
      (mission === 1 && m1Mode === 'sep1d') ||
      (mission === 2 && Math.abs(m2Center - 5.0) < 0.05) ||
      (mission === 3 && m3Mode === 'aces_bloom');

    ctx.fillStyle = ok ? '#34d399' : '#fb7185';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      ok ? 'POST-PROCESSING PIPELINE PASS ✓' : 'BOTTLENECK OR ARTIFACT DETECTED ✗',
      24,
      36
    );
  }, [activeTab, mission, m1Mode, m2Center, m3Mode]);

  const verifyMission = () => {
    if (mission === 1) {
      if (m1Mode === 'sep1d') {
        setPassed(prev => ({ ...prev, 1: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 1 通过！利用 rank(K)=1 外积分解，采样数从 961 次降至 62 次（15.5倍提速）！'
            : '✅ Mission 1 Passed! Separable 1D×2 blur reduces taps from 961 to 62 per pixel!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 2D 单通道循环每像素采样 N²=961 次！请切换为可分离 1D×2 管线。'
            : '⚠️ Brute-force 2D loop takes N²=961 taps! Switch to Separable 1D×2.'
        });
      }
    } else if (mission === 2) {
      if (Math.abs(m2Center - 5.0) < 0.05) {
        setPassed(prev => ({ ...prev, 2: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 2 通过！中心权重 c=5.0 使 ∑K = 5 - 4 = 1.0，严格保持直流平均亮度守恒！'
            : '✅ Mission 2 Passed! Center weight c=5.0 yields ∑K=1.0, conserving DC brightness!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? `⚠️ 当前中心权重 ${m2Center.toFixed(1)} 使 ∑K = ${(m2Center - 4).toFixed(1)} ≠ 1.0！请调至 5.0。`
            : '⚠️ Set center weight c = 5.0 so ∑K = 1.0!'
        });
      }
    } else {
      if (m3Mode === 'aces_bloom') {
        setPassed(prev => ({ ...prev, 3: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 3 通过！ACES Filmic S-Curve + 可分离高斯 Bloom 完美还原高光细节与光学散射光晕！'
            : '✅ Mission 3 Passed! ACES Filmic + HDR Bloom restores highlight gradients and optical glow!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ Hard Clip 会把 >1.0 的高光全部截断为死白色块！请切换为 ACES Filmic + HDR Bloom。'
            : '⚠️ Hard Clip crushes >1.0 highlights! Enable ACES Filmic + HDR Bloom.'
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
            <span>STAGE 6 · LESSON 30</span>
            <span>·</span>
            <span>MIT 6.837 LECTURE 21</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isZh
              ? '图像处理、卷积核与实时后处理管线 (Post-Processing)'
              : 'Image Processing, Convolution Kernels & Real-Time Post-Processing'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isZh
              ? '用秩-1 矩阵外积分解推导可分离高斯模糊 O(2N) 与 Sobel 算子，掌握 HDR 泛光 (Bloom) 与 ACES Filmic 色调映射曲线'
              : 'Rank-1 outer-product factorization for separable Gaussian blur & Sobel edges, HDR Bloom, and ACES Filmic tone mapping'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="lessons/lesson-30.html"
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
          { id: 1 as const, zh: '📐 1. 3Blue1Brown 秩-1 外积与色调映射', en: '📐 1. 3Blue1Brown Rank-1 Outer Product & ACES' },
          { id: 2 as const, zh: '🔬 2. 双实验台 (3×3 卷积核 + HDR ACES 台)', en: '🔬 2. Dual Labs (3×3 Kernel + HDR ACES)' },
          { id: 3 as const, zh: '🎥 3. MIT 6.837 L21 课堂精要', en: '🎥 3. MIT 6.837 L21 Course Companion' },
          { id: 4 as const, zh: '🎮 4. 闯关：首席后处理架构师 (3关)', en: '🎮 4. Game: Chief Post-Processing Architect (3 Missions)' }
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
                  ? '1. 秩-1 外积 K = g·gᵀ：为什么 2D 高斯模糊只需 2N 次采样？'
                  : '1. Rank-1 Outer Product K = g·gᵀ: O(N²) to O(2N)'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '二维高斯函数 e^{-(u²+v²)/(2σ²)} = e^{-u²/(2σ²)}·e^{-v²/(2σ²)} 意味着 N×N 高斯核矩阵的秩为 1，可分解为列向量 g 与行向量 gᵀ 的外积。利用卷积结合律 I*(g·gᵀ) = (I*g)*gᵀ，拆为水平 1D + 垂直 1D 两趟即可将 N² 降为 2N！'
                  : 'Because the 2D Gaussian factors into 1D Gaussians, the N×N kernel has rank 1 (K = g·gᵀ), reducing N² taps per pixel to 2N!'
                }
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h3 className="text-base font-bold text-amber-300">
                {isZh
                  ? '2. Reinhard vs ACES Filmic S-Curve 色调映射'
                  : '2. Reinhard vs. ACES Filmic S-Curve Tone Mapping'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '为了把 [0, ∞) 的 HDR 物理辐射亮度无损压缩到 [0, 1] 显示器，Reinhard 使用 x/(1+x)，而 ACES Filmic 使用二次有理分式同时构建暗部趾部 (Toe) 与高光平滑滚降肩部 (Shoulder)。'
                  : 'ACES Filmic maps [0, ∞) HDR radiance into [0, 1] with a crisp dark Toe and smooth highlight Shoulder.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <canvas
              ref={mathCanvasRef}
              width={540}
              height={290}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-300">Kernel Size N = {kernelN}</span>
                <input
                  type="range"
                  min={3}
                  max={35}
                  step={2}
                  value={kernelN}
                  onChange={e => setKernelN(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">HDR Input = {hdrIn.toFixed(1)} nits</span>
                <input
                  type="range"
                  min={0.2}
                  max={8.0}
                  step={0.1}
                  value={hdrIn}
                  onChange={e => setHdrIn(parseFloat(e.target.value))}
                  className="w-full"
                />
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
              {isZh ? '实验台 1：3×3 卷积核与权重和检验' : 'Lab 1: 3×3 Convolution Kernel Workbench'}
            </h3>
            <canvas
              ref={convCanvasRef}
              width={480}
              height={260}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex gap-2 text-xs">
              {(['gaussian', 'sobel', 'laplace', 'sharpen'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setPreset(p);
                    setCenterBias(0);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold border ${
                    preset === p ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh ? '实验台 2：HDR 曝光、泛光 (Bloom) 与 ACES 工作台' : 'Lab 2: HDR Exposure, Bloom & ACES Workbench'}
            </h3>
            <canvas
              ref={hdrCanvasRef}
              width={480}
              height={260}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex gap-2 text-xs">
              {(['aces', 'reinhard', 'clip'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setToneMode(m)}
                  className={`flex-1 py-1.5 rounded-lg font-bold border ${
                    toneMode === m ? 'bg-amber-500/25 border-amber-400 text-amber-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-300">Exposure: {exposure.toFixed(1)}</span>
                <input
                  type="range"
                  min={0.4}
                  max={3.5}
                  step={0.1}
                  value={exposure}
                  onChange={e => setExposure(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">Bloom: {bloomAmt.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={bloomAmt}
                  onChange={e => setBloomAmt(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">
            {isZh
              ? 'MIT 6.837 Lecture 21：Image Processing 课程精要'
              : 'MIT 6.837 Lecture 21: Image Processing Course Companion'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isZh
              ? 'Justin Solomon 教授在 MIT 6.837 第 21 讲中串联了空间域离散卷积、频率域卷积定理、Sobel 梯度边缘检测、双边滤波以及现代实时渲染中的 HDR 泛光与色调映射后处理管线。'
              : 'Prof. Justin Solomon covers discrete 2D convolution, separable filters, Sobel edge detection, bilateral filtering, and HDR tone mapping.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isZh ? '🎮 首席后处理管线架构师' : '🎮 Chief Post-Processing Architect'}
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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setM1Mode('brute2d')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m1Mode === 'brute2d' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Brute 2D (N²)
                </button>
                <button
                  onClick={() => setM1Mode('sep1d')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m1Mode === 'sep1d' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Separable 1D×2 (2N)
                </button>
              </div>
            )}

            {mission === 2 && (
              <div className="text-xs text-slate-300">
                <span>Center Weight c = {m2Center.toFixed(1)} (Target ∑K = c - 4 = 1.0)</span>
                <input
                  type="range"
                  min={3.0}
                  max={8.0}
                  step={0.5}
                  value={m2Center}
                  onChange={e => setM2Center(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {mission === 3 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setM3Mode('hard_clip')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Mode === 'hard_clip' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Hard Clip min(x,1)
                </button>
                <button
                  onClick={() => setM3Mode('aces_bloom')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Mode === 'aces_bloom' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  ACES + HDR Bloom
                </button>
              </div>
            )}

            <button
              onClick={verifyMission}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              {isZh ? '⚡ 验证后处理管线' : '⚡ Verify Post-Processing'}
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
              height={280}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
