import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../App';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Lesson03Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson03Rotations: React.FC<Lesson03Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'deep' | 'lab1' | 'lab2' | 'videos' | 'game'>('deep');

  const [camYaw, setCamYaw] = useState(-0.58);
  const [camPitch, setCamPitch] = useState(0.42);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Tab 0 State: 1) SO(3) Transpose Duality & 2) Rodrigues 3D Decomposition
  const [so3Angle, setSo3Angle] = useState(40);
  const [so3Skew, setSo3Skew] = useState(0);
  const [so3Scale, setSo3Scale] = useState(1.0);

  const [rodTheta, setRodTheta] = useState(65);
  const [rodTilt, setRodTilt] = useState(25);

  // Tab 1 State: 3-Ring Gimbal Lock Simulator
  const [gmYaw, setGmYaw] = useState(20);
  const [gmPitch, setGmPitch] = useState(25);
  const [gmRoll, setGmRoll] = useState(15);

  // Tab 2 State: Rodrigues Arbitrary-Axis Lab
  const [aaAz, setAaAz] = useState(45);
  const [aaEl, setAaEl] = useState(45);
  const [aaTheta, setAaTheta] = useState(75);

  // Tab 4 State: Mini-Game
  const [currentMission, setCurrentMission] = useState<1 | 2 | 3>(1);
  const [missionsCleared, setMissionsCleared] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false
  });
  const [m1Ang, setM1Ang] = useState(70);
  const [m1Len, setM1Len] = useState(1.45);
  const [m2Yaw, setM2Yaw] = useState(0);
  const [m2Pitch, setM2Pitch] = useState(90);
  const [m2Roll, setM2Roll] = useState(0);
  const [m3Tilt, setM3Tilt] = useState(0);
  const [m3Theta, setM3Theta] = useState(25);

  const so3DualityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rodriguesDecompCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gimbalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const axisAngleCanvasRef = useRef<HTMLCanvasElement | null>(null);
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

  const rotY3 = (v: Vec3, rad: number): Vec3 => {
    const c = Math.cos(rad), s = Math.sin(rad);
    return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
  };
  const rotX3 = (v: Vec3, rad: number): Vec3 => {
    const c = Math.cos(rad), s = Math.sin(rad);
    return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
  };
  const rotZ3 = (v: Vec3, rad: number): Vec3 => {
    const c = Math.cos(rad), s = Math.sin(rad);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
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

  // Draw Tab 0 Canvases
  useEffect(() => {
    if (activeTab !== 'deep') return;

    // 1. SO(3) Transpose Duality
    const c1 = so3DualityCanvasRef.current;
    if (c1) {
      const r1 = c1.parentElement?.getBoundingClientRect();
      c1.width = r1?.width || 540;
      c1.height = r1?.height || 295;
      const ctx = c1.getContext('2d');
      if (ctx) {
        const w = c1.width, h = c1.height;
        ctx.clearRect(0, 0, w, h);

        const rad1 = (so3Angle * Math.PI) / 180;
        const rad2 = ((so3Angle + 90 + so3Skew) * Math.PI) / 180;
        const u = { x: so3Scale * Math.cos(rad1), y: so3Scale * Math.sin(rad1) };
        const v = { x: Math.cos(rad2), y: Math.sin(rad2) };

        const pOrig = { x: 1.2, y: 0.7 };
        const pRot = { x: pOrig.x * u.x + pOrig.y * v.x, y: pOrig.x * u.y + pOrig.y * v.y };
        const pRec = { x: u.x * pRot.x + u.y * pRot.y, y: v.x * pRot.x + v.y * pRot.y };

        const cx = w / 2, cy = h / 2 + 10, scale = 68;
        const toScr = (pt: { x: number; y: number }) => ({ x: cx + pt.x * scale, y: cy - pt.y * scale });
        const origScr = toScr({ x: 0, y: 0 });

        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, cy - i * scale); ctx.lineTo(w, cy - i * scale); ctx.stroke();
        }
        ctx.restore();

        drawArrow2D(ctx, origScr, toScr(u), '#ef4444', 2.8, 'Col 1: u');
        drawArrow2D(ctx, origScr, toScr(v), '#10b981', 2.8, 'Col 2: v');
        drawArrow2D(ctx, origScr, toScr(pOrig), '#f59e0b', 3, 'Original p');
        drawArrow2D(ctx, origScr, toScr(pRot), '#38bdf8', 3, 'Rotated R·p');
        drawArrow2D(ctx, origScr, toScr(pRec), '#a855f7', 2.5, 'Recovered Rᵀ(R·p)');
      }
    }

    // 2. Rodrigues 3D Decomposition
    const c2 = rodriguesDecompCanvasRef.current;
    if (c2) {
      const r2 = c2.parentElement?.getBoundingClientRect();
      c2.width = r2?.width || 540;
      c2.height = r2?.height || 320;
      const ctx = c2.getContext('2d');
      if (ctx) {
        const w = c2.width, h = c2.height;
        ctx.clearRect(0, 0, w, h);

        const tiltRad = (rodTilt * Math.PI) / 180;
        const kUnit = norm3({ x: Math.sin(tiltRad), y: Math.cos(tiltRad), z: 0.15 });
        const v = { x: 1.5, y: 1.5, z: 0.8 };
        const kv = dot3(kUnit, v);
        const vPar = { x: kUnit.x * kv, y: kUnit.y * kv, z: kUnit.z * kv };
        const kxv = cross3(kUnit, v);
        const vRot = rodriguesRotate(v, kUnit, (rodTheta * Math.PI) / 180);

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.1) {
          const pt = rodriguesRotate(v, kUnit, a);
          const s = project3D(pt, w, h, 74);
          if (a === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.restore();

        const o = project3D({ x: 0, y: 0, z: 0 }, w, h, 74);
        const pPar = project3D(vPar, w, h, 74);
        drawArrow2D(ctx, o, project3D({ x: kUnit.x * 2.5, y: kUnit.y * 2.5, z: kUnit.z * 2.5 }, w, h, 74), '#06b6d4', 2.5, 'Axis k̂');
        drawArrow2D(ctx, o, pPar, '#3b82f6', 3.5, 'v_∥=(k̂·v)k̂');
        drawArrow2D(ctx, pPar, project3D(v, w, h, 74), '#10b981', 3, 'v_⊥');
        drawArrow2D(ctx, pPar, project3D({ x: vPar.x + kxv.x, y: vPar.y + kxv.y, z: vPar.z + kxv.z }, w, h, 74), '#a855f7', 3, 'k̂ × v');
        drawArrow2D(ctx, o, project3D(vRot, w, h, 74), '#f59e0b', 3.8, 'v_rot(θ)');
      }
    }
  }, [activeTab, so3Angle, so3Skew, so3Scale, rodTheta, rodTilt, camYaw, camPitch]);

  // Draw Tab 1: 3-Ring Gimbal Lock
  useEffect(() => {
    if (activeTab !== 'lab1') return;
    const canvas = gimbalCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 430;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const a = (gmYaw * Math.PI) / 180;
    const b = (gmPitch * Math.PI) / 180;
    const g = (gmRoll * Math.PI) / 180;
    const isLocked = Math.abs(Math.abs(gmPitch) - 90) <= 2;

    const drawRing = (radius: number, transformFn: (pt: Vec3) => Vec3, color: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        const localPt = { x: radius * Math.cos(ang), y: radius * Math.sin(ang), z: 0 };
        const s = project3D(transformFn(localPt), w, h, 82);
        if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawRing(2.35, pt => rotY3(pt, a), '#38bdf8');
    drawRing(1.95, pt => rotY3(rotX3({ x: pt.x, y: 0, z: pt.y }, b), a), '#10b981');
    drawRing(1.55, pt => rotY3(rotX3(rotZ3(pt, g), b), a), isLocked ? '#f43f5e' : '#f59e0b');

    const o = project3D({ x: 0, y: 0, z: 0 }, w, h, 82);
    drawArrow2D(ctx, o, project3D({ x: 0, y: 2.75, z: 0 }, w, h, 82), '#38bdf8', 3, 'Outer Yaw Axis (World Y)');
    const innerAxis = rotY3(rotX3({ x: 0, y: 0, z: 2.4 }, b), a);
    drawArrow2D(ctx, o, project3D(innerAxis, w, h, 82), '#f43f5e', 3, "Inner Roll Axis (Z')");
  }, [activeTab, gmYaw, gmPitch, gmRoll, camYaw, camPitch]);

  // Draw Tab 2: Axis-Angle Lab
  useEffect(() => {
    if (activeTab !== 'lab2') return;
    const canvas = axisAngleCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const azRad = (aaAz * Math.PI) / 180;
    const elRad = (aaEl * Math.PI) / 180;
    const thetaRad = (aaTheta * Math.PI) / 180;
    const k = norm3({
      x: Math.cos(elRad) * Math.sin(azRad),
      y: Math.sin(elRad),
      z: Math.cos(elRad) * Math.cos(azRad)
    });

    const col1 = rodriguesRotate({ x: 1, y: 0, z: 0 }, k, thetaRad);
    const col2 = rodriguesRotate({ x: 0, y: 1, z: 0 }, k, thetaRad);
    const col3 = rodriguesRotate({ x: 0, y: 0, z: 1 }, k, thetaRad);

    const o = project3D({ x: 0, y: 0, z: 0 }, w, h);
    drawArrow2D(
      ctx,
      project3D({ x: -k.x * 2.5, y: -k.y * 2.5, z: -k.z * 2.5 }, w, h),
      project3D({ x: k.x * 2.5, y: k.y * 2.5, z: k.z * 2.5 }, w, h),
      '#06b6d4',
      3.2,
      'Axis k̂'
    );
    drawArrow2D(ctx, o, project3D({ x: col1.x * 1.5, y: col1.y * 1.5, z: col1.z * 1.5 }, w, h), '#ef4444', 3, 'u=R·î');
    drawArrow2D(ctx, o, project3D({ x: col2.x * 1.5, y: col2.y * 1.5, z: col2.z * 1.5 }, w, h), '#10b981', 3, 'v=R·ĵ');
    drawArrow2D(ctx, o, project3D({ x: col3.x * 1.5, y: col3.y * 1.5, z: col3.z * 1.5 }, w, h), '#38bdf8', 3, 'w=R·k̂');
  }, [activeTab, aaAz, aaEl, aaTheta, camYaw, camPitch]);

  // Draw Tab 4: Mini-Game
  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 410;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2 + 10, scale = 86;
    const toScr = (x: number, y: number) => ({ x: cx + x * scale, y: cy - y * scale });

    if (currentMission === 1) {
      const uRad = (35 * Math.PI) / 180;
      const vRad = (m1Ang * Math.PI) / 180;
      const u = { x: Math.cos(uRad), y: Math.sin(uRad) };
      const v = { x: m1Len * Math.cos(vRad), y: m1Len * Math.sin(vRad) };
      const uvDot = u.x * v.x + u.y * v.y;
      const det = u.x * v.y - u.y * v.x;
      const cleared = Math.abs(uvDot) <= 0.08 && Math.abs(m1Len - 1.0) <= 0.06 && det > 0.9;
      if (cleared && !missionsCleared[1]) {
        setMissionsCleared(prev => ({ ...prev, 1: true }));
      }
      drawArrow2D(ctx, toScr(0, 0), toScr(u.x, u.y), '#ef4444', 3.5, 'u (35°, len=1)');
      drawArrow2D(ctx, toScr(0, 0), toScr(v.x, v.y), cleared ? '#10b981' : '#f59e0b', 3.5, 'v');
    } else if (currentMission === 2) {
      const targetNose = rotY3(rotX3({ x: 0, y: 0, z: 2.0 }, (30 * Math.PI) / 180), (45 * Math.PI) / 180);
      const userNose = rotY3(
        rotX3(rotZ3({ x: 0, y: 0, z: 2.0 }, (m2Roll * Math.PI) / 180), (m2Pitch * Math.PI) / 180),
        (m2Yaw * Math.PI) / 180
      );
      const o = project3D({ x: 0, y: 0, z: 0 }, w, h, 82);
      drawArrow2D(ctx, o, project3D(targetNose, w, h, 82), '#f59e0b', 3, 'Target Attitude');
      drawArrow2D(ctx, o, project3D(userNose, w, h, 82), '#38bdf8', 3.5, 'Your Ship');

      const err = Math.hypot(userNose.x - targetNose.x, userNose.y - targetNose.y, userNose.z - targetNose.z);
      if (err <= 0.22 && !missionsCleared[2]) {
        setMissionsCleared(prev => ({ ...prev, 2: true }));
      }
    } else if (currentMission === 3) {
      const kUser = norm3({ x: Math.sin((m3Tilt * Math.PI) / 180), y: Math.cos((m3Tilt * Math.PI) / 180), z: 0.2 });
      const kTarget = norm3({ x: Math.sin((35 * Math.PI) / 180), y: Math.cos((35 * Math.PI) / 180), z: 0.2 });
      const vStart = { x: 1.7, y: 0.6, z: 0.5 };
      const vUser = rodriguesRotate(vStart, kUser, (m3Theta * Math.PI) / 180);
      const vTarget = rodriguesRotate(vStart, kTarget, (110 * Math.PI) / 180);

      const o = project3D({ x: 0, y: 0, z: 0 }, w, h, 82);
      const pTarget = project3D(vTarget, w, h, 82);
      drawArrow2D(ctx, o, project3D(vUser, w, h, 82), '#f59e0b', 3.5, 'v_rot');

      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pTarget.x, pTarget.y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const err = Math.hypot(vUser.x - vTarget.x, vUser.y - vTarget.y, vUser.z - vTarget.z);
      if (err <= 0.22 && !missionsCleared[3]) {
        setMissionsCleared(prev => ({ ...prev, 3: true }));
      }
    }
  }, [activeTab, currentMission, m1Ang, m1Len, m2Yaw, m2Pitch, m2Roll, m3Tilt, m3Theta, missionsCleared, camYaw, camPitch]);

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
              <span>Stage 1 · Lesson 03</span>
              <span>•</span>
              <span>UC Davis Lec 04 + MIT 6.837 Lec 04 + 3Blue1Brown</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isZh
                ? 'L03: 3D 旋转数学 — 正交矩阵 SO(3)、万向节死锁与罗德里格斯公式'
                : 'L03: 3D Rotations — Orthogonal Group SO(3), Gimbal Lock & Rodrigues Formula'}
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
                : '✓ Lesson 03 Completed'
              : isZh
              ? '打卡完成 Lesson 03'
              : 'Mark Lesson 03 Complete'}
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
            { id: 'lab1', label: isZh ? '2. 🔬 三环万向节死锁模拟器' : '2. 🔬 3-Ring Gimbal Lock Simulator' },
            { id: 'lab2', label: isZh ? '3. 🧭 罗德里格斯任意轴旋转实验室' : '3. 🧭 Rodrigues Arbitrary-Axis Lab' },
            { id: 'videos', label: isZh ? '4. 🎥 名校公开课视频与精要' : '4. 🎥 Lecture Videos & Notes' },
            {
              id: 'game',
              label: isZh
                ? `5. 🎮 终极互动小游戏 (${clearedCount}/3 通关)`
                : `5. 🎮 Gyro Rescue Mini-Game (${clearedCount}/3 Cleared)`
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-bold text-amber-300">
              {isZh
                ? '🔬 SO(3) 对偶性验证：为什么只有标准正交基才能用转置 Rᵀ 完美求逆？'
                : '🔬 SO(3) Duality: Why Rᵀ Inverts R Only When Columns Are Orthonormal'}
            </div>
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950" style={{ height: 295 }}>
              <canvas ref={so3DualityCanvasRef} className="w-full h-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Angle: {so3Angle}°</span>
                <input type="range" min="-180" max="180" value={so3Angle} onChange={e => setSo3Angle(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <span className="text-rose-400">Skew: {so3Skew}°</span>
                <input type="range" min="-45" max="45" value={so3Skew} onChange={e => setSo3Skew(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <span className="text-cyan-400">||u||: {so3Scale.toFixed(2)}</span>
                <input type="range" min="0.6" max="1.6" step="0.05" value={so3Scale} onChange={e => setSo3Scale(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-bold text-indigo-300">
              {isZh
                ? '🔬 3D 罗德里格斯几何分解：v_rot = v_∥ + cos(θ)v_⊥ + sin(θ)(k̂ × v)'
                : '🔬 3D Rodrigues Decomposition: v_rot = v_∥ + cos(θ)v_⊥ + sin(θ)(k̂ × v)'}
            </div>
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 295 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={rodriguesDecompCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-amber-300">Rotation θ: {rodTheta}°</span>
                <input type="range" min="0" max="360" value={rodTheta} onChange={e => setRodTheta(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <span className="text-cyan-300">Axis Tilt: {rodTilt}°</span>
                <input type="range" min="-60" max="60" value={rodTilt} onChange={e => setRodTilt(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lab1' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">
                {isZh ? '3D 三环万向节死锁模拟器' : '3D 3-Ring Gimbal Lock Simulator'}
              </span>
              <button
                onClick={() => setGmPitch(90)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white"
              >
                {isZh ? '⚠️ 一键触发 Pitch = 90° 万向节死锁' : '⚠️ Trigger Pitch = 90° Gimbal Lock'}
              </button>
            </div>
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 420 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={gimbalCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div>
              <span className="text-sky-400 font-bold block">1. Outer Yaw α: {gmYaw}°</span>
              <input type="range" min="-180" max="180" value={gmYaw} onChange={e => setGmYaw(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-emerald-400 font-bold block">2. Middle Pitch β: {gmPitch}°</span>
              <input type="range" min="-90" max="90" value={gmPitch} onChange={e => setGmPitch(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-rose-400 font-bold block">3. Inner Roll γ: {gmRoll}°</span>
              <input type="range" min="-180" max="180" value={gmRoll} onChange={e => setGmRoll(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lab2' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 420 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={axisAngleCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div>
              <span className="text-cyan-400 block">Axis Azimuth φ: {aaAz}°</span>
              <input type="range" min="-180" max="180" value={aaAz} onChange={e => setAaAz(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-cyan-400 block">Axis Elevation ψ: {aaEl}°</span>
              <input type="range" min="-89" max="89" value={aaEl} onChange={e => setAaEl(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-amber-400 font-bold block">Rotation Angle θ: {aaTheta}°</span>
              <input type="range" min="0" max="360" value={aaTheta} onChange={e => setAaTheta(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-lg font-bold text-white">
              UC Davis Lecture 4: Rotations about an Arbitrary Axis (Prof. Kenneth Joy)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? 'Kenneth Joy 教授展示了如何用无坐标几何分解 (v_∥ 与圆盘正交基 v_⊥, k̂ × v) 直接推导出罗德里格斯公式。'
                : 'Prof. Kenneth Joy derives Rodrigues Rotation Formula directly via coordinate-free decomposition into v_∥, v_⊥, and k̂ × v.'}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-lg font-bold text-white">
              MIT 6.837 Lecture 4: 3D Rotations & Gimbal Lock (Prof. Justin Solomon)
            </h3>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/videoseries?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi&index=3"
                title="MIT 6.837 Lecture 4"
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
              {isZh ? `🎮 深空陀螺仪救援 (${clearedCount}/3 通关)` : `🎮 Deep-Space Gyro Rescue (${clearedCount}/3 Cleared)`}
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
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950" style={{ height: 410 }}>
                <canvas ref={gameCanvasRef} className="w-full h-full" />
              </div>
            </div>
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              {currentMission === 1 && (
                <>
                  <div className="font-bold text-amber-400">Mission 1: SO(3) Orthonormal Repair (Target: 125°, Len 1.0)</div>
                  <label className="block">Col 2 Angle: {m1Ang}°</label>
                  <input type="range" min="-180" max="180" value={m1Ang} onChange={e => setM1Ang(parseFloat(e.target.value))} className="w-full" />
                  <label className="block">Col 2 Length: {m1Len.toFixed(2)}</label>
                  <input type="range" min="0.5" max="1.6" step="0.05" value={m1Len} onChange={e => setM1Len(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
              {currentMission === 2 && (
                <>
                  <div className="font-bold text-rose-400">Mission 2: Escape Gimbal Lock (Target: Pitch 30°, Yaw 45°)</div>
                  <label className="block">Yaw α: {m2Yaw}°</label>
                  <input type="range" min="-180" max="180" step="5" value={m2Yaw} onChange={e => setM2Yaw(parseFloat(e.target.value))} className="w-full" />
                  <label className="block">Pitch β: {m2Pitch}°</label>
                  <input type="range" min="-90" max="90" step="5" value={m2Pitch} onChange={e => setM2Pitch(parseFloat(e.target.value))} className="w-full" />
                  <label className="block">Roll γ: {m2Roll}°</label>
                  <input type="range" min="-180" max="180" step="5" value={m2Roll} onChange={e => setM2Roll(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
              {currentMission === 3 && (
                <>
                  <div className="font-bold text-indigo-400">Mission 3: Rodrigues Sniper (Target: Tilt 35°, θ 110°)</div>
                  <label className="block">Axis Tilt: {m3Tilt}°</label>
                  <input type="range" min="-60" max="60" step="5" value={m3Tilt} onChange={e => setM3Tilt(parseFloat(e.target.value))} className="w-full" />
                  <label className="block">Rotation θ: {m3Theta}°</label>
                  <input type="range" min="0" max="180" step="5" value={m3Theta} onChange={e => setM3Theta(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
