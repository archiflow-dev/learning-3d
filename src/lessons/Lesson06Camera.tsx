import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson06Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Vec3 = [number, number, number];
type Mat4 = number[];

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

function vSub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vAdd(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vScale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function vDot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function vCross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function vLen(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function buildCameraFrame(eye: Vec3, target: Vec3, upHint: Vec3) {
  const wRaw = vSub(eye, target);
  const dist = vLen(wRaw);
  const w: Vec3 = dist > 1e-6 ? vScale(wRaw, 1 / dist) : [0, 0, 1];
  const uRaw = vCross(upHint, w);
  const crossLen = vLen(uRaw);
  const u: Vec3 = crossLen > 1e-5 ? vScale(uRaw, 1 / crossLen) : [1, 0, 0];
  const v: Vec3 = vCross(w, u);

  const M_cam: Mat4 = [
    u[0], v[0], w[0], eye[0],
    u[1], v[1], w[1], eye[1],
    u[2], v[2], w[2], eye[2],
    0,    0,    0,    1
  ];

  const V_lookAt: Mat4 = [
    u[0], u[1], u[2], -vDot(u, eye),
    v[0], v[1], v[2], -vDot(v, eye),
    w[0], w[1], w[2], -vDot(w, eye),
    0,    0,    0,    1
  ];

  return { u, v, w, dist, crossLen, M_cam, V_lookAt };
}

function mat4TransformVec3(M: Mat4, p: Vec3): Vec3 {
  return [
    M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3],
    M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7],
    M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]
  ];
}

const SCENE_EDGES: { a: Vec3; b: Vec3; col: string }[] = [
  { a: [-0.8, 0, -0.8], b: [0.8, 0, -0.8], col: '#6366f1' },
  { a: [0.8, 0, -0.8], b: [0.8, 0, 0.8], col: '#6366f1' },
  { a: [0.8, 0, 0.8], b: [-0.8, 0, 0.8], col: '#6366f1' },
  { a: [-0.8, 0, 0.8], b: [-0.8, 0, -0.8], col: '#6366f1' },
  { a: [-0.8, 0, -0.8], b: [0, 1.7, 0], col: '#38bdf8' },
  { a: [0.8, 0, -0.8], b: [0, 1.7, 0], col: '#38bdf8' },
  { a: [0.8, 0, 0.8], b: [0, 1.7, 0], col: '#34d399' },
  { a: [-0.8, 0, 0.8], b: [0, 1.7, 0], col: '#34d399' },
  { a: [0.8, 0, 0], b: [1.45, 0.8, 0], col: '#f43f5e' },
  { a: [0, 0.8, 0], b: [1.45, 0.8, 0], col: '#f43f5e' }
];

