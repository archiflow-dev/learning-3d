import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../App';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Lesson04Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson04Quaternions: React.FC<Lesson04Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'deep' | 'lab1' | 'lab2' | 'videos' | 'game'>('deep');

  const [camYaw, setCamYaw] = useState(-0.55);
  const [camPitch, setCamPitch] = useState(0.40);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Tab 0 State: Half-Angle Sandwich Explorer
  const [isFullSandwich, setIsFullSandwich] = useState(true);
  const [swTheta, setSwTheta] = useState(90);

  // Tab 1 State: Quaternion Attitude & Double Cover (q vs -q)
  const [negateQ, setNegateQ] = useState(false);
  const [qlAz, setQlAz] = useState(45);
  const [qlEl, setQlEl] = useState(45);
  const [qlTheta, setQlTheta] = useState(90);

  // Tab 2 State: LERP vs NLERP vs SLERP
  const [useShortestPath, setUseShortestPath] = useState(true);
  const [slerpT, setSlerpT] = useState(0.5);
  const [slerpOmega, setSlerpOmega] = useState(130);

  // Tab 4 State: Mini-Game
  const [currentMission, setCurrentMission] = useState<1 | 2 | 3>(1);
  const [missionsCleared, setMissionsCleared] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false
  });
  const [m1UseRight, setM1UseRight] = useState(false);
  const [m1Alpha, setM1Alpha] = useState(120);

  const [m2Flipped, setM2Flipped] = useState(false);
  const [m2T, setM2T] = useState(0.5);

  const [m3UseSlerp, setM3UseSlerp] = useState(false);
  const [m3T, setM3T] = useState(0.2);

  const sandwichCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const quatLabCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const slerpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross3 = (a: Vec3, b: Vec3): Vec3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  });
  const norm3 = (v: Vec3): Vec3 => {
    const l = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  };
  const rodriguesRotate = (v: Vec3, kUnit: Vec3, thetaRad: number): Vec3 => {
    const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
    const kv = dot3(kUnit, v);
    const kxv = cross3(kUnit, v);
    return {
      x: v.x * c + kUnit.x * kv * (1 - c) + kxv.x * s,
      y: v.y * c + kUnit.y * kv * (1 - c) + kxv.y * s,
      z: v.z * c + kUnit.z * kv * (1 - c) + kxv.z * s
    };
  };

  const project3D = (p: Vec3, width: number, height: number, scale = 76) => {
    const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;
    const cosP = Math.cos(camPitch), sinP = Math.sin(camPitch);
    const y2 = p.y * cosP - z1 * sinP;
    const z2 = p.y * sinP + z1 * cosP;
    const camDist = 9.5;
    const persp = camDist / Math.max(1.5, camDist - z2);
    return {
      x: width / 2 + x1 * scale * persp,
      y: height / 2 + 15 - y2 * scale * persp,
      depth: z2
    };
  };

  const drawArrow2D = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    lineWidth = 2.5,
    label = ''
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(11, Math.max(6, len * 0.22));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLen * Math.cos(angle - Math.PI / 6),
      to.y - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - headLen * Math.cos(angle + Math.PI / 6),
      to.y - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, to.x + 10 * Math.cos(angle) - 8, to.y + 10 * Math.sin(angle) + 4);
    }
    ctx.restore();
  };

  // Draw Tab 0: Sandwich Explorer
  useEffect(() => {
    if (activeTab !== 'deep') return;
    const canvas = sandwichCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 540;
    canvas.height = rect?.height || 315;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const halfDeg = swTheta / 2;
    const alphaRad = (halfDeg * Math.PI) / 180;
    const kUnit: Vec3 = { x: 0, y: 1, z: 0 };
    const pStart: Vec3 = { x: 1.5, y: 1.1, z: 0.4 };

    const activeDiskAngle = isFullSandwich ? 2 * alphaRad : alphaRad;
    const wLeak = isFullSandwich ? 0 : -Math.sin(alphaRad) * pStart.y;
    const pParY = isFullSandwich ? pStart.y : pStart.y * Math.cos(alphaRad);

    const pDiskRot = rodriguesRotate({ x: pStart.x, y: 0, z: pStart.z }, kUnit, activeDiskAngle);
    const pOut3D = { x: pDiskRot.x, y: pParY, z: pDiskRot.z };

    const o = project3D({ x: 0, y: 0, z: 0 }, w, h, 72);
    drawArrow2D(ctx, o, project3D({ x: 0, y: 2.3, z: 0 }, w, h, 72), '#06b6d4', 2.5, 'Axis û (Y)');
    drawArrow2D(ctx, o, project3D(pStart, w, h, 72), 'rgba(148,163,184,0.5)', 2, 'Original p');
    drawArrow2D(
      ctx,
      o,
      project3D(pOut3D, w, h, 72),
      isFullSandwich ? '#10b981' : '#f43f5e',
      3.5,
      isFullSandwich ? `q·p·q⁻¹ (Rot=${swTheta}°)` : `q·p (Only ${halfDeg}°, Leaked!)`
    );

    const gx = w - 65, gy = h / 2 + 15, gh = 90;
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx - 12, gy - gh, 24, gh * 2);
    ctx.fillStyle = Math.abs(wLeak) > 0.02 ? '#f43f5e' : '#10b981';
    ctx.fillRect(gx - 10, gy, 20, -wLeak * gh * 0.8);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('4D w-Leak', gx - 28, gy - gh - 8);
    ctx.fillText(`w=${wLeak.toFixed(2)}`, gx - 22, gy + gh + 15);
    ctx.restore();
  }, [activeTab, isFullSandwich, swTheta, camYaw, camPitch]);

  // Draw Tab 1: Quaternion Attitude & Double Cover
  useEffect(() => {
    if (activeTab !== 'lab1') return;
    const canvas = quatLabCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const azRad = (qlAz * Math.PI) / 180;
    const elRad = (qlEl * Math.PI) / 180;
    const u = norm3({
      x: Math.cos(elRad) * Math.sin(azRad),
      y: Math.sin(elRad),
      z: Math.cos(elRad) * Math.cos(azRad)
    });

    const thetaRad = (qlTheta * Math.PI) / 180;
    drawArrow2D(
      ctx,
      project3D({ x: -u.x * 2.4, y: -u.y * 2.4, z: -u.z * 2.4 }, w, h, 82),
      project3D({ x: u.x * 2.4, y: u.y * 2.4, z: u.z * 2.4 }, w, h, 82),
      '#06b6d4',
      3,
      'Axis û'
    );

    const shipVerts = [
      { x: 0, y: 0, z: 1.6 },
      { x: -1.1, y: 0, z: -0.9 },
      { x: 1.1, y: 0, z: -0.9 },
      { x: 0, y: 0.6, z: -0.6 }
    ].map(v => project3D(rodriguesRotate(v, u, thetaRad), w, h, 82));

    const faces = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.2;
    faces.forEach(([i, j, k]) => {
      ctx.beginPath();
      ctx.moveTo(shipVerts[i].x, shipVerts[i].y);
      ctx.lineTo(shipVerts[j].x, shipVerts[j].y);
      ctx.lineTo(shipVerts[k].x, shipVerts[k].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }, [activeTab, negateQ, qlAz, qlEl, qlTheta, camYaw, camPitch]);

  // Draw Tab 2: SLERP Arena
  useEffect(() => {
    if (activeTab !== 'lab2') return;
    const canvas = slerpCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2 + 10, R = 145;
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const q1 = { x: 1, y: 0 };
    const omRad = (slerpOmega * Math.PI) / 180;
    const rawQ2 = { x: Math.cos(omRad), y: Math.sin(omRad) };
    const dotVal = q1.x * rawQ2.x + q1.y * rawQ2.y;
    const q2 = useShortestPath && dotVal < 0 ? { x: -rawQ2.x, y: -rawQ2.y } : rawQ2;

    const toScr = (pt: { x: number; y: number }) => ({ x: cx + pt.x * R, y: cy - pt.y * R });
    const sQ1 = toScr(q1), sQ2 = toScr(q2);

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sQ1.x, sQ1.y);
    ctx.lineTo(sQ2.x, sQ2.y);
    ctx.stroke();
    ctx.restore();

    const qLerp = { x: (1 - slerpT) * q1.x + slerpT * q2.x, y: (1 - slerpT) * q1.y + slerpT * q2.y };
    const lerpLen = Math.hypot(qLerp.x, qLerp.y);
    const qNlerp = { x: qLerp.x / (lerpLen || 1), y: qLerp.y / (lerpLen || 1) };

    const effCos = Math.max(-1, Math.min(1, q1.x * q2.x + q1.y * q2.y));
    const effOmega = Math.acos(effCos);
    const sinOm = Math.sin(effOmega);
    const w1 = sinOm > 1e-4 ? Math.sin((1 - slerpT) * effOmega) / sinOm : 1 - slerpT;
    const w2 = sinOm > 1e-4 ? Math.sin(slerpT * effOmega) / sinOm : slerpT;
    const qSlerp = { x: w1 * q1.x + w2 * q2.x, y: w1 * q1.y + w2 * q2.y };

    const orig = { x: cx, y: cy };
    drawArrow2D(ctx, orig, sQ1, '#94a3b8', 2, 'q₁');
    drawArrow2D(ctx, orig, sQ2, '#f59e0b', 2.5, useShortestPath && dotVal < 0 ? '-q₂ (Short!)' : 'q₂');
    drawArrow2D(ctx, orig, toScr(qLerp), '#f43f5e', 3, `LERP (${lerpLen.toFixed(2)})`);
    drawArrow2D(ctx, orig, toScr(qNlerp), '#38bdf8', 2.8, 'NLERP');
    drawArrow2D(ctx, orig, toScr(qSlerp), '#10b981', 3.6, 'SLERP');
  }, [activeTab, useShortestPath, slerpT, slerpOmega]);

  // Draw Tab 4: Mini-Game
  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2 + 10, R = 135;
    const orig = { x: cx, y: cy };
    const toScr = (x: number, y: number) => ({ x: cx + x * R, y: cy - y * R });

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (currentMission === 1) {
      const actualTurn = m1UseRight ? 2 * m1Alpha : m1Alpha;
      const targetRad = (120 * Math.PI) / 180;
      const userRad = (actualTurn * Math.PI) / 180;
      drawArrow2D(ctx, orig, toScr(Math.cos(targetRad), Math.sin(targetRad)), '#f59e0b', 3, 'Target (120°)');
      drawArrow2D(ctx, orig, toScr(Math.cos(userRad), Math.sin(userRad)), '#38bdf8', 3.5, `Turn: ${actualTurn}°`);

      if (m1UseRight && Math.abs(m1Alpha - 60) <= 5 && !missionsCleared[1]) {
        setMissionsCleared(prev => ({ ...prev, 1: true }));
      }
    } else if (currentMission === 2) {
      const ang = m2Flipped ? ((-40 * Math.PI) / 180) * m2T : ((140 * Math.PI) / 180) * m2T;
      drawArrow2D(ctx, orig, toScr(Math.cos((-40 * Math.PI) / 180), Math.sin((-40 * Math.PI) / 180)), '#f59e0b', 2.5, 'Target (-q₂)');
      drawArrow2D(ctx, orig, toScr(Math.cos(ang), Math.sin(ang)), m2Flipped ? '#10b981' : '#f43f5e', 3.5, 'Ship');

      if (m2Flipped && m2T >= 0.95 && !missionsCleared[2]) {
        setMissionsCleared(prev => ({ ...prev, 2: true }));
      }
    } else if (currentMission === 3) {
      const q1 = { x: 1, y: 0 };
      const q2 = { x: Math.cos((140 * Math.PI) / 180), y: Math.sin((140 * Math.PI) / 180) };
      let cur = { x: (1 - m3T) * q1.x + m3T * q2.x, y: (1 - m3T) * q1.y + m3T * q2.y };
      if (m3UseSlerp) {
        const om = (140 * Math.PI) / 180;
        const sOm = Math.sin(om);
        const w1 = Math.sin((1 - m3T) * om) / sOm;
        const w2 = Math.sin(m3T * om) / sOm;
        cur = { x: w1 * q1.x + w2 * q2.x, y: w1 * q1.y + w2 * q2.y };
      }
      drawArrow2D(ctx, orig, toScr(cur.x, cur.y), m3UseSlerp ? '#10b981' : '#f43f5e', 3.5, m3UseSlerp ? 'SLERP' : 'LERP');

      if (m3UseSlerp && Math.abs(m3T - 0.5) <= 0.06 && !missionsCleared[3]) {
        setMissionsCleared(prev => ({ ...prev, 3: true }));
      }
    }
  }, [activeTab, currentMission, m1UseRight, m1Alpha, m2Flipped, m2T, m3UseSlerp, m3T, missionsCleared]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setCamYaw(prev => prev + dx * 0.008);
    setCamPitch(prev => Math.max(-1.2, Math.min(1.2, prev + dy * 0.008)));
  };
  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const clearedCount = Object.values(missionsCleared).filter(Boolean).length;

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1.5">
              <button
                onClick={onBackToPortal}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isZh ? '← 返回总站导航 (All 32 Lessons)' : '← Back to All 32 Lessons'}
              </button>
              <span>•</span>
              <span>Stage 1 · Lesson 04</span>
              <span>•</span>
              <span>UC Davis Lec 09 + MIT 6.837 + 3Blue1Brown Quaternions</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isZh
                ? 'L04: 四元数 (Quaternions) 深度解密与球面插值 (SLERP)'
                : 'L04: Quaternions Deep Dive, Half-Angle Sandwich & SLERP'}
            </h1>
          </div>

          <button
            onClick={onToggleComplete}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isCompleted
              ? isZh
                ? '✓ 已完成本课 (Completed)'
                : '✓ Lesson 04 Completed'
              : isZh
              ? '打卡完成 Lesson 04'
              : 'Mark Lesson 04 Complete'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800">
          {[
            {
              id: 'deep',
              label: isZh
                ? '1. 🧠 深度几何原理与推导 (3Blue1Brown 视角)'
                : '1. 🧠 Deep Intuition & Proofs (3B1B Style)'
            },
            {
              id: 'lab1',
              label: isZh ? '2. 🔬 四元数三明治旋转与双重覆盖 (q vs -q)' : '2. 🔬 Quaternion Sandwich & Double Cover'
            },
            { id: 'lab2', label: isZh ? '3. 🌐 LERP vs NLERP vs SLERP 竞技场' : '3. 🌐 LERP vs NLERP vs SLERP Arena' },
            { id: 'videos', label: isZh ? '4. 🎥 名校公开课视频与精要' : '4. 🎥 Lecture Videos & Notes' },
            {
              id: 'game',
              label: isZh
                ? `5. 🎮 终极互动小游戏 (${clearedCount}/3 通关)`
                : `5. 🎮 4D Hypersphere Game (${clearedCount}/3 Cleared)`
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'deep' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '🔬 3Blue1Brown 终极解密：单侧左乘 q·p (第4维泄漏) vs 双侧三明治 q·p·q⁻¹ (抵消泄漏 + 角度翻倍)'
                : '🔬 3B1B Sandwich Explorer: Left-Only q·p (4D Leakage) vs. Full Sandwich q·p·q⁻¹'}
            </h2>
            <button
              onClick={() => setIsFullSandwich(!isFullSandwich)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white"
            >
              {isFullSandwich ? 'Mode: Full Sandwich q·p·q⁻¹ (w=0)' : 'Mode: Left-Only q·p (4D w-Leak!)'}
            </button>
          </div>
          <div
            className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
            style={{ height: 320 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <canvas ref={sandwichCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          </div>
          <div className="text-xs">
            <span className="text-amber-300 font-bold">
              Target 3D Rotation θ = {swTheta}° (Half-Angle θ/2 = {swTheta / 2}°)
            </span>
            <input
              type="range"
              min="0"
              max="360"
              step="2"
              value={swTheta}
              onChange={e => setSwTheta(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {activeTab === 'lab1' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">
                {isZh ? '3D 四元数姿态沙盒与双重覆盖 (q vs -q)' : '3D Quaternion Attitude & Double Cover (q vs -q)'}
              </span>
              <button
                onClick={() => setNegateQ(!negateQ)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white"
              >
                {negateQ ? 'Sign: -q (Same 3D Attitude!)' : 'Sign: +q (Click to Flip to -q)'}
              </button>
            </div>
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 420 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={quatLabCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div>
              <span className="text-cyan-400 block">Axis Azimuth φ: {qlAz}°</span>
              <input type="range" min="-180" max="180" value={qlAz} onChange={e => setQlAz(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-cyan-400 block">Axis Elevation ψ: {qlEl}°</span>
              <input type="range" min="-89" max="89" value={qlEl} onChange={e => setQlEl(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-amber-400 font-bold block">3D Angle θ (0° to 720°): {qlTheta}°</span>
              <input type="range" min="0" max="720" step="2" value={qlTheta} onChange={e => setQlTheta(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lab2' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">LERP vs NLERP vs SLERP</span>
              <button
                onClick={() => setUseShortestPath(!useShortestPath)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
              >
                {useShortestPath ? '✅ Shortest Path Check: ON' : '⚠️ Shortest Path Check: OFF'}
              </button>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950" style={{ height: 420 }}>
              <canvas ref={slerpCanvasRef} className="w-full h-full" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div>
              <span className="text-emerald-400 font-bold block">Interpolation t: {slerpT.toFixed(2)}</span>
              <input type="range" min="0" max="1" step="0.01" value={slerpT} onChange={e => setSlerpT(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-amber-400 block">Hypersphere Angle Ω: {slerpOmega}°</span>
              <input type="range" min="30" max="170" step="2" value={slerpOmega} onChange={e => setSlerpOmega(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-lg font-bold text-white">
              UC Davis Lecture 9: Quaternions (Prof. Kenneth Joy)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? 'Kenneth Joy 教授深入讲解了汉密尔顿四元数的代数结构、单位四元数与三维旋转的对应关系，以及 SLERP 球面线性插值。'
                : 'Prof. Kenneth Joy covers Hamilton quaternions, unit quaternion rotations, and SLERP spherical linear interpolation.'}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-lg font-bold text-white">
              3Blue1Brown: Visualizing Quaternions (4D Stereographic Projection)
            </h3>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/d4EgbgTm0Bg"
                title="3Blue1Brown Quaternions"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white">
              {isZh ? `🎮 四维超球面领航员 (${clearedCount}/3 通关)` : `🎮 4D Hypersphere Navigator (${clearedCount}/3 Cleared)`}
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3].map(m => (
                <button
                  key={m}
                  onClick={() => setCurrentMission(m as 1 | 2 | 3)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${
                    currentMission === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {missionsCleared[m] ? '✓ ' : ''}Mission {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950" style={{ height: 400 }}>
                <canvas ref={gameCanvasRef} className="w-full h-full" />
              </div>
            </div>
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              {currentMission === 1 && (
                <>
                  <div className="font-bold text-amber-400">Mission 1: Half-Angle θ/2 = 60° & Sandwich</div>
                  <button
                    onClick={() => setM1UseRight(!m1UseRight)}
                    className="w-full py-2 rounded-lg font-bold bg-indigo-600 text-white"
                  >
                    {m1UseRight ? '✅ Right-Multiply q⁻¹: ON' : '❌ Right-Multiply q⁻¹: OFF'}
                  </button>
                  <label className="block">Half-Angle α: {m1Alpha}°</label>
                  <input type="range" min="0" max="180" step="5" value={m1Alpha} onChange={e => setM1Alpha(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
              {currentMission === 2 && (
                <>
                  <div className="font-bold text-cyan-400">Mission 2: Shortest-Path Flip (-q₂)</div>
                  <button
                    onClick={() => setM2Flipped(!m2Flipped)}
                    className="w-full py-2 rounded-lg font-bold bg-indigo-600 text-white"
                  >
                    {m2Flipped ? '✅ Flipped to -q₂ (Short Path)' : '⚠️ Using +q₂ (Long Hazard Path)'}
                  </button>
                  <label className="block">Progress t: {m2T.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={m2T} onChange={e => setM2T(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
              {currentMission === 3 && (
                <>
                  <div className="font-bold text-emerald-400">Mission 3: SLERP Midpoint t = 0.50</div>
                  <button
                    onClick={() => setM3UseSlerp(!m3UseSlerp)}
                    className="w-full py-2 rounded-lg font-bold bg-indigo-600 text-white"
                  >
                    {m3UseSlerp ? '✅ Mode: SLERP' : '❌ Mode: Shrinking LERP'}
                  </button>
                  <label className="block">t: {m3T.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={m3T} onChange={e => setM3T(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
