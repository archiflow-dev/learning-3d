import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson25Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

interface Pt2D {
  x: number;
  y: number;
}

function evalBezier(P0: Pt2D, P1: Pt2D, P2: Pt2D, P3: Pt2D, u: number): Pt2D {
  const m = 1 - u;
  const b0 = m * m * m;
  const b1 = 3 * m * m * u;
  const b2 = 3 * m * u * u;
  const b3 = u * u * u;
  return {
    x: b0 * P0.x + b1 * P1.x + b2 * P2.x + b3 * P3.x,
    y: b0 * P0.y + b1 * P1.y + b2 * P2.y + b3 * P3.y
  };
}

function evalBezierDeriv(P0: Pt2D, P1: Pt2D, P2: Pt2D, P3: Pt2D, u: number): { vx: number; vy: number } {
  const m = 1 - u;
  const d0 = 3 * m * m;
  const d1 = 6 * m * u;
  const d2 = 3 * u * u;
  return {
    vx: d0 * (P1.x - P0.x) + d1 * (P2.x - P1.x) + d2 * (P3.x - P2.x),
    vy: d0 * (P1.y - P0.y) + d1 * (P2.y - P1.y) + d2 * (P3.y - P2.y)
  };
}

function buildArcLengthLUT(P0: Pt2D, P1: Pt2D, P2: Pt2D, P3: Pt2D, steps = 200) {
  const uArr = new Float32Array(steps + 1);
  const sArr = new Float32Array(steps + 1);
  let prev = evalBezier(P0, P1, P2, P3, 0);
  let total = 0;
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    const cur = evalBezier(P0, P1, P2, P3, u);
    total += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    uArr[i] = u;
    sArr[i] = total;
    prev = cur;
  }
  for (let i = 1; i <= steps; i++) {
    sArr[i] /= Math.max(1e-5, total);
  }
  return { uArr, sArr, total };
}

function invertArcLength(lut: { uArr: Float32Array; sArr: Float32Array; total: number }, targetNormS: number): number {
  const s = Math.max(0, Math.min(1, targetNormS));
  const arr = lut.sArr;
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= s) lo = mid;
    else hi = mid;
  }
  const span = Math.max(1e-6, arr[hi] - arr[lo]);
  const frac = (s - arr[lo]) / span;
  return lut.uArr[lo] + frac * (lut.uArr[hi] - lut.uArr[lo]);
}