export const Lesson06Camera: React.FC<Lesson06Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Visualizer 1 State: Two-Step Relativity Animator
  const [relMorph, setRelMorph] = useState<number>(2);
  const [relCamX, setRelCamX] = useState<number>(110);
  const [relCamAng, setRelCamAng] = useState<number>(38);
  const [wrongOrderBug, setWrongOrderBug] = useState<boolean>(false);
  const relCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Visualizer 2 State: Cross-Product Basis & Zenith Singularity
  const [basisPitch, setBasisPitch] = useState<number>(32);
  const basisCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: Dual-Viewport Camera Lab
  const [ex, setEx] = useState<number>(2.4);
  const [ey, setEy] = useState<number>(1.8);
  const [ez, setEz] = useState<number>(2.8);
  const [cx, setCx] = useState<number>(0.0);
  const [cy, setCy] = useState<number>(0.6);
  const [cz, setCz] = useState<number>(0.0);
  const [rollDeg, setRollDeg] = useState<number>(0);
  const [godYaw, setGodYaw] = useState<number>(-0.62);
  const [godPitch, setGodPitch] = useState<number>(0.42);
  const godCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const camCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gameOrderFixed, setGameOrderFixed] = useState<boolean>(false);
  const [gameUpMode, setGameUpMode] = useState<'Y' | 'Z'>('Y');
  const [gAimX, setGAimX] = useState<number>(0.8);
  const [gAimY, setGAimY] = useState<number>(-0.6);
  const [gDist, setGDist] = useState<number>(5.0);
  const [gRoll, setGRoll] = useState<number>(0);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Visualizer 1
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = relCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const ox = W * 0.5, oy = H * 0.62;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy); ctx.lineTo(W, oy);
    ctx.moveTo(ox, 0); ctx.lineTo(ox, H);
    ctx.stroke();

    const camZ = 75;
    const ang = deg2rad(relCamAng);
    const t1 = Math.min(1, relMorph);
    const t2 = Math.max(0, relMorph - 1);

    const transformPt = (x: number, z: number): [number, number] => {
      if (!wrongOrderBug) {
        const tx = x - t1 * relCamX;
        const tz = z - t1 * camZ;
        const a = -t2 * ang;
        const c = Math.cos(a), s = Math.sin(a);
        return [tx * c - tz * s, tx * s + tz * c];
      } else {
        const a = -t2 * ang;
        const c = Math.cos(a), s = Math.sin(a);
        const rx = x * c - z * s;
        const rz = x * s + z * c;
        return [rx - t1 * relCamX, rz - t1 * camZ];
      }
    };

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let g = -200; g <= 200; g += 40) {
      const a = transformPt(g, -200), b = transformPt(g, 200);
      ctx.beginPath(); ctx.moveTo(ox + a[0], oy + a[1]); ctx.lineTo(ox + b[0], oy + b[1]); ctx.stroke();
      const c = transformPt(-200, g), d = transformPt(200, g);
      ctx.beginPath(); ctx.moveTo(ox + c[0], oy + c[1]); ctx.lineTo(ox + d[0], oy + d[1]); ctx.stroke();
    }

    const starWorld: [number, number][] = [
      [relCamX - Math.sin(ang) * 115, camZ - Math.cos(ang) * 115],
      [relCamX - Math.sin(ang) * 145 - 25, camZ - Math.cos(ang) * 145 + 15],
      [relCamX - Math.sin(ang) * 145 + 25, camZ - Math.cos(ang) * 145 - 15]
    ];
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    starWorld.forEach((pt, idx) => {
      const p = transformPt(pt[0], pt[1]);
      if (idx === 0) ctx.moveTo(ox + p[0], oy + p[1]);
      else ctx.lineTo(ox + p[0], oy + p[1]);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const camOrigin = transformPt(relCamX, camZ);
    const fLeft = transformPt(relCamX + Math.sin(-ang - 0.35) * 150, camZ - Math.cos(-ang - 0.35) * 150);
    const fRight = transformPt(relCamX + Math.sin(-ang + 0.35) * 150, camZ - Math.cos(-ang + 0.35) * 150);
    ctx.fillStyle = wrongOrderBug ? 'rgba(244, 63, 94, 0.14)' : 'rgba(56, 189, 248, 0.14)';
    ctx.strokeStyle = wrongOrderBug ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + camOrigin[0], oy + camOrigin[1]);
    ctx.lineTo(ox + fLeft[0], oy + fLeft[1]);
    ctx.lineTo(ox + fRight[0], oy + fRight[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }, [activeTab, relMorph, relCamX, relCamAng, wrongOrderBug]);

  // Draw Visualizer 2: Cross-Product Basis
  const angleBetween = Math.abs(90 - basisPitch);
  const sinTheta = Math.sin(deg2rad(angleBetween));
  const isBasisSingular = sinTheta < 0.015;

  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = basisCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const ox = W * 0.45, oy = H * 0.62, R = 110;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, oy); ctx.lineTo(W - 40, oy);
    ctx.moveTo(ox, 25); ctx.lineTo(ox, H - 25);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, oy - R);
    ctx.stroke();
    ctx.restore();

    const pitchRad = deg2rad(basisPitch);
    const wx = Math.cos(pitchRad) * R, wy = -Math.sin(pitchRad) * R;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + wx, oy + wy);
    ctx.stroke();

    if (!isBasisSingular) {
      const vx = -Math.sin(pitchRad) * R, vy = -Math.cos(pitchRad) * R;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + vx, oy + vy);
      ctx.stroke();

      const barLen = sinTheta * 90;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox - barLen * 0.7, oy + barLen * 0.45);
      ctx.stroke();
    }
  }, [activeTab, basisPitch, isBasisSingular, sinTheta]);

  // Tab 2 Dual Lab Calculation & Rendering
  const labEye: Vec3 = [ex, ey, ez];
  const labTarget: Vec3 = [cx, cy, cz];
  const labRollRad = deg2rad(rollDeg);
  const labUpHint: Vec3 = [Math.sin(labRollRad), Math.cos(labRollRad), 0];
  const labCam = buildCameraFrame(labEye, labTarget, labUpHint);
  const labTargetInEye = mat4TransformVec3(labCam.V_lookAt, labTarget);

  useEffect(() => {
    if (activeTab !== 'lab') return;
    const godC = godCanvasRef.current;
    const camC = camCanvasRef.current;
    if (godC) {
      const ctx = godC.getContext('2d');
      if (ctx) {
        const W = godC.width, H = godC.height;
        ctx.clearRect(0, 0, W, H);
        const projGod = (p: Vec3): [number, number] => {
          const cy1 = Math.cos(godYaw), sy1 = Math.sin(godYaw);
          const cp1 = Math.cos(godPitch), sp1 = Math.sin(godPitch);
          const x1 = p[0] * cy1 - p[2] * sy1;
          const z1 = p[0] * sy1 + p[2] * cy1;
          const y1 = p[1] * cp1 - z1 * sp1;
          const z2 = p[1] * sp1 + z1 * cp1 + 7.5;
          const s = 380 / Math.max(1.2, z2);
          return [W * 0.5 + x1 * s, H * 0.62 - y1 * s];
        };
        const drawGLine = (a: Vec3, b: Vec3, col: string, lw = 1.5) => {
          const pa = projGod(a), pb = projGod(b);
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(pa[0], pa[1]);
          ctx.lineTo(pb[0], pb[1]);
          ctx.stroke();
        };
        for (let i = -3; i <= 3; i++) {
          drawGLine([i, 0, -3], [i, 0, 3], '#1e293b', 1);
          drawGLine([-3, 0, i], [3, 0, i], '#1e293b', 1);
        }
        SCENE_EDGES.forEach((e) => drawGLine(e.a, e.b, e.col, 2.5));
        drawGLine(labEye, labTarget, '#fbbf24', 1.5);
        drawGLine(labEye, vAdd(labEye, vScale(labCam.u, 0.85)), '#f43f5e', 3);
        drawGLine(labEye, vAdd(labEye, vScale(labCam.v, 0.85)), '#10b981', 3);
        drawGLine(labEye, vAdd(labEye, vScale(labCam.w, 0.85)), '#38bdf8', 3);
      }
    }
    if (camC) {
      const ctx = camC.getContext('2d');
      if (ctx) {
        const W = camC.width, H = camC.height;
        ctx.clearRect(0, 0, W, H);
        const drawCLine = (aW: Vec3, bW: Vec3, col: string, lw = 2.5) => {
          const aV = mat4TransformVec3(labCam.V_lookAt, aW);
          const bV = mat4TransformVec3(labCam.V_lookAt, bW);
          if (aV[2] > -0.2 || bV[2] > -0.2) return;
          const sA = 330 / Math.max(0.3, -aV[2]);
          const sB = 330 / Math.max(0.3, -bV[2]);
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(W * 0.5 + aV[0] * sA, H * 0.5 - aV[1] * sA);
          ctx.lineTo(W * 0.5 + bV[0] * sB, H * 0.5 - bV[1] * sB);
          ctx.stroke();
        };
        for (let i = -3; i <= 3; i++) {
          drawCLine([i, 0, -3], [i, 0, 3], '#1e293b', 1);
          drawCLine([-3, 0, i], [3, 0, i], '#1e293b', 1);
        }
        SCENE_EDGES.forEach((e) => drawCLine(e.a, e.b, e.col, 3));
      }
    }
  }, [activeTab, ex, ey, ez, cx, cy, cz, rollDeg, godYaw, godPitch]);

  // Tab 4 Mini-Game Calculation & Rendering
  const stationWorld: Vec3 = [0, 0.6, 0];
  const gEye: Vec3 = mission === 2 ? [0, gDist, 0] : [gDist * 0.55, 0.6 + gDist * 0.35, gDist * 0.75];
  const gTarget: Vec3 = [stationWorld[0] + gAimX, stationWorld[1] + gAimY, stationWorld[2]];
  const gRollRad = deg2rad(gRoll);
  const gUpHint: Vec3 =
    mission === 2 && gameUpMode === 'Y'
      ? [0, 1, 0]
      : mission === 2
      ? [Math.sin(gRollRad), 0, -Math.cos(gRollRad)]
      : [Math.sin(gRollRad), Math.cos(gRollRad), 0];

  const gCam = buildCameraFrame(gEye, gTarget, gUpHint);
  const gV = [...gCam.V_lookAt];
  if (mission === 1 && !gameOrderFixed) {
    gV[3] = -gEye[0] + 1.65;
    gV[7] = -gEye[1] - 0.95;
    gV[11] = -gEye[2];
  }
  const gSingular = gCam.crossLen < 1e-3;
  const gStationInView = mat4TransformVec3(gV, stationWorld);
  const gAimErr = Math.hypot(gStationInView[0], gStationInView[1]);

  const gPassed =
    (mission === 1 && gameOrderFixed && gAimErr < 0.22) ||
    (mission === 2 && !gSingular && gAimErr < 0.25) ||
    (mission === 3 && gAimErr < 0.22 && Math.abs(-gStationInView[2] - 5.0) < 0.25 && Math.abs(gRoll - 25) <= 3);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (gSingular) {
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ SINGULARITY: ||up_hint × w|| = 0.000', W * 0.5, H * 0.5);
      ctx.textAlign = 'left';
      return;
    }

    SCENE_EDGES.forEach((e) => {
      const aV = mat4TransformVec3(gV, e.a);
      const bV = mat4TransformVec3(gV, e.b);
      if (aV[2] > -0.2 || bV[2] > -0.2) return;
      const sA = 340 / Math.max(0.3, -aV[2]);
      const sB = 340 / Math.max(0.3, -bV[2]);
      ctx.strokeStyle = e.col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + aV[0] * sA, H * 0.5 - aV[1] * sA);
      ctx.lineTo(W * 0.5 + bV[0] * sB, H * 0.5 - bV[1] * sB);
      ctx.stroke();
    });

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, 22, 0, Math.PI * 2);
    ctx.stroke();
  }, [activeTab, mission, gameOrderFixed, gameUpMode, gAimX, gAimY, gDist, gRoll]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1.5">
              <button
                onClick={onBackToPortal}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isZh ? '← 返回课程总目录 (Index)' : '← Back to Course Index'}
              </button>
              <span>•</span>
              <span>Stage 1 Finale • Lesson 06 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-06.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L06: 相机变换 (The Camera Transform)、观察空间与 LookAt 矩阵推导'
                : 'L06: The Camera Transform, View Space & LookAt Matrix Derivation'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Relativity of Basis • UC Davis ECS 175 Lec 05 (Kenneth Joy) • MIT 6.837 Lec 04 & 09
            </p>
          </div>

          <button
            onClick={onToggleComplete}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isCompleted ? (isZh ? '✓ 已完成本课' : '✓ Lesson Completed') : isZh ? '标记本课完成' : 'Mark Complete'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'concepts' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '1. 3Blue1Brown 相对性直觉与 LookAt 推导' : '1. 3Blue1Brown Relativity & LookAt Derivation'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 双视窗实验室 (上帝视角 + 相机第一视角)' : '2. Dual-Viewport Lab (God + Camera View)'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. UC Davis Lec 05 & MIT 6.837 讲义' : '3. University Lectures & Notes'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：侦察卫星相机标定' : '4. 3-Mission Game: Satellite Calibration'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {isZh
                  ? '透视镜 1：世界空间 → 观察空间两步逆变换连续变形器 (I → T(-e) → Rᵀ·T(-e))'
                  : 'Visualizer 1: Two-Step World-to-View Relativity Animator'}
              </h2>
              <button
                onClick={() => setWrongOrderBug(!wrongOrderBug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  wrongOrderBug ? 'bg-rose-600 border-rose-400 text-white' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                🐞 {isZh ? `错误顺序 T(-e)·Rᵀ 对比: ${wrongOrderBug ? '开' : '关'}` : `Wrong Order T(-e)·Rᵀ: ${wrongOrderBug ? 'ON' : 'OFF'}`}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7">
                <canvas ref={relCanvasRef} width={600} height={340} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>Morph Progress (0 → 1 → 2)</span>
                    <span>{relMorph.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={2} step={0.02} value={relMorph} onChange={(e) => setRelMorph(Number(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-slate-300">
                    <span>Camera X ({relCamX})</span>
                    <span>Yaw ({relCamAng}°)</span>
                  </div>
                  <input type="range" min={-140} max={150} value={relCamX} onChange={(e) => setRelCamX(Number(e.target.value))} className="w-full" />
                  <input type="range" min={-140} max={140} value={relCamAng} onChange={(e) => setRelCamAng(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {isZh
                  ? '透视镜 2：两次叉积锻造相机正交基 (w → u → v) 与 90° 天顶奇异点测试'
                  : 'Visualizer 2: Cross-Product Orthonormalizer & Zenith Singularity Tester'}
              </h2>
              <button
                onClick={() => setBasisPitch(90)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs font-bold text-white"
              >
                ⚠️ {isZh ? '一键推到 Pitch = 90° (触发共线奇异点!)' : 'Push Pitch to 90° (Singularity!)'}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7">
                <canvas ref={basisCanvasRef} width={600} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>Camera Pitch Angle</span>
                    <span>{basisPitch.toFixed(1)}°</span>
                  </div>
                  <input type="range" min={-89.5} max={90} step={0.5} value={basisPitch} onChange={(e) => setBasisPitch(Number(e.target.value))} className="w-full" />
                  <div className="font-mono text-slate-300">
                    ||up_hint × w|| = sin({angleBetween.toFixed(1)}°) = {sinTheta.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <div className="text-xs font-bold text-cyan-300 mb-1.5">
                {isZh ? '🌍 视窗 1：上帝视角 (World Space)' : '🌍 Viewport 1: God-View World Space'}
              </div>
              <canvas
                ref={godCanvasRef}
                width={540}
                height={340}
                onPointerMove={(e) => {
                  if (e.buttons === 1) {
                    setGodYaw((y) => y + e.movementX * 0.008);
                    setGodPitch((p) => Math.max(-0.2, Math.min(1.2, p + e.movementY * 0.008)));
                  }
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-grab"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 mb-1.5 flex justify-between">
                <span>{isZh ? '👁️ 视窗 2：相机第一视角 (Eye Space)' : '👁️ Viewport 2: Camera First-Person View'}</span>
                <span className="font-mono text-amber-300">
                  Target in Eye: ({labTargetInEye[0].toFixed(2)}, {labTargetInEye[1].toFixed(2)}, {labTargetInEye[2].toFixed(2)})
                </span>
              </div>
              <canvas ref={camCanvasRef} width={540} height={340} className="w-full rounded-xl border border-emerald-500/40 bg-slate-950" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="flex justify-between"><span>eye.x</span><span>{ex.toFixed(1)}</span></div>
              <input type="range" min={-4} max={4} step={0.1} value={ex} onChange={(e) => setEx(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between"><span>eye.y</span><span>{ey.toFixed(1)}</span></div>
              <input type="range" min={-1} max={4} step={0.1} value={ey} onChange={(e) => setEy(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between"><span>eye.z</span><span>{ez.toFixed(1)}</span></div>
              <input type="range" min={-4} max={4} step={0.1} value={ez} onChange={(e) => setEz(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between"><span>Up Roll</span><span>{rollDeg}°</span></div>
              <input type="range" min={-90} max={90} step={1} value={rollDeg} onChange={(e) => setRollDeg(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            UC Davis ECS 175 Lecture 05 (Prof. Kenneth Joy — The Camera Transform)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可查看完整的 Kenneth Joy 教授 Lecture 05 讲义与光线追踪 vs 光栅化相机矩阵对偶对比。'
              : 'Open the standalone HTML page above for the full UC Davis Lecture 05 notes and Ray Tracing vs. Rasterization comparison.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '星际侦察卫星相机标定挑战 (3 关)' : 'Satellite Camera Calibration Challenge'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    setGameOrderFixed(m !== 1);
                    setGameUpMode('Y');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    mission === m ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Mission {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <canvas ref={gameCanvasRef} width={600} height={360} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              {mission === 1 && (
                <button
                  onClick={() => setGameOrderFixed(!gameOrderFixed)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold border ${
                    gameOrderFixed ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200' : 'border-rose-500 bg-rose-900/60 text-white'
                  }`}
                >
                  {gameOrderFixed ? '✅ 已修复为 V = R_camᵀ · T(-e)' : '❌ 点击修复顺序：将 T(-e)·Rᵀ 改为 Rᵀ·T(-e)'}
                </button>
              )}
              {mission === 2 && (
                <button
                  onClick={() => setGameUpMode(gameUpMode === 'Y' ? 'Z' : 'Y')}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold border ${
                    gameUpMode === 'Z' ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200' : 'border-rose-500 bg-rose-900/60 text-white'
                  }`}
                >
                  {gameUpMode === 'Z' ? '✅ up_hint = (0, 0, -1) 已解除天顶共线奇异点' : '❌ up_hint = (0, 1, 0) 与视线共线崩溃 — 点击切换为 (0,0,-1)'}
                </button>
              )}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between"><span>Aim X</span><span>{gAimX.toFixed(1)}</span></div>
                <input type="range" min={-2.5} max={2.5} step={0.1} value={gAimX} onChange={(e) => setGAimX(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between"><span>Aim Y</span><span>{gAimY.toFixed(1)}</span></div>
                <input type="range" min={-2.0} max={2.0} step={0.1} value={gAimY} onChange={(e) => setGAimY(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between"><span>Distance</span><span>{gDist.toFixed(1)} m</span></div>
                <input type="range" min={2.5} max={8.0} step={0.1} value={gDist} onChange={(e) => setGDist(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between"><span>Dutch Roll</span><span>{gRoll}°</span></div>
                <input type="range" min={-60} max={60} step={1} value={gRoll} onChange={(e) => setGRoll(Number(e.target.value))} className="w-full" />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : `Target in Eye: (${gStationInView[0].toFixed(2)}, ${gStationInView[1].toFixed(2)}, ${gStationInView[2].toFixed(2)})`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
