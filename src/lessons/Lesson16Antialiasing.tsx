import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson16Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type FilterType = 'box' | 'tent' | 'gaussian' | 'sinc';
type MicroScene = 'triangle' | 'checker' | 'zoneplate';
type SamplePattern = 'regular' | 'rgss' | 'random' | 'stratified';

const GRID_N = 24;

function evalKernel1D(type: FilterType, x: number, R: number): number {
  const ax = Math.abs(x);
  if (type === 'box') return ax <= R ? 1.0 : 0.0;
  if (type === 'tent') return ax <= R ? 1.0 - ax / R : 0.0;
  if (type === 'gaussian') {
    if (ax > R) return 0.0;
    const sigma = R * 0.5;
    return Math.max(
      0,
      Math.exp(-(x * x) / (2 * sigma * sigma)) - Math.exp(-(R * R) / (2 * sigma * sigma))
    );
  }
  if (ax < 1e-6) return 1.0;
  if (ax > R) return 0.0;
  const px = Math.PI * x;
  return (Math.sin(px) / px) * (Math.sin(px / R) / (px / R));
}

function sampleSignal2D(scene: MicroScene, x: number, y: number, phase: number): number {
  const u = (x + phase) / GRID_N;
  const v = y / GRID_N;
  if (scene === 'triangle') {
    const inTri = v > 0.12 + 0.68 * u && v < 0.88 - 0.18 * u && u > 0.12;
    const wireDist = Math.abs((v - (0.18 + 0.72 * u)) * GRID_N);
    const inWire = wireDist < 0.36;
    return inTri || inWire ? 1.0 : 0.08;
  } else if (scene === 'checker') {
    if (v < 0.22) return 0.15;
    const z = 1.0 / Math.max(v - 0.2, 0.025);
    const wx = (u - 0.5) * z * 4.2 + phase * 0.5;
    const wz = z * 2.8;
    const cx = Math.floor(wx) & 1;
    const cz = Math.floor(wz) & 1;
    return cx ^ cz ? 0.92 : 0.12;
  } else {
    const dx = (u - 0.5) * 2.0;
    const dy = (v - 0.5) * 2.0;
    const r2 = dx * dx + dy * dy;
    return 0.5 + 0.46 * Math.cos(54.0 * r2 + phase * 6.28);
  }
}

function pseudoRand(px: number, py: number, idx: number, chan: number, seed: number): number {
  let h =
    (px * 374761393 + py * 668265263 + idx * 1442695041 + chan * 2654435761 + seed) >>> 0;
  h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296.0;
}

