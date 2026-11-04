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
  const [activeTab, setActiveTab] = useState<'lab1' | 'lab2' | 'videos' | 'quiz'>('lab1');
  const [isRightHanded, setIsRightHanded] = useState(true);
  const [isSwappedCross, setIsSwappedCross] = useState(false);
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [showProjection, setShowProjection] = useState(true);

  const [vecA, setVecA] = useState<Vec3>({ x: 1.5, y: 2.0, z: 0.8 });
  const [vecB, setVecB] = useState<Vec3>({ x: 2.2, y: 0.5, z: 1.5 });

  const [camYaw, setCamYaw] = useState(-0.65);
  const [camPitch, setCamPitch] = useState(0.45);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const [activePillar, setActivePillar] = useState<1 | 2 | 3>(2);
  const [activeShape, setActiveShape] = useState<'icosahedron' | 'torus'>('icosahedron');
  const [lightAzimuth, setLightAzimuth] = useState(45);
  const [showNormals, setShowNormals] = useState(true);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  const vectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pillarsCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const dVal = dot(vecA, vecB);
  const lenA = norm(vecA);
  const lenB = norm(vecB);
  const cosTheta = lenA > 1e-5 && lenB > 1e-5 ? Math.max(-1, Math.min(1, dVal / (lenA * lenB))) : 0;
  const thetaDeg = Math.acos(cosTheta) * (180 / Math.PI);
  const lambert = Math.max(0, cosTheta);
  const crossVec = isSwappedCross ? cross(vecB, vecA) : cross(vecA, vecB);
  const areaVal = norm(crossVec);

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
              <span>UC Davis Lec 01 + MIT 6.837 Lec 01</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isZh
                ? 'L01: 图形学全景与 3D 向量几何直觉 (Vectors, Handedness & The 4 Pillars of CG)'
                : 'L01: Computer Graphics Panorama & 3D Vector Geometry Intuition'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isZh
                ? '通过拖拽 3D 向量亲手探索点积（投影/漫反射）与叉积（法向量/有向面积），并连接两门名校公开课的第一讲。'
                : 'Drag 3D vectors to explore Dot Product (projection & diffuse lighting) and Cross Product (surface normals & signed area).'}
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
            { id: 'lab1', label: isZh ? '1. 3D 向量与点积/叉积实验室' : '1. 3D Vector, Dot & Cross Lab' },
            { id: 'lab2', label: isZh ? '2. 图形学四大支柱 3D 管线' : '2. The 4 Pillars of CG Pipeline' },
            { id: 'videos', label: isZh ? '3. 嵌入课程视频与导读 (MIT + UC Davis)' : '3. Embedded Lecture Videos & Notes' },
            { id: 'quiz', label: isZh ? '4. 直觉闯关测验 (Quiz)' : '4. Intuition Quiz' }
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
            <p className="text-xs text-slate-400 leading-relaxed">
              {isZh
                ? '重点看点：图形学与计算机视觉的对偶性（3D → 2D vs 2D → 3D）、课程四大板块拆解（Geometry, Animation, Rendering, Imaging）以及为什么线性代数是图形学的通用语言。'
                : 'Key Takeaways: Duality between Graphics (3D → 2D) and Vision (2D → 3D), the 4 core pillars of the syllabus, and why Linear Algebra powers real-time rendering.'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
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
                <div className="font-semibold text-amber-400 text-sm">
                  {isZh ? 'Kenneth Joy 教授第一讲核心直觉笔记：' : 'Prof. Kenneth Joy Lecture 1 Key Intuition:'}
                </div>
                <p>
                  {isZh
                    ? '1. Coordinate-Free Thinking (无坐标几何直觉)：在写下 (x, y, z) 之前，先在脑海中想象空间中的点、向量、平面与光线。坐标只是选定参考标架（Frame）后的读数。'
                    : '1. Coordinate-Free Thinking: Visualize points, vectors, planes, and rays geometrically before introducing (x, y, z) coordinates.'}
                </p>
                <p>
                  {isZh
                    ? '2. Modeling → Viewing → Clipping → Scan Conversion：从三维几何模型出发，经过相机变换与裁剪，最终离散化为帧缓冲（Frame Buffer）中的 RGB 像素。'
                    : '2. Modeling → Viewing → Clipping → Scan Conversion: The classical pipeline from 3D geometry to 2D frame buffer pixels.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUIZ */}
      {activeTab === 'quiz' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-white">
            {isZh ? 'Lesson 01 直觉闯关测验' : 'Lesson 01 Intuition Quiz'}
          </h2>
          {[
            {
              q: isZh
                ? 'Q1. 在右手坐标系中，如果三角形边向量 e₁ 指向 +X，边向量 e₂ 指向 +Y，那么叉积 e₁ × e₂ 生成的面法线 N 指向哪里？'
                : 'Q1. In a Right-Handed system, if edge e₁ points along +X and edge e₂ points along +Y, where does the normal N = e₁ × e₂ point?',
              options: [
                { id: 'A', text: isZh ? 'A. 指向屏幕外侧 (+Z，朝向观察者)' : 'A. Out of the screen (+Z, towards viewer)', correct: true },
                { id: 'B', text: isZh ? 'B. 指向屏幕内部 (-Z，远离观察者)' : 'B. Into the screen (-Z, away from viewer)', correct: false },
                { id: 'C', text: isZh ? 'C. 长度为 0' : 'C. Zero length', correct: false }
              ],
              explain: isZh
                ? '根据右手定则，四指从 +X 弯向 +Y（逆时针），大拇指指向 +Z（屏幕外侧）。'
                : 'By the Right-Hand Rule, curling fingers from +X to +Y points the thumb along +Z (out of the screen).'
            },
            {
              q: isZh
                ? 'Q2. 若表面单位法线为 N，指向相机的单位视线向量为 V，背面剔除 (Back-Face Culling) 应当剔除满足什么条件的三角形？'
                : 'Q2. Given unit normal N and unit view vector V (pointing to camera), which triangles does Back-Face Culling discard?',
              options: [
                { id: 'A', text: 'A. N × V = 0', correct: false },
                { id: 'B', text: isZh ? 'B. N · V ≤ 0 (夹角 ≥ 90°)' : 'B. N · V ≤ 0 (angle ≥ 90°)', correct: true },
                { id: 'C', text: isZh ? 'C. N · V > 0 (夹角 < 90°)' : 'C. N · V > 0 (angle < 90°)', correct: false }
              ],
              explain: isZh
                ? '当 N · V ≤ 0 时，表面法线与视线夹角 ≥ 90°，代表该面背对相机。'
                : 'When N · V ≤ 0, the angle between normal and view direction is ≥ 90°, meaning the triangle faces away from the camera.'
            },
            {
              q: isZh
                ? 'Q3. 已知 3D 三角形两条边向量为 a 和 b，该三角形的面积等于什么？'
                : 'Q3. Given a 3D triangle with edge vectors a and b, what is its area?',
              options: [
                { id: 'A', text: 'A. 0.5 * |a · b|', correct: false },
                { id: 'B', text: 'B. 0.5 * ||a × b||', correct: true },
                { id: 'C', text: 'C. ||a|| * ||b||', correct: false }
              ],
              explain: isZh
                ? '叉积模长 ||a × b|| = ||a|| ||b|| sin(θ) 等于平行四边形面积，三角形面积为其一半。'
                : 'The magnitude ||a × b|| equals the parallelogram area, so the triangle area is half of that.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-sm font-semibold text-white">{item.q}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {item.options.map(opt => {
                  const chosen = quizAnswers[idx] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: opt.id })}
                      className={`p-3 rounded-lg border text-left transition ${
                        chosen
                          ? opt.correct
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                            : 'border-rose-500 bg-rose-950/40 text-rose-200'
                          : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
              {quizAnswers[idx] && (
                <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  💡 {item.explain}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
