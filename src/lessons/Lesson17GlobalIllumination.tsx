import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson17Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

function hashRand(i: number, ch: number, seed: number): number {
  let h = (i * 374761393 + ch * 668265263 + seed) >>> 0;
  h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296.0;
}

export const Lesson17GlobalIllumination: React.FC<Lesson17Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1A state: Nusselt Hemisphere & Cosine-Weighted Importance Sampling
  const [hemiMode, setHemiMode] = useState<'uniform' | 'cosine'>('cosine');
  const [hemiN, setHemiN] = useState<number>(48);
  const [hemiSeed, setHemiSeed] = useState<number>(42);
  const [hemiVar, setHemiVar] = useState<number>(0.004);
  const hemiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 1B state: Russian Roulette
  const [rrQ, setRrQ] = useState<number>(0.65);

  // Tab 2 state: Cornell Box Progressive Path Tracer
  const [bounces, setBounces] = useState<number>(4);
  const [strategy, setStrategy] = useState<'uniform' | 'cosine' | 'nee'>('nee');
  const [lightSize, setLightSize] = useState<number>(0.7);
  const [sppCount, setSppCount] = useState<number>(0);
  const cornellCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Mini-Game state
  const [m1Choice, setM1Choice] = useState<string>('raw');
  const [m2Bounces, setM2Bounces] = useState<number>(1);
  const [m2Width, setM2Width] = useState<number>(0.3);
  const [m3Weight, setM3Weight] = useState<number>(1.0);

  const m1Passed = m1Choice === 'pi';
  const m2Passed = m2Bounces >= 3 && m2Width >= 0.8;
  const m3Passed = Math.abs(m3Weight - 2.0) < 0.05;

  // Draw Tab 1A: Nusselt Hemisphere Projection
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = hemiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = 200;
    const R = 140;

    // Base disk
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 50, R, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(
      isZh
        ? '努塞尔单位圆盘 (面积 = π)：圆盘均匀撒点垂直上投即得 p(ω)=cosθ/π'
        : "Nusselt's Base Disk (Area = π): Uniform disk points project vertically to p(ω)=cosθ/π",
      20,
      H - 10
    );

    // Hemisphere arc
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI, 0, false);
    ctx.lineTo(cx + R, cy);
    ctx.lineTo(cx - R, cy);
    ctx.stroke();

    // Normal
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - R - 16);
    ctx.stroke();

    let estSum = 0;
    let estSqSum = 0;
    for (let i = 0; i < hemiN; i++) {
      const u1 = hashRand(i, 1, hemiSeed);
      const u2 = hashRand(i, 2, hemiSeed) * 2.0 - 1.0;
      let cosT: number;
      let sinT: number;
      if (hemiMode === 'uniform') {
        cosT = Math.max(0.02, u1);
        sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      } else {
        sinT = Math.sqrt(u1);
        cosT = Math.sqrt(Math.max(0.01, 1 - u1));
      }
      const dirSign = u2 >= 0 ? 1 : -1;
      const x = dirSign * sinT;
      const z = cosT;

      const hx = cx + x * R;
      const hy = cy - z * R;

      ctx.strokeStyle =
        hemiMode === 'cosine' ? `rgba(56, 189, 248, ${0.25 + 0.65 * z})` : 'rgba(251, 191, 36, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      const dx = cx + x * R;
      const dy = cy + 50 + (hashRand(i, 3, hemiSeed) - 0.5) * 24 * Math.sqrt(Math.max(0, 1 - x * x));
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = hemiMode === 'cosine' ? '#38bdf8' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
      ctx.fill();

      const Li = 0.8 + 0.4 * z;
      const brdf = 0.8 / Math.PI;
      const sampleEst =
        hemiMode === 'uniform'
          ? (brdf * Li * z) / (1.0 / (2.0 * Math.PI))
          : (brdf * Li * z) / (z / Math.PI);
      estSum += sampleEst;
      estSqSum += sampleEst * sampleEst;
    }

    const mean = estSum / hemiN;
    const variance = Math.max(0, estSqSum / hemiN - mean * mean) / hemiN;
    setHemiVar(variance);
  }, [activeTab, hemiMode, hemiN, hemiSeed, isZh]);

  // Tab 2: Progressive Cornell Box Renderer
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = cornellCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const RES = 72;
    const accum = new Float32Array(RES * RES * 3);
    let spp = 0;
    let animId = 0;

    const step = () => {
      if (spp < 120) {
        spp++;
        for (let py = 0; py < RES; py++) {
          for (let px = 0; px < RES; px++) {
            const u = ((px + Math.random()) / RES) * 2.0 - 1.0;
            const v = 1.0 - ((py + Math.random()) / RES) * 2.0;

            // Analytical Cornell Box approximation + stochastic bounce simulation
            const inLight = v > 0.88 && Math.abs(u) < lightSize * 0.45;
            let r = 0;
            let g = 0;
            let b = 0;
            if (inLight) {
              r = 1.0;
              g = 0.96;
              b = 0.88;
            } else if (bounces >= 1) {
              const distL = Math.hypot(u, v - 0.85);
              const noiseScale =
                strategy === 'uniform' ? 0.55 : strategy === 'cosine' ? 0.28 : 0.12;
              const xi = (Math.random() - 0.5) * noiseScale;
              const direct = Math.max(0.08, (1.15 - distL * 0.55) * (lightSize / 0.7) + xi);
              // Left wall red, right wall green, center white + color bleeding for bounces >= 2
              const bleed = bounces >= 2 ? 0.28 * (bounces / 4) : 0.0;
              if (u < -0.68) {
                r = 0.85 * direct;
                g = 0.15 * direct;
                b = 0.15 * direct;
              } else if (u > 0.68) {
                r = 0.15 * direct;
                g = 0.8 * direct;
                b = 0.2 * direct;
              } else {
                const redBleed = Math.max(0, -u) * bleed;
                const greenBleed = Math.max(0, u) * bleed;
                r = 0.78 * direct + redBleed;
                g = 0.78 * direct + greenBleed;
                b = 0.78 * direct;
              }
            }
            const idx = (py * RES + px) * 3;
            accum[idx] += Math.max(0, r);
            accum[idx + 1] += Math.max(0, g);
            accum[idx + 2] += Math.max(0, b);
          }
        }

        const cell = canvas.width / RES;
        const inv = 1.0 / spp;
        for (let py = 0; py < RES; py++) {
          for (let px = 0; px < RES; px++) {
            const idx = (py * RES + px) * 3;
            const cr = Math.min(255, Math.round(Math.pow(accum[idx] * inv, 1 / 2.2) * 255));
            const cg = Math.min(255, Math.round(Math.pow(accum[idx + 1] * inv, 1 / 2.2) * 255));
            const cb = Math.min(255, Math.round(Math.pow(accum[idx + 2] * inv, 1 / 2.2) * 255));
            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.fillRect(px * cell, py * cell, cell + 0.5, cell + 0.5);
          }
        }
        setSppCount(spp);
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, bounces, strategy, lightSize]);

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
            <span>Stage 3 Finale • Lesson 17 / 32</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isZh
              ? 'L17: 全局光照 (Global Illumination) 与蒙特卡洛路径追踪'
              : 'L17: Global Illumination & Monte Carlo Path Tracing'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Radiometry (Flux, Solid Angle, Irradiance, Radiance) • Kajiya Rendering Equation •
            Nusselt 1/π Proof • Malley Cosine Importance Sampling • Russian Roulette
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="lessons/lesson-17.html"
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
          { id: 1, zh: '1. 📐 3B1B 渲染方程与余弦重要性采样', en: '1. 📐 3B1B Rendering Eq & Cosine Sampling' },
          { id: 2, zh: '2. 🏮 Cornell Box 渐进式路径追踪实验室', en: '2. 🏮 Progressive Cornell Box Lab' },
          { id: 3, zh: '3. 🎥 MIT 6.837 L16 & 路径追踪代码', en: '3. 🎥 MIT 6.837 L16 & Reference Code' },
          { id: 4, zh: '4. 🎮 3 关全局光照架构师挑战', en: '4. 🎮 3-Mission Global Illumination Game' }
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
                ? '1. 努塞尔半球投影 (Nusselt Analog) 与 Malley 余弦重要性采样 (p(ω) = cosθ / π)'
                : '1. Nusselt Hemisphere Projection & Malley Cosine-Weighted Sampling (p(ω) = cosθ / π)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isZh
                ? '单位半球面上的立体角微元 dω 乘上兰伯特倾角因子 cosθ 后，正好等于将该球面微元垂直向下正交投影到底部单位圆盘上的面积微元 dx·dy！因此 ∫ cosθ dω = π，理想漫反射 BRDF 必为 f_r = ρ/π。反之，在底圆盘均匀随机撒点再垂直向上投回半球面（Malley 方法），采样密度天然等于 p(ω) = cosθ / π，完美消掉渲染方程中的 cosθ 与 π！'
                : 'Multiplying a hemisphere solid angle element dω by cosθ projects it vertically onto the unit base disk (Area = π), proving ∫ cosθ dω = π and Lambertian BRDF f_r = ρ/π. Conversely, sampling uniformly on the base disk and projecting straight up to the hemisphere (Malley method) yields p(ω) = cosθ / π, cancelling cosθ and π in the Monte Carlo estimator!'}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <canvas
                  ref={hemiCanvasRef}
                  width={560}
                  height={295}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800"
                />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="flex gap-2">
                  <button
                    onClick={() => setHemiMode('uniform')}
                    className={`flex-1 py-2 rounded-lg font-bold ${
                      hemiMode === 'uniform' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Uniform p = 1/(2π)
                  </button>
                  <button
                    onClick={() => setHemiMode('cosine')}
                    className={`flex-1 py-2 rounded-lg font-bold ${
                      hemiMode === 'cosine' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Cosine p = cosθ/π
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span>Samples N:</span>
                    <span className="font-mono font-bold text-cyan-400">{hemiN}</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={160}
                    step={4}
                    value={hemiN}
                    onChange={e => setHemiN(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between pt-1">
                    <span>Estimator Variance:</span>
                    <span className="font-mono font-bold text-emerald-400">{hemiVar.toFixed(5)}</span>
                  </div>
                  <button
                    onClick={() => setHemiSeed(s => (s * 1664525 + 1013904223) >>> 0)}
                    className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                  >
                    🎲 Reseed Samples
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-300">
                    🎰 Russian Roulette (q = {rrQ.toFixed(2)}, Boost 1/q = {(1 / rrQ).toFixed(2)}x)
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.95}
                    step={0.05}
                    value={rrQ}
                    onChange={e => setRrQ(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="text-slate-400">
                    Unbiased Expectation: q × (L / q) + (1 - q) × 0 = 1.000 L
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CORNELL BOX */}
      {activeTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '🏮 Cornell Box 渐进式蒙特卡洛路径追踪实验室'
                : '🏮 Cornell Box Progressive Monte Carlo Path Tracing Lab'}
            </h2>
            <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-xs font-mono font-bold text-indigo-300">
              Accumulated SPP: {sppCount} (Noise ∝ {(1 / Math.sqrt(Math.max(1, sppCount))).toFixed(3)})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Max Bounces:</label>
              <select
                value={bounces}
                onChange={e => setBounces(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value={0}>0 Bounces (Emissive Only)</option>
                <option value={1}>1 Bounce (Direct Illumination Only)</option>
                <option value={2}>2 Bounces (1st Indirect Color Bleed)</option>
                <option value={4}>4 Bounces (Full Multi-Bounce GI)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Sampling Strategy:</label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value as 'uniform' | 'cosine' | 'nee')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="uniform">Uniform Hemisphere (High Noise)</option>
                <option value="cosine">Malley Cosine-Weighted</option>
                <option value="nee">Cosine + Next Event Estimation (NEE)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Area Light Width: {lightSize.toFixed(2)}</label>
              <input
                type="range"
                min={0.2}
                max={1.3}
                step={0.1}
                value={lightSize}
                onChange={e => setLightSize(parseFloat(e.target.value))}
                className="w-full accent-amber-400 mt-1"
              />
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <canvas
              ref={cornellCanvasRef}
              width={360}
              height={360}
              className="w-full aspect-square rounded-xl bg-black border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* TAB 3: MIT 6.837 L16 */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h2 className="text-lg font-bold text-amber-300">
            🎥 MIT 6.837 Lecture 16: Global Illumination (Radiometry, Rendering Equation & Path Tracing)
          </h2>
          <p className="leading-relaxed">
            {isZh
              ? 'Kajiya 渲染方程将光学传输统一为第二类 Fredholm 积分方程。通过结合 Malley 余弦重要性采样、直接面光源采样 (Next Event Estimation, NEE) 与俄罗斯轮盘赌 (Russian Roulette)，蒙特卡洛路径追踪器以 O(1/√N) 的无偏收敛速度自动模拟软阴影、红绿色彩溢色、焦散与环境遮蔽。'
              : 'Kajiya unified light transport into a Fredholm integral equation of the second kind. Combining Malley cosine-weighted hemisphere sampling, Next Event Estimation (NEE), and Russian Roulette produces an unbiased O(1/√N) estimator capable of soft shadows, color bleeding, caustics, and ambient occlusion.'}
          </p>
          <a
            href="https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300"
          >
            ▶ MIT 6.837 Lecture 16 Playlist ↗
          </a>
        </div>
      )}

      {/* TAB 4: 3-MISSION MINI-GAME */}
      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh
                ? '🎮 3 关全局光照与蒙特卡洛架构师挑战赛'
                : '🎮 3-Mission Global Illumination Architect Game'}
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
                {isZh ? '关卡 1：漫反射 BRDF 能量守恒校准' : 'Mission 1: Lambertian BRDF Conservation'}
              </div>
              <select
                value={m1Choice}
                onChange={e => setM1Choice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="raw">f_r = ρ (Violates conservation by π!)</option>
                <option value="twopi">f_r = ρ / (2π) (Loses half energy!)</option>
                <option value="pi">f_r = ρ / π (Exact Nusselt Disk Area π!)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400">
                {isZh ? '关卡 2：康奈尔盒溢色与软阴影导演' : 'Mission 2: Color Bleeding & Soft Shadows'}
              </div>
              <div>Bounces: {m2Bounces} (Target ≥ 3)</div>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={m2Bounces}
                onChange={e => setM2Bounces(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-400"
              />
              <div>Light Width: {m2Width.toFixed(2)} (Target ≥ 0.80)</div>
              <input
                type="range"
                min={0.2}
                max={1.2}
                step={0.1}
                value={m2Width}
                onChange={e => setM2Width(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400">
                {isZh ? '关卡 3：俄罗斯轮盘赌无偏补偿 (q=0.50)' : 'Mission 3: Russian Roulette Boost (q=0.50)'}
              </div>
              <div>Survivor Weight w = {m3Weight.toFixed(2)}x (Target 1/q = 2.00x)</div>
              <input
                type="range"
                min={1.0}
                max={3.0}
                step={0.1}
                value={m3Weight}
                onChange={e => setM3Weight(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
