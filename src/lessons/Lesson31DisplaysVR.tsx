import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson31Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson31DisplaysVR: React.FC<Lesson31Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Binocular Disparity & VAC
  const [zVirt, setZVirt] = useState<number>(0.55);
  const [ipd, setIpd] = useState<number>(64);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: VR Lens Pre-Warp & Chromatic Aberration
  const [k1, setK1] = useState<number>(0.34);
  const [ca, setCa] = useState<number>(0.06);
  const vrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: Subpixel Layout & ClearType
  const [layout, setLayout] = useState<'stripe' | 'pentile'>('stripe');
  const [fontMode, setFontMode] = useState<'bilevel' | 'gray' | 'cleartype'>('cleartype');
  const subCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [m1K, setM1K] = useState<number>(0.04);
  const [m2Ca, setM2Ca] = useState<number>(0.0);
  const [m3Mode, setM3Mode] = useState<'whole_px' | 'cleartype_3x'>('whole_px');
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

    const cx = W * 0.5;
    const eyeY = H - 40;
    const halfB = (ipd / 64) * 65;
    const mapZ = (z: number) => eyeY - (z / 2.8) * (H - 80);
    const focalY = mapZ(1.8);
    const objY = mapZ(zVirt);

    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(56,189,248,0.5)';
    ctx.beginPath();
    ctx.moveTo(40, focalY);
    ctx.lineTo(W - 40, focalY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - halfB, eyeY);
    ctx.lineTo(cx, objY);
    ctx.moveTo(cx + halfB, eyeY);
    ctx.lineTo(cx, objY);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, objY, 7, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, zVirt, ipd]);

  // Draw Tab 2 Lab 1: VR Pre-Warp
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = vrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const drawGrid = (cx: number, cy: number, rad: number, isRetinal: boolean) => {
      const dk = isRetinal ? k1 - 0.34 : k1;
      const dca = isRetinal ? ca - 0.06 : ca;
      [
        { col: '#f43f5e', c: dk - dca },
        { col: '#10b981', c: dk },
        { col: '#38bdf8', c: dk + dca }
      ].forEach(ch => {
        ctx.strokeStyle = ch.col;
        ctx.lineWidth = 1.5;
        for (let g = -0.8; g <= 0.81; g += 0.25) {
          ctx.beginPath();
          for (let x = -0.8; x <= 0.81; x += 0.1) {
            const s = 1 + ch.c * (x * x + g * g);
            const sx = cx + x * s * rad;
            const sy = cy + g * s * rad;
            if (x === -0.8) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
      });
    };

    drawGrid(W * 0.26, H * 0.52, 95, false);
    drawGrid(W * 0.74, H * 0.52, 95, true);
  }, [activeTab, k1, ca]);

  // Draw Tab 2 Lab 2: Subpixels
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = subCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cols = 8;
    const rows = 5;
    const cell = 38;
    const ox = (W - cols * cell) * 0.5;
    const oy = 32;

    const cov = (x: number, r: number) => Math.max(0, Math.min(1, 1.35 - Math.abs(x - (2.2 + r * 0.65))));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = ox + c * cell;
        const py = oy + r * cell;
        ctx.strokeStyle = 'rgba(148,163,184,0.2)';
        ctx.strokeRect(px, py, cell, cell);
        const iR = fontMode === 'cleartype' ? cov(c + 0.16, r) : cov(c + 0.5, r);
        const iG = cov(c + 0.5, r);
        const iB = fontMode === 'cleartype' ? cov(c + 0.84, r) : cov(c + 0.5, r);

        if (layout === 'stripe') {
          const sw = (cell - 6) / 3;
          ctx.fillStyle = `rgba(244,63,94,${0.15 + 0.85 * iR})`;
          ctx.fillRect(px + 2, py + 3, sw - 1, cell - 6);
          ctx.fillStyle = `rgba(16,185,129,${0.15 + 0.85 * iG})`;
          ctx.fillRect(px + 2 + sw, py + 3, sw - 1, cell - 6);
          ctx.fillStyle = `rgba(56,189,248,${0.15 + 0.85 * iB})`;
          ctx.fillRect(px + 2 + 2 * sw, py + 3, sw - 1, cell - 6);
        } else {
          ctx.fillStyle = `rgba(16,185,129,${0.15 + 0.85 * iG})`;
          ctx.beginPath();
          ctx.arc(px + cell * 0.32, py + cell * 0.5, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = (r + c) % 2 === 0 ? `rgba(244,63,94,${0.15 + 0.85 * iR})` : `rgba(56,189,248,${0.15 + 0.85 * iB})`;
          ctx.beginPath();
          ctx.arc(px + cell * 0.72, py + cell * 0.5, 8.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [activeTab, layout, fontMode]);

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
      (mission === 1 && Math.abs(m1K - 0.36) <= 0.03) ||
      (mission === 2 && Math.abs(m2Ca - 0.08) <= 0.015) ||
      (mission === 3 && m3Mode === 'cleartype_3x');

    ctx.fillStyle = ok ? '#34d399' : '#fb7185';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(ok ? 'OPTICAL & DISPLAY CALIBRATION PASS ✓' : 'DISTORTION / FRINGING DETECTED ✗', 24, 34);
  }, [activeTab, mission, m1K, m2Ca, m3Mode]);

  const verifyMission = () => {
    if (mission === 1) {
      if (Math.abs(m1K - 0.36) <= 0.03) {
        setPassed(prev => ({ ...prev, 1: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 1 通过！枕形预畸变 k₁ ≈ +0.36 完美抵消菲涅尔桶形透镜畸变！'
            : '✅ Mission 1 Passed! Pincushion pre-warp k₁ ≈ +0.36 cancels lens barrel distortion!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh ? '⚠️ 请将 k₁ 调至 +0.36 左右以抵消 -0.36 的桶形畸变！' : '⚠️ Tune k₁ near +0.36!'
        });
      }
    } else if (mission === 2) {
      if (Math.abs(m2Ca - 0.08) <= 0.015) {
        setPassed(prev => ({ ...prev, 2: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 2 通过！分通道径向补偿 Δk_B = 0.08 彻底消除横向色差紫边！'
            : '✅ Mission 2 Passed! Per-channel Δk_B = 0.08 eliminates chromatic aberration!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh ? '⚠️ 请将蓝通道径向补偿 Δk_B 调至 0.08！' : '⚠️ Set Δk_B to 0.08!'
        });
      }
    } else {
      if (m3Mode === 'cleartype_3x') {
        setPassed(prev => ({ ...prev, 3: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 3 通过！ClearType 3× 次像素相移采样将水平有效清晰度提升 3 倍！'
            : '✅ Mission 3 Passed! ClearType 3× subpixel sampling triples horizontal text resolution!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh ? '⚠️ 请切换为 ClearType 3× 次像素采样管线！' : '⚠️ Switch to ClearType 3×!'
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
            <span>STAGE 6 · LESSON 31</span>
            <span>·</span>
            <span>UCD ECS 175 L21 & MIT 6.837 L22</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isZh
              ? '显示设备原理、VR 光学与图形学分支全景'
              : 'Display Principles, VR Optics & Branches in Computer Graphics'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isZh
              ? '从双目视差三角、辐辏-调节冲突 (VAC)、VR 枕形预畸变与消色差到 RGB/PenTile 子像素超分辨'
              : 'Binocular disparity, VAC conflict, VR lens pre-distortion, RGB/PenTile subpixels & CG branches'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="lessons/lesson-31.html"
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
          { id: 1 as const, zh: '📐 1. 3Blue1Brown 视差与透镜逆畸变', en: '📐 1. 3Blue1Brown Disparity & Lens Inverse' },
          { id: 2 as const, zh: '🔬 2. 双实验台 (VR 预畸变 + 子像素显微镜)', en: '🔬 2. Dual Labs (VR Pre-Warp + Subpixels)' },
          { id: 3 as const, zh: '🎥 3. UCD L21 & MIT L22 图形学全景', en: '🎥 3. UCD L21 & MIT L22 CG Panorama' },
          { id: 4 as const, zh: '🎮 4. 闯关：首席 XR 光学架构师 (3关)', en: '🎮 4. Game: Chief XR Architect (3 Missions)' }
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
                {isZh ? '1. 双目立体视差 d = bf/Z 与 VAC 眩晕根源' : '1. Binocular Disparity d = bf/Z & VAC'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '左右眼视网膜投影差 d = x_L - x_R = bf/Z 与深度 Z 成严格反比。固定焦距 VR 头显中，双目辐辏交点随 d 移向近处 (如 0.4m)，但晶状体调焦却锁死在光学虚像屏 (1.8m)，产生辐辏-调节冲突 (VAC)。'
                  : 'Retinal disparity d = bf/Z is inversely proportional to depth Z. Fixed-focus VR headsets decouple vergence depth from focal accommodation depth (VAC).'}
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h3 className="text-base font-bold text-emerald-300">
                {isZh ? '2. 枕形预畸变与 ClearType 3× 次像素采样' : '2. Pincushion Pre-Warp & 3× Subpixel Sampling'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '为了抵消 VR 凸透镜的桶形畸变与波长色散，着色器需施加 r²/r⁴ 枕形逆映射并分通道微调 R/G/B；而 ClearType 将物理并排的左 R、中 G、右 B 视为 1/3 像素间隔的独立采样点，使水平分辨率翻 3 倍。'
                  : 'VR shaders pre-apply pincushion distortion per RGB channel; ClearType treats spatially offset R/G/B subpixels as 1/3-pixel luminance samples.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <canvas
              ref={mathCanvasRef}
              width={540}
              height={280}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-300">Z_virtual = {zVirt.toFixed(2)} m</span>
                <input
                  type="range"
                  min={0.25}
                  max={2.5}
                  step={0.05}
                  value={zVirt}
                  onChange={e => setZVirt(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">IPD b = {ipd} mm</span>
                <input
                  type="range"
                  min={54}
                  max={72}
                  step={1}
                  value={ipd}
                  onChange={e => setIpd(parseInt(e.target.value, 10))}
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
              {isZh ? '实验台 1：VR 枕形预畸变与色差校正仪' : 'Lab 1: VR Lens Pre-Warp & Chromatic Aberration'}
            </h3>
            <canvas
              ref={vrCanvasRef}
              width={480}
              height={250}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-300">k₁: {k1.toFixed(2)}</span>
                <input
                  type="range"
                  min={-0.1}
                  max={0.55}
                  step={0.02}
                  value={k1}
                  onChange={e => setK1(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">Chroma Δk: {ca.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={0.14}
                  step={0.01}
                  value={ca}
                  onChange={e => setCa(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh ? '实验台 2：RGB Stripe / PenTile 子像素显微镜' : 'Lab 2: Subpixel Layout & ClearType Microscope'}
            </h3>
            <canvas
              ref={subCanvasRef}
              width={480}
              height={250}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex gap-2 text-xs">
              {(['stripe', 'pentile'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`flex-1 py-1.5 rounded-lg font-bold border ${
                    layout === l ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {l === 'stripe' ? 'LCD RGB Stripe' : 'OLED Diamond PenTile'}
                </button>
              ))}
              {(['gray', 'cleartype'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFontMode(f)}
                  className={`flex-1 py-1.5 rounded-lg font-bold border ${
                    fontMode === f ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {f === 'cleartype' ? 'ClearType 3×' : 'Gray AA'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">
            {isZh
              ? 'UC Davis ECS 175 L21 & MIT 6.837 L22：图形学全分支与显示硬件'
              : 'UCD ECS 175 L21 & MIT 6.837 L22: CG Branches & Output Devices'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isZh
              ? 'Kenneth Joy 教授与 Justin Solomon 教授分别在两校收官课中总结了计算机图形学的五大核心支柱：几何建模、真实感与神经渲染、物理动画仿真、科学可视化与现代空间显示光学硬件。'
              : 'Prof. Kenneth Joy and Prof. Justin Solomon synthesize the five pillars of Computer Graphics: Geometric Modeling, Rendering, Physics Animation, SciVis, and Display Optics.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isZh ? '🎮 首席 XR 光学架构师' : '🎮 Chief XR Optics Architect'}
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
              <div className="text-xs text-slate-300">
                <span>Shader Pre-Warp k₁ = +{m1K.toFixed(2)} (Target +0.36)</span>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.02}
                  value={m1K}
                  onChange={e => setM1K(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {mission === 2 && (
              <div className="text-xs text-slate-300">
                <span>Blue Radial Compensation Δk_B = {m2Ca.toFixed(2)} (Target 0.08)</span>
                <input
                  type="range"
                  min={0}
                  max={0.14}
                  step={0.01}
                  value={m2Ca}
                  onChange={e => setM2Ca(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {mission === 3 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setM3Mode('whole_px')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Mode === 'whole_px' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  1× Whole-Pixel Gray
                </button>
                <button
                  onClick={() => setM3Mode('cleartype_3x')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Mode === 'cleartype_3x' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  3× Subpixel ClearType
                </button>
              </div>
            )}

            <button
              onClick={verifyMission}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              {isZh ? '⚡ 验证光学与显示校准' : '⚡ Verify Calibration'}
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