export const Lesson25CameraMotion: React.FC<Lesson25Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Arc-Length LUT Inversion Visualizer
  const [bunching, setBunching] = useState<number>(0.82);
  const [targetS, setTargetS] = useState<number>(0.45);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: Parametric vs Arc-Length Camera Race
  const [easing, setEasing] = useState<'linear' | 'smoothstep'>('linear');
  const [timeT, setTimeT] = useState<number>(0.35);
  const [skew, setSkew] = useState<number>(0.85);
  const lab1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: S-Curve Inflection Frenet Flip vs World-Up/Banking
  const [frameMode, setFrameMode] = useState<'frenet' | 'worldup' | 'banking'>('frenet');
  const [sPos, setSPos] = useState<number>(0.46);
  const lab2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [gameParam, setGameParam] = useState<'naive' | 'arclength'>('naive');
  const [gameEase, setGameEase] = useState<'linear' | 'smoothstep'>('linear');
  const [gameFrame, setGameFrame] = useState<'frenet' | 'banking'>('frenet');
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

    const P0 = { x: 40, y: 270 };
    const P1 = { x: 40 + (1 - bunching) * 180, y: 270 - (1 - bunching) * 190 };
    const P2 = { x: 40 + (1 - bunching * 0.7) * 240, y: 65 };
    const P3 = { x: 320, y: 75 };

    const lut = buildArcLengthLUT(P0, P1, P2, P3, 220);
    const uStar = invertArcLength(lut, targetS);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const pt = evalBezier(P0, P1, P2, P3, i / 100);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    for (let k = 0; k <= 10; k++) {
      const frac = k / 10;
      const pNaive = evalBezier(P0, P1, P2, P3, frac);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(pNaive.x, pNaive.y - 8, 4, 0, Math.PI * 2);
      ctx.fill();

      const uEq = invertArcLength(lut, frac);
      const pArc = evalBezier(P0, P1, P2, P3, uEq);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(pArc.x, pArc.y + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const pCur = evalBezier(P0, P1, P2, P3, uStar);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(pCur.x, pCur.y, 7, 0, Math.PI * 2);
    ctx.fill();

    const gx = 385;
    const gy = 40;
    const gw = 235;
    const gh = 235;
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < lut.uArr.length; i++) {
      const px = gx + lut.uArr[i] * gw;
      const py = gy + (1 - lut.sArr[i]) * gh;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const hitX = gx + uStar * gw;
    const hitY = gy + (1 - targetS) * gh;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, hitY);
    ctx.lineTo(hitX, hitY);
    ctx.lineTo(hitX, gy + gh);
    ctx.stroke();
  }, [activeTab, bunching, targetS]);

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

        const P0 = { x: 45, y: 165 };
        const P1 = { x: 45 + (1 - skew) * 240, y: 35 };
        const P2 = { x: 45 + (1 - skew * 0.65) * 380, y: 195 };
        const P3 = { x: W - 45, y: 65 };
        const lut = buildArcLengthLUT(P0, P1, P2, P3, 220);

        const easeVal = (tau: number) => (easing === 'smoothstep' ? tau * tau * (3 - 2 * tau) : tau);
        const easeDeriv = (tau: number) => (easing === 'smoothstep' ? 6 * tau * (1 - tau) : 1.0);

        const sTarget = easeVal(timeT);
        const uNaive = sTarget;
        const uArc = invertArcLength(lut, sTarget);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const pt = evalBezier(P0, P1, P2, P3, i / 100);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        const posNaive = evalBezier(P0, P1, P2, P3, uNaive);
        const posArc = evalBezier(P0, P1, P2, P3, uArc);

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(posNaive.x, posNaive.y - 9, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(posArc.x, posArc.y + 9, 8, 0, Math.PI * 2);
        ctx.fill();

        const plotX = 45;
        const plotY = 215;
        const plotW = W - 90;
        const plotH = 120;
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(plotX, plotY, plotW, plotH);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const tau = i / 100;
          const d = evalBezierDeriv(P0, P1, P2, P3, easeVal(tau));
          const v = Math.hypot(d.vx, d.vy) * easeDeriv(tau);
          const px = plotX + tau * plotW;
          const py = plotY + plotH - Math.min(plotH - 6, (v / 1300) * plotH);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const tau = i / 100;
          const v = lut.total * easeDeriv(tau);
          const px = plotX + tau * plotW;
          const py = plotY + plotH - Math.min(plotH - 6, (v / 1300) * plotH);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }

    const c2 = lab2CanvasRef.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const W = c2.width;
        const H = c2.height;
        ctx.clearRect(0, 0, W, H);

        const padX = 36;
        const trackW = 290;
        const midY = 180;
        const amp = 85;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const u = i / 100;
          const px = padX + u * trackW;
          const py = midY - amp * Math.sin((u - 0.5) * Math.PI * 2);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        const angle = (sPos - 0.5) * Math.PI * 2;
        const cx = padX + sPos * trackW;
        const cy = midY - amp * Math.sin(angle);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();

        const vx = 500;
        const vy = 180;
        const vr = 115;
        const rollRad =
          frameMode === 'frenet'
            ? sPos < 0.5
              ? 0
              : Math.PI
            : frameMode === 'banking'
            ? Math.sin(angle) * 0.42
            : 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(vx, vy, vr, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(vx, vy);
        ctx.rotate(rollRad);

        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(-vr * 1.5, -vr * 1.5, vr * 3, vr * 1.5);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-vr * 1.5, 0, vr * 3, vr * 1.5);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('▲ SKY (+UP)', -40, -45);
        ctx.restore();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(vx, vy, vr, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [activeTab, easing, timeT, skew, frameMode, sPos]);

  // Draw Tab 4 Game Canvas
  useEffect(() => {
    if (activeTab !== 4) return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#090d1f';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = gameParam === 'arclength' ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const tau = i / 100;
      let vNorm = gameEase === 'smoothstep' ? 6 * tau * (1 - tau) * 0.65 : 0.65;
      if (gameParam === 'naive') {
        vNorm *= 0.35 + 1.45 * Math.pow(Math.sin(tau * Math.PI * 2.5), 2);
      }
      const px = 35 + tau * 320;
      const py = H - 45 - vNorm * 175;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const cx = 495;
    const cy = 160;
    const r = 85;
    ctx.strokeStyle = gameFrame === 'banking' ? '#22d3ee' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [activeTab, gameParam, gameEase, gameFrame]);

  const handleVerifyMission = () => {
    let ok = false;
    if (mission === 1) ok = gameParam === 'arclength';
    else if (mission === 2) ok = gameParam === 'arclength' && gameEase === 'smoothstep';
    else ok = gameParam === 'arclength' && gameEase === 'smoothstep' && gameFrame === 'banking';

    if (ok) {
      setPassed(prev => ({ ...prev, [mission]: true }));
      setGameFeedback({
        ok: true,
        msg: isZh
          ? `🎉 恭喜通过关卡 ${mission}！你的弧长参数化与防翻转运镜管线已达好莱坞虚拟制片标准！`
          : `🎉 Mission ${mission} Complete! Your arc-length and stabilized camera rig is cinema-ready!`
      });
    } else {
      setGameFeedback({
        ok: false,
        msg: isZh
          ? '⚠️ 参数未达标：请检查是否开启了 Arc-Length LUT、Smoothstep 缓动或 World-Up + Banking 稳定标架！'
          : '⚠️ Check Arc-Length LUT, Smoothstep easing, or World-Up + Banking stabilization!'
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
            <span>Stage 5 • L25</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isZh
              ? 'L25: 相机运动 (Camera Motion)、关键帧与弧长参数化'
              : 'L25: Camera Path Interpolation, Arc-Length Parameterization & Orientation Splines'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="lessons/lesson-25.html"
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 1 as const, zh: '📐 1. 核心数学与 3B1B 直觉', en: '📐 1. Core Math & 3B1B Intuition' },
          { id: 2 as const, zh: '🔬 2. 弧长匀速竞速与 Frenet 防翻转实验室', en: '🔬 2. Arc-Length Race & Frenet Labs' },
          { id: 3 as const, zh: '🎬 3. 名校公开课与笔记', en: '🎬 3. Course Videos & Notes' },
          { id: 4 as const, zh: '🎮 4. 闯关游戏：首席虚拟运镜总监', en: '🎮 4. Game: Virtual Cinematographer' }
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
              ? '链式法则与弧长查找表 s(u) <-> u(s*) 反函数抵消几何仪'
              : 'Chain Rule & Arc-Length LUT Inversion s(u) <-> u(s*) Visualizer'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800">
              <canvas ref={mathCanvasRef} width={650} height={310} className="w-full rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '控制点聚拢度' : 'Control Point Bunching'}</span>
                  <span className="font-mono text-indigo-400">{bunching.toFixed(2)}</span>
                </div>
                <input type="range" min={0.1} max={0.92} step={0.02} value={bunching} onChange={e => setBunching(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '目标归一化弧长 s*' : 'Target Arc Length s*'}</span>
                  <span className="font-mono text-emerald-400">{targetS.toFixed(2)}</span>
                </div>
                <input type="range" min={0.05} max={0.95} step={0.01} value={targetS} onChange={e => setTargetS(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {isZh ? '实验台 1：参数 u 直驱 vs. 弧长 s 重参数化双机竞速' : 'Lab 1: Parametric u vs. Arc-Length s Camera Race'}
              </h3>
              <div className="flex gap-2">
                {(['linear', 'smoothstep'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setEasing(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      easing === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab1CanvasRef} width={660} height={350} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '归一化时间 t' : 'Normalized Time t'}</span>
                    <span className="font-mono text-cyan-400">{timeT.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={timeT} onChange={e => setTimeT(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '控制点聚拢度' : 'Bunching Skew'}</span>
                    <span className="font-mono text-indigo-400">{skew.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.2} max={0.92} step={0.02} value={skew} onChange={e => setSkew(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {isZh ? '实验台 2：S 弯拐点 Frenet 180° 翻转 vs. World-Up / Banking 稳定器' : 'Lab 2: S-Curve Inflection Frenet Flip vs. Stabilizer'}
              </h3>
              <div className="flex gap-2">
                {(['frenet', 'worldup', 'banking'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFrameMode(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      frameMode === f ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab2CanvasRef} width={660} height={350} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? 'S 弯位置 s (0.50 为拐点)' : 'S-Curve Position s'}</span>
                    <span className="font-mono text-amber-400">{sPos.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.05} max={0.95} step={0.01} value={sPos} onChange={e => setSPos(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">UC Davis ECS 175 • Lecture 20</div>
            <h3 className="text-base font-bold text-white">Camera Motion (Prof. Kenneth Joy)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '讲解弧长参数化 s(u)、距离-时间缓动曲线 (Ease-In / Ease-Out) 以及相机朝向 Frenet 标架的稳定化。'
                : 'Covers arc-length parameterization s(u), distance-time easing curves, and camera orientation frames.'}
            </p>
          </div>
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-cyan-400">MIT 6.837 • Lecture 06</div>
            <h3 className="text-base font-bold text-white">Computer Animation & Keyframing (Prof. Justin Solomon)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '剖析关键帧样条插值、时间重映射与刚体位姿在 SE(3) 上的平滑运动控制。'
                : 'Analyzes keyframe spline interpolation, time warps, and smooth SE(3) camera pose control.'}
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
              <select
                value={gameParam}
                onChange={e => setGameParam(e.target.value as 'naive' | 'arclength')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="naive">Naive Parametric u = e(t)</option>
                <option value="arclength">Arc-Length LUT Inversion u = s⁻¹(e(t))</option>
              </select>

              <select
                value={gameEase}
                onChange={e => setGameEase(e.target.value as 'linear' | 'smoothstep')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="linear">Linear Easing e(t) = t</option>
                <option value="smoothstep">Hermite Smoothstep 3t² - 2t³</option>
              </select>

              <select
                value={gameFrame}
                onChange={e => setGameFrame(e.target.value as 'frenet' | 'banking')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="frenet">Raw Frenet–Serret Frame (Flips 180°)</option>
                <option value="banking">World-Up Stabilized + Smooth Banking</option>
              </select>

              <button
                onClick={handleVerifyMission}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white"
              >
                {isZh ? '🚀 验证虚拟摄影机轨道配置' : '🚀 Verify Virtual Camera Rig'}
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
