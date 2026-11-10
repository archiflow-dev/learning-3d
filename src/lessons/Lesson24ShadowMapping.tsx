import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson24Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type SoftShadowMode = 'hard' | 'wrongblur' | 'pcf' | 'pcss';

export const Lesson24ShadowMapping: React.FC<Lesson24Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Texel Stair-Step & Slope-Scale Bias Microscope
  const [slopeTheta, setSlopeTheta] = useState<number>(32);
  const [texelSpan, setTexelSpan] = useState<number>(96);
  const [appliedBias, setAppliedBias] = useState<number>(8);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: Dual-View Shadow Map Debugger
  const [res, setRes] = useState<number>(32);
  const [constBias, setConstBias] = useState<number>(0.008);
  const [slopeBias, setSlopeBias] = useState<number>(0.024);
  const [hillDeg, setHillDeg] = useState<number>(38);
  const lab1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: Pre-Blurred Depth vs PCF vs PCSS Studio
  const [softMode, setSoftMode] = useState<SoftShadowMode>('pcss');
  const [lightSize, setLightSize] = useState<number>(28);
  const [gridRes, setGridRes] = useState<number>(48);
  const lab2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4: 3-Mission Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [gameConst, setGameConst] = useState<number>(0.002);
  const [gameSlope, setGameSlope] = useState<number>(0.004);
  const [gameFilter, setGameFilter] = useState<'hard' | 'wrong_blur' | 'pcf' | 'pcss'>('hard');
  const [gameFeedback, setGameFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const tanTheta = Math.tan((slopeTheta * Math.PI) / 180);
    const startX = 50;
    const endX = W - 40;
    const baseY = 85;
    const surfaceY = (x: number) => baseY + (x - startX) * tanTheta * 0.48;

    for (let tx = startX; tx < endX; tx += texelSpan) {
      const cx = tx + texelSpan * 0.5;
      const zMapY = surfaceY(cx) + appliedBias * 0.48;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, zMapY);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, zMapY);
      ctx.lineTo(Math.min(endX, tx + texelSpan), zMapY);
      ctx.stroke();

      const segSteps = 20;
      const stepW = Math.min(texelSpan, endX - tx) / segSteps;
      for (let i = 0; i < segSteps; i++) {
        const sx0 = tx + i * stepW;
        const sx1 = sx0 + stepW;
        const sy0 = surfaceY(sx0);
        const sy1 = surfaceY(sx1);
        const isFalseShadow = (sy0 + sy1) * 0.5 > zMapY + 0.5;
        ctx.strokeStyle = isFalseShadow ? '#f43f5e' : '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sx0, sy0);
        ctx.lineTo(sx1, sy1);
        ctx.stroke();
      }
    }
  }, [activeTab, slopeTheta, texelSpan, appliedBias]);

  // Draw Tab 2 Lab 1 & Lab 2
  useEffect(() => {
    if (activeTab !== 2) return;
    const c1 = lab1CanvasRef.current;
    if (c1) {
      const ctx = c1.getContext('2d');
      if (ctx) {
        const W = c1.width;
        const H = c1.height;
        ctx.clearRect(0, 0, W, H);

        const tanHill = Math.tan((hillDeg * Math.PI) / 180) * 0.45;
        const sceneDepthAt = (u: number, v: number) => {
          const groundZ = 0.25 + u * tanHill;
          if (u >= 0.42 && u <= 0.56 && v >= 0.36 && v <= 0.64) {
            return Math.min(groundZ, 0.22);
          }
          return groundZ;
        };

        const shadowMap = new Float32Array(res * res);
        for (let iv = 0; iv < res; iv++) {
          for (let iu = 0; iu < res; iu++) {
            shadowMap[iv * res + iu] = sceneDepthAt((iu + 0.5) / res, (iv + 0.5) / res);
          }
        }

        const leftX = 16;
        const leftY = 24;
        const viewSz = 300;
        const cellPx = viewSz / res;
        for (let iv = 0; iv < res; iv++) {
          for (let iu = 0; iu < res; iu++) {
            const d = shadowMap[iv * res + iu];
            const g = Math.max(15, Math.min(245, Math.floor((1.0 - d * 0.9) * 240)));
            ctx.fillStyle = `rgb(${g},${g},${g + 10})`;
            ctx.fillRect(leftX + iu * cellPx, leftY + iv * cellPx, Math.ceil(cellPx), Math.ceil(cellPx));
          }
        }

        const rightX = 340;
        const rightY = 24;
        const img = ctx.createImageData(viewSz, viewSz);
        const data = img.data;
        const totalBias = constBias + slopeBias * tanHill;

        for (let py = 0; py < viewSz; py++) {
          for (let px = 0; px < viewSz; px++) {
            const u = px / viewSz;
            const v = py / viewSz;
            const isPillar = u >= 0.34 && u <= 0.48 && v >= 0.36 && v <= 0.64;
            const uLight = isPillar ? 0.48 : u - 0.08;
            const iu = Math.max(0, Math.min(res - 1, Math.floor(uLight * res)));
            const iv = Math.max(0, Math.min(res - 1, Math.floor(v * res)));
            const zMap = shadowMap[iv * res + iu];
            const zCurr = isPillar ? 0.22 : 0.25 + uLight * tanHill;
            const inShadow = !isPillar && zCurr - totalBias > zMap;
            const idx = (py * viewSz + px) * 4;
            if (isPillar) {
              data[idx] = 99;
              data[idx + 1] = 102;
              data[idx + 2] = 241;
            } else if (inShadow) {
              data[idx] = 22;
              data[idx + 1] = 28;
              data[idx + 2] = 48;
            } else {
              data[idx] = 52;
              data[idx + 1] = 211;
              data[idx + 2] = 153;
            }
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(img, rightX, rightY);
      }
    }

    const c2 = lab2CanvasRef.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const W = c2.width;
        const H = c2.height;
        const img = ctx.createImageData(W, H);
        const data = img.data;
        const baseX = 150;
        const baseY = H - 45;

        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const qx = Math.floor((x / W) * gridRes) * (W / gridRes);
            const qy = Math.floor((y / H) * gridRes) * (H / gridRes);
            const tAlong = Math.max(0, Math.min(1.2, (baseY - y) / 260));
            const shadowCenterX = baseX + tAlong * 240;
            const halfWidth = 32;
            let visibility = 1.0;

            if (softMode === 'hard') {
              visibility = Math.abs(qx - shadowCenterX) < halfWidth && tAlong >= 0 && tAlong <= 1.0 ? 0.0 : 1.0;
            } else if (softMode === 'wrongblur') {
              visibility = Math.abs(qx - shadowCenterX + Math.sin(qy * 0.15) * 4) < halfWidth && tAlong >= 0 && tAlong <= 1.0 ? 0.0 : 1.0;
            } else if (softMode === 'pcf') {
              const radius = lightSize * 0.75;
              const dx = Math.abs(x - shadowCenterX);
              if (tAlong >= 0 && tAlong <= 1.05) {
                const raw = Math.max(0, Math.min(1, (dx - halfWidth + radius) / (2 * Math.max(1, radius))));
                visibility = raw * raw * (3 - 2 * raw);
              }
            } else {
              const radius = Math.max(1.2, lightSize * 1.35 * tAlong);
              const dx = Math.abs(x - shadowCenterX);
              if (tAlong >= 0 && tAlong <= 1.05) {
                const raw = Math.max(0, Math.min(1, (dx - halfWidth + radius) / (2 * radius)));
                visibility = raw * raw * (3 - 2 * raw);
              }
            }

            const checker = (Math.floor(x / 32) + Math.floor(y / 32)) & 1 ? 1.0 : 0.86;
            const shade = (0.18 + 0.82 * visibility) * checker;
            const idx = (y * W + x) * 4;
            data[idx] = Math.floor(45 * shade);
            data[idx + 1] = Math.floor(195 * shade);
            data[idx + 2] = Math.floor(215 * shade);
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    }
  }, [activeTab, res, constBias, slopeBias, hillDeg, softMode, lightSize, gridRes]);

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

    const hasAcne = gameSlope < 0.018 && gameConst < 0.015;
    const hasPeter = gameConst > 0.030;

    for (let y = 0; y < H; y += 3) {
      const t = (H - 36 - y) / 240;
      const center = 170 + Math.max(0, t) * 210;
      for (let x = 0; x < W; x += 4) {
        let vis = 1.0;
        const dx = Math.abs(x - center - (hasPeter ? 40 : 0));
        if (t >= 0 && t <= 1.0) {
          if (gameFilter === 'hard' || gameFilter === 'wrong_blur') {
            vis = dx < 30 ? 0.0 : 1.0;
          } else if (gameFilter === 'pcf') {
            vis = Math.max(0, Math.min(1, (dx - 15) / 30));
          } else {
            const rad = Math.max(2, 36 * t);
            vis = Math.max(0, Math.min(1, (dx - 30 + rad) / (2 * rad)));
          }
        }
        if (hasAcne && Math.floor(x / 16) % 2 === 0) {
          vis *= 0.35;
        }
        const shade = 0.2 + 0.8 * vis;
        ctx.fillStyle = `rgb(${Math.floor(45 * shade)},${Math.floor(195 * shade)},${Math.floor(165 * shade)})`;
        ctx.fillRect(x, y, 4, 3);
      }
    }
  }, [activeTab, gameConst, gameSlope, gameFilter]);

  const handleVerifyMission = () => {
    const biasClean = gameSlope >= 0.020 && gameSlope <= 0.048 && gameConst <= 0.026;
    let ok = false;
    if (mission === 1) ok = biasClean;
    else if (mission === 2) ok = biasClean && (gameFilter === 'pcf' || gameFilter === 'pcss');
    else ok = biasClean && gameFilter === 'pcss';

    if (ok) {
      setPassed(prev => ({ ...prev, [mission]: true }));
      setGameFeedback({
        ok: true,
        msg: isZh
          ? `🎉 恭喜通过关卡 ${mission}！你的 Shadow Map 偏移与 PCSS 软阴影管线完全达标！`
          : `🎉 Mission ${mission} Complete! Your Shadow Map bias and PCSS soft-shadow pipeline is verified!`
      });
    } else {
      setGameFeedback({
        ok: false,
        msg: isZh
          ? '⚠️ 参数未达标：请确保 Slope-Scale Bias 在 [0.020, 0.045] 之间、Constant Bias <= 0.025，并选择对应的 PCF / PCSS 模式！'
          : '⚠️ Check that Slope-Scale Bias is in [0.020, 0.045], Constant Bias <= 0.025, and PCF / PCSS mode matches the mission!'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
            <button onClick={onBackToPortal} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
              {isZh ? '← 返回课程总目录' : '← Back to Index'}
            </button>
            <span>•</span>
            <span>Stage 4 • L24</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isZh
              ? 'L24: 阴影算法 (Part 2)：Shadow Mapping、深度偏移与软阴影 PCF / PCSS'
              : 'L24: Two-Pass Shadow Mapping, Slope-Scale Bias & PCF / PCSS Soft Shadows'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="lessons/lesson-24.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
          >
            {isZh ? '↗ 打开独立全屏 HTML 实验室' : '↗ Open Standalone HTML Lab'}
          </a>
          <button
            onClick={onToggleComplete}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isCompleted ? (isZh ? '✓ 已完成' : '✓ Completed') : isZh ? '标记为已完成' : 'Mark Completed'}
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 1 as const, zh: '📐 1. 核心数学与 3B1B 直觉', en: '📐 1. Core Math & 3B1B Intuition' },
          { id: 2 as const, zh: '🔬 2. 双视角 Shadow Map 与 PCF/PCSS 实验室', en: '🔬 2. Dual-View Shadow Map & PCF/PCSS Labs' },
          { id: 3 as const, zh: '🎬 3. 名校公开课与笔记', en: '🎬 3. Course Videos & Notes' },
          { id: 4 as const, zh: '🎮 4. 闯关游戏：首席阴影渲染工程师', en: '🎮 4. Game: Chief Shadow Engineer' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isZh ? t.zh : t.en}
          </button>
        ))}
      </div>

      {activeTab === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">
            {isZh
              ? '纹素阶梯量化与 Δz_max = (Δs/2)tan(θ) 斜率偏移几何显微镜'
              : 'Texel Stair-Step Quantization & Δz_max = (Δs/2)tan(θ) Slope-Scale Bias Microscope'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800">
              <canvas ref={mathCanvasRef} width={660} height={320} className="w-full rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '表面倾角 θ' : 'Surface Slope θ'}</span>
                  <span className="font-mono text-indigo-400">{slopeTheta}°</span>
                </div>
                <input type="range" min={5} max={62} step={1} value={slopeTheta} onChange={e => setSlopeTheta(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '纹素跨度 Δs' : 'Texel Span Δs'}</span>
                  <span className="font-mono text-cyan-400">{texelSpan} px</span>
                </div>
                <input type="range" min={48} max={140} step={4} value={texelSpan} onChange={e => setTexelSpan(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '当前深度偏移 ε' : 'Applied Depth Bias ε'}</span>
                  <span className="font-mono text-emerald-400">{appliedBias} px</span>
                </div>
                <input type="range" min={0} max={85} step={1} value={appliedBias} onChange={e => setAppliedBias(parseInt(e.target.value, 10))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {isZh ? '实验台 1：Shadow Map 双视角同步调试台 (光源深度图 + 主相机视图)' : 'Lab 1: Dual-View Shadow Map Debugger'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab1CanvasRef} width={660} height={340} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '深度图分辨率' : 'Resolution'}</span>
                    <span className="font-mono text-cyan-400">{res}x{res}</span>
                  </div>
                  <input type="range" min={16} max={96} step={8} value={res} onChange={e => setRes(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Constant Bias</span>
                    <span className="font-mono text-indigo-400">{constBias.toFixed(3)}</span>
                  </div>
                  <input type="range" min={0} max={0.16} step={0.002} value={constBias} onChange={e => setConstBias(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Slope-Scale Bias</span>
                    <span className="font-mono text-emerald-400">{slopeBias.toFixed(3)}</span>
                  </div>
                  <input type="range" min={0} max={0.08} step={0.002} value={slopeBias} onChange={e => setSlopeBias(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '山坡倾角' : 'Hill Slope'}</span>
                    <span className="font-mono text-amber-400">{hillDeg}°</span>
                  </div>
                  <input type="range" min={10} max={60} step={2} value={hillDeg} onChange={e => setHillDeg(parseInt(e.target.value, 10))} className="w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {isZh ? '实验台 2：错误预模糊深度 vs. PCF vs. PCSS 接触硬化软阴影' : 'Lab 2: Wrong Pre-Blur vs. PCF vs. PCSS Contact Hardening'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(['hard', 'wrongblur', 'pcf', 'pcss'] as SoftShadowMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setSoftMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      softMode === m ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab2CanvasRef} width={660} height={340} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '面光源尺寸 w_light' : 'Area Light Size'}</span>
                    <span className="font-mono text-cyan-400">{lightSize}</span>
                  </div>
                  <input type="range" min={4} max={56} step={2} value={lightSize} onChange={e => setLightSize(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '纹素网格密度' : 'Texel Grid'}</span>
                    <span className="font-mono text-indigo-400">{gridRes}x{gridRes}</span>
                  </div>
                  <input type="range" min={20} max={80} step={4} value={gridRes} onChange={e => setGridRes(parseInt(e.target.value, 10))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">UC Davis ECS 175 • Lecture 19</div>
            <h3 className="text-base font-bold text-white">Shadows, Part 2 (Prof. Kenneth Joy)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '讲解 Lance Williams 双遍 Shadow Z-Buffer 算法、离散深度自遮挡伪影与 PCF 多样本软阴影过滤。'
                : 'Covers Lance Williams two-pass Shadow Z-Buffer, self-shadowing quantization, and PCF soft shadows.'}
            </p>
          </div>
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-cyan-400">MIT 6.837 • Lecture 19</div>
            <h3 className="text-base font-bold text-white">Shadow Maps (Prof. Justin Solomon)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '严格推导 Slope-Scale Depth Bias、为什么 H(E[z]) != E[H(z)]，以及 PCF、PCSS 与级联阴影图 (CSM)。'
                : 'Derives Slope-Scale Depth Bias, why H(E[z]) != E[H(z)], PCF, PCSS, and Cascaded Shadow Maps (CSM).'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3] as const).map(m => (
              <button
                key={m}
                onClick={() => {
                  setMission(m);
                  setGameFeedback(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  mission === m ? 'border-indigo-500 bg-indigo-600/20 text-white' : 'border-slate-800 bg-slate-950 text-slate-300'
                }`}
              >
                Mission 0{m} {passed[m] ? '✅' : ''}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 rounded-xl p-3 border border-slate-800">
              <canvas ref={gameCanvasRef} width={640} height={320} className="w-full rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Constant Bias</span>
                  <span className="font-mono text-indigo-400">{gameConst.toFixed(3)}</span>
                </div>
                <input type="range" min={0} max={0.12} step={0.002} value={gameConst} onChange={e => setGameConst(parseFloat(e.target.value))} className="w-full" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Slope-Scale Bias</span>
                  <span className="font-mono text-emerald-400">{gameSlope.toFixed(3)}</span>
                </div>
                <input type="range" min={0} max={0.06} step={0.002} value={gameSlope} onChange={e => setGameSlope(parseFloat(e.target.value))} className="w-full" />
              </div>

              <select
                value={gameFilter}
                onChange={e => setGameFilter(e.target.value as 'hard' | 'wrong_blur' | 'pcf' | 'pcss')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="hard">1-Tap Hard Shadow</option>
                <option value="wrong_blur">Pre-Blur Depth Map First (H(E[z]))</option>
                <option value="pcf">5x5 Percentage Closer Filtering (PCF)</option>
                <option value="pcss">PCSS Contact-Hardening Soft Shadows</option>
              </select>

              <button
                onClick={handleVerifyMission}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white"
              >
                {isZh ? '🚀 验证阴影渲染管线' : '🚀 Verify Shadow Pipeline'}
              </button>

              {gameFeedback && (
                <div className={`p-3 rounded-lg font-semibold ${gameFeedback.ok ? 'bg-emerald-950/80 text-emerald-300' : 'bg-rose-950/80 text-rose-300'}`}>
                  {gameFeedback.msg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
