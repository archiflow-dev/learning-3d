import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../App';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Lesson02Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson02Frames: React.FC<Lesson02Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'deep' | 'lab1' | 'lab2' | 'videos' | 'game'>('deep');

  // Camera Orbit State
  const [camYaw, setCamYaw] = useState(-0.62);
  const [camPitch, setCamPitch] = useState(0.42);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Tab 0 State: 1) Shear Slice (w=1) & 2) Normal Matrix (M^-1)^T
  const [shearTx, setShearTx] = useState(1.2);
  const [shearTy, setShearTy] = useState(0.8);
  const [sliceW, setSliceW] = useState(1.0);

  const [nmSx, setNmSx] = useState(2.1);
  const [nmSy, setNmSy] = useState(0.7);
  const [nmShear, setNmShear] = useState(0.4);

  // Tab 1 State: 4x4 Homogeneous Matrix Sandbox
  const [composeTRS, setComposeTRS] = useState(true);
  const [tx, setTx] = useState(1.2);
  const [ty, setTy] = useState(0.8);
  const [tz, setTz] = useState(0.0);
  const [yaw, setYaw] = useState(25);
  const [pitch, setPitch] = useState(15);
  const [roll, setRoll] = useState(0);
  const [sx, setSx] = useState(1.0);
  const [sy, setSy] = useState(1.0);
  const [sz, setSz] = useState(1.0);
  const [sh, setSh] = useState(0.0);
  const [wVal, setWVal] = useState(1.0);

  // Tab 2 State: Hierarchical Robot Arm Scene Graph
  const [armBaseX, setArmBaseX] = useState(0.0);
  const [armYaw, setArmYaw] = useState(25);
  const [armShoulder, setArmShoulder] = useState(35);
  const [armElbow, setArmElbow] = useState(-50);

  // Tab 4 State: 3-Mission Playable Mini-Game
  const [currentMission, setCurrentMission] = useState<1 | 2 | 3>(1);
  const [missionsCleared, setMissionsCleared] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false
  });
  const [m1Target, setM1Target] = useState({ ux: 1.4, uy: 0.6, vx: -0.6, vy: 1.2 });
  const [m1User, setM1User] = useState({ ux: 1.0, uy: 0.0, vx: 0.0, vy: 1.0 });

  const [m2UseTR, setM2UseTR] = useState(false);
  const [m2User, setM2User] = useState({ tx: 1.5, ty: 0.5, angle: 45 });

  const [m3UseInvT, setM3UseInvT] = useState(false);
  const [m3Scale, setM3Scale] = useState(1.0);

  const shearSliceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const normalMatrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const matrixSandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hierarchyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const project3D = (p: Vec3, width: number, height: number, scale = 72) => {
    const cosY = Math.cos(camYaw);
    const sinY = Math.sin(camYaw);
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;

    const cosP = Math.cos(camPitch);
    const sinP = Math.sin(camPitch);
    const y2 = p.y * cosP - z1 * sinP;
    const z2 = p.y * sinP + z1 * cosP;

    const camDist = 9.5;
    const persp = camDist / Math.max(1.5, camDist - z2);
    return {
      x: width / 2 + x1 * scale * persp,
      y: height / 2 + 25 - y2 * scale * persp,
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

  const mat4Mul = (A: number[], B: number[]): number[] => {
    const C = new Array(16).fill(0);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        C[r * 4 + c] =
          A[r * 4 + 0] * B[0 * 4 + c] +
          A[r * 4 + 1] * B[1 * 4 + c] +
          A[r * 4 + 2] * B[2 * 4 + c] +
          A[r * 4 + 3] * B[3 * 4 + c];
      }
    }
    return C;
  };

  const mat4Vec4 = (M: number[], v: { x: number; y: number; z: number; w: number }) => ({
    x: M[0] * v.x + M[1] * v.y + M[2] * v.z + M[3] * v.w,
    y: M[4] * v.x + M[5] * v.y + M[6] * v.z + M[7] * v.w,
    z: M[8] * v.x + M[9] * v.y + M[10] * v.z + M[11] * v.w,
    w: M[12] * v.x + M[13] * v.y + M[14] * v.z + M[15] * v.w
  });

  const getCurrentMat4 = (): number[] => {
    const T = [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1];
    const yRad = (yaw * Math.PI) / 180;
    const pRad = (pitch * Math.PI) / 180;
    const rRad = (roll * Math.PI) / 180;
    const cy = Math.cos(yRad), syaw = Math.sin(yRad);
    const cp = Math.cos(pRad), sp = Math.sin(pRad);
    const cr = Math.cos(rRad), sr = Math.sin(rRad);

    const Ry = [cy, 0, syaw, 0, 0, 1, 0, 0, -syaw, 0, cy, 0, 0, 0, 0, 1];
    const Rx = [1, 0, 0, 0, 0, cp, -sp, 0, 0, sp, cp, 0, 0, 0, 0, 1];
    const Rz = [cr, -sr, 0, 0, sr, cr, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const R = mat4Mul(Ry, mat4Mul(Rx, Rz));

    const S = [sx, sh, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
    return composeTRS ? mat4Mul(T, mat4Mul(R, S)) : mat4Mul(R, mat4Mul(T, S));
  };

  // Draw Tab 0 Canvases
  useEffect(() => {
    if (activeTab !== 'deep') return;

    // 1. Shear Slice Canvas
    const c1 = shearSliceCanvasRef.current;
    if (c1) {
      const r1 = c1.parentElement?.getBoundingClientRect();
      c1.width = r1?.width || 540;
      c1.height = r1?.height || 320;
      const ctx = c1.getContext('2d');
      if (ctx) {
        const w = c1.width, h = c1.height;
        ctx.clearRect(0, 0, w, h);

        const mapPt = (x2d: number, y2d: number, wHeight: number) => {
          const shearedX = x2d + wHeight * shearTx;
          const shearedY = y2d + wHeight * shearTy;
          return project3D({ x: shearedX, y: wHeight * 1.6 - 0.6, z: shearedY }, w, h, 66);
        };

        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        for (let i = -2; i <= 2; i++) {
          const p1 = mapPt(i, -2, 0), p2 = mapPt(i, 2, 0);
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          const p3 = mapPt(-2, i, 0), p4 = mapPt(2, i, 0);
          ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
        }
        ctx.restore();

        const cA = mapPt(-1.8, -1.8, sliceW);
        const cB = mapPt(1.8, -1.8, sliceW);
        const cC = mapPt(1.8, 1.8, sliceW);
        const cD = mapPt(-1.8, 1.8, sliceW);
        ctx.save();
        ctx.fillStyle = Math.abs(sliceW - 1.0) < 0.05 ? 'rgba(99, 102, 241, 0.18)' : 'rgba(16, 185, 129, 0.14)';
        ctx.strokeStyle = Math.abs(sliceW - 1.0) < 0.05 ? '#818cf8' : '#10b981';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cA.x, cA.y); ctx.lineTo(cB.x, cB.y); ctx.lineTo(cC.x, cC.y); ctx.lineTo(cD.x, cD.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const o0 = mapPt(0, 0, 0);
        drawArrow2D(ctx, o0, mapPt(1.2, 0, 0), '#ef4444', 2.5, 'î=(1,0,0)');
        drawArrow2D(ctx, o0, mapPt(0, 1.2, 0), '#22c55e', 2.5, 'ĵ=(0,1,0)');
        drawArrow2D(ctx, o0, mapPt(0, 0, 1), '#a855f7', 3.2, `ŵ'=(${shearTx.toFixed(1)},${shearTy.toFixed(1)},1)`);

        const triPts = [mapPt(0.2, 0.2, sliceW), mapPt(1.1, 0.2, sliceW), mapPt(0.5, 1.0, sliceW)];
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(triPts[0].x, triPts[0].y);
        ctx.lineTo(triPts[1].x, triPts[1].y);
        ctx.lineTo(triPts[2].x, triPts[2].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawArrow2D(ctx, o0, mapPt(1.0, 0.8, 0), '#38bdf8', 3, 'v(w=0, immune!)');
      }
    }

    // 2. Normal Matrix Canvas
    const c2 = normalMatrixCanvasRef.current;
    if (c2) {
      const r2 = c2.parentElement?.getBoundingClientRect();
      c2.width = r2?.width || 540;
      c2.height = r2?.height || 310;
      const ctx = c2.getContext('2d');
      if (ctx) {
        const w = c2.width, h = c2.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2 + 15, scale = 68;
        const applyM = (x: number, y: number) => ({ x: nmSx * x + nmShear * y, y: nmSy * y });
        const det = nmSx * nmSy;
        const applyInvT = (nx: number, ny: number) => ({
          x: (nmSy * nx) / det,
          y: (-nmShear * nx + nmSx * ny) / det
        });
        const toScreen = (pt: { x: number; y: number }) => ({ x: cx + pt.x * scale, y: cy - pt.y * scale });

        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        for (let i = -3; i <= 3; i++) {
          const p1 = toScreen(applyM(i, -2.5)), p2 = toScreen(applyM(i, 2.5));
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          const p3 = toScreen(applyM(-2.5, i)), p4 = toScreen(applyM(2.5, i));
          ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.06) {
          const p = toScreen(applyM(Math.cos(a), Math.sin(a)));
          if (a === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const theta = Math.PI / 4;
        const pOrig = { x: Math.cos(theta), y: Math.sin(theta) };
        const tOrig = { x: -Math.sin(theta), y: Math.cos(theta) };
        const nOrig = { x: Math.cos(theta), y: Math.sin(theta) };

        const pTrans = applyM(pOrig.x, pOrig.y);
        const tTrans = applyM(tOrig.x, tOrig.y);
        const nWrong = applyM(nOrig.x, nOrig.y);
        const nRight = applyInvT(nOrig.x, nOrig.y);

        const norm2 = (v: { x: number; y: number }) => {
          const l = Math.hypot(v.x, v.y) || 1;
          return { x: v.x / l, y: v.y / l };
        };
        const tUnit = norm2(tTrans);
        const wUnit = norm2(nWrong);
        const rUnit = norm2(nRight);

        const sPt = toScreen(pTrans);
        const t1 = toScreen({ x: pTrans.x - tUnit.x * 1.1, y: pTrans.y - tUnit.y * 1.1 });
        const t2 = toScreen({ x: pTrans.x + tUnit.x * 1.1, y: pTrans.y + tUnit.y * 1.1 });
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
        ctx.restore();

        drawArrow2D(ctx, sPt, toScreen({ x: pTrans.x + wUnit.x * 1.15, y: pTrans.y + wUnit.y * 1.15 }), '#f43f5e', 3, 'Wrong: M·n');
        drawArrow2D(ctx, sPt, toScreen({ x: pTrans.x + rUnit.x * 1.15, y: pTrans.y + rUnit.y * 1.15 }), '#10b981', 3.5, 'Correct: (M⁻¹)ᵀ·n');
      }
    }
  }, [activeTab, shearTx, shearTy, sliceW, nmSx, nmSy, nmShear, camYaw, camPitch]);

  // Draw Tab 1 Canvas
  useEffect(() => {
    if (activeTab !== 'lab1') return;
    const canvas = matrixSandboxCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 430;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const M = getCurrentMat4();

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    for (let i = -3; i <= 3; i++) {
      const p1 = project3D({ x: i, y: 0, z: -3 }, w, h);
      const p2 = project3D({ x: i, y: 0, z: 3 }, w, h);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const p3 = project3D({ x: -3, y: 0, z: i }, w, h);
      const p4 = project3D({ x: 3, y: 0, z: i }, w, h);
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }
    ctx.restore();

    const wOrigin = project3D({ x: 0, y: 0, z: 0 }, w, h);
    const frameO = { x: M[3], y: M[7], z: M[11] };
    const frameU = { x: frameO.x + M[0], y: frameO.y + M[4], z: frameO.z + M[8] };
    const frameV = { x: frameO.x + M[1], y: frameO.y + M[5], z: frameO.z + M[9] };
    const frameW = { x: frameO.x + M[2], y: frameO.y + M[6], z: frameO.z + M[10] };

    const pO = project3D(frameO, w, h);
    drawArrow2D(ctx, wOrigin, pO, '#a855f7', 2.5, 'O (Col 4)');
    drawArrow2D(ctx, pO, project3D(frameU, w, h), '#ef4444', 3.5, 'u (Col 1)');
    drawArrow2D(ctx, pO, project3D(frameV, w, h), '#10b981', 3.5, 'v (Col 2)');
    drawArrow2D(ctx, pO, project3D(frameW, w, h), '#38bdf8', 3.5, 'w (Col 3)');

    const divW = Math.abs(wVal) > 1e-3 ? wVal : 1.0;
    const cubeVerts = [
      { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }
    ].map(v => {
      const res = mat4Vec4(M, { x: v.x, y: v.y, z: v.z, w: wVal });
      return project3D({ x: res.x / divW, y: res.y / divW, z: res.z / divW }, w, h);
    });

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    ctx.save();
    ctx.strokeStyle = Math.abs(wVal) < 1e-3 ? '#f59e0b' : '#818cf8';
    ctx.lineWidth = 1.8;
    edges.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(cubeVerts[i].x, cubeVerts[i].y);
      ctx.lineTo(cubeVerts[j].x, cubeVerts[j].y);
      ctx.stroke();
    });
    ctx.restore();
  }, [activeTab, composeTRS, tx, ty, tz, yaw, pitch, roll, sx, sy, sz, sh, wVal, camYaw, camPitch]);

  // Draw Tab 2 Canvas: Hierarchy Lab
  useEffect(() => {
    if (activeTab !== 'lab2') return;
    const canvas = hierarchyCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    for (let i = -3; i <= 3; i++) {
      const p1 = project3D({ x: i, y: -1.0, z: -3 }, w, h);
      const p2 = project3D({ x: i, y: -1.0, z: 3 }, w, h);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const p3 = project3D({ x: -3, y: -1.0, z: i }, w, h);
      const p4 = project3D({ x: 3, y: -1.0, z: i }, w, h);
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
    }
    ctx.restore();

    const makeT = (x: number, y: number, z: number) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
    const makeRy = (rad: number) => {
      const c = Math.cos(rad), s = Math.sin(rad);
      return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
    };
    const makeRz = (rad: number) => {
      const c = Math.cos(rad), s = Math.sin(rad);
      return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    };

    const M_base = mat4Mul(makeT(armBaseX, -1.0, 0), makeRy((armYaw * Math.PI) / 180));
    const M_shoulder = mat4Mul(M_base, mat4Mul(makeT(0, 0.8, 0), makeRz((armShoulder * Math.PI) / 180)));
    const M_elbow = mat4Mul(M_shoulder, mat4Mul(makeT(0, 1.4, 0), makeRz((armElbow * Math.PI) / 180)));
    const M_tip = mat4Mul(M_elbow, makeT(0, 1.2, 0));

    const drawFrameAxes = (M: number[], label: string) => {
      const o = { x: M[3], y: M[7], z: M[11] };
      const ux = { x: o.x + M[0] * 0.55, y: o.y + M[4] * 0.55, z: o.z + M[8] * 0.55 };
      const vy = { x: o.x + M[1] * 0.55, y: o.y + M[5] * 0.55, z: o.z + M[9] * 0.55 };
      const wz = { x: o.x + M[2] * 0.55, y: o.y + M[6] * 0.55, z: o.z + M[10] * 0.55 };
      const po = project3D(o, w, h);
      drawArrow2D(ctx, po, project3D(ux, w, h), '#ef4444', 2, '');
      drawArrow2D(ctx, po, project3D(vy, w, h), '#10b981', 2, '');
      drawArrow2D(ctx, po, project3D(wz, w, h), '#38bdf8', 2, label);
      return po;
    };

    const pBase = drawFrameAxes(M_base, 'F1:Base');
    const pShoulder = drawFrameAxes(M_shoulder, 'F2:Shoulder');
    const pElbow = drawFrameAxes(M_elbow, 'F3:Elbow');
    const pTip = drawFrameAxes(M_tip, 'Tip');

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(pBase.x, pBase.y); ctx.lineTo(pShoulder.x, pShoulder.y); ctx.stroke();
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath(); ctx.moveTo(pShoulder.x, pShoulder.y); ctx.lineTo(pElbow.x, pElbow.y); ctx.stroke();
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath(); ctx.moveTo(pElbow.x, pElbow.y); ctx.lineTo(pTip.x, pTip.y); ctx.stroke();
    ctx.restore();
  }, [activeTab, armBaseX, armYaw, armShoulder, armElbow, camYaw, camPitch]);

  // Draw Tab 4 Mini-Game Canvas
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

    const cx = w / 2, cy = h / 2 + 10, scale = 72;
    const toScr = (x: number, y: number) => ({ x: cx + x * scale, y: cy - y * scale });

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy - i * scale); ctx.lineTo(w, cy - i * scale); ctx.stroke();
    }
    ctx.restore();

    if (currentMission === 1) {
      const shipLocal = [
        { x: 0, y: 0 }, { x: 1.2, y: 0.2 }, { x: 1.5, y: 0.9 }, { x: 0.9, y: 1.5 }, { x: 0.2, y: 1.2 }
      ];
      const apply2 = (p: { x: number; y: number }, a: number, b: number, c: number, d: number) =>
        toScr(a * p.x + c * p.y, b * p.x + d * p.y);

      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      shipLocal.forEach((p, idx) => {
        const s = apply2(p, m1Target.ux, m1Target.uy, m1Target.vx, m1Target.vy);
        if (idx === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      const err =
        Math.hypot(m1User.ux - m1Target.ux, m1User.uy - m1Target.uy) +
        Math.hypot(m1User.vx - m1Target.vx, m1User.vy - m1Target.vy);
      const cleared = err <= 0.22;
      if (cleared && !missionsCleared[1]) {
        setMissionsCleared(prev => ({ ...prev, 1: true }));
      }

      ctx.save();
      ctx.fillStyle = cleared ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.28)';
      ctx.strokeStyle = cleared ? '#10b981' : '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      shipLocal.forEach((p, idx) => {
        const s = apply2(p, m1User.ux, m1User.uy, m1User.vx, m1User.vy);
        if (idx === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawArrow2D(ctx, toScr(0, 0), toScr(m1User.ux, m1User.uy), '#ef4444', 3.2, 'u');
      drawArrow2D(ctx, toScr(0, 0), toScr(m1User.vx, m1User.vy), '#10b981', 3.2, 'v');
    } else if (currentMission === 2) {
      const transformShip = (
        pts: Array<{ x: number; y: number }>,
        tX: number,
        tY: number,
        deg: number,
        isTR: boolean
      ) => {
        const rad = (deg * Math.PI) / 180;
        const c = Math.cos(rad), s = Math.sin(rad);
        return pts.map(p => {
          if (isTR) {
            return toScr(c * p.x - s * p.y + tX, s * p.x + c * p.y + tY);
          }
          const px = p.x + tX, py = p.y + tY;
          return toScr(c * px - s * py, s * px + c * py);
        });
      };

      const hull = [{ x: -0.4, y: -0.3 }, { x: 0.6, y: 0 }, { x: -0.4, y: 0.3 }];
      const targetPts = transformShip(hull, 1.6, 1.0, 60, true);
      const userPts = transformShip(hull, m2User.tx, m2User.ty, m2User.angle, m2UseTR);

      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      targetPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      const distErr = Math.hypot(userPts[1].x - targetPts[1].x, userPts[1].y - targetPts[1].y) / scale;
      const cleared = m2UseTR && distErr < 0.18 && Math.abs(m2User.angle - 60) <= 10;
      if (cleared && !missionsCleared[2]) {
        setMissionsCleared(prev => ({ ...prev, 2: true }));
      }

      ctx.save();
      ctx.fillStyle = cleared ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.strokeStyle = cleared ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      userPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (currentMission === 3) {
      const tLen = Math.hypot(m3Scale, 1);
      const tX = m3Scale / tLen, tY = 1 / tLen;
      const rawNx = m3UseInvT ? -1 / m3Scale : -m3Scale;
      const rawNy = 1;
      const nLen = Math.hypot(rawNx, rawNy);
      const nx = rawNx / nLen, ny = rawNy / nLen;

      const m1 = toScr(-tX * 1.8, -tY * 1.8);
      const m2 = toScr(tX * 1.8, tY * 1.8);
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
      ctx.restore();

      drawArrow2D(
        ctx,
        toScr(0, 0),
        toScr(nx * 1.3, ny * 1.3),
        m3UseInvT ? '#10b981' : '#f43f5e',
        3,
        m3UseInvT ? "n'=(M⁻¹)ᵀn" : 'Wrong M·n'
      );

      const src = { x: -2.2, y: 0.8 };
      const iLen = Math.hypot(-src.x, -src.y);
      const ix = -src.x / iLen, iy = -src.y / iLen;
      drawArrow2D(ctx, toScr(src.x, src.y), toScr(0, 0), '#f59e0b', 3, 'Laser I');

      const idotn = ix * nx + iy * ny;
      const rx = ix - 2 * idotn * nx;
      const ry = iy - 2 * idotn * ny;
      drawArrow2D(ctx, toScr(0, 0), toScr(rx * 2.4, ry * 2.4), '#a855f7', 3.2, 'Reflected R');

      const targetSx = 1.65;
      const tNxRaw = -1 / targetSx, tNyRaw = 1;
      const tNl = Math.hypot(tNxRaw, tNyRaw);
      const tNx = tNxRaw / tNl, tNy = tNyRaw / tNl;
      const tDot = ix * tNx + iy * tNy;
      const coreScr = toScr((ix - 2 * tDot * tNx) * 2.1, (iy - 2 * tDot * tNy) * 2.1);

      const cleared = m3UseInvT && Math.abs(m3Scale - targetSx) <= 0.12;
      if (cleared && !missionsCleared[3]) {
        setMissionsCleared(prev => ({ ...prev, 3: true }));
      }

      ctx.save();
      ctx.fillStyle = cleared ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.25)';
      ctx.strokeStyle = cleared ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(coreScr.x, coreScr.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [activeTab, currentMission, m1Target, m1User, m2UseTR, m2User, m3UseInvT, m3Scale, missionsCleared]);

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

  const M = getCurrentMat4();
  const clearedCount = Object.values(missionsCleared).filter(Boolean).length;

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Lesson 02 Header */}
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
              <span>Stage 1 · Lesson 02</span>
              <span>•</span>
              <span>UC Davis Lec 03 + MIT 6.837 Lec 04 + 3Blue1Brown</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isZh
                ? 'L02: 线性变换、仿射标架 (Frames) 与 4×4 齐次坐标矩阵'
                : 'L02: Linear Transformations, Coordinate Frames & 4×4 Homogeneous Matrices'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isZh
                ? '从“矩阵的列就是变换后的基向量”出发，理解为什么高维线性切变 (Shear) 能在 w=1 超平面上诞生平移，以及为什么法线必须乘逆转置矩阵 (M⁻¹)ᵀ！'
                : 'Understand why matrix columns are transformed basis vectors, how higher-dimensional Shear at w=1 creates translation, and why normals transform by (M⁻¹)ᵀ!'}
            </p>
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
                : '✓ Lesson 02 Completed'
              : isZh
              ? '打卡完成 Lesson 02'
              : 'Mark Lesson 02 Complete'}
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
              label: isZh ? '2. 🔬 4×4 齐次矩阵与 w 透视实验室' : '2. 🔬 4×4 Homogeneous Matrix & w Lab'
            },
            {
              id: 'lab2',
              label: isZh ? '3. 🦾 父子层级标架树 (机械臂)' : '3. 🦾 Hierarchical Frames (Robot Arm)'
            },
            { id: 'videos', label: isZh ? '4. 🎥 名校公开课视频与精要' : '4. 🎥 Lecture Videos & Notes' },
            {
              id: 'game',
              label: isZh
                ? `5. 🎮 终极互动小游戏 (${clearedCount}/3 通关)`
                : `5. 🎮 Matrix Pilot Mini-Game (${clearedCount}/3 Cleared)`
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

      {/* TAB 0: 3BLUE1BROWN DEEP INTUITION */}
      {activeTab === 'deep' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '1. 3Blue1Brown 黄金铁律：“矩阵的每一列，就是基向量变换后的新落点！”'
                : '1. 3Blue1Brown Golden Rule: "Matrix Columns Are Where the Basis Vectors Land!"'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 text-sm">
                  {isZh ? '① 线性变换的两条几何铁律' : '① Two Geometric Rules of Linearity'}
                </div>
                <p>
                  {isZh
                    ? '1. 直线变形后依然是直线（平行且等距的网格线依然保持平行且等距）；2. 原点 (0,0,0) 必须固定不动。因此原本等于 x·î + y·ĵ + z·k̂ 的向量，在变形后必然等于 x·L(î) + y·L(ĵ) + z·L(k̂)！'
                    : '1. Grid lines remain parallel and evenly spaced; 2. The origin stays fixed at (0,0,0). Thus L(x·î + y·ĵ + z·k̂) = x·L(î) + y·L(ĵ) + z·L(k̂)!'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 text-sm">
                  {isZh ? '② 为什么矩阵乘向量要那样算？' : '② Why Matrix-Vector Multiplication Works That Way'}
                </div>
                <p>
                  {isZh
                    ? '把变形后的三根新基向量 u = L(î), v = L(ĵ), w = L(k̂) 竖着排成矩阵的三列 M = [u | v | w]，那么 M · [x, y, z]ᵀ = x·u + y·v + z·w！从此写旋转、缩放、切变矩阵再也不用背公式，只需写出三根基向量的落点！'
                    : 'Packing the transformed basis vectors u=L(î), v=L(ĵ), w=L(k̂) as columns of M=[u|v|w] makes M·[x,y,z]ᵀ = x·u + y·v + z·w!'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400 text-sm">
                  {isZh ? '③ 行列式 det(M) 与矩阵复合 AB ≠ BA' : '③ Determinant det(M) & Non-Commutativity'}
                </div>
                <p>
                  {isZh
                    ? '矩阵相乘 A·B 代表先做变换 B 再做变换 A（从右往左读）。det(M) 代表单位立方体变形后的有向体积倍率；det(M) < 0 代表空间镜像翻转（右手系变左手系）！'
                    : 'A·B means apply B first, then A. det(M) measures the signed volume scaling factor of a unit cube!'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visualizer 1: Shear Slice */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-sm font-bold text-indigo-300">
                {isZh
                  ? '🔬 为什么把世界抬升到 w=1 做高维切变 (Shear) 就能产生平移？'
                  : '🔬 How Higher-Dimensional Shear on the w=1 Slice Creates Translation'}
              </div>
              <div
                className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
                style={{ height: 320 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
              >
                <canvas ref={shearSliceCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Shear tₓ: {shearTx.toFixed(1)}</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={shearTx}
                    onChange={e => setShearTx(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Shear tᵧ: {shearTy.toFixed(1)}</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={shearTy}
                    onChange={e => setShearTy(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Slice w: {sliceW.toFixed(2)}</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={sliceW}
                    onChange={e => setSliceW(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Visualizer 2: Normal Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-sm font-bold text-purple-300">
                {isZh
                  ? '🔬 为什么法向量不能乘 M，而必须乘逆转置矩阵 (M⁻¹)ᵀ？'
                  : '🔬 Why Surface Normals Must Transform by (M⁻¹)ᵀ Instead of M'}
              </div>
              <div
                className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
                style={{ height: 320 }}
              >
                <canvas ref={normalMatrixCanvasRef} className="w-full h-full" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Scale sₓ: {nmSx.toFixed(1)}</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={nmSx}
                    onChange={e => setNmSx(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Scale sᵧ: {nmSy.toFixed(1)}</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={nmSy}
                    onChange={e => setNmSy(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Shear kₓᵧ: {nmShear.toFixed(1)}</span>
                  <input
                    type="range"
                    min="-1.2"
                    max="1.2"
                    step="0.1"
                    value={nmShear}
                    onChange={e => setNmShear(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: 4x4 HOMOGENEOUS MATRIX SANDBOX */}
      {activeTab === 'lab1' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">
                {isZh
                  ? '3D 仿射标架 (O; u, v, w) 与 4×4 齐次矩阵透视沙盒'
                  : '3D Coordinate Frame (O; u, v, w) & 4×4 Homogeneous Matrix Sandbox'}
              </h2>
              <button
                onClick={() => setComposeTRS(!composeTRS)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
              >
                {composeTRS ? 'Order: M = T · R · S (Local)' : 'Order: M = R · T · S (Orbit)'}
              </button>
            </div>
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 430 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={matrixSandboxCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="text-sm font-bold text-white">
                {isZh ? '实时 4×4 齐次矩阵 M = [ u | v | w | O ]' : 'Live 4×4 Matrix M = [ u | v | w | O ]'}
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs text-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                {M.map((val, idx) => {
                  const col = idx % 4;
                  const colors = [
                    'text-red-300 bg-red-950/30',
                    'text-emerald-300 bg-emerald-950/30',
                    'text-sky-300 bg-sky-950/30',
                    'text-purple-300 bg-purple-950/30'
                  ];
                  return (
                    <div key={idx} className={`py-1.5 rounded ${colors[col]}`}>
                      {val.toFixed(2)}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                <div>
                  <span className="text-slate-400">tₓ: {tx.toFixed(1)}</span>
                  <input type="range" min="-2.5" max="2.5" step="0.1" value={tx} onChange={e => setTx(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">tᵧ: {ty.toFixed(1)}</span>
                  <input type="range" min="-2.5" max="2.5" step="0.1" value={ty} onChange={e => setTy(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">t_z: {tz.toFixed(1)}</span>
                  <input type="range" min="-2.5" max="2.5" step="0.1" value={tz} onChange={e => setTz(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">Yaw: {yaw}°</span>
                  <input type="range" min="-180" max="180" value={yaw} onChange={e => setYaw(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">Pitch: {pitch}°</span>
                  <input type="range" min="-90" max="90" value={pitch} onChange={e => setPitch(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">Roll: {roll}°</span>
                  <input type="range" min="-180" max="180" value={roll} onChange={e => setRoll(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">sₓ: {sx.toFixed(1)}</span>
                  <input type="range" min="-2" max="2" step="0.1" value={sx} onChange={e => setSx(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">sᵧ: {sy.toFixed(1)}</span>
                  <input type="range" min="-2" max="2" step="0.1" value={sy} onChange={e => setSy(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <span className="text-slate-400">w: {wVal.toFixed(1)}</span>
                  <input type="range" min="0" max="2.5" step="0.1" value={wVal} onChange={e => setWVal(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIERARCHICAL ROBOT ARM */}
      {activeTab === 'lab2' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 420 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={hierarchyCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
            <div className="font-bold text-sm text-white">
              {isZh ? '父子层级标架控制 (Scene Graph)' : 'Hierarchical Frame Controls'}
            </div>
            <div>
              <span className="text-amber-400 block">Base X: {armBaseX.toFixed(1)}</span>
              <input type="range" min="-1.8" max="1.8" step="0.1" value={armBaseX} onChange={e => setArmBaseX(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-amber-400 block">Base Yaw θ₁: {armYaw}°</span>
              <input type="range" min="-180" max="180" value={armYaw} onChange={e => setArmYaw(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-cyan-400 block">Shoulder Pitch θ₂: {armShoulder}°</span>
              <input type="range" min="-75" max="85" value={armShoulder} onChange={e => setArmShoulder(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <span className="text-purple-400 block">Elbow Bend θ₃: {armElbow}°</span>
              <input type="range" min="-120" max="90" value={armElbow} onChange={e => setArmElbow(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VIDEOS */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">
              MIT 6.837 Lecture 4: Coordinates and Transformations (Prof. Justin Solomon)
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">
              UC Davis Lecture 3: Moving Objects in Space (Prof. Kenneth Joy)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? 'Kenneth Joy 教授重点剖析了仿射标架 (O; u, v, w) 如何把“移动空间中的几何体”与“切换局部坐标系”统一在同一个 4×4 齐次矩阵之下。'
                : 'Prof. Kenneth Joy demonstrates how Coordinate Frames (O; u, v, w) unify moving objects in space with changing coordinate representations via 4×4 homogeneous matrices.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: MINI-GAME */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white">
              {isZh
                ? `🎮 星际船坞矩阵领航员 (${clearedCount}/3 通关)`
                : `🎮 Star-Dock Matrix Pilot (${clearedCount}/3 Cleared)`}
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
                  <div className="font-bold text-amber-400">Mission 1: Sculpt Basis Columns [u | v]</div>
                  <label className="block">uₓ: {m1User.ux.toFixed(1)}</label>
                  <input type="range" min="-2" max="2" step="0.1" value={m1User.ux} onChange={e => setM1User({ ...m1User, ux: parseFloat(e.target.value) })} className="w-full" />
                  <label className="block">uᵧ: {m1User.uy.toFixed(1)}</label>
                  <input type="range" min="-2" max="2" step="0.1" value={m1User.uy} onChange={e => setM1User({ ...m1User, uy: parseFloat(e.target.value) })} className="w-full" />
                  <label className="block">vₓ: {m1User.vx.toFixed(1)}</label>
                  <input type="range" min="-2" max="2" step="0.1" value={m1User.vx} onChange={e => setM1User({ ...m1User, vx: parseFloat(e.target.value) })} className="w-full" />
                  <label className="block">vᵧ: {m1User.vy.toFixed(1)}</label>
                  <input type="range" min="-2" max="2" step="0.1" value={m1User.vy} onChange={e => setM1User({ ...m1User, vy: parseFloat(e.target.value) })} className="w-full" />
                  <button
                    onClick={() => setM1Target({ ux: 0.8, uy: 1.2, vx: -1.2, vy: 0.8 })}
                    className="w-full py-1.5 mt-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    {isZh ? '🎲 随机新目标虚影' : '🎲 Randomize Target'}
                  </button>
                </>
              )}
              {currentMission === 2 && (
                <>
                  <div className="font-bold text-cyan-400">Mission 2: T·R vs R·T Orbital Docking</div>
                  <button
                    onClick={() => setM2UseTR(!m2UseTR)}
                    className="w-full py-2 rounded-lg font-bold bg-indigo-600 text-white"
                  >
                    {m2UseTR ? 'Order: M = T · R (Correct!)' : 'Order: M = R · T (Click to Flip!)'}
                  </button>
                  <label className="block">tₓ: {m2User.tx.toFixed(1)}</label>
                  <input type="range" min="-2.2" max="2.2" step="0.1" value={m2User.tx} onChange={e => setM2User({ ...m2User, tx: parseFloat(e.target.value) })} className="w-full" />
                  <label className="block">tᵧ: {m2User.ty.toFixed(1)}</label>
                  <input type="range" min="-2.2" max="2.2" step="0.1" value={m2User.ty} onChange={e => setM2User({ ...m2User, ty: parseFloat(e.target.value) })} className="w-full" />
                  <label className="block">Angle θ: {m2User.angle}°</label>
                  <input type="range" min="-180" max="180" step="5" value={m2User.angle} onChange={e => setM2User({ ...m2User, angle: parseFloat(e.target.value) })} className="w-full" />
                </>
              )}
              {currentMission === 3 && (
                <>
                  <div className="font-bold text-purple-400">Mission 3: Inverse-Transpose Normal Laser</div>
                  <button
                    onClick={() => setM3UseInvT(!m3UseInvT)}
                    className="w-full py-2 rounded-lg font-bold bg-emerald-600 text-white"
                  >
                    {m3UseInvT ? '✅ Enabled: (M⁻¹)ᵀ Normal Matrix' : '❌ Wrong M·n (Click to Enable (M⁻¹)ᵀ)'}
                  </button>
                  <label className="block">Mirror Scale sₓ: {m3Scale.toFixed(2)}</label>
                  <input type="range" min="0.5" max="2.5" step="0.05" value={m3Scale} onChange={e => setM3Scale(parseFloat(e.target.value))} className="w-full" />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