export const Lesson16Antialiasing: React.FC<Lesson16Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1A state: Nyquist & Spectral Folding
  const [sigFreq, setSigFreq] = useState<number>(2.2);
  const [sampRate, setSampRate] = useState<number>(6.0);
  const nyquistCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 1B state: Filter Kernel & Frequency Response
  const [filterLabType, setFilterLabType] = useState<FilterType>('tent');
  const [filterRadius, setFilterRadius] = useState<number>(1.5);
  const filterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 state: Pixel Microscope
  const [microScene, setMicroScene] = useState<MicroScene>('triangle');
  const [spp, setSpp] = useState<number>(16);
  const [pattern, setPattern] = useState<SamplePattern>('stratified');
  const [reconFilter, setReconFilter] = useState<'box' | 'tent' | 'gaussian'>('gaussian');
  const [phase, setPhase] = useState<number>(0.24);
  const [selectedPx, setSelectedPx] = useState<{ x: number; y: number }>({ x: 12, y: 12 });
  const [jitterSeed, setJitterSeed] = useState<number>(1337);
  const [rmseMetric, setRmseMetric] = useState<number>(0.042);
  const [subStats, setSubStats] = useState<{ gt: number; recon: number; err: number }>({
    gt: 0.5,
    recon: 0.5,
    err: 0
  });

  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const subCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Mini-Game state
  const [m1Fs, setM1Fs] = useState<number>(6.0);
  const [m2Pat, setM2Pat] = useState<string>('regular');
  const [m2Flt, setM2Flt] = useState<string>('box');
  const [m3Mode, setM3Mode] = useState<string>('1spp');

  const m1Passed = m1Fs >= 8.8 && m1Fs <= 10.2;
  const m2Passed = m2Pat === 'stratified' && (m2Flt === 'tent16' || m2Flt === 'gauss16');
  const m3Passed = m3Mode === '8msaa';

  // Draw Tab 1A: 1D Nyquist Wave & Frequency Spectrum
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = nyquistCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const nyq = sampRate * 0.5;
    const kNearest = Math.round(sigFreq / sampRate);
    const fAlias = Math.abs(sigFreq - kNearest * sampRate);
    const isAliased = sigFreq > nyq + 1e-6;

    const topY0 = 18;
    const topH = 120;
    const topMid = topY0 + topH * 0.5;
    const leftPad = 32;
    const rightPad = 18;
    const plotW = W - leftPad - rightPad;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, topMid);
    ctx.lineTo(W - rightPad, topMid);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(
      isZh
        ? '空域连续信号 cos(2πfx) (蓝) vs 离散采样针 (黄) vs 混叠重建波 (红虚线)'
        : 'Spatial Wave cos(2πfx) (Blue) vs Sample Needles (Amber) vs Aliased Wave (Red Dashed)',
      leftPad,
      14
    );

    // True wave
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const t = i / 360;
      const x = leftPad + t * plotW;
      const y = topMid - Math.cos(2 * Math.PI * sigFreq * t) * (topH * 0.4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Aliased wave
    if (isAliased) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 260; i++) {
        const t = i / 260;
        const x = leftPad + t * plotW;
        const y = topMid - Math.cos(2 * Math.PI * fAlias * t) * (topH * 0.4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Samples
    const dt = 1.0 / sampRate;
    for (let t = 0; t <= 1.0001; t += dt) {
      const x = leftPad + t * plotW;
      const val = Math.cos(2 * Math.PI * sigFreq * t);
      const y = topMid - val * (topH * 0.4);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, topMid);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x, y, 4.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom: Frequency spectrum
    const botY0 = 170;
    const botH = 110;
    const botBase = botY0 + botH - 18;
    const maxFreqPlot = 12.5;
    const freqToX = (freq: number) => leftPad + ((freq + maxFreqPlot) / (2 * maxFreqPlot)) * plotW;

    const nxL = freqToX(-nyq);
    const nxR = freqToX(nyq);
    ctx.fillStyle = isAliased ? 'rgba(244, 63, 94, 0.13)' : 'rgba(16, 185, 129, 0.13)';
    ctx.strokeStyle = isAliased ? 'rgba(244, 63, 94, 0.6)' : 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(nxL, botY0 + 12, nxR - nxL, botBase - (botY0 + 12));
    ctx.strokeRect(nxL, botY0 + 12, nxR - nxL, botBase - (botY0 + 12));

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(
      isZh
        ? '频域频谱 S_sampled(ω)：奈奎斯特基带 [-fs/2, +fs/2] 与周期克隆副本 k·fs ± f'
        : 'Frequency Spectrum S_sampled(ω): Nyquist Baseband [-fs/2, +fs/2] & Spectral Clones k·fs ± f',
      leftPad,
      botY0 + 4
    );

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(leftPad, botBase);
    ctx.lineTo(W - rightPad, botBase);
    ctx.stroke();

    for (let k = -2; k <= 2; k++) {
      const center = k * sampRate;
      [-sigFreq, sigFreq].forEach(offset => {
        const w = center + offset;
        if (Math.abs(w) > maxFreqPlot) return;
        const x = freqToX(w);
        const isBaseOriginal = k === 0;
        const inNyq = Math.abs(w) <= nyq + 1e-5;
        ctx.strokeStyle = isBaseOriginal ? '#38bdf8' : inNyq ? '#f43f5e' : '#64748b';
        ctx.lineWidth = isBaseOriginal || inNyq ? 2.5 : 1.4;
        ctx.beginPath();
        ctx.moveTo(x, botBase);
        ctx.lineTo(x, botBase - 58);
        ctx.stroke();

        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(x, botBase - 58, 3.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [activeTab, sigFreq, sampRate, isZh]);

  // Draw Tab 1B: Reconstruction Filter Kernel
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = filterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const pW = (W - 60) * 0.5;
    const x1L = 24;
    const yZero = 170;
    const scaleY = 110;

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isZh ? '空域滤波核 h(x) (x ∈ [-3, +3])' : 'Spatial Kernel h(x)', x1L, 22);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(x1L, yZero);
    ctx.lineTo(x1L + pW, yZero);
    ctx.moveTo(x1L + pW * 0.5, 36);
    ctx.lineTo(x1L + pW * 0.5, H - 22);
    ctx.stroke();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 220; i++) {
      const u = (i / 220) * 6.0 - 3.0;
      const val = evalKernel1D(filterLabType, u, filterRadius);
      const px = x1L + (i / 220) * pW;
      const py = yZero - val * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const x2L = x1L + pW + 24;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(isZh ? '频域响应 |H(ω)|' : 'Frequency Response |H(ω)|', x2L, 22);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(x2L, yZero);
    ctx.lineTo(x2L + pW, yZero);
    ctx.moveTo(x2L + pW * 0.5, 36);
    ctx.lineTo(x2L + pW * 0.5, H - 22);
    ctx.stroke();

    let norm0 = 0;
    for (let k = -60; k <= 60; k++) {
      norm0 += evalKernel1D(filterLabType, k * 0.05, filterRadius) * 0.05;
    }
    norm0 = Math.max(norm0, 1e-5);

    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 180; i++) {
      const freq = (i / 180) * 4.0 - 2.0;
      let sum = 0;
      for (let k = -60; k <= 60; k++) {
        const x = k * 0.05;
        sum += evalKernel1D(filterLabType, x, filterRadius) * Math.cos(2 * Math.PI * freq * x) * 0.05;
      }
      const mag = Math.abs(sum / norm0);
      const px = x2L + (i / 180) * pW;
      const py = yZero - mag * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [activeTab, filterLabType, filterRadius, isZh]);

  // Draw Tab 2: Pixel Microscope
  useEffect(() => {
    if (activeTab !== 2) return;
    const gridCanvas = gridCanvasRef.current;
    const subCanvas = subCanvasRef.current;
    if (!gridCanvas || !subCanvas) return;
    const ctx = gridCanvas.getContext('2d');
    const sctx = subCanvas.getContext('2d');
    if (!ctx || !sctx) return;

    const getOffsets = (px: number, py: number) => {
      if (spp === 1) return [{ dx: 0, dy: 0 }];
      const M = Math.round(Math.sqrt(spp));
      const fRad = reconFilter === 'box' ? 0.5 : reconFilter === 'tent' ? 0.85 : 1.0;
      const span = Math.max(1.0, fRad * 1.5);
      const pts: { dx: number; dy: number }[] = [];
      let idx = 0;
      for (let sy = 0; sy < M; sy++) {
        for (let sx = 0; sx < M; sx++) {
          let ux = (sx + 0.5) / M - 0.5;
          let uy = (sy + 0.5) / M - 0.5;
          if (pattern === 'rgss') {
            const ang = 0.4636476;
            const c = Math.cos(ang);
            const s = Math.sin(ang);
            const rx = ux * c - uy * s;
            const ry = ux * s + uy * c;
            ux = rx * 0.85;
            uy = ry * 0.85;
          } else if (pattern === 'random') {
            ux = pseudoRand(px, py, idx, 1, jitterSeed) - 0.5;
            uy = pseudoRand(px, py, idx, 2, jitterSeed) - 0.5;
          } else if (pattern === 'stratified') {
            ux = (sx + pseudoRand(px, py, idx, 1, jitterSeed)) / M - 0.5;
            uy = (sy + pseudoRand(px, py, idx, 2, jitterSeed)) / M - 0.5;
          }
          pts.push({ dx: ux * span, dy: uy * span });
          idx++;
        }
      }
      return pts;
    };

    const weight2D = (dx: number, dy: number) => {
      const r = Math.hypot(dx, dy);
      if (reconFilter === 'box') return Math.abs(dx) <= 0.55 && Math.abs(dy) <= 0.55 ? 1.0 : 0.05;
      if (reconFilter === 'tent') return Math.max(0.02, 1.0 - r / 1.05);
      return Math.exp(-(r * r) / (2 * 0.52 * 0.52));
    };

    const evalPixel = (px: number, py: number) => {
      const offsets = getOffsets(px, py);
      let wSum = 0;
      let valSum = 0;
      for (const pt of offsets) {
        const w = weight2D(pt.dx, pt.dy);
        const s = sampleSignal2D(microScene, px + 0.5 + pt.dx, py + 0.5 + pt.dy, phase);
        valSum += w * s;
        wSum += w;
      }
      return { value: valSum / Math.max(wSum, 1e-6), offsets };
    };

    const evalGT = (px: number, py: number) => {
      let sum = 0;
      const G = 6;
      for (let j = 0; j < G; j++) {
        for (let i = 0; i < G; i++) {
          sum += sampleSignal2D(microScene, px + (i + 0.5) / G, py + (j + 0.5) / G, phase);
        }
      }
      return sum / (G * G);
    };

    const cell = gridCanvas.width / GRID_N;
    let sqErr = 0;
    for (let py = 0; py < GRID_N; py++) {
      for (let px = 0; px < GRID_N; px++) {
        const { value } = evalPixel(px, py);
        const gt = evalGT(px, py);
        sqErr += (value - gt) * (value - gt);
        const c = Math.max(0, Math.min(255, Math.round(value * 255)));
        ctx.fillStyle = `rgb(${c}, ${c}, ${Math.min(255, c + 12)})`;
        ctx.fillRect(px * cell, py * cell, cell, cell);
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px * cell, py * cell, cell, cell);
      }
    }

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(selectedPx.x * cell + 1, selectedPx.y * cell + 1, cell - 2, cell - 2);
    setRmseMetric(Math.sqrt(sqErr / (GRID_N * GRID_N)));

    // Sub-pixel canvas
    const SW = subCanvas.width;
    const SH = subCanvas.height;
    sctx.clearRect(0, 0, SW, SH);
    const res = 60;
    const tile = SW / res;
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const dx = ((i + 0.5) / res - 0.5) * 1.5;
        const dy = ((j + 0.5) / res - 0.5) * 1.5;
        const s = sampleSignal2D(microScene, selectedPx.x + 0.5 + dx, selectedPx.y + 0.5 + dy, phase);
        const v = Math.round(s * 215);
        sctx.fillStyle = `rgb(${v}, ${v + 8}, ${Math.min(255, v + 28)})`;
        sctx.fillRect(i * tile, j * tile, tile + 0.5, tile + 0.5);
      }
    }

    const toSub = (dx: number, dy: number) => ({
      x: (dx / 1.5 + 0.5) * SW,
      y: (dy / 1.5 + 0.5) * SH
    });

    const pMin = toSub(-0.5, -0.5);
    const pMax = toSub(0.5, 0.5);
    sctx.strokeStyle = '#fbbf24';
    sctx.lineWidth = 2;
    sctx.strokeRect(pMin.x, pMin.y, pMax.x - pMin.x, pMax.y - pMin.y);

    const { value, offsets } = evalPixel(selectedPx.x, selectedPx.y);
    for (const pt of offsets) {
      const sc = toSub(pt.dx, pt.dy);
      const w = weight2D(pt.dx, pt.dy);
      const hitVal = sampleSignal2D(
        microScene,
        selectedPx.x + 0.5 + pt.dx,
        selectedPx.y + 0.5 + pt.dy,
        phase
      );
      sctx.fillStyle = hitVal > 0.5 ? '#38bdf8' : '#f43f5e';
      sctx.strokeStyle = '#ffffff';
      sctx.lineWidth = 1.4;
      sctx.beginPath();
      sctx.arc(sc.x, sc.y, 3.2 + 4.2 * w, 0, Math.PI * 2);
      sctx.fill();
      sctx.stroke();
    }

    const gt = evalGT(selectedPx.x, selectedPx.y);
    setSubStats({ gt, recon: value, err: Math.abs(value - gt) });
  }, [activeTab, microScene, spp, pattern, reconFilter, phase, selectedPx, jitterSeed]);

  const nyqLimit = sampRate * 0.5;
  const fAlias = Math.abs(sigFreq - Math.round(sigFreq / sampRate) * sampRate);
  const isAliased = sigFreq > nyqLimit + 1e-6;

  return (
    <div className="space-y-6">
      {/* Lesson Header Banner */}
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
            <span>Stage 3 • Lesson 16 / 32</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isZh
              ? 'L16: 信号处理、采样理论与反走样 (Antialiasing)'
              : 'L16: Signal Processing, Sampling Theory & Antialiasing'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Nyquist–Shannon Theorem • Spectral Replication & Folding • Stratified Supersampling •
            Box / Tent / Gaussian Reconstruction • SSAA vs. MSAA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="lessons/lesson-16.html"
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
          { id: 1, zh: '1. 📐 3B1B 频谱折叠与滤波核直觉', en: '1. 📐 3B1B Spectral Folding & Filters' },
          { id: 2, zh: '2. 🔬 走样与超采样像素显微镜', en: '2. 🔬 Supersampling Pixel Microscope' },
          { id: 3, zh: '3. 🎥 MIT 6.837 L15 & MSAA 架构', en: '3. 🎥 MIT 6.837 L15 & MSAA vs SSAA' },
          { id: 4, zh: '4. 🎮 3 关信号与反走样总师挑战', en: '4. 🎮 3-Mission Antialiasing Game' }
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

      {/* TAB 1: 3B1B INTUITION */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg sm:text-xl font-bold text-indigo-300">
              {isZh
                ? '1. 为什么高频波会“折叠”伪装成低频？(奈奎斯特极限 f_Nyquist = f_s / 2)'
                : '1. Why High Frequencies Fold into Low Frequencies (Nyquist Limit f_Nyquist = f_s / 2)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isZh
                ? '根据傅里叶卷积定理，在空域中以间隔 Δx = 1/f_s 对连续信号做狄拉克梳状点采样，等价于在频域中每隔 f_s 无限复制一份原始频谱 S(ω)。一旦信号最高频率 f > f_s / 2，相邻频谱副本就会侵入基带 [-f_s/2, +f_s/2]，折叠伪装成表观频率 f_alias = |f - round(f/f_s)·f_s|！'
                : 'By the Convolution Theorem, multiplying a continuous signal by a Dirac Comb in space replicates its Fourier spectrum S(ω) at every integer multiple k·f_s in frequency. Whenever f > f_s / 2, spectral clones invade the baseband [-f_s/2, +f_s/2] and fold into f_alias = |f - round(f/f_s)·f_s|!'}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <canvas
                  ref={nyquistCanvasRef}
                  width={560}
                  height={300}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800"
                />
              </div>
              <div className="lg:col-span-5 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{isZh ? '真实信号频率 f:' : 'True Signal f:'}</span>
                    <span className="font-mono font-bold text-cyan-400">{sigFreq.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={9.5}
                    step={0.1}
                    value={sigFreq}
                    onChange={e => setSigFreq(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{isZh ? '采样频率 f_s:' : 'Sampling Rate f_s:'}</span>
                    <span className="font-mono font-bold text-amber-400">{sampRate.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={12.0}
                    step={0.2}
                    value={sampRate}
                    onChange={e => setSampRate(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nyquist Limit (f_s / 2):</span>
                    <span className="font-mono font-bold text-emerald-400">{nyqLimit.toFixed(2)} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reconstructed f_alias:</span>
                    <span className="font-mono font-bold text-rose-400">{fAlias.toFixed(2)} Hz</span>
                  </div>
                  <div className="pt-1 font-bold text-amber-300">
                    {isAliased
                      ? isZh
                        ? `⚠️ 频谱折叠！${sigFreq.toFixed(1)}Hz 高频波伪装成了 ${fAlias.toFixed(2)}Hz 低频波`
                        : `⚠️ Aliasing! ${sigFreq.toFixed(1)}Hz folds into ${fAlias.toFixed(2)}Hz`
                      : isZh
                      ? '✓ 满足奈奎斯特采样定理，零混叠失真'
                      : '✓ Nyquist satisfied — zero aliasing'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1B: Reconstruction Filter Kernel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-emerald-300">
                {isZh
                  ? '2. 重建滤波器核对比：Box vs. Tent vs. Gaussian vs. Sinc'
                  : '2. Reconstruction Filter Kernels: Box vs. Tent vs. Gaussian vs. Sinc'}
              </h2>
              <div className="flex gap-1.5">
                {(['box', 'tent', 'gaussian', 'sinc'] as FilterType[]).map(ft => (
                  <button
                    key={ft}
                    onClick={() => setFilterLabType(ft)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                      filterLabType === ft
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8">
                <canvas
                  ref={filterCanvasRef}
                  width={560}
                  height={250}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800"
                />
              </div>
              <div className="lg:col-span-4 space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Support Radius R:</span>
                    <span className="font-mono font-bold text-emerald-400">{filterRadius.toFixed(1)} px</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={filterRadius}
                    onChange={e => setFilterRadius(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {isZh
                    ? 'Box 滤波器在频域为 sinc(ω)，高频旁瓣巨大；Tent 滤波器为 sinc²(ω)；Gaussian 滤波在空域与频域皆为平滑高斯，无旁瓣泄漏且无负权重振铃。'
                    : 'Box filter transforms to sinc(ω) with tall side-lobes; Tent transforms to sinc²(ω); Gaussian has smooth roll-off in both domains with zero negative-lobe ringing.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PIXEL MICROSCOPE */}
      {activeTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '🔬 走样与超采样像素显微镜 (点击左侧像素网格检视内部采样点)'
                : '🔬 Supersampling & Reconstruction Pixel Microscope'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'triangle', zh: '📐 斜边三角形+细线', en: '📐 Triangle + Thin Wire' },
                { id: 'checker', zh: '♟️ 透视地平线棋盘格', en: '♟️ Horizon Checkerboard' },
                { id: 'zoneplate', zh: '🎯 变频波带片 (Zone Plate)', en: '🎯 Zone Plate' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setMicroScene(s.id as MicroScene)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    microScene === s.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isZh ? s.zh : s.en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">SPP:</label>
              <select
                value={spp}
                onChange={e => setSpp(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value={1}>1 SPP (Point Sample)</option>
                <option value={4}>4 SPP (2×2)</option>
                <option value={16}>16 SPP (4×4)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Pattern:</label>
              <select
                value={pattern}
                onChange={e => setPattern(e.target.value as SamplePattern)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="regular">Regular Grid</option>
                <option value="rgss">Rotated Grid (RGSS)</option>
                <option value="random">Uniform Random</option>
                <option value="stratified">Stratified Jittered</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Filter:</label>
              <select
                value={reconFilter}
                onChange={e => setReconFilter(e.target.value as 'box' | 'tent' | 'gaussian')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="box">Box Filter</option>
                <option value="tent">Tent Filter</option>
                <option value="gaussian">Gaussian Filter</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Sub-pixel Shift Δx: {phase.toFixed(2)}</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={phase}
                onChange={e => setPhase(parseFloat(e.target.value))}
                className="w-full accent-indigo-400 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <canvas
                ref={gridCanvasRef}
                width={432}
                height={432}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_N);
                  const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_N);
                  setSelectedPx({
                    x: Math.max(0, Math.min(GRID_N - 1, x)),
                    y: Math.max(0, Math.min(GRID_N - 1, y))
                  });
                }}
                className="w-full aspect-square rounded-lg bg-slate-900 border border-slate-800 cursor-crosshair"
              />
              <div className="flex justify-between text-xs text-slate-300">
                <span>
                  RMSE vs 64× Ground Truth:{' '}
                  <strong className="font-mono text-emerald-400">{rmseMetric.toFixed(3)}</strong>
                </span>
                <span>
                  Selected Pixel: <strong className="font-mono text-amber-300">({selectedPx.x}, {selectedPx.y})</strong>
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300">
                  {isZh ? '🔍 单像素内部采样针与滤波权重' : '🔍 Sub-Pixel Sample Needles & Weights'}
                </span>
                <button
                  onClick={() => setJitterSeed(s => (s * 1664525 + 1013904223) >>> 0)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  🎲 Reseed
                </button>
              </div>
              <canvas
                ref={subCanvasRef}
                width={340}
                height={340}
                className="w-full aspect-square rounded-lg bg-slate-900 border border-slate-800"
              />
              <div className="text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Ground Truth:</span>
                  <span className="font-mono text-emerald-400">{subStats.gt.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weighted Output:</span>
                  <span className="font-mono text-cyan-300">{subStats.recon.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Absolute Error:</span>
                  <span className="font-mono text-amber-300">{subStats.err.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MIT 6.837 L15 & MSAA */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h2 className="text-lg font-bold text-amber-300">
            🎥 MIT 6.837 Lecture 15: Antialiasing (Sampling & Reconstruction) & MSAA Architecture
          </h2>
          <p className="leading-relaxed">
            {isZh
              ? '在 GPU 光栅化管线中，SSAA 对每个子采样点都执行一次昂贵的 Fragment Shader；而 MSAA（多重采样反走样）将“几何覆盖率/深度测试”与“片元着色”解耦：每个像素内的 4 或 8 个子采样点各自维护深度与覆盖掩码，但同一个三角形在单像素内仅执行 1 次 Fragment Shader，以接近 1 SPP 的着色代价完美消除几何边缘锯齿！'
              : 'In GPU rasterization, SSAA runs the expensive Fragment Shader at every sub-sample, whereas MSAA (Multisample Antialiasing) decouples coverage/depth testing from shading: 4 or 8 sub-samples test triangle coverage and Z-depth, while the Fragment Shader executes only ONCE per pixel per triangle.'}
          </p>
          <a
            href="https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300"
          >
            ▶ MIT 6.837 Lecture 15 Playlist ↗
          </a>
        </div>
      )}

      {/* TAB 4: 3-MISSION MINI-GAME */}
      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh
                ? '🎮 3 关信号与反走样总工程师挑战赛'
                : '🎮 3-Mission Signal & Antialiasing Chief Engineer Game'}
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
                {isZh ? '关卡 1：奈奎斯特除混叠调谐 (f = 4.4 Hz)' : 'Mission 1: Nyquist Tuner (f = 4.4 Hz)'}
              </div>
              <p className="text-slate-400">
                {isZh
                  ? '将采样率调至 [8.8, 10.2] Hz 区间以消除频谱折叠：'
                  : 'Tune sampling rate fs into [8.8, 10.2] Hz to eliminate spectral folding:'}
              </p>
              <input
                type="range"
                min={4.0}
                max={12.0}
                step={0.2}
                value={m1Fs}
                onChange={e => setM1Fs(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="font-mono text-amber-300">f_s = {m1Fs.toFixed(1)} Hz</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400">
                {isZh ? '关卡 2：波带片摩尔纹歼灭战' : 'Mission 2: Zone Plate Moiré Destroyer'}
              </div>
              <select
                value={m2Pat}
                onChange={e => setM2Pat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="regular">Regular Grid</option>
                <option value="stratified">Stratified Jittered</option>
              </select>
              <select
                value={m2Flt}
                onChange={e => setM2Flt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="box">1x Box</option>
                <option value="gauss16">16x Gaussian Filter</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400">
                {isZh ? '关卡 3：MSAA 硬件带宽架构师' : 'Mission 3: MSAA Bandwidth Architect'}
              </div>
              <select
                value={m3Mode}
                onChange={e => setM3Mode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="1spp">1 SPP Point Sampling</option>
                <option value="8ssaa">8x SSAA (8.0x Shader Cost)</option>
                <option value="8msaa">8x RGSS MSAA (1.0x Shader Cost)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
