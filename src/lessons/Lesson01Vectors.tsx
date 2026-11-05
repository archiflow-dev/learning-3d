import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../App';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Lesson01Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson01Vectors: React.FC<Lesson01Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'deep' | 'lab1' | 'lab2' | 'videos' | 'game'>('deep');
  const [isRightHanded, setIsRightHanded] = useState(true);
  const [isSwappedCross, setIsSwappedCross] = useState(false);
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [showProjection, setShowProjection] = useState(true);

  // 3Blue1Brown Deep Intuition state
  const [squish, setSquish] = useState(0);
  const [uAngle, setUAngle] = useState(30);
  const [vAngle, setVAngle] = useState(55);
  const [probeHeight, setProbeHeight] = useState(1.4);
  const [probeShear, setProbeShear] = useState(0.6);

  const [vecA, setVecA] = useState<Vec3>({ x: 1.5, y: 2.0, z: 0.8 });
  const [vecB, setVecB] = useState<Vec3>({ x: 2.2, y: 0.5, z: 1.5 });

  const [camYaw, setCamYaw] = useState(-0.65);
  const [camPitch, setCamPitch] = useState(0.45);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const [activePillar, setActivePillar] = useState<1 | 2 | 3>(2);
  const [activeShape, setActiveShape] = useState<'icosahedron' | 'torus'>('icosahedron');
  const [lightAzimuth, setLightAzimuth] = useState(45);
  const [showNormals, setShowNormals] = useState(true);

  // Mini-Game State
  const [currentMission, setCurrentMission] = useState<1 | 2 | 3>(1);
  const [missionsCleared, setMissionsCleared] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false
  });
  const [m1Target, setM1Target] = useState({ yaw: -45, pitch: 38 });
  const [m1User, setM1User] = useState({ yaw: 20, pitch: 15 });

  const [m2TargetTilt, setM2TargetTilt] = useState(28);
  const [m2Spread, setM2Spread] = useState(45);
  const [m2Len, setM2Len] = useState(1.6);
  const [m2Tilt, setM2Tilt] = useState(10);
  const [m2WindingCorrect, setM2WindingCorrect] = useState(false);

  const [m3SelectedFaces, setM3SelectedFaces] = useState<number[]>([]);
  const [m3Feedback, setM3Feedback] = useState<string>('');
  const m3CachedPolysRef = useRef<
    Array<{
      idx: number;
      ndotv: number;
      isFront: boolean;
      poly2D: Array<{ x: number; y: number }>;
    }>
  >([]);

  const dualityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pillarsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const dot = (u: Vec3, v: Vec3) => u.x * v.x + u.y * v.y + u.z * v.z;
  const norm = (u: Vec3) => Math.sqrt(dot(u, u));
  const normalize = (u: Vec3): Vec3 => {
    const l = norm(u);
    return l > 1e-6 ? { x: u.x / l, y: u.y / l, z: u.z / l } : { x: 0, y: 0, z: 0 };
  };
  const cross = (u: Vec3, v: Vec3, rightHanded = isRightHanded): Vec3 => {
    const s = rightHanded ? 1 : -1;
    return {
      x: s * (u.y * v.z - u.z * v.y),
      y: s * (u.z * v.x - u.x * v.z),
      z: s * (u.x * v.y - u.y * v.x)
    };
  };
  const sphericalToVec = (yawDeg: number, pitchDeg: number, radius = 1): Vec3 => {
    const yaw = yawDeg * (Math.PI / 180);
    const pitch = pitchDeg * (Math.PI / 180);
    return {
      x: radius * Math.cos(pitch) * Math.sin(yaw),
      y: radius * Math.sin(pitch),
      z: radius * Math.cos(pitch) * Math.cos(yaw)
    };
  };

  const project3D = (
    p: Vec3,
    width: number,
    height: number,
    yaw: number,
    pitch: number,
    scaleFactor = 76
  ) => {
    const zSign = isRightHanded ? 1 : -1;
    const px = p.x;
    const py = p.y;
    const pz = p.z * zSign;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const x1 = px * cosY + pz * sinY;
    const z1 = -px * sinY + pz * cosY;

    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const y2 = py * cosP - z1 * sinP;
    const z2 = py * sinP + z1 * cosP;

    const camDist = 9.0;
    const perspective = camDist / Math.max(1.5, camDist - z2);
    return {
      x: width / 2 + x1 * scaleFactor * perspective,
      y: height / 2 + 25 - y2 * scaleFactor * perspective,
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
      ctx.font = 'bold 12px monospace';
      ctx.fillText(label, to.x + 10 * Math.cos(angle), to.y + 10 * Math.sin(angle));
    }
    ctx.restore();
  };

  // Draw Tab 0: 3Blue1Brown Duality & Volume Canvases
  useEffect(() => {
    if (activeTab !== 'deep') return;

    // 1. Duality Canvas (2D to 1D squish)
    const c1 = dualityCanvasRef.current;
    if (c1) {
      const r1 = c1.parentElement?.getBoundingClientRect();
      c1.width = r1?.width || 540;
      c1.height = r1?.height || 310;
      const ctx = c1.getContext('2d');
      if (ctx) {
        const w = c1.width;
        const h = c1.height;
        ctx.clearRect(0, 0, w, h);

        const uRad = uAngle * (Math.PI / 180);
        const ux = Math.cos(uRad);
        const uy = Math.sin(uRad);
        const vRad = vAngle * (Math.PI / 180);
        const vx = 1.9 * Math.cos(vRad);
        const vy = 1.9 * Math.sin(vRad);

        const cx = w / 2;
        const cy = h / 2;
        const scale = 68;

        const transformPt = (x: number, y: number) => {
          const d = x * ux + y * uy;
          const px = d * ux;
          const py = d * uy;
          const curX = x * (1 - squish) + px * squish;
          const curY = y * (1 - squish) + py * squish;
          return { x: cx + curX * scale, y: cy - curY * scale };
        };

        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - ux * 3.5 * scale, cy + uy * 3.5 * scale);
        ctx.lineTo(cx + ux * 3.5 * scale, cy - uy * 3.5 * scale);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          const p1 = transformPt(i, -3);
          const p2 = transformPt(i, 3);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          const p3 = transformPt(-3, i);
          const p4 = transformPt(3, i);
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.stroke();
        }
        ctx.restore();

        const origin = { x: cx, y: cy };
        const pU = { x: cx + ux * scale, y: cy - uy * scale };
        const pI = transformPt(1, 0);
        const pJ = transformPt(0, 1);
        const pV = transformPt(vx, vy);

        drawArrow2D(ctx, origin, pU, '#f59e0b', 3, 'û');
        drawArrow2D(ctx, origin, pI, '#ef4444', 2.5, squish > 0.8 ? `T(î)=uₓ=${ux.toFixed(2)}` : 'î');
        drawArrow2D(ctx, origin, pJ, '#22c55e', 2.5, squish > 0.8 ? `T(ĵ)=uᵧ=${uy.toFixed(2)}` : 'ĵ');
        drawArrow2D(
          ctx,
          origin,
          pV,
          '#38bdf8',
          3.2,
          squish > 0.8 ? `T(v)=${(vx * ux + vy * uy).toFixed(2)}` : 'v'
        );
      }
    }

    // 2. Volume Canvas (3D Parallelepiped)
    const c2 = volumeCanvasRef.current;
    if (c2) {
      const r2 = c2.parentElement?.getBoundingClientRect();
      c2.width = r2?.width || 540;
      c2.height = r2?.height || 310;
      const ctx = c2.getContext('2d');
      if (ctx) {
        const w = c2.width;
        const h = c2.height;
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.strokeStyle = 'rgba(148,163,184,0.14)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          const p1 = project3D({ x: i, y: 0, z: -3 }, w, h, camYaw, camPitch, 68);
          const p2 = project3D({ x: i, y: 0, z: 3 }, w, h, camYaw, camPitch, 68);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          const p3 = project3D({ x: -3, y: 0, z: i }, w, h, camYaw, camPitch, 68);
          const p4 = project3D({ x: 3, y: 0, z: i }, w, h, camYaw, camPitch, 68);
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.stroke();
        }
        ctx.restore();

        const baseA: Vec3 = { x: 2.0, y: 0, z: 0.3 };
        const baseB: Vec3 = { x: 0.2, y: 0, z: 1.55 };
        const crossAB = cross(baseA, baseB, true);
        const unitN = normalize(crossAB);

        const probeX: Vec3 = {
          x: unitN.x * probeHeight + probeShear * 0.8,
          y: unitN.y * probeHeight,
          z: unitN.z * probeHeight + probeShear * 0.5
        };

        const add3 = (u: Vec3, v: Vec3): Vec3 => ({ x: u.x + v.x, y: u.y + v.y, z: u.z + v.z });
        const O: Vec3 = { x: 0, y: 0, z: 0 };
        const AB = add3(baseA, baseB);
        const XA = add3(probeX, baseA);
        const XB = add3(probeX, baseB);
        const XAB = add3(probeX, AB);

        const pO = project3D(O, w, h, camYaw, camPitch, 68);
        const pA = project3D(baseA, w, h, camYaw, camPitch, 68);
        const pB = project3D(baseB, w, h, camYaw, camPitch, 68);
        const pAB = project3D(AB, w, h, camYaw, camPitch, 68);

        const pX = project3D(probeX, w, h, camYaw, camPitch, 68);
        const pXA = project3D(XA, w, h, camYaw, camPitch, 68);
        const pXB = project3D(XB, w, h, camYaw, camPitch, 68);
        const pXAB = project3D(XAB, w, h, camYaw, camPitch, 68);

        ctx.save();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.24)';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(pO.x, pO.y);
        ctx.lineTo(pA.x, pA.y);
        ctx.lineTo(pAB.x, pAB.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = probeHeight >= 0 ? 'rgba(34, 197, 94, 0.22)' : 'rgba(244, 63, 94, 0.22)';
        ctx.strokeStyle = probeHeight >= 0 ? '#22c55e' : '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(pX.x, pX.y);
        ctx.lineTo(pXA.x, pXA.y);
        ctx.lineTo(pXAB.x, pXAB.y);
        ctx.lineTo(pXB.x, pXB.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.setLineDash([3, 3]);
        [
          [pO, pX],
          [pA, pXA],
          [pB, pXB],
          [pAB, pXAB]
        ].forEach(([u, v]) => {
          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.lineTo(v.x, v.y);
          ctx.stroke();
        });
        ctx.restore();

        drawArrow2D(ctx, pO, pA, '#f59e0b', 3, 'a');
        drawArrow2D(ctx, pO, pB, '#06b6d4', 3, 'b');
        drawArrow2D(ctx, pO, pX, '#22c55e', 3.2, 'Probe x');

        const pCross = project3D(
          { x: crossAB.x * 0.65, y: crossAB.y * 0.65, z: crossAB.z * 0.65 },
          w,
          h,
          camYaw,
          camPitch,
          68
        );
        drawArrow2D(ctx, pO, pCross, '#a855f7', 3.5, 'p = a × b');
      }
    }
  }, [activeTab, squish, uAngle, vAngle, probeHeight, probeShear, camYaw, camPitch]);

  // Draw Lab 1 Canvas
  useEffect(() => {
    if (activeTab !== 'lab1') return;
    const canvas = vectorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 680;
    canvas.height = rect?.height || 430;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.14)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const p1 = project3D({ x: i, y: 0, z: -3 }, w, h, camYaw, camPitch);
      const p2 = project3D({ x: i, y: 0, z: 3 }, w, h, camYaw, camPitch);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project3D({ x: -3, y: 0, z: i }, w, h, camYaw, camPitch);
      const p4 = project3D({ x: 3, y: 0, z: i }, w, h, camYaw, camPitch);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }
    ctx.restore();

    const origin = project3D({ x: 0, y: 0, z: 0 }, w, h, camYaw, camPitch);
    drawArrow2D(ctx, origin, project3D({ x: 3.1, y: 0, z: 0 }, w, h, camYaw, camPitch), '#ef4444', 1.6, '+X');
    drawArrow2D(ctx, origin, project3D({ x: 0, y: 3.1, z: 0 }, w, h, camYaw, camPitch), '#22c55e', 1.6, '+Y');
    drawArrow2D(
      ctx,
      origin,
      project3D({ x: 0, y: 0, z: 3.1 }, w, h, camYaw, camPitch),
      '#3b82f6',
      1.6,
      isRightHanded ? '+Z (RH)' : '+Z (LH)'
    );

    const pA = project3D(vecA, w, h, camYaw, camPitch);
    const pB = project3D(vecB, w, h, camYaw, camPitch);
    const pSum = project3D(
      { x: vecA.x + vecB.x, y: vecA.y + vecB.y, z: vecA.z + vecB.z },
      w,
      h,
      camYaw,
      camPitch
    );

    if (showParallelogram) {
      ctx.save();
      ctx.fillStyle = isSwappedCross ? 'rgba(236, 72, 153, 0.18)' : 'rgba(168, 85, 247, 0.18)';
      ctx.strokeStyle = isSwappedCross ? 'rgba(236, 72, 153, 0.65)' : 'rgba(168, 85, 247, 0.65)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(pA.x, pA.y);
      ctx.lineTo(pSum.x, pSum.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const lenB2 = dot(vecB, vecB);
    if (showProjection && lenB2 > 1e-4) {
      const scaleProj = dot(vecA, vecB) / lenB2;
      const projVec = { x: vecB.x * scaleProj, y: vecB.y * scaleProj, z: vecB.z * scaleProj };
      const pProj = project3D(projVec, w, h, camYaw, camPitch);

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pProj.x, pProj.y);
      ctx.stroke();
      ctx.restore();

      drawArrow2D(ctx, origin, pProj, '#eab308', 3.5, 'proj_b(a)');
    }

    const cVec = isSwappedCross ? cross(vecB, vecA) : cross(vecA, vecB);
    const pC = project3D({ x: cVec.x * 0.55, y: cVec.y * 0.55, z: cVec.z * 0.55 }, w, h, camYaw, camPitch);
    drawArrow2D(ctx, origin, pC, '#a855f7', 3.2, isSwappedCross ? 'b × a' : 'a × b');
    drawArrow2D(ctx, origin, pA, '#f59e0b', 3.2, 'a');
    drawArrow2D(ctx, origin, pB, '#06b6d4', 3.2, 'b');
  }, [activeTab, vecA, vecB, isRightHanded, isSwappedCross, showParallelogram, showProjection, camYaw, camPitch]);

  // Draw Lab 2 Canvas
  useEffect(() => {
    if (activeTab !== 'lab2') return;
    let frameId: number | null = null;
    let t = 0;

    const renderPillars = () => {
      const canvas = pillarsCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 680;
      canvas.height = rect?.height || 410;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      let verts: Vec3[] = [];
      let faces: [number, number, number][] = [];

      if (activeShape === 'icosahedron') {
        const phi = (1 + Math.sqrt(5)) / 2;
        const raw = [
          [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
          [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
          [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
        ];
        verts = raw.map((v, idx) => {
          const l = Math.hypot(v[0], v[1], v[2]);
          let s = 1.85 / l;
          if (activePillar === 3) {
            s *= 1 + 0.18 * Math.sin(t * 3.2 + idx * 0.9);
          }
          return { x: v[0] * s, y: v[1] * s, z: v[2] * s };
        });
        faces = [
          [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
          [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
          [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
          [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
        ];
      } else {
        const R = 1.45, r = 0.62;
        const segU = 14, segV = 10;
        for (let i = 0; i < segU; i++) {
          const u = (i / segU) * Math.PI * 2;
          for (let j = 0; j < segV; j++) {
            const v = (j / segV) * Math.PI * 2;
            const wave = activePillar === 3 ? 0.22 * Math.sin(u * 2 + t * 3.5) : 0;
            verts.push({
              x: (R + r * Math.cos(v)) * Math.cos(u),
              y: r * Math.sin(v) + wave,
              z: (R + r * Math.cos(v)) * Math.sin(u)
            });
          }
        }
        for (let i = 0; i < segU; i++) {
          const ni = (i + 1) % segU;
          for (let j = 0; j < segV; j++) {
            const nj = (j + 1) % segV;
            const a = i * segV + j;
            const b = ni * segV + j;
            const c = ni * segV + nj;
            const d = i * segV + nj;
            faces.push([a, d, c], [a, c, b]);
          }
        }
      }

      const rad = lightAzimuth * (Math.PI / 180);
      const lightDir = normalize({ x: Math.cos(rad), y: 0.7, z: Math.sin(rad) });
      const projectedVerts = verts.map(v => project3D(v, w, h, camYaw, camPitch, 86));

      const triList = faces.map(f => {
        const v0 = verts[f[0]], v1 = verts[f[1]], v2 = verts[f[2]];
        const e1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const e2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
        const n = normalize(cross(e1, e2, true));
        const center = {
          x: (v0.x + v1.x + v2.x) / 3,
          y: (v0.y + v1.y + v2.y) / 3,
          z: (v0.z + v1.z + v2.z) / 3
        };
        const pCenter = project3D(center, w, h, camYaw, camPitch, 86);
        return { f, n, center, depth: pCenter.depth };
      });

      triList.sort((a, b) => a.depth - b.depth);

      triList.forEach(tri => {
        const p0 = projectedVerts[tri.f[0]];
        const p1 = projectedVerts[tri.f[1]];
        const p2 = projectedVerts[tri.f[2]];

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();

        if (activePillar === 1) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          const ndotl = Math.max(0.12, dot(tri.n, lightDir));
          const rC = Math.round(35 + 65 * ndotl);
          const gC = Math.round(90 + 135 * ndotl);
          const bC = Math.round(145 + 105 * ndotl);
          ctx.fillStyle = `rgb(${rC},${gC},${bC})`;
          ctx.fill();
          ctx.strokeStyle = 'rgba(15,23,42,0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        if (showNormals) {
          const cProj = project3D(tri.center, w, h, camYaw, camPitch, 86);
          const tip = {
            x: tri.center.x + tri.n.x * 0.35,
            y: tri.center.y + tri.n.y * 0.35,
            z: tri.center.z + tri.n.z * 0.35
          };
          const tipProj = project3D(tip, w, h, camYaw, camPitch, 86);
          drawArrow2D(ctx, cProj, tipProj, '#f43f5e', 1.4, '');
        }
      });

      if (activePillar === 1) {
        ctx.fillStyle = '#f59e0b';
        projectedVerts.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (activePillar === 3) {
        t += 0.025;
        frameId = requestAnimationFrame(renderPillars);
      }
    };

    renderPillars();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [activeTab, activePillar, activeShape, lightAzimuth, showNormals, camYaw, camPitch]);

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
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.14)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const p1 = project3D({ x: i, y: 0, z: -3 }, w, h, camYaw, camPitch);
      const p2 = project3D({ x: i, y: 0, z: 3 }, w, h, camYaw, camPitch);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project3D({ x: -3, y: 0, z: i }, w, h, camYaw, camPitch);
      const p4 = project3D({ x: 3, y: 0, z: i }, w, h, camYaw, camPitch);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }
    ctx.restore();

    const origin = project3D({ x: 0, y: 0, z: 0 }, w, h, camYaw, camPitch);

    if (currentMission === 1) {
      const sunVec = sphericalToVec(m1Target.yaw, m1Target.pitch, 2.5);
      const normVec = sphericalToVec(m1User.yaw, m1User.pitch, 2.2);
      const sunUnit = normalize(sunVec);
      const normUnit = normalize(normVec);
      const eff = Math.max(0, dot(sunUnit, normUnit));

      if (eff >= 0.97 && !missionsCleared[1]) {
        setMissionsCleared(prev => ({ ...prev, 1: true }));
      }

      const upRef = Math.abs(normUnit.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
      const tangentU = normalize(cross(upRef, normUnit, true));
      const tangentV = normalize(cross(normUnit, tangentU, true));
      const s = 1.15;
      const corners = [
        { x: (tangentU.x + tangentV.x) * s, y: (tangentU.y + tangentV.y) * s, z: (tangentU.z + tangentV.z) * s },
        { x: (-tangentU.x + tangentV.x) * s, y: (-tangentU.y + tangentV.y) * s, z: (-tangentU.z + tangentV.z) * s },
        { x: (-tangentU.x - tangentV.x) * s, y: (-tangentU.y - tangentV.y) * s, z: (-tangentU.z - tangentV.z) * s },
        { x: (tangentU.x - tangentV.x) * s, y: (tangentU.y - tangentV.y) * s, z: (tangentU.z - tangentV.z) * s }
      ].map(p => project3D(p, w, h, camYaw, camPitch));

      ctx.save();
      ctx.fillStyle = eff >= 0.97 ? 'rgba(16, 185, 129, 0.45)' : `rgba(56, 189, 248, ${0.15 + eff * 0.45})`;
      ctx.strokeStyle = eff >= 0.97 ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      corners.slice(1).forEach(c => ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawArrow2D(ctx, origin, project3D(sunVec, w, h, camYaw, camPitch), '#f59e0b', 3.5, 'Sun L');
      drawArrow2D(
        ctx,
        origin,
        project3D(normVec, w, h, camYaw, camPitch),
        eff >= 0.97 ? '#10b981' : '#06b6d4',
        3.5,
        'Normal N'
      );
    } else if (currentMission === 2) {
      const halfSpread = (m2Spread / 2) * (Math.PI / 180);
      const tiltRad = m2Tilt * (Math.PI / 180);
      const localA = { x: m2Len * Math.sin(halfSpread), y: 0, z: m2Len * Math.cos(halfSpread) };
      const localB = { x: -m2Len * Math.sin(halfSpread), y: 0, z: m2Len * Math.cos(halfSpread) };

      const rotX = (v: Vec3): Vec3 => ({
        x: v.x,
        y: v.y * Math.cos(tiltRad) - v.z * Math.sin(tiltRad),
        z: v.y * Math.sin(tiltRad) + v.z * Math.cos(tiltRad)
      });

      const rodA = rotX(localA);
      const rodB = rotX(localB);
      const shieldCross = m2WindingCorrect ? cross(rodA, rodB, true) : cross(rodB, rodA, true);
      const shieldArea = norm(shieldCross);
      const shieldNorm = normalize(shieldCross);

      const tRad = m2TargetTilt * (Math.PI / 180);
      const threatUnit = normalize({ x: 0, y: Math.cos(tRad), z: Math.sin(tRad) });
      const threatVec = { x: threatUnit.x * 2.5, y: threatUnit.y * 2.5, z: threatUnit.z * 2.5 };

      const align = dot(shieldNorm, threatUnit);
      const isClear = align >= 0.95 && shieldArea >= 3.2;
      if (isClear && !missionsCleared[2]) {
        setMissionsCleared(prev => ({ ...prev, 2: true }));
      }

      const pA = project3D(rodA, w, h, camYaw, camPitch);
      const pB = project3D(rodB, w, h, camYaw, camPitch);
      const pSum = project3D(
        { x: rodA.x + rodB.x, y: rodA.y + rodB.y, z: rodA.z + rodB.z },
        w,
        h,
        camYaw,
        camPitch
      );

      ctx.save();
      ctx.fillStyle = isClear
        ? 'rgba(16, 185, 129, 0.35)'
        : align < 0
        ? 'rgba(244, 63, 94, 0.25)'
        : 'rgba(168, 85, 247, 0.25)';
      ctx.strokeStyle = isClear ? '#10b981' : '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(pA.x, pA.y);
      ctx.lineTo(pSum.x, pSum.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      drawArrow2D(ctx, origin, pA, '#f59e0b', 3, 'Rod a');
      drawArrow2D(ctx, origin, pB, '#06b6d4', 3, 'Rod b');
      drawArrow2D(ctx, origin, project3D(threatVec, w, h, camYaw, camPitch), '#f43f5e', 3, 'Meteor T');
      drawArrow2D(
        ctx,
        origin,
        project3D({ x: shieldCross.x * 0.6, y: shieldCross.y * 0.6, z: shieldCross.z * 0.6 }, w, h, camYaw, camPitch),
        isClear ? '#10b981' : '#a855f7',
        3.5,
        m2WindingCorrect ? 'N = a × b' : 'N = b × a'
      );
    } else if (currentMission === 3) {
      const octVerts: Vec3[] = [
        { x: 0, y: 2.1, z: 0 },
        { x: 0, y: -2.1, z: 0 },
        { x: 2.1, y: 0, z: 0 },
        { x: 0, y: 0, z: 2.1 },
        { x: -2.1, y: 0, z: 0 },
        { x: 0, y: 0, z: -2.1 }
      ];
      const octFaces: [number, number, number][] = [
        [0, 3, 2], [0, 4, 3], [0, 5, 4], [0, 2, 5],
        [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]
      ];
      const viewVec = normalize({
        x: -Math.cos(camPitch) * Math.sin(camYaw),
        y: Math.sin(camPitch),
        z: Math.cos(camPitch) * Math.cos(camYaw)
      });

      const projVerts = octVerts.map(v => project3D(v, w, h, camYaw, camPitch, 84));
      const faceRecords = octFaces.map((f, idx) => {
        const v0 = octVerts[f[0]], v1 = octVerts[f[1]], v2 = octVerts[f[2]];
        const e1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const e2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
        const n = normalize(cross(e1, e2, true));
        const ndotv = dot(n, viewVec);
        const center = {
          x: (v0.x + v1.x + v2.x) / 3,
          y: (v0.y + v1.y + v2.y) / 3,
          z: (v0.z + v1.z + v2.z) / 3
        };
        const pCenter = project3D(center, w, h, camYaw, camPitch, 84);
        return {
          idx,
          n,
          ndotv,
          isFront: ndotv > 0.02,
          center,
          depth: pCenter.depth,
          poly2D: [projVerts[f[0]], projVerts[f[1]], projVerts[f[2]]]
        };
      });

      faceRecords.sort((a, b) => a.depth - b.depth);
      m3CachedPolysRef.current = faceRecords;

      const frontFaces = faceRecords.filter(r => r.isFront);
      const lockedFrontCount = frontFaces.filter(r => m3SelectedFaces.includes(r.idx)).length;
      if (frontFaces.length > 0 && lockedFrontCount === frontFaces.length && !missionsCleared[3]) {
        setMissionsCleared(prev => ({ ...prev, 3: true }));
      }

      faceRecords.forEach(rec => {
        const [p0, p1, p2] = rec.poly2D;
        const isPicked = m3SelectedFaces.includes(rec.idx);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.closePath();

        if (isPicked) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
        } else if (rec.isFront) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.6;
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.1)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1;
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const cProj = project3D(rec.center, w, h, camYaw, camPitch, 84);
        const tip = {
          x: rec.center.x + rec.n.x * 0.45,
          y: rec.center.y + rec.n.y * 0.45,
          z: rec.center.z + rec.n.z * 0.45
        };
        const tipProj = project3D(tip, w, h, camYaw, camPitch, 84);
        drawArrow2D(ctx, cProj, tipProj, rec.isFront ? '#10b981' : '#f43f5e', 1.6, `#${rec.idx}`);
      });
    }
  }, [
    activeTab,
    currentMission,
    m1Target,
    m1User,
    m2TargetTilt,
    m2Spread,
    m2Len,
    m2Tilt,
    m2WindingCorrect,
    m3SelectedFaces,
    camYaw,
    camPitch,
    missionsCleared
  ]);

  const dVal = dot(vecA, vecB);
  const lenA = norm(vecA);
  const lenB = norm(vecB);
  const cosTheta = lenA > 1e-5 && lenB > 1e-5 ? Math.max(-1, Math.min(1, dVal / (lenA * lenB))) : 0;
  const thetaDeg = Math.acos(cosTheta) * (180 / Math.PI);
  const lambert = Math.max(0, cosTheta);
  const crossVec = isSwappedCross ? cross(vecB, vecA) : cross(vecA, vecB);
  const areaVal = norm(crossVec);

  const m1Eff = Math.max(
    0,
    dot(
      normalize(sphericalToVec(m1Target.yaw, m1Target.pitch, 1)),
      normalize(sphericalToVec(m1User.yaw, m1User.pitch, 1))
    )
  );
  const m2ShieldArea = m2Len * m2Len * Math.sin(m2Spread * (Math.PI / 180));
  const m2Align =
    (m2WindingCorrect ? 1 : -1) * Math.cos((m2Tilt - m2TargetTilt) * (Math.PI / 180));

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
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

  const pointInTriangle2D = (
    px: number,
    py: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    const area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    if (Math.abs(area) < 1e-5) return false;
    const s =
      (1 / (2 * area)) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * px + (p0.x - p2.x) * py);
    const t =
      (1 / (2 * area)) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * px + (p1.x - p0.x) * py);
    return s >= 0 && t >= 0 && s + t <= 1;
  };

  const handleGameMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const moved = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
    isDraggingRef.current = false;
    if (currentMission !== 3 || moved >= 5) return;

    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const polys = m3CachedPolysRef.current;
    for (let i = polys.length - 1; i >= 0; i--) {
      const rec = polys[i];
      const [p0, p1, p2] = rec.poly2D;
      if (pointInTriangle2D(mx, my, p0, p1, p2)) {
        if (rec.isFront) {
          if (!m3SelectedFaces.includes(rec.idx)) {
            setM3SelectedFaces(prev => [...prev, rec.idx]);
          }
          setM3Feedback(
            isZh
              ? `✅ 命中正面 #${rec.idx}！N · V = +${rec.ndotv.toFixed(2)} > 0，保留渲染！`
              : `✅ Hit Front Face #${rec.idx}! N · V = +${rec.ndotv.toFixed(2)} > 0 (Kept)!`
          );
          return;
        } else {
          setM3Feedback(
            isZh
              ? `❌ 晶面 #${rec.idx} 是背面 (N · V = ${rec.ndotv.toFixed(2)} ≤ 0)，应被背面剔除！`
              : `❌ Facet #${rec.idx} is Back-Facing (N · V = ${rec.ndotv.toFixed(2)} ≤ 0), culled!`
          );
        }
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const clearedCount = Object.values(missionsCleared).filter(Boolean).length;

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp}>
      {/* Lesson Header Bar */}
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
              <span>Stage 1 · Lesson 01</span>
              <span>•</span>
              <span>UC Davis Lec 01 + MIT 6.837 Lec 01 + 3Blue1Brown Intuition</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isZh
                ? 'L01: 图形学全景与 3D 向量几何直觉 (Vectors, Handedness & The 4 Pillars of CG)'
                : 'L01: Computer Graphics Panorama & 3D Vector Geometry Intuition'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isZh
                ? '从 3Blue1Brown 的“线性变换与对偶性 (Duality)”视角，彻底搞懂为什么点积的坐标相乘等于投影、为什么叉积的行列式必然生成垂直法向量！'
                : 'Understand WHY coordinate multiplication equals geometric projection and WHY the cross-product determinant yields a perpendicular normal via 3Blue1Brown Duality!'}
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
                : '✓ Lesson 01 Completed'
              : isZh
              ? '打卡完成 Lesson 01'
              : 'Mark Lesson 01 Complete'}
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800">
          {[
            {
              id: 'deep',
              label: isZh
                ? '1. 🧠 深度几何原理与推导 (3Blue1Brown 视角)'
                : '1. 🧠 Deep Intuition & Proofs (3B1B Style)'
            },
            { id: 'lab1', label: isZh ? '2. 🔬 3D 向量点积/叉积实验室' : '2. 🔬 3D Vector, Dot & Cross Lab' },
            { id: 'lab2', label: isZh ? '3. 🏛️ 图形学四大支柱 3D 管线' : '3. 🏛️ The 4 Pillars of CG Pipeline' },
            { id: 'videos', label: isZh ? '4. 🎥 嵌入课程视频与精要' : '4. 🎥 Lecture Videos & Notes' },
            {
              id: 'game',
              label: isZh
                ? `5. 🎮 终极互动小游戏 (${clearedCount}/3 通关)`
                : `5. 🎮 Vector Mini-Game (${clearedCount}/3 Cleared)`
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

      {/* TAB 0: 3BLUE1BROWN DEEP INTUITION & DERIVATIONS */}
      {activeTab === 'deep' && (
        <div className="space-y-6">
          {/* Part 1: Coordinate-Free vs Basis */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '1. 为什么说“自然界没有坐标轴”？点 (Point)、向量 (Vector) 与基向量的真相'
                : '1. Why "Nature Has No Axes": Points, Vectors, and Basis Vectors'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 text-sm">
                  {isZh ? '① 点 vs 向量：位置与纯粹位移' : '① Point vs. Vector: Position vs. Displacement'}
                </div>
                <p>
                  {isZh
                    ? '三维空间里本来只有点（位置）和向量（有向位移箭头）。向量没有固定起点——在空间任意平移只要方向和长度不变就是同一个向量！因此：两点相减 (Q - P = v) 得到位移向量；点加向量 (P + v = Q) 移动到新点；而两点直接相加 (P + Q) 没有几何意义！'
                    : 'Points represent locations; Vectors represent displacements with no fixed origin. Subtracting two points (Q - P = v) gives a displacement vector; adding a vector to a point (P + v = Q) moves to a new point; adding two points (P + Q) is undefined!'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400 text-sm">
                  {isZh ? '② 坐标 (x, y, z) 是缩放基向量的配方' : '② Coordinates Are a Recipe for Scaling Basis Vectors'}
                </div>
                <p>
                  {isZh
                    ? '按 3Blue1Brown 的视角，写下 v = (2, 3, -1) 其实是对三个单位基向量 î, ĵ, k̂ 的线性缩放与拼接指令：v = 2·î + 3·ĵ + (-1)·k̂。坐标系只是我们为了把几何箭头翻译成数字而选定的一套基向量标架！'
                    : 'Writing v = (2, 3, -1) is a recipe for scaling and adding three unit basis vectors: v = 2·î + 3·ĵ + (-1)·k̂.'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400 text-sm">
                  {isZh ? '③ 线性性 (Linearity) 的威力' : '③ The Power of Linearity'}
                </div>
                <p>
                  {isZh
                    ? '因为任何线性变换都满足 L(x·î + y·ĵ + z·k̂) = x·L(î) + y·L(ĵ) + z·L(k̂)，只要知道三个基向量 î, ĵ, k̂ 变换后落在了哪里，空间中任意向量变换后的结果就等于“坐标乘以基向量落点再相加”！'
                    : 'By linearity, L(x·î + y·ĵ + z·k̂) = x·L(î) + y·L(ĵ) + z·L(k̂). Knowing where î, ĵ, k̂ land tells us where every vector lands!'}
                </p>
              </div>
            </div>
          </div>

          {/* Part 2: Dot Product Duality */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isZh
                  ? '2. 点积的灵魂拷问：为什么“对应坐标相乘再相加 (uₓvₓ + uᵧvᵧ + u_zv_z)”恰好等于“几何投影 ||u||||v||cos(θ)”？'
                  : '2. Dot Product Deep Dive: Why Does "uₓvₓ + uᵧvᵧ + u_zv_z" Equal Geometric Projection "||u||||v||cos(θ)"?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-sm font-bold text-indigo-300">
                  {isZh
                    ? '🔬 3Blue1Brown 对偶性交互演示：把二维空间线性挤压到一维数轴'
                    : '🔬 3Blue1Brown Duality Explorer: Squishing 2D Space onto a 1D Line'}
                </div>
                <div className="relative w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900" style={{ height: 310 }}>
                  <canvas ref={dualityCanvasRef} className="w-full h-full" />
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-amber-300">
                      <span>{isZh ? '✨ 拖动体验空间向一维数轴投影坍缩 (Squish t):' : '✨ Drag to Squish 2D Space onto 1D Line:'}</span>
                      <span className="font-mono">{Math.round(squish * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={squish}
                      onChange={e => setSquish(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400">{isZh ? '数轴倾角 (û Angle)' : '1D Line Angle'}</span>
                      <input
                        type="range"
                        min="-75"
                        max="75"
                        value={uAngle}
                        onChange={e => setUAngle(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">{isZh ? '旋转测试向量 v' : 'Rotate Vector v'}</span>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={vAngle}
                        onChange={e => setVAngle(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white text-sm">
                    {isZh ? '第一层：几何投影与对称性 (为什么 u · v = v · u)' : 'Layer 1: Geometric Projection & Symmetry'}
                  </div>
                  <p>
                    {isZh
                      ? '当 ||u|| = ||v|| 时，两个等长向量关于它们的角平分线完全镜像对称，把 v 投到 u 上的长度与把 u 投到 v 上的长度必然相等！如果把其中一个向量 u 拉长 k 倍，投影本身不变但乘数放大了 k 倍，两边依然严格相等。'
                      : 'When ||u|| = ||v||, the vectors are mirror-symmetric across their bisector, so projecting v onto u equals projecting u onto v. Scaling u by k scales both sides equally!'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 text-sm">
                    {isZh
                      ? '第二层（3Blue1Brown 灵魂洞见）：对偶性 (Duality) —— 为什么坐标相乘等于投影？'
                      : 'Layer 2 (3Blue1Brown Duality): Why Coordinate Multiplication Equals Projection'}
                  </div>
                  <p>
                    {isZh
                      ? '请拖动左侧滑块把 2D 网格挤压到单位向量 û = (uₓ, uᵧ) 的数轴上！因为投影是线性的，任意向量 v = vₓî + vᵧĵ 在数轴上的落点 T(v) = vₓT(î) + vᵧT(ĵ)。而根据对称性，X 轴单位向量 î=(1,0) 在 û 数轴上的投影刻度 T(î)，完全等于把 û 投影回 X 轴的坐标——也就是 uₓ！同理 T(ĵ) = uᵧ。所以 T(v) = uₓvₓ + uᵧvᵧ！原来“坐标相乘再相加”就是在执行向一维数轴的线性投影变换！'
                      : 'Drag the Squish slider on the left! By linearity, projecting v = vₓî + vᵧĵ onto the û line gives T(v) = vₓT(î) + vᵧT(ĵ). By symmetry, where î=(1,0) lands on the û line is identical to projecting û onto the X-axis—which is literally uₓ! Similarly T(ĵ) = uᵧ. Thus T(v) = uₓvₓ + uᵧvᵧ!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Part 3: Cross Product Volume Duality */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '3. 叉积的终极解密：为什么 3×3 行列式 (aᵧb_z - a_zbᵧ, ...) 一定垂直于 a 和 b，且长度恰好是平行四边形面积？'
                : '3. Cross Product Deep Dive: Why Must the Determinant Formula Be Perpendicular to a & b with Length Equal to Area?'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-400 text-sm">
                    {isZh
                      ? '3Blue1Brown 皇冠证明：三维平行六面体体积 V(x) = det([x, a, b]) = (a × b) · x'
                      : '3Blue1Brown Proof: 3D Parallelepiped Volume V(x) = det([x, a, b]) = (a × b) · x'}
                  </div>
                  <p>
                    {isZh
                      ? '固定底面向量 a 和 b，引入可变探针向量 x = (x, y, z)，计算它们张成的三维平行六面体有向体积 V(x) = det([x, a, b])：① 按第一列代数展开行列式：V(x) = x(aᵧb_z - a_zbᵧ) + y(a_zbₓ - aₓb_z) + z(aₓbᵧ - aᵧbₓ) = p · x。② 从立体几何看：斜棱柱体积 = 底面积 Area × 探针 x 在底面单位法线 n̂ 上的投影高度 (n̂ · x) = (Area · n̂) · x。③ 既然对任意向量 x 都有 p · x = (Area · n̂) · x，那么那个由行列式算出来的向量 p 必然垂直于底面 a, b，且模长必然等于底面平行四边形面积 Area！'
                      : 'Fix base vectors a and b, and let probe vector x=(x,y,z) vary. The signed volume V(x) = det([x, a, b]) expands algebraically to p · x where p = (aᵧb_z - a_zbᵧ, ...). Geometrically, Volume = BaseArea × Height = BaseArea × (n̂ · x) = (BaseArea · n̂) · x. Since p · x = (BaseArea · n̂) · x for ALL x, vector p MUST equal BaseArea · n̂!'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-cyan-400 text-sm">
                    {isZh
                      ? '为什么叉积的 X 分量 (aᵧb_z - a_zbᵧ) 偏偏不含 X？'
                      : 'Why Does the X-Component (aᵧb_z - a_zbᵧ) Exclude X?'}
                  </div>
                  <p>
                    {isZh
                      ? '因为 aᵧb_z - a_zbᵧ 正好是三维平行四边形投影到 YZ 墙面（垂直于 X 轴）上的 2D 阴影面积！一个平面越是正对着 X 轴（法向量 X 分量越大），它在 YZ 墙面上的投影面积就越大！'
                      : 'Because aᵧb_z - a_zbᵧ is the 2D signed shadow area projected onto the YZ wall (perpendicular to X)!'}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-sm font-bold text-purple-300">
                  {isZh
                    ? '🔬 3D 平行六面体体积探针：水平切变 (Shear) 不改变体积！'
                    : '🔬 3D Parallelepiped Volume Probe: Horizontal Shear Preserves Volume!'}
                </div>
                <div
                  className="relative w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
                  style={{ height: 310 }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                >
                  <canvas ref={volumeCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">{isZh ? '探针垂直高度 h (沿 a×b)' : 'Orthogonal Height h'}</span>
                    <input
                      type="range"
                      min="-1.8"
                      max="2.0"
                      step="0.1"
                      value={probeHeight}
                      onChange={e => setProbeHeight(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">{isZh ? '水平切变 (Shear, 不改体积!)' : 'Horizontal Shear'}</span>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.1"
                      value={probeShear}
                      onChange={e => setProbeShear(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: VECTOR SANDBOX */}
      {activeTab === 'lab1' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  {isZh
                    ? '交互式 3D 向量几何沙盒 (按住鼠标拖拽旋转相机)'
                    : 'Interactive 3D Vector Sandbox (Drag mouse to orbit camera)'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isZh
                    ? '琥珀色: 向量 a ｜ 青色: 向量 b ｜ 紫色: 叉积 a × b ｜ 黄色虚线: 点积投影 proj_b(a)'
                    : 'Amber: Vector a ｜ Cyan: Vector b ｜ Purple: Cross a × b ｜ Dashed: Projection proj_b(a)'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRightHanded(!isRightHanded)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {isRightHanded
                    ? isZh
                      ? '右手系 (OpenGL / Three.js)'
                      : 'Right-Handed (OpenGL / Three.js)'
                    : isZh
                    ? '左手系 (DirectX / Unity)'
                    : 'Left-Handed (DirectX / Unity)'}
                </button>
                <button
                  onClick={() => setIsSwappedCross(!isSwappedCross)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isSwappedCross
                    ? isZh
                      ? '当前: b × a = -(a × b)'
                      : 'Order: b × a = -(a × b)'
                    : isZh
                    ? '当前: a × b (点击翻转顺序)'
                    : 'Order: a × b (Click to flip)'}
                </button>
              </div>
            </div>

            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 430 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={vectorCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 self-center mr-1">{isZh ? '预设:' : 'Presets:'}</span>
                  <button
                    onClick={() => {
                      setVecA({ x: 1.5, y: 2.0, z: 0.8 });
                      setVecB({ x: 2.2, y: 0.5, z: 1.5 });
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    {isZh ? '正面受光 (θ < 90°)' : 'Front-Lit (θ < 90°)'}
                  </button>
                  <button
                    onClick={() => {
                      setVecA({ x: 2.2, y: 0, z: 0 });
                      setVecB({ x: 0, y: 2.2, z: 0 });
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    {isZh ? '正交基 (θ = 90°)' : 'Orthonormal (θ = 90°)'}
                  </button>
                  <button
                    onClick={() => {
                      setVecA({ x: -1.8, y: -1.2, z: -0.9 });
                      setVecB({ x: 1.8, y: 1.0, z: 1.2 });
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    {isZh ? '背面剔除 (θ > 90°)' : 'Back-Face (θ > 90°)'}
                  </button>
                </div>

                <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs flex gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showParallelogram}
                      onChange={e => setShowParallelogram(e.target.checked)}
                    />
                    <span>{isZh ? '显示叉积面积' : 'Show Cross Area'}</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProjection}
                      onChange={e => setShowProjection(e.target.checked)}
                    />
                    <span>{isZh ? '显示点积投影' : 'Show Dot Projection'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                {isZh ? '实时调整 3D 向量坐标' : 'Adjust 3D Vector Coordinates'}
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-400">
                    {isZh ? '向量 a (例如光线方向 L)' : 'Vector a (e.g., Light Direction L)'}
                  </span>
                  <span className="font-mono text-slate-300">
                    ({vecA.x.toFixed(1)}, {vecA.y.toFixed(1)}, {vecA.z.toFixed(1)})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['x', 'y', 'z'] as const).map(axis => (
                    <div key={axis}>
                      <label className="text-slate-400 block mb-0.5">a_{axis}</label>
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="0.1"
                        value={vecA[axis]}
                        onChange={e => setVecA({ ...vecA, [axis]: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-cyan-400">
                    {isZh ? '向量 b (例如表面法线 N)' : 'Vector b (e.g., Surface Normal N)'}
                  </span>
                  <span className="font-mono text-slate-300">
                    ({vecB.x.toFixed(1)}, {vecB.y.toFixed(1)}, {vecB.z.toFixed(1)})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['x', 'y', 'z'] as const).map(axis => (
                    <div key={axis}>
                      <label className="text-slate-400 block mb-0.5">b_{axis}</label>
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="0.1"
                        value={vecB[axis]}
                        onChange={e => setVecB({ ...vecB, [axis]: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  {isZh ? '点积 (Dot Product): 夹角与投影' : 'Dot Product: Angle & Projection'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-amber-400">
                  {Math.abs(dVal) < 0.05
                    ? isZh
                      ? '正交垂直 (90°)'
                      : 'Orthogonal (90°)'
                    : dVal > 0
                    ? isZh
                      ? '同向锐角 (受光)'
                      : 'Acute (Front-Lit)'
                    : isZh
                    ? '反向钝角 (背光)'
                    : 'Obtuse (Back-Facing)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? '点积 a · b' : 'Dot (a · b)'}</div>
                  <div className="text-lg font-bold font-mono text-white">{dVal.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? '空间夹角 θ' : 'Angle θ'}</div>
                  <div className="text-lg font-bold font-mono text-white">{thetaDeg.toFixed(1)}°</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{isZh ? 'Lambert 系数' : 'Lambert Factor'}</div>
                  <div className="text-lg font-bold font-mono text-amber-400">{lambert.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  {isZh ? '叉积 (Cross Product): 法向量与面积' : 'Cross Product: Normal & Area'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-purple-400">
                  ({crossVec.x.toFixed(1)}, {crossVec.y.toFixed(1)}, {crossVec.z.toFixed(1)})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">
                    {isZh ? '平行四边形面积 ||a × b||' : 'Parallelogram Area ||a × b||'}
                  </div>
                  <div className="text-lg font-bold font-mono text-white">{areaVal.toFixed(2)}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">
                    {isZh ? '三角形面积 ½||a × b||' : 'Triangle Area ½||a × b||'}
                  </div>
                  <div className="text-lg font-bold font-mono text-purple-400">{(areaVal * 0.5).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 4 PILLARS OF CG */}
      {activeTab === 'lab2' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  {isZh
                    ? '图形学四大支柱实时沙盒 (The 4 Pillars of CG)'
                    : 'The 4 Pillars of Computer Graphics Live Sandbox'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isZh
                    ? '用 Lab 1 的叉积求面法线 N，用点积求每个三角形的漫反射明暗'
                    : 'Cross product computes face normal N; dot product computes diffuse lighting'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveShape('icosahedron')}
                  className={`px-3 py-1.5 text-xs rounded-lg ${
                    activeShape === 'icosahedron' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isZh ? '二十面体 (Icosahedron)' : 'Icosahedron'}
                </button>
                <button
                  onClick={() => setActiveShape('torus')}
                  className={`px-3 py-1.5 text-xs rounded-lg ${
                    activeShape === 'torus' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isZh ? '圆环面 (Torus)' : 'Torus'}
                </button>
              </div>
            </div>

            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
              style={{ height: 410 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <canvas ref={pillarsCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">
              {isZh ? '点击切换图形学核心模块：' : 'Switch Core Computer Graphics Pillars:'}
            </h3>
            {[
              {
                id: 1 as const,
                title: isZh ? '1. Modeling (几何建模)' : '1. Modeling (Geometry Representation)',
                desc: isZh
                  ? '用离散顶点与拓扑三角形网格表示 3D 形状（Stage 2 核心）。'
                  : 'Represent 3D shapes via discrete vertices and triangle mesh topology (Stage 2).'
              },
              {
                id: 2 as const,
                title: isZh ? '2. Rendering (光线与着色)' : '2. Rendering (Light & Shading)',
                desc: isZh
                  ? '用叉积 (P₁-P₀)×(P₂-P₀) 计算每个三角面的法针，再用点积 max(0, N·L) 决定明暗（Stage 3 & 4 核心）。'
                  : 'Compute face normals via Cross Product (P₁-P₀)×(P₂-P₀) and shade via Dot Product max(0, N·L).'
              },
              {
                id: 3 as const,
                title: isZh ? '3. Animation & Simulation (动画与仿真)' : '3. Animation & Simulation',
                desc: isZh
                  ? '让顶点位置随时间函数或微分方程发生形变，每帧动态重算法线（Stage 5 核心）。'
                  : 'Deform vertices over time via wave functions or ODEs, recomputing normals every frame.'
              }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActivePillar(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition ${
                  activePillar === item.id
                    ? 'border-indigo-500 bg-indigo-950/40'
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                }`}
              >
                <div className="font-semibold text-sm text-white">{item.title}</div>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </button>
            ))}

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {isZh ? '平行光水平方位角 (Light Azimuth)' : 'Light Azimuth Angle'}
                </span>
                <span className="font-mono text-white">{lightAzimuth}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={lightAzimuth}
                onChange={e => setLightAzimuth(parseFloat(e.target.value))}
                className="w-full"
              />
              <label className="inline-flex items-center gap-2 cursor-pointer pt-1 text-slate-300">
                <input
                  type="checkbox"
                  checked={showNormals}
                  onChange={e => setShowNormals(e.target.checked)}
                />
                <span>
                  {isZh
                    ? '绘制每个三角面的叉积法线针 (Red Normal Needles)'
                    : 'Draw Cross-Product Face Normal Needles'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMBEDDED COURSE VIDEOS */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                MIT 6.837 · Fall 2021 · Lecture 01
              </span>
              <a
                href="https://www.youtube.com/watch?v=tPzC879i-ag&list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline"
              >
                {isZh ? '在 YouTube 打开完整播放列表 ↗' : 'Open Full Playlist on YouTube ↗'}
              </a>
            </div>
            <h3 className="text-lg font-bold text-white">
              MIT 6.837 Lecture 1: Introduction to Computer Graphics (Prof. Justin Solomon)
            </h3>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/tPzC879i-ag"
                title="MIT 6.837 Lecture 1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                UC Davis ECS 175 · Fall 2009 · Lecture 01
              </span>
              <a
                href="https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+1+Kenneth+Joy"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 hover:underline"
              >
                {isZh ? '在 YouTube 搜索/观看本讲 ↗' : 'Watch on YouTube ↗'}
              </a>
            </div>
            <h3 className="text-lg font-bold text-white">
              UC Davis Lecture 1: Introduction to Computer Graphics (Prof. Kenneth Joy)
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                {isZh
                  ? '1. Coordinate-Free Thinking (无坐标几何直觉)：在写下 (x, y, z) 之前，先在脑海中想象空间中的点、向量、平面与光线。'
                  : '1. Coordinate-Free Thinking: Visualize points, vectors, planes, and rays geometrically before introducing (x, y, z) coordinates.'}
              </p>
              <p>
                {isZh
                  ? '2. Modeling → Viewing → Clipping → Scan Conversion：从三维几何模型出发，经过相机变换与裁剪，最终离散化为帧缓冲中的 RGB 像素。'
                  : '2. Modeling → Viewing → Clipping → Scan Conversion: The classical pipeline from 3D geometry to 2D frame buffer pixels.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PLAYABLE 3D VECTOR MINI-GAME */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                  {isZh ? '🎮 Play to Learn · 互动通关小游戏' : '🎮 Play to Learn · Interactive Mini-Game'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-emerald-400">
                  {isZh ? `已通关: ${clearedCount} / 3` : `Cleared: ${clearedCount} / 3`}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {isZh
                  ? '星际能量护盾与激光校准特训 (Starshield & Vector Defense)'
                  : 'Starshield & Vector Defense (3 Missions)'}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 1 as const, label: isZh ? '关卡 1: 点积太阳能聚能' : 'Mission 1: Solar Dot Alignment' },
                { id: 2 as const, label: isZh ? '关卡 2: 叉积等离子护盾' : 'Mission 2: Cross-Product Shield' },
                { id: 3 as const, label: isZh ? '关卡 3: 背面剔除点击赛' : 'Mission 3: Back-Face Culling Radar' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setCurrentMission(m.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    currentMission === m.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {missionsCleared[m.id] ? '✓ ' : ''}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div
                className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950"
                style={{ height: 410 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
              >
                <canvas
                  ref={gameCanvasRef}
                  onMouseUp={handleGameMouseUp}
                  className="w-full h-full cursor-pointer"
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {currentMission === 1 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="text-sm font-bold text-white">
                    {isZh
                      ? '🌞 任务 1：调节卫星帆板法向量 N 对准太阳光 L'
                      : '🌞 Mission 1: Align Solar Panel Normal N with Sun Ray L'}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isZh
                      ? '调节下方两个滑块，使青色法向量 N 与金色太阳光 L 同向重合（点积效率 ≥ 97% 即可通关）！'
                      : 'Rotate the panel normal N until it aligns with the golden Sun vector L (reach ≥ 97% efficiency)!'}
                  </p>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{isZh ? '帆板水平偏航角 (Yaw)' : 'Normal Yaw'}</span>
                        <span className="font-mono">{m1User.yaw}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={m1User.yaw}
                        onChange={e => setM1User({ ...m1User, yaw: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>{isZh ? '帆板俯仰倾角 (Pitch)' : 'Normal Pitch'}</span>
                        <span className="font-mono">{m1User.pitch}°</span>
                      </div>
                      <input
                        type="range"
                        min="-85"
                        max="85"
                        value={m1User.pitch}
                        onChange={e => setM1User({ ...m1User, pitch: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{isZh ? '当前点积充能效率:' : 'Dot Product Efficiency:'}</span>
                      <span className="font-mono text-emerald-400">{(m1Eff * 100).toFixed(1)}%</span>
                    </div>
                    <button
                      onClick={() =>
                        setM1Target({
                          yaw: Math.round(Math.random() * 240 - 120),
                          pitch: Math.round(Math.random() * 110 - 45)
                        })
                      }
                      className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      {isZh ? '🎲 随机新太阳光方向' : '🎲 Randomize Sun Direction'}
                    </button>
                  </div>
                </div>
              )}

              {currentMission === 2 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                  <div className="text-sm font-bold text-white">
                    {isZh
                      ? '🛡️ 任务 2：用叉积 a × b 构建等离子护盾拦截陨石'
                      : '🛡️ Mission 2: Build a Cross-Product Plasma Shield'}
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between">
                        <span>{isZh ? '发生杆张角' : 'Spread Angle'}</span>
                        <span className="font-mono">{m2Spread}°</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="165"
                        value={m2Spread}
                        onChange={e => setM2Spread(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>{isZh ? '发生杆长度' : 'Rod Length'}</span>
                        <span className="font-mono">{m2Len.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="2.4"
                        step="0.05"
                        value={m2Len}
                        onChange={e => setM2Len(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>{isZh ? '护盾平面俯仰角' : 'Plane Pitch Tilt'}</span>
                        <span className="font-mono">{m2Tilt}°</span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="80"
                        value={m2Tilt}
                        onChange={e => setM2Tilt(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <button
                      onClick={() => setM2WindingCorrect(!m2WindingCorrect)}
                      className="w-full py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      {m2WindingCorrect
                        ? isZh
                          ? '🔄 当前环绕: a × b (正面朝外)'
                          : '🔄 Winding: a × b (Front)'
                        : isZh
                        ? '⚠️ 当前环绕: b × a (朝反了！点击切换 a × b)'
                        : '⚠️ Winding: b × a (Inverted! Click to flip)'}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between">
                      <span>{isZh ? '法线对准度 N̂ · T̂ (需 ≥ 0.95):' : 'Alignment N̂ · T̂ (≥ 0.95):'}</span>
                      <span className="font-mono font-bold">{m2Align.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{isZh ? '护盾面积 ||a × b|| (需 ≥ 3.20):' : 'Shield Area ||a × b|| (≥ 3.20):'}</span>
                      <span className="font-mono font-bold">{m2ShieldArea.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setM2TargetTilt(Math.round(Math.random() * 100 - 50))}
                      className="w-full py-1.5 mt-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      {isZh ? '🎲 随机新陨石来袭倾角' : '🎲 Randomize Meteor Angle'}
                    </button>
                  </div>
                </div>
              )}

              {currentMission === 3 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                  <div className="text-sm font-bold text-white">
                    {isZh
                      ? '🎯 任务 3：点击 3D 画布中所有正面三角形！'
                      : '🎯 Mission 3: Click All Front-Facing Triangles!'}
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {isZh
                      ? '直接点击左侧 3D 画布上绿色法线朝向相机的正面晶面（N · V > 0），避开红色虚线背面！'
                      : 'Click directly on the 3D canvas facets whose green normal needles point toward the camera (N · V > 0)!'}
                  </p>
                  {m3Feedback && (
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                      {m3Feedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
