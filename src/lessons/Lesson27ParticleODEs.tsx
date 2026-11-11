import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson27Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson27ParticleODEs: React.FC<Lesson27Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Phase Space Single Step Pythagorean Microscope
  const [mathH, setMathH] = useState<number>(0.45);
  const [mathAngle, setMathAngle] = useState<number>(35);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: 5-Integrator Phase-Space & Energy Arena
  const [lab1Dt, setLab1Dt] = useState<number>(0.3);
  const [lab1Steps, setLab1Steps] = useState<number>(30);
  const lab1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: Particle Fountain & Vortex Force-Field Sandbox
  const [fountainMethod, setFountainMethod] = useState<'symplectic' | 'explicit' | 'rk4'>('symplectic');
  const [fountainDt, setFountainDt] = useState<number>(0.06);
  const [fountainSpring, setFountainSpring] = useState<number>(1.8);
  const [fountainSwirl, setFountainSwirl] = useState<number>(1.4);
  const lab2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game: Chief Physics Engine Architect
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [gameOrder, setGameOrder] = useState<'explicit' | 'symplectic'>('explicit');
  const [gameMethod, setGameMethod] = useState<'explicit' | 'implicit' | 'rk4'>('explicit');
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

    const h = mathH;
    const theta = (mathAngle * Math.PI) / 180;
    const cx = W * 0.45;
    const cy = H * 0.54;
    const R = 135;

    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, cy);
    ctx.lineTo(W - 30, cy);
    ctx.moveTo(cx, 25);
    ctx.lineTo(cx, H - 25);
    ctx.stroke();

    // Unit phase circle
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const x0 = Math.cos(theta);
    const v0 = Math.sin(theta);

    // Explicit Euler
    const xExp = x0 + h * v0;
    const vExp = v0 - h * x0;

    // Implicit Euler
    const denom = 1 + h * h;
    const xImp = (x0 + h * v0) / denom;
    const vImp = (v0 - h * x0) / denom;

    // Symplectic Euler
    const vSymp = v0 - h * x0;
    const xSymp = x0 + h * vSymp;

    const toS = (x: number, v: number) => ({ sx: cx + x * R, sy: cy - v * R });
    const p0 = toS(x0, v0);
    const pExp = toS(xExp, vExp);
    const pImp = toS(xImp, vImp);
    const pSymp = toS(xSymp, vSymp);

    // Radius vector Y_n
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p0.sx, p0.sy);
    ctx.stroke();

    // Explicit step (Rose)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy);
    ctx.lineTo(pExp.sx, pExp.sy);
    ctx.stroke();

    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pExp.sx, pExp.sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Implicit step (Sky)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy);
    ctx.lineTo(pImp.sx, pImp.sy);
    ctx.stroke();

    // Dots
    const drawDot = (pt: { sx: number; sy: number }, col: string, label: string, dx: number, dy: number) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pt.sx, pt.sy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, pt.sx + dx, pt.sy + dy);
    };

    drawDot(p0, '#f8fafc', 'Y_n (r=1.00)', 8, -8);
    drawDot(pExp, '#fb7185', `Explicit (√(1+h²)=${Math.sqrt(1 + h * h).toFixed(3)})`, 8, -6);
    drawDot(pImp, '#38bdf8', `Implicit (1/√(1+h²)=${(1 / Math.sqrt(1 + h * h)).toFixed(3)})`, -140, 18);
    drawDot(pSymp, '#34d399', 'Symplectic (det=1)', 8, 15);
  }, [activeTab, mathH, mathAngle]);

  // Draw Tab 2 Lab 1: 5-Integrator Phase-Space & Energy Arena
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = lab1CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const h = lab1Dt;
    const N = lab1Steps;
    const cx = W * 0.28;
    const cy = H * 0.52;
    const R = 105;

    // Phase-space circle
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const stepFn = (m: string, x: number, v: number) => {
      if (m === 'exp') return { x: x + h * v, v: v - h * x };
      if (m === 'imp') {
        const d = 1 + h * h;
        return { x: (x + h * v) / d, v: (v - h * x) / d };
      }
      if (m === 'symp') {
        const vn = v - h * x;
        const xn = x + h * vn;
        return { x: xn, v: vn };
      }
      if (m === 'mid') {
        const xm = x + 0.5 * h * v;
        const vm = v - 0.5 * h * x;
        return { x: x + h * vm, v: v - h * xm };
      }
      // rk4
      const k1x = v;
      const k1v = -x;
      const k2x = v + 0.5 * h * k1v;
      const k2v = -(x + 0.5 * h * k1x);
      const k3x = v + 0.5 * h * k2v;
      const k3v = -(x + 0.5 * h * k2x);
      const k4x = v + h * k3v;
      const k4v = -(x + h * k3x);
      return {
        x: x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
        v: v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)
      };
    };

    const configs = [
      { id: 'exp', col: '#f43f5e', name: 'Explicit' },
      { id: 'imp', col: '#38bdf8', name: 'Implicit' },
      { id: 'symp', col: '#10b981', name: 'Symplectic' },
      { id: 'mid', col: '#f59e0b', name: 'Midpoint (RK2)' },
      { id: 'rk4', col: '#c084fc', name: 'RK4' }
    ];

    const gx0 = W * 0.57;
    const gx1 = W - 24;
    const gy0 = 40;
    const gy1 = H - 36;

    // Energy axis
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.beginPath();
    ctx.moveTo(gx0, gy0);
    ctx.lineTo(gx0, gy1);
    ctx.lineTo(gx1, gy1);
    ctx.stroke();

    const mapY = (ratio: number) => {
      const clamped = Math.min(3.0, Math.max(0, ratio));
      return gy1 - (clamped / 3.0) * (gy1 - gy0);
    };

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(gx0, mapY(1.0));
    ctx.lineTo(gx1, mapY(1.0));
    ctx.stroke();
    ctx.setLineDash([]);

    configs.forEach(cfg => {
      let x = 1.0;
      let v = 0.0;
      const pts: { x: number; v: number; e: number }[] = [{ x, v, e: 1.0 }];
      for (let i = 0; i < N; i++) {
        const nxt = stepFn(cfg.id, x, v);
        x = nxt.x;
        v = nxt.v;
        pts.push({ x, v, e: x * x + v * v });
      }

      // Phase orbit
      ctx.strokeStyle = cfg.col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const sx = cx + Math.max(-2.1, Math.min(2.1, p.x)) * R;
        const sy = cy - Math.max(-2.1, Math.min(2.1, p.v)) * R;
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();

      // Energy graph
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const ex = gx0 + (idx / N) * (gx1 - gx0);
        const ey = mapY(p.e);
        if (idx === 0) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      });
      ctx.stroke();
    });

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isZh ? '左：相空间轨迹 (x, v)' : 'Left: Phase Space (x, v)', 20, 22);
    ctx.fillText(isZh ? '右：归一化总能量 E_n / E_0' : 'Right: Energy Ratio E_n / E_0', gx0, 22);
  }, [activeTab, lab1Dt, lab1Steps, isZh]);

  // Draw Tab 2 Lab 2: Particle Fountain & Vortex Force-Field
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = lab2CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.52;
    const h = fountainDt;
    const k = fountainSpring;
    const s = fountainSwirl;

    // Reference circle
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148,163,184,0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, 115, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const accel = (px: number, py: number) => ({
      ax: -k * px - s * py,
      ay: -k * py + s * px
    });

    const numStreams = 6;
    for (let b = 0; b < numStreams; b++) {
      const ang = (b / numStreams) * Math.PI * 2;
      let px = Math.cos(ang) * 1.0;
      let py = Math.sin(ang) * 1.0;
      let vx = -Math.sin(ang) * 1.0;
      let vy = Math.cos(ang) * 1.0;

      ctx.strokeStyle =
        fountainMethod === 'explicit'
          ? 'rgba(244,63,94,0.65)'
          : fountainMethod === 'symplectic'
          ? 'rgba(16,185,129,0.65)'
          : 'rgba(192,132,252,0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let step = 0; step < 65; step++) {
        const sx = cx + Math.max(-2.2, Math.min(2.2, px)) * 115;
        const sy = cy - Math.max(-2.2, Math.min(2.2, py)) * 115;
        if (step === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);

        if (fountainMethod === 'explicit') {
          const a = accel(px, py);
          px += h * vx;
          py += h * vy;
          vx += h * a.ax;
          vy += h * a.ay;
        } else if (fountainMethod === 'symplectic') {
          const a = accel(px, py);
          vx += h * a.ax;
          vy += h * a.ay;
          px += h * vx;
          py += h * vy;
        } else {
          const a1 = accel(px, py);
          const k1vx = a1.ax, k1vy = a1.ay, k1px = vx, k1py = vy;
          const a2 = accel(px + 0.5 * h * k1px, py + 0.5 * h * k1py);
          const k2vx = a2.ax, k2vy = a2.ay, k2px = vx + 0.5 * h * k1vx, k2py = vy + 0.5 * h * k1vy;
          const a3 = accel(px + 0.5 * h * k2px, py + 0.5 * h * k2py);
          const k3vx = a3.ax, k3vy = a3.ay, k3px = vx + 0.5 * h * k2vx, k3py = vy + 0.5 * h * k2vy;
          const a4 = accel(px + h * k3px, py + h * k3py);
          const k4vx = a4.ax, k4vy = a4.ay, k4px = vx + h * k3vx, k4py = vy + h * k3vy;
          px += (h / 6) * (k1px + 2 * k2px + 2 * k3px + k4px);
          py += (h / 6) * (k1py + 2 * k2py + 2 * k3py + k4py);
          vx += (h / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx);
          vy += (h / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy);
        }
      }
      ctx.stroke();
    }
  }, [activeTab, fountainMethod, fountainDt, fountainSpring, fountainSwirl]);

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

    const cx = W * 0.5;
    const cy = H * 0.52;
    const R = 105;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(16,185,129,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const h = mission === 1 ? 0.32 : mission === 2 ? 0.65 : 0.45;
    let x = 1.0;
    let v = 0.0;
    const pts: { x: number; v: number }[] = [{ x, v }];

    for (let i = 0; i < 36; i++) {
      if (mission === 1) {
        if (gameOrder === 'explicit') {
          const xn = x + h * v;
          const vn = v - h * x;
          x = xn;
          v = vn;
        } else {
          v = v - h * x;
          x = x + h * v;
        }
      } else {
        if (gameMethod === 'explicit') {
          const xn = x + h * v;
          const vn = v - h * x;
          x = xn;
          v = vn;
        } else if (gameMethod === 'implicit') {
          const d = 1 + h * h;
          const xn = (x + h * v) / d;
          const vn = (v - h * x) / d;
          x = xn;
          v = vn;
        } else {
          const k1x = v, k1v = -x;
          const k2x = v + 0.5 * h * k1v, k2v = -(x + 0.5 * h * k1x);
          const k3x = v + 0.5 * h * k2v, k3v = -(x + 0.5 * h * k2x);
          const k4x = v + h * k3v, k4v = -(x + h * k3x);
          x += (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
          v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
        }
      }
      pts.push({ x, v });
    }

    const finalE = x * x + v * v;
    const ok =
      (mission === 1 && gameOrder === 'symplectic') ||
      (mission === 2 && gameMethod === 'implicit') ||
      (mission === 3 && gameMethod === 'rk4');

    ctx.strokeStyle = ok ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const sx = cx + Math.max(-2.2, Math.min(2.2, p.x)) * R;
      const sy = cy - Math.max(-2.2, Math.min(2.2, p.v)) * R;
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    ctx.fillStyle = ok ? '#34d399' : '#fb7185';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Final Energy Ratio E_N / E_0 = ${finalE.toFixed(4)}`, 20, 26);
  }, [activeTab, mission, gameOrder, gameMethod]);

  const verifyMission = () => {
    if (mission === 1) {
      if (gameOrder === 'symplectic') {
        setPassed(prev => ({ ...prev, 1: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 1 通过！先更新 v_{n+1} 再用新速度更新 x_{n+1} 构成半隐式（辛）欧拉，行列式 det(A)=1 严格保面积！'
            : '✅ Mission 1 Passed! Updating v_{n+1} first and using it for x_{n+1} forms Symplectic Euler with det(A)=1!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 当前同时使用旧状态更新属于显式欧拉，斜边效应使能量每步暴涨 (1+h²) 倍！请切换为半隐式欧拉顺序。'
            : '⚠️ Simultaneous old-state update is Explicit Euler, which amplifies energy by (1+h²) per step!'
        });
      }
    } else if (mission === 2) {
      if (gameMethod === 'implicit') {
        setPassed(prev => ({ ...prev, 2: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 2 通过！隐式欧拉把旧状态变为直角三角形斜边，谱半径 1/√(1+h²)<1 无条件 A-稳定！'
            : '✅ Mission 2 Passed! Implicit Euler makes the old state the hypotenuse, unconditionally A-stable!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 面对超大刚性步长，请选择无条件 A-稳定并自带数值阻尼的隐式欧拉 (Backward Implicit Euler)！'
            : '⚠️ For stiff large time steps, select unconditionally A-stable Backward Implicit Euler!'
        });
      }
    } else {
      if (gameMethod === 'rk4') {
        setPassed(prev => ({ ...prev, 3: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 3 通过！4 阶龙格-库塔 (RK4) 通过 (k₁+2k₂+2k₃+k₄)/6 对称采样斜率，单步截断误差达到 O(h⁵)！'
            : '✅ Mission 3 Passed! 4th-Order Runge-Kutta (RK4) achieves O(h⁵) local error with 4 symmetric slope probes!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 请选择 4 阶龙格-库塔 (RK4) 以同时避免显式发散与隐式过度耗散，达到高精度轨道锁定！'
            : '⚠️ Select 4th-Order Runge-Kutta (RK4) for high-order orbital accuracy!'
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
            <span>STAGE 5 · LESSON 27</span>
            <span>·</span>
            <span>MIT 6.837 LECTURE 07</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isZh
              ? '粒子系统与常微分方程数值积分 (ODEs & Euler Methods)'
              : 'Particle Systems & ODE Integrators: Phase Space, Euler & RK4'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isZh
              ? '用相空间勾股定理直觉彻底看懂为什么显式欧拉必爆炸、隐式欧拉必衰减、而对调两行代码的半隐式欧拉完美守恒'
              : 'Geometric phase-space intuition for Explicit Euler explosion, Implicit Euler damping, Symplectic Euler area preservation, and RK4'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="lessons/lesson-27.html"
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

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 1 as const, zh: '📐 1. 3Blue1Brown 相空间与勾股直觉', en: '📐 1. 3Blue1Brown Phase Space & Math' },
          { id: 2 as const, zh: '🔬 2. 双实验台 (5积分器竞技场 + 粒子喷泉)', en: '🔬 2. Dual Labs (5-Integrator Arena + Fountain)' },
          { id: 3 as const, zh: '🎥 3. MIT 6.837 L07 课堂精要', en: '🎥 3. MIT 6.837 L07 Course Companion' },
          { id: 4 as const, zh: '🎮 4. 闯关：首席物理引擎架构师 (3关)', en: '🎮 4. Game: Chief Physics Architect (3 Missions)' }
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
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-indigo-300">
                {isZh
                  ? '1. 降阶魔法：把二阶 F=ma 化为一阶相空间流场'
                  : '1. Order Reduction: 2nd-Order F=ma to 1st-Order Phase Space'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '牛顿第二定律 mẍ = F(x,v) 是二阶微分方程。我们把位置与速度打包为相空间状态向量 Y = [x, v]ᵀ，弹簧振子 (k/m=1) 立刻化为一阶线性系统 dY/dt = [v, -x]ᵀ。因为 Y · dY/dt = xv - xv = 0，切向量永远垂直于半径！'
                  : 'Packing position and velocity into state vector Y = [x, v]ᵀ turns the harmonic oscillator into dY/dt = [v, -x]ᵀ. Since Y · dY/dt = 0, the velocity vector is perpendicular to the radius everywhere!'}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-rose-300">
                {isZh
                  ? '2. 为什么显式欧拉必爆炸？为什么隐式欧拉必衰减？'
                  : '2. Why Explicit Euler Explodes & Implicit Euler Damps'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '显式欧拉 Y_{n+1} = Y_n + h·f(Y_n) 沿当前圆的切线走出直角边 h||Y_n||，新状态落在直角三角形斜边上：||Y_{n+1}|| = √(1+h²)||Y_n||，能量每步暴涨 (1+h²) 倍！隐式欧拉 Y_{n+1} = Y_n + h·f(Y_{n+1}) 则让新状态切线垂直于新半径，旧状态反而成了斜边：||Y_{n+1}|| = ||Y_n|| / √(1+h²) < ||Y_n||。'
                  : 'Explicit Euler steps along the old tangent onto the hypotenuse: ||Y_{n+1}|| = √(1+h²)||Y_n||. Implicit Euler aligns the step with the new tangent, making the old state the hypotenuse: ||Y_{n+1}|| = ||Y_n||/√(1+h²).'}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-emerald-300">
                {isZh
                  ? '3. 两行代码顺序的奇迹：半隐式（辛）欧拉 det(A) = 1'
                  : '3. The Two-Line Miracle: Symplectic Euler det(A) = 1'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '先算新速度 v_{n+1} = v_n - h·x_n，再用新速度更新位置 x_{n+1} = x_n + h·v_{n+1}。这等价于两次行列式为 1 的错切变换乘积，转移矩阵行列式 det(A_symp) = (1-h²) + h² = 1，严格遵守刘维尔相空间面积守恒！'
                  : 'Updating velocity first v_{n+1} = v_n - h·x_n and then position x_{n+1} = x_n + h·v_{n+1} factors into two unit-determinant shear matrices, yielding det(A_symp) = 1 and long-term energy conservation!'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">
                {isZh
                  ? '🔬 相空间单步勾股直角三角形显微镜'
                  : '🔬 Phase-Space Single-Step Pythagorean Microscope'}
              </h3>
              <canvas
                ref={mathCanvasRef}
                width={520}
                height={330}
                className="w-full rounded-xl bg-slate-950 border border-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{isZh ? '时间步长 h (Δt)' : 'Step Size h (Δt)'}</span>
                  <span className="font-mono text-indigo-300">{mathH.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.85}
                  step={0.01}
                  value={mathH}
                  onChange={e => setMathH(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{isZh ? '初始相角 θ₀' : 'Initial Phase Angle θ₀'}</span>
                  <span className="font-mono text-amber-300">{mathAngle}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={mathAngle}
                  onChange={e => setMathAngle(parseInt(e.target.value, 10))}
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
          {/* Lab 1 */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh
                ? '实验台 1：五大 ODE 积分器相空间与能量漂移同屏竞技场'
                : 'Lab 1: 5-Integrator Phase-Space & Energy Drift Arena'}
            </h3>
            <canvas
              ref={lab1CanvasRef}
              width={640}
              height={320}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{isZh ? '时间步长 h = Δt' : 'Time Step h = Δt'}</span>
                  <span className="font-mono text-indigo-300">{lab1Dt.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.65}
                  step={0.01}
                  value={lab1Dt}
                  onChange={e => setLab1Dt(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{isZh ? '仿真步数 N' : 'Simulation Steps N'}</span>
                  <span className="font-mono text-emerald-300">{lab1Steps}</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={60}
                  step={1}
                  value={lab1Steps}
                  onChange={e => setLab1Steps(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Lab 2 */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh
                ? '实验台 2：粒子涡旋力场轨迹沙盒'
                : 'Lab 2: Particle Vortex Force-Field Sandbox'}
            </h3>
            <canvas
              ref={lab2CanvasRef}
              width={460}
              height={320}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['symplectic', 'explicit', 'rk4'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setFountainMethod(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                      fountainMethod === m
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {m === 'symplectic' ? 'Symplectic' : m === 'explicit' ? 'Explicit' : 'RK4'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Δt</span>
                    <span className="font-mono">{fountainDt.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.02}
                    max={0.14}
                    step={0.01}
                    value={fountainDt}
                    onChange={e => setFountainDt(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>{isZh ? '涡旋力' : 'Swirl'}</span>
                    <span className="font-mono">{fountainSwirl.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={2.6}
                    step={0.1}
                    value={fountainSwirl}
                    onChange={e => setFountainSwirl(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
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
              ? 'MIT 6.837 Lecture 07：Particle Systems & ODEs 课程精要'
              : 'MIT 6.837 Lecture 07: Particle Systems & ODEs Course Companion'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-bold text-indigo-300">
                {isZh ? '1. 粒子系统模块化设计 (Forces vs Integrators)' : '1. Modularity: Forces vs Integrators'}
              </div>
              <p>
                {isZh
                  ? 'Justin Solomon 教授强调将物理引擎拆为完全解耦的两层：① 物理规律层提供 evalF(Y, t)；② 数值求解器层 (Euler / Symplectic / RK4) 只负责把 Y(t) 推进到 Y(t+Δt)，无需知道模拟的是烟花、布料还是行星。'
                  : 'Prof. Justin Solomon highlights separating physics into two decoupled layers: force evaluators evalF(Y,t) and black-box ODE integrators.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-300">
                {isZh ? '2. 精度阶数 O(h^p) vs 稳定性区域' : '2. Accuracy Order O(h^p) vs Stability'}
              </div>
              <p>
                {isZh
                  ? '精度与稳定性是两件独立的事：显式欧拉与隐式欧拉同为 1 阶精度 O(h)，但显式欧拉在振荡系统无条件发散，隐式欧拉无条件稳定；RK4 具有 4 阶全局精度 O(h⁴)，在步长合理时兼具高精度与低阻尼。'
                  : 'Accuracy order and stability are distinct: both Explicit and Implicit Euler are 1st-order O(h), yet have opposite stability behavior on oscillators.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isZh ? '🎮 首席物理引擎架构师' : '🎮 Chief Physics Engine Architect'}
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
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  {isZh
                    ? '任务 1：实习生写的弹簧循环每步能量暴涨 (1+h²) 倍。请将代码更新顺序切换为保面积 det(A)=1 的半隐式（辛）欧拉！'
                    : 'Mission 1: Switch the update order from exploding Explicit Euler to area-preserving Symplectic Euler (det(A)=1)!'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGameOrder('explicit')}
                    className={`p-2.5 rounded-xl border text-left font-mono ${
                      gameOrder === 'explicit'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    x += h * v_old;
                    <br />v += h * a(x_old);
                  </button>
                  <button
                    onClick={() => setGameOrder('symplectic')}
                    className={`p-2.5 rounded-xl border text-left font-mono ${
                      gameOrder === 'symplectic'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    v += h * a(x_old);
                    <br />x += h * v_new;
                  </button>
                </div>
              </div>
            )}

            {mission !== 1 && (
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  {mission === 2
                    ? isZh
                      ? '任务 2：面对大步长刚性系统 (h=0.65)，请选择无条件 A-稳定、绝对不会爆炸的积分器！'
                      : 'Mission 2: For a stiff large step (h=0.65), select the unconditionally A-stable integrator!'
                    : isZh
                    ? '任务 3：深空探测器需要 O(h⁵) 单步精度锁定参考圆轨道 (误差 < 2%)，请选择高阶积分器！'
                    : 'Mission 3: Select the 4th-order integrator to lock onto the reference orbit within 2% error!'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['explicit', 'implicit', 'rk4'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setGameMethod(m)}
                      className={`py-2 rounded-xl border font-bold ${
                        gameMethod === m
                          ? 'bg-indigo-600/30 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {m === 'explicit' ? 'Explicit' : m === 'implicit' ? 'Implicit' : 'RK4'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={verifyMission}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              {isZh ? '⚡ 验证并运行架构测试' : '⚡ Verify & Run Physics Test'}
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
              height={320}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
