import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson28Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson28ClothSim: React.FC<Lesson28Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Vector Hooke, Axial Dashpot & Quad Shear Nullspace
  const [stretch, setStretch] = useState<number>(1.35);
  const [velAngle, setVelAngle] = useState<number>(55);
  const [shearDeg, setShearDeg] = useState<number>(28);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: Cloth Wind Tunnel & Sphere Collision
  const [wind, setWind] = useState<number>(1.4);
  const [sphereZ, setSphereZ] = useState<number>(0.25);
  const [pbdIters, setPbdIters] = useState<number>(5);
  const [rightPin, setRightPin] = useState<boolean>(true);
  const clothCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: Topology Shear & Stiffness Stability
  const [useShear, setUseShear] = useState<boolean>(true);
  const [useBend, setUseBend] = useState<boolean>(true);
  const [ks, setKs] = useState<number>(180);
  const [dt, setDt] = useState<number>(0.08);
  const stiffCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [m1Mode, setM1Mode] = useState<'struct_only' | 'full_provot'>('struct_only');
  const [m2Mode, setM2Mode] = useState<'global' | 'axial'>('global');
  const [m3Mode, setM3Mode] = useState<'raw_euler' | 'pbd_sdf'>('raw_euler');
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

    // Divider
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.beginPath();
    ctx.moveTo(W * 0.52, 16);
    ctx.lineTo(W * 0.52, H - 16);
    ctx.stroke();

    const x1 = 48;
    const y1 = H * 0.56;
    const L0 = 96;
    const curL = L0 * stretch;
    const x2 = x1 + curL;
    const y2 = y1;

    // Rest length line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(16,185,129,0.5)';
    ctx.beginPath();
    ctx.moveTo(x1 + L0, y1 - 40);
    ctx.lineTo(x1 + L0, y1 + 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Spring zig-zag
    ctx.strokeStyle = stretch > 1.02 ? '#fb7185' : stretch < 0.98 ? '#38bdf8' : '#34d399';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i < 10; i++) {
      ctx.lineTo(x1 + (i / 10) * curL, y1 + (i % 2 === 0 ? -9 : 9));
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const phi = (velAngle * Math.PI) / 180;
    const vLen = 70;
    const vx = Math.cos(phi) * vLen;
    const vy = -Math.sin(phi) * vLen;

    // Axial component
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + vx, y2);
    ctx.stroke();

    // Perpendicular component
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x2 + vx, y2);
    ctx.lineTo(x2 + vx, y2 + vy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Total relative velocity
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + vx, y2 + vy);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(x1, y1, 6, 0, Math.PI * 2);
    ctx.arc(x2, y2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Right panel: Rhombus shear
    const qcx = W * 0.76;
    const qcy = H * 0.56;
    const side = 100;
    const gamma = (shearDeg * Math.PI) / 180;
    const p00 = { x: qcx - side * 0.5, y: qcy + side * 0.5 };
    const p10 = { x: qcx + side * 0.5, y: qcy + side * 0.5 };
    const p01 = { x: p00.x + Math.sin(gamma) * side, y: p00.y - Math.cos(gamma) * side };
    const p11 = { x: p10.x + Math.sin(gamma) * side, y: p10.y - Math.cos(gamma) * side };

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p00.x, p00.y);
    ctx.lineTo(p11.x, p11.y);
    ctx.moveTo(p10.x, p10.y);
    ctx.lineTo(p01.x, p01.y);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(p00.x, p00.y);
    ctx.lineTo(p10.x, p10.y);
    ctx.lineTo(p11.x, p11.y);
    ctx.lineTo(p01.x, p01.y);
    ctx.closePath();
    ctx.stroke();
  }, [activeTab, stretch, velAngle, shearDeg]);

  // Draw Tab 2 Lab 1: Cloth Wind Tunnel
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = clothCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const scx = W * 0.5;
    const scy = H * 0.56;
    const sR = 54;

    // Draw sphere collider
    ctx.fillStyle = 'rgba(99,102,241,0.32)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(scx, scy + sphereZ * 30, sR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cloth drape preview grid
    const cols = 10;
    const rows = 8;
    const cell = 24;
    const pts: { x: number; y: number; strain: number }[][] = [];

    for (let r = 0; r < rows; r++) {
      const rowArr: { x: number; y: number; strain: number }[] = [];
      for (let c = 0; c < cols; c++) {
        const dropOffset = !rightPin && c > cols / 2 ? (c - cols / 2) * r * 2.2 : 0;
        let px = scx + (c - (cols - 1) / 2) * cell + r * wind * 3.5;
        let py = 46 + r * cell + dropOffset;
        const dx = px - scx;
        const dy = py - (scy + sphereZ * 30);
        const d = Math.hypot(dx, dy) || 1;
        let strain = 0.02 * (6 - pbdIters);
        if (d < sR + 6) {
          px = scx + (dx / d) * (sR + 6);
          py = scy + sphereZ * 30 + (dy / d) * (sR + 6);
          strain += 0.14;
        }
        rowArr.push({ x: px, y: py, strain });
      }
      pts.push(rowArr);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = pts[r][c];
        ctx.strokeStyle = p.strain > 0.12 ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 1.8;
        if (c + 1 < cols) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pts[r][c + 1].x, pts[r][c + 1].y);
          ctx.stroke();
        }
        if (r + 1 < rows) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pts[r + 1][c].x, pts[r + 1][c].y);
          ctx.stroke();
        }
      }
    }
  }, [activeTab, wind, sphereZ, pbdIters, rightPin]);

  // Draw Tab 2 Lab 2: Topology & Stiffness Stability
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = stiffCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 34;
    const oy = 56;
    const cell = 42;
    const shearShift = useShear ? 4 : 25;
    const bendSag = useBend ? 3 : 16;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const x = ox + c * cell + r * shearShift;
        const y = oy + r * cell + (c === 1 ? bendSag : 0);
        if (c < 2) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(ox + (c + 1) * cell + r * shearShift, oy + r * cell + (c + 1 === 1 ? bendSag : 0));
          ctx.stroke();
        }
        if (r < 2) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(ox + c * cell + (r + 1) * shearShift, oy + (r + 1) * cell + (c === 1 ? bendSag : 0));
          ctx.stroke();
        }
      }
    }

    const gx0 = W * 0.48;
    const gx1 = W - 18;
    const gyMid = H * 0.52;
    const prod = Math.sqrt(ks) * dt;
    let x = 1.0;
    let v = 0.0;
    ctx.strokeStyle = prod < 2.0 ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let step = 0; step <= 20; step++) {
      const sx = gx0 + (step / 20) * (gx1 - gx0);
      const sy = gyMid - Math.max(-2.1, Math.min(2.1, x)) * 52;
      if (step === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
      v = v - ks * x * dt;
      x = x + v * dt;
    }
    ctx.stroke();
  }, [activeTab, useShear, useBend, ks, dt]);

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
      (mission === 1 && m1Mode === 'full_provot') ||
      (mission === 2 && m2Mode === 'axial') ||
      (mission === 3 && m3Mode === 'pbd_sdf');

    ctx.strokeStyle = ok ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3;
    const cx = W * 0.5;
    const cy = H * 0.54;
    ctx.beginPath();
    for (let i = -4; i <= 4; i++) {
      const x = cx + i * 38 + (!ok && mission === 1 ? 35 : 0);
      const y = cy + Math.sin(i * 0.6) * (ok ? 28 : 65);
      if (i === -4) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = ok ? '#34d399' : '#fb7185';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(ok ? 'STATUS: CLOTH SIMULATION PASS ✓' : 'STATUS: ARTIFACT / INSTABILITY DETECTED ✗', 22, 28);
  }, [activeTab, mission, m1Mode, m2Mode, m3Mode]);

  const verifyMission = () => {
    if (mission === 1) {
      if (m1Mode === 'full_provot') {
        setPassed(prev => ({ ...prev, 1: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 1 通过！剪切弹簧锁死对角线 √2h，弯曲弹簧消除 180° 折纸零空间！'
            : '✅ Mission 1 Passed! Shear and Bending springs eliminate the shear/fold nullspace!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 仅有结构弹簧时，平行四边形错切变形位于刚度零空间！请切换为完整 Provot 拓扑。'
            : '⚠️ Structural springs alone allow zero-energy rhombus shear! Enable full Provot topology.'
        });
      }
    } else if (mission === 2) {
      if (m2Mode === 'axial') {
        setPassed(prev => ({ ...prev, 2: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 2 通过！轴向投影阻尼 k_d((v_j-v_i)·d̂)d̂ 对刚体旋转点积为 0，披风摆动自然流畅！'
            : '✅ Mission 2 Passed! Axial dashpot projection preserves rigid-body swing!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 全局阻尼 -k_d*v_i 会把刚体摆动当成糖浆阻力耗散掉！请切换为轴向投影阻尼。'
            : '⚠️ Global damping -k_d*v_i kills rigid-body swing! Switch to Axial Dashpot Projection.'
        });
      }
    } else {
      if (m3Mode === 'pbd_sdf') {
        setPassed(prev => ({ ...prev, 3: true }));
        setGameFeedback({
          ok: true,
          msg: isZh
            ? '✅ 关卡 3 通过！PBD 距离约束松弛 + 球体 SDF 法向投影完美化解高刚度爆炸与穿模！'
            : '✅ Mission 3 Passed! PBD constraint relaxation + Sphere SDF projection resolves stiffness explosion!'
        });
      } else {
        setGameFeedback({
          ok: false,
          msg: isZh
            ? '⚠️ 高刚度单步显式力超越了 Δt_crit = 2√(m/k_s)！请开启 PBD + 球体 SDF 碰撞投影。'
            : '⚠️ High-stiffness explicit step violates Δt_crit! Enable PBD + Sphere SDF projection.'
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
            <span>STAGE 5 · LESSON 28</span>
            <span>·</span>
            <span>MIT 6.837 LECTURE 08</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isZh
              ? '质点弹簧系统与实时布料仿真 (Mass-Spring & Cloth Simulation)'
              : 'Mass-Spring Systems & Real-Time Cloth Simulation'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isZh
              ? '从弹性势能负梯度、轴向速度阻尼投影到结构/剪切/弯曲三大弹簧零空间、刚度危机与球体 SDF 碰撞约束'
              : 'Potential gradient Hooke law, axial dashpot projection, Structural/Shear/Bending nullspaces, stiffness crisis & collision'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="lessons/lesson-28.html"
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
          { id: 1 as const, zh: '📐 1. 3Blue1Brown 弹簧拓扑与阻尼直觉', en: '📐 1. 3Blue1Brown Spring & Topology Math' },
          { id: 2 as const, zh: '🔬 2. 双实验台 (3D 布料风洞 + 刚度稳定性)', en: '🔬 2. Dual Labs (3D Cloth Wind Tunnel + Stiffness)' },
          { id: 3 as const, zh: '🎥 3. MIT 6.837 L08 课堂精要', en: '🎥 3. MIT 6.837 L08 Course Companion' },
          { id: 4 as const, zh: '🎮 4. 闯关：首席布料物理总监 (3关)', en: '🎮 4. Game: Chief Cloth Director (3 Missions)' }
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
                  ? '1. 向量胡克定律与轴向投影阻尼 (Δv·d̂)d̂'
                  : '1. Vector Hooke Law & Axial Dashpot Projection'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '弹簧力是弹性势能 E = ½k_s(||x_j - x_i|| - L₀)² 的负梯度：F = k_s(||d|| - L₀)d̂。阻尼器必须将相对速度投影到弹簧轴线上：F_damp = k_d((v_j - v_i)·d̂)d̂，否则全局阻尼 -k_d*v_i 会把刚体自由落体与旋转当成糖浆阻力吃掉！'
                  : 'Spring force is the negative gradient of potential energy. Dashpot damping projects relative velocity onto the spring axis d̂ so rigid rotation experiences zero false drag.'}
              </p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h3 className="text-base font-bold text-emerald-300">
                {isZh
                  ? '2. 结构 (Structural)、剪切 (Shear) 与弯曲 (Bending) 零空间'
                  : '2. Structural, Shear & Bending Nullspace Geometry'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isZh
                  ? '正方形压成菱形时四条边长完全不变（平面错切处于结构弹簧零空间），必须靠对角线剪切弹簧 (L₀=√2h) 锁死；而沿网格边 180° 折纸时不改变结构边与对角线长度，必须靠跨两格的弯曲弹簧 (L₀=2h) 抵抗折叠！'
                  : 'Shearing a square into a rhombus preserves all 4 edge lengths (structural nullspace), requiring diagonal Shear springs; out-of-plane folding requires 2-hop Bending springs.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <canvas
              ref={mathCanvasRef}
              width={540}
              height={310}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>||d||/L₀</span>
                  <span className="font-mono text-indigo-300">{stretch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.01}
                  value={stretch}
                  onChange={e => setStretch(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>φ_Δv</span>
                  <span className="font-mono text-emerald-300">{velAngle}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={1}
                  value={velAngle}
                  onChange={e => setVelAngle(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>γ_shear</span>
                  <span className="font-mono text-amber-300">{shearDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={1}
                  value={shearDeg}
                  onChange={e => setShearDeg(parseInt(e.target.value, 10))}
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
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isZh ? '实验台 1：3D 布料风洞与碰撞张力沙盒' : 'Lab 1: 3D Cloth Wind Tunnel & Sphere Collider'}
              </h3>
              <button
                onClick={() => setRightPin(p => !p)}
                className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300"
              >
                {isZh ? '📌 切换右上角挂钩' : '📌 Toggle Right Pin'}
              </button>
            </div>
            <canvas
              ref={clothCanvasRef}
              width={600}
              height={300}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-300">Wind: {wind.toFixed(1)}</span>
                <input
                  type="range"
                  min={0}
                  max={3.5}
                  step={0.1}
                  value={wind}
                  onChange={e => setWind(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">Sphere Y/Z: {sphereZ.toFixed(2)}</span>
                <input
                  type="range"
                  min={-0.8}
                  max={0.9}
                  step={0.05}
                  value={sphereZ}
                  onChange={e => setSphereZ(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">PBD Passes: {pbdIters}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={pbdIters}
                  onChange={e => setPbdIters(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isZh ? '实验台 2：拓扑抗剪与刚度稳定性临界台' : 'Lab 2: Topology & Stiffness Stability'}
            </h3>
            <canvas
              ref={stiffCanvasRef}
              width={460}
              height={300}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setUseShear(s => !s)}
                className={`flex-1 py-1.5 rounded-lg font-bold border ${
                  useShear ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {useShear ? '✓ Shear' : '✗ Shear'}
              </button>
              <button
                onClick={() => setUseBend(b => !b)}
                className={`flex-1 py-1.5 rounded-lg font-bold border ${
                  useBend ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {useBend ? '✓ Bending' : '✗ Bending'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-300">k_s: {ks}</span>
                <input
                  type="range"
                  min={40}
                  max={600}
                  step={10}
                  value={ks}
                  onChange={e => setKs(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-slate-300">Δt: {dt.toFixed(3)}</span>
                <input
                  type="range"
                  min={0.02}
                  max={0.18}
                  step={0.005}
                  value={dt}
                  onChange={e => setDt(parseFloat(e.target.value))}
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
              ? 'MIT 6.837 Lecture 08：Mass-Spring Systems & Cloth Simulation 精要'
              : 'MIT 6.837 Lecture 08: Mass-Spring Systems & Cloth Simulation'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isZh
              ? 'Justin Solomon 教授在 MIT 6.837 第 8 讲中系统拆解了 Provot (1995) 质点弹簧布料网络：如何用 Structural / Shear / Bending 三类无质量弹簧将二维织物表面转化为常微分方程系统，以及高刚度下显式步长受限于 Δt < 2√(m/k_s) 的刚度危机。'
              : 'Prof. Justin Solomon covers Provot (1995) mass-spring cloth topology, axial dashpot damping, and the high-stiffness time-step bottleneck.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isZh ? '🎮 首席布料物理仿真总监' : '🎮 Chief Cloth Simulation Director'}
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
                  onClick={() => setM1Mode('struct_only')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m1Mode === 'struct_only' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Structural Only
                </button>
                <button
                  onClick={() => setM1Mode('full_provot')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m1Mode === 'full_provot' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Struct + Shear + Bend
                </button>
              </div>
            )}

            {mission === 2 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setM2Mode('global')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m2Mode === 'global' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  -k_d * v_i
                </button>
                <button
                  onClick={() => setM2Mode('axial')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m2Mode === 'axial' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  k_d * dot(dv, d_hat) * d_hat
                </button>
              </div>
            )}

            {mission === 3 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setM3Mode('raw_euler')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Mode === 'raw_euler' ? 'bg-rose-500/20 border-rose-500 text-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Raw Single-Step Force
                </button>
                <button
                  onClick={() => setM3Mode('pbd_sdf')}
                  className={`p-2.5 rounded-xl border font-mono ${
                    m3Mode === 'pbd_sdf' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  PBD + Sphere SDF
                </button>
              </div>
            )}

            <button
              onClick={verifyMission}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              {isZh ? '⚡ 运行布料仿真验收测试' : '⚡ Verify Cloth Simulation'}
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
