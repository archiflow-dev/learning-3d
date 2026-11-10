import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson22Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type QuadMode = 'affine' | 'split' | 'correct';
type FilterMode = 'nearest' | 'trilinear' | 'aniso' | 'rainbow';

function edgeFunc(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

export const Lesson22TextureMapping: React.FC<Lesson22Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Hyperbolic t(s) & Pixel Footprint Jacobian
  const [depthRatio, setDepthRatio] = useState<number>(5.0);
  const [screenS, setScreenS] = useState<number>(0.5);
  const [tiltDeg, setTiltDeg] = useState<number>(65);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2: Lab 1 (Affine vs 1/Z Perspective-Correct) & Lab 2 (Mipmap/Anisotropic/TBN)
  const [quadMode, setQuadMode] = useState<QuadMode>('split');
  const [lab1Depth, setLab1Depth] = useState<number>(6.5);
  const [lab1Yaw, setLab1Yaw] = useState<number>(18);
  const [lab1Tiles, setLab1Tiles] = useState<number>(8);
  const [showDiag, setShowDiag] = useState<boolean>(true);
  const lab1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>('aniso');
  const [lab2Pitch, setLab2Pitch] = useState<number>(74);
  const [lab2Bump, setLab2Bump] = useState<number>(0.9);
  const [lab2Light, setLab2Light] = useState<number>(35);
  const lab2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4: 3-Mission Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [gameInterp, setGameInterp] = useState<'affine' | 'perspective'>('affine');
  const [gameFilter, setGameFilter] = useState<'none' | 'trilinear' | 'aniso8x'>('trilinear');
  const [gamePitch, setGamePitch] = useState<number>(6.5);
  const [gameBump, setGameBump] = useState<number>(0.25);
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

    const z0 = 1.0;
    const z1 = depthRatio;
    const padL = 48;
    const padT = 36;
    const plotW = 260;
    const plotH = 260;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Dashed affine diagonal
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT);
    ctx.stroke();
    ctx.restore();

    // Hyperbolic curve t(s)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const s = i / 100;
      const t = (s / z0) / ((1 - s) / z1 + s / z0);
      const px = padL + s * plotW;
      const py = padT + (1 - t) * plotH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const tCor = (screenS / z0) / ((1 - screenS) / z1 + screenS / z0);
    const curX = padL + screenS * plotW;
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(curX, padT);
    ctx.lineTo(curX, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(curX, padT + (1 - screenS) * plotH, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(curX, padT + (1 - tCor) * plotH, 6, 0, Math.PI * 2);
    ctx.fill();

    // Right panel: Texel footprint
    const cx = 490;
    const cy = 166;
    const boxR = 125;
    const cells = 8;
    const cellSz = (boxR * 2) / cells;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#0f172a' : '#1e293b';
        ctx.fillRect(cx - boxR + c * cellSz, cy - boxR + r * cellSz, cellSz, cellSz);
      }
    }

    const tiltRad = (tiltDeg * Math.PI) / 180;
    const gxLen = 1.2 + 0.25 * Math.sqrt(depthRatio);
    const gyLen = gxLen / Math.max(0.14, Math.cos(tiltRad));
    const rx = Math.min(boxR - 10, gxLen * 12);
    const ry = Math.min(boxR - 10, gyLen * 12);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - ry, cy - ry, ry * 2, ry * 2);
    ctx.restore();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [activeTab, depthRatio, screenS, tiltDeg, isZh]);

  // Draw Tab 2 Lab 1 & Lab 2
  useEffect(() => {
    if (activeTab !== 2) return;
    const c1 = lab1CanvasRef.current;
    if (c1) {
      const ctx = c1.getContext('2d');
      if (ctx) {
        const W = c1.width;
        const H = c1.height;
        const yaw = (lab1Yaw * Math.PI) / 180;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);

        const rawCorners = [
          { x: -1.45, y: -0.95, zBase: 1.0, u: 0, v: 0 },
          { x: 1.45, y: -0.95, zBase: 1.0, u: 1, v: 0 },
          { x: 1.45, y: 0.85, zBase: lab1Depth, u: 1, v: 1 },
          { x: -1.45, y: 0.85, zBase: lab1Depth, u: 0, v: 1 }
        ];

        const verts = rawCorners.map(c => {
          const rx = c.x * cosY - (c.zBase - 1.0) * 0.12 * sinY;
          const z = Math.max(0.6, c.zBase + c.x * 0.18 * sinY);
          const scale = 300 / Math.pow(z, 0.55);
          return {
            sx: W * 0.5 + rx * scale,
            sy: H * 0.56 - c.y * scale * 0.78,
            z,
            u: c.u,
            v: c.v
          };
        });

        const img = ctx.createImageData(W, H);
        const data = img.data;
        for (let i = 0; i < W * H * 4; i += 4) {
          data[i] = 8;
          data[i + 1] = 12;
          data[i + 2] = 26;
          data[i + 3] = 255;
        }

        const tris: Array<[typeof verts[0], typeof verts[0], typeof verts[0], number]> = [
          [verts[0], verts[1], verts[2], 0],
          [verts[0], verts[2], verts[3], 1]
        ];

        for (const [A, B, C, triId] of tris) {
          const area = edgeFunc(A.sx, A.sy, B.sx, B.sy, C.sx, C.sy);
          if (Math.abs(area) < 1e-5) continue;
          const minX = Math.max(0, Math.floor(Math.min(A.sx, B.sx, C.sx)));
          const maxX = Math.min(W - 1, Math.ceil(Math.max(A.sx, B.sx, C.sx)));
          const minY = Math.max(0, Math.floor(Math.min(A.sy, B.sy, C.sy)));
          const maxY = Math.min(H - 1, Math.ceil(Math.max(A.sy, B.sy, C.sy)));

          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              const w0 = edgeFunc(B.sx, B.sy, C.sx, C.sy, x + 0.5, y + 0.5) / area;
              const w1 = edgeFunc(C.sx, C.sy, A.sx, A.sy, x + 0.5, y + 0.5) / area;
              const w2 = 1.0 - w0 - w1;
              if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                const useCorrect = quadMode === 'correct' || (quadMode === 'split' && triId === 1);
                let u: number;
                let v: number;
                if (!useCorrect) {
                  u = w0 * A.u + w1 * B.u + w2 * C.u;
                  v = w0 * A.v + w1 * B.v + w2 * C.v;
                } else {
                  const invZ = w0 / A.z + w1 / B.z + w2 / C.z;
                  u = (w0 * (A.u / A.z) + w1 * (B.u / B.z) + w2 * (C.u / C.z)) / invZ;
                  v = (w0 * (A.v / A.z) + w1 * (B.v / B.z) + w2 * (C.v / C.z)) / invZ;
                }

                const tx = Math.floor(u * lab1Tiles);
                const ty = Math.floor(v * lab1Tiles);
                const isDark = (tx + ty) % 2 === 0;
                const idx = (y * W + x) * 4;
                data[idx] = !useCorrect ? (isDark ? 42 : 244) : isDark ? 18 : 52;
                data[idx + 1] = !useCorrect ? (isDark ? 24 : 114) : isDark ? 45 : 211;
                data[idx + 2] = !useCorrect ? (isDark ? 48 : 140) : isDark ? 58 : 153;
                data[idx + 3] = 255;
              }
            }
          }
        }
        ctx.putImageData(img, 0, 0);

        if (showDiag) {
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(verts[0].sx, verts[0].sy);
          ctx.lineTo(verts[2].sx, verts[2].sy);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    const c2 = lab2CanvasRef.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const W = c2.width;
        const H = c2.height;
        const img = ctx.createImageData(W, H);
        const data = img.data;
        const horizonY = Math.floor(H * (0.18 + (82 - lab2Pitch) * 0.006));
        const lightPhi = (lab2Light * Math.PI) / 180;
        const lx = Math.sin(lightPhi) * 0.75;
        const ly = 0.55;
        const lz = Math.cos(lightPhi) * 0.45;
        const lLen = Math.hypot(lx, ly, lz);
        const Lx = lx / lLen;
        const Ly = ly / lLen;
        const Lz = lz / lLen;

        const lodColors = [
          [244, 63, 94],
          [245, 158, 11],
          [16, 185, 129],
          [6, 182, 212],
          [59, 130, 246],
          [168, 85, 247]
        ];

        for (let y = 0; y < H; y++) {
          if (y < horizonY) {
            for (let x = 0; x < W; x++) {
              const idx = (y * W + x) * 4;
              data[idx] = 14;
              data[idx + 1] = 22;
              data[idx + 2] = 44;
              data[idx + 3] = 255;
            }
            continue;
          }
          const dy = Math.max(1.5, y - horizonY);
          const camH = 110 * Math.cos((lab2Pitch * Math.PI) / 180) + 28;
          const Z = (camH * 240) / dy;
          const duDx = Z / 320;
          const dvDy = (Z * Z) / (camH * 240 * 18);
          const rhoIso = Math.max(duDx * 16, dvDy * 16);
          const rhoMin = Math.min(duDx * 16, dvDy * 16);
          const lodIso = Math.max(0, Math.min(5, Math.log2(Math.max(1, rhoIso))));
          const lodAniso = Math.max(0, Math.min(5, Math.log2(Math.max(1, rhoMin * 1.4))));

          for (let x = 0; x < W; x++) {
            const u = ((x - W * 0.5) * Z) / (320 * 48);
            const v = Z / 22;
            const U = u * 4.0;
            const V = v * 4.0;
            const rawCheck = (Math.floor(U) + Math.floor(V)) & 1 ? 1.0 : 0.18;
            let baseVal = rawCheck;
            if (filterMode === 'trilinear') {
              const bf = Math.min(1.0, lodIso / 3.2);
              baseVal = rawCheck * (1 - bf) + 0.58 * bf;
            } else if (filterMode === 'aniso') {
              const bf = Math.min(0.62, lodAniso / 4.5);
              baseVal = rawCheck * (1 - bf) + 0.58 * bf;
            }

            let nx = 0;
            let ny = 1;
            let nz = 0;
            if (lab2Bump > 0.01) {
              const mipAtten = 1.0 / (1.0 + 0.35 * lodAniso);
              nx = -Math.sin((U - Math.floor(U)) * Math.PI * 2) * lab2Bump * mipAtten;
              nz = -Math.sin((V - Math.floor(V)) * Math.PI * 2) * lab2Bump * mipAtten;
              const nLen = Math.hypot(nx, 1.0, nz);
              nx /= nLen;
              ny = 1.0 / nLen;
              nz /= nLen;
            }
            const ndotl = Math.max(0.15, nx * Lx + ny * Ly + nz * Lz);
            const idx = (y * W + x) * 4;
            if (filterMode === 'rainbow') {
              const l0 = Math.floor(lodIso);
              const c0 = lodColors[l0];
              const shade = (0.55 + 0.45 * rawCheck) * ndotl;
              data[idx] = Math.min(255, c0[0] * shade);
              data[idx + 1] = Math.min(255, c0[1] * shade);
              data[idx + 2] = Math.min(255, c0[2] * shade);
            } else {
              data[idx] = Math.min(255, baseVal * 195 * ndotl);
              data[idx + 1] = Math.min(255, baseVal * 210 * ndotl);
              data[idx + 2] = Math.min(255, baseVal * 235 * ndotl);
            }
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
      }
    }
  }, [activeTab, quadMode, lab1Depth, lab1Yaw, lab1Tiles, showDiag, filterMode, lab2Pitch, lab2Bump, lab2Light]);

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

    const horizonY = 64;
    ctx.fillStyle = '#090d1f';
    ctx.fillRect(0, 0, W, horizonY);

    for (let y = horizonY; y < H; y += 3) {
      const s = (y - horizonY) / (H - horizonY);
      const z =
        gameInterp === 'perspective'
          ? 1.0 / ((1 - s) / gamePitch + s / 1.0)
          : (1 - s) * gamePitch + s * 1.0;

      for (let x = 0; x < W; x += 4) {
        const nxScreen = (x - W * 0.5) / (W * 0.45);
        const diagOffset =
          gameInterp === 'affine'
            ? x / W > s
              ? 0.28 * s * (1 - s) * gamePitch
              : -0.18 * s * (1 - s) * gamePitch
            : 0;
        const u = nxScreen * z * 1.8 + diagOffset;
        const v = z * 1.6;
        const check = (Math.floor(u * 2) + Math.floor(v * 2)) & 1 ? 1.0 : 0.22;
        let val = check;
        if (gameFilter === 'trilinear') {
          const blur = Math.min(0.85, z / (gamePitch * 0.95));
          val = check * (1 - blur) + 0.55 * blur;
        } else if (gameFilter === 'aniso8x') {
          const blur = Math.min(0.32, z / (gamePitch * 2.2));
          val = check * (1 - blur) + 0.55 * blur;
        }
        const bevel = Math.sin(u * Math.PI * 4) * Math.cos(v * Math.PI * 4) * gameBump;
        const shade = Math.max(0.2, Math.min(1.35, 0.78 + bevel * 0.55));
        ctx.fillStyle = `rgb(${Math.floor(val * 70 * shade)},${Math.floor(val * 185 * shade)},${Math.floor(val * 225 * shade)})`;
        ctx.fillRect(x, y, 4, 3);
      }
    }
  }, [activeTab, gameInterp, gameFilter, gamePitch, gameBump]);

  const handleVerifyMission = () => {
    let ok = false;
    if (mission === 1) ok = gameInterp === 'perspective' && gamePitch >= 6.0;
    else if (mission === 2) ok = gameInterp === 'perspective' && gameFilter === 'aniso8x' && gamePitch >= 7.5;
    else ok = gameInterp === 'perspective' && gameFilter === 'aniso8x' && gameBump >= 0.85;

    if (ok) {
      setPassed(prev => ({ ...prev, [mission]: true }));
      setGameFeedback({
        ok: true,
        msg: isZh
          ? `🎉 恭喜通过关卡 ${mission}！你的 1/Z 透视校正、各向异性过滤与 TBN 法线管线已完美达标！`
          : `🎉 Mission ${mission} Passed! Your 1/Z perspective-correct, Anisotropic AF, and TBN pipeline is production-ready!`
      });
    } else {
      setGameFeedback({
        ok: false,
        msg: isZh
          ? '⚠️ 参数未达标：请检查是否开启了 1/Z 透视校正、Anisotropic 8x AF 或 TBN 凹凸强度 >= 0.85！'
          : '⚠️ Not quite there: check 1/Z Perspective-Correct, Anisotropic 8x AF, or TBN Bump >= 0.85!'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
            <button onClick={onBackToPortal} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
              {isZh ? '← 返回课程总目录' : '← Back to Index'}
            </button>
            <span>•</span>
            <span>Stage 4 • L22</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isZh
              ? 'L22: 纹理映射 (Texture Mapping)、1/Z 透视校正、Mipmap 与 TBN 法线贴图'
              : 'L22: Texture Mapping, 1/Z Perspective-Correct Interpolation, Mipmaps & TBN Normal Mapping'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="lessons/lesson-22.html"
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

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 1 as const, zh: '📐 1. 核心数学与 3B1B 直觉', en: '📐 1. Core Math & 3B1B Intuition' },
          { id: 2 as const, zh: '🔬 2. 透视校正与 Mipmap/TBN 实验室', en: '🔬 2. Perspective & Mipmap/TBN Labs' },
          { id: 3 as const, zh: '🎬 3. 名校公开课与笔记', en: '🎬 3. Course Videos & Notes' },
          { id: 4 as const, zh: '🎮 4. 闯关游戏：首席纹理与材质架构师', en: '🎮 4. Game: Chief Texture Architect' }
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

      {/* Tab 1 */}
      {activeTab === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">
            {isZh
              ? '为什么屏幕空间均匀步进 s 对应三维世界双曲步进 t？(1/Z 与 u/Z 线性定理 + 雅可比像素脚印)'
              : 'Why Uniform Screen Steps s Map to Hyperbolic 3D Steps t (1/Z Linearity & Pixel Footprint Jacobian)'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {isZh
              ? '经过透视除法 x_s = X/Z 后，真正随屏幕坐标 s 呈线性关系的不是 Z 和 u，而是倒数 1/Z 与比值 u/Z！同时，屏幕移动 1 个像素在纹素空间张成的雅可比偏导切向量 g_x = (∂U/∂x, ∂V/∂x) 与 g_y = (∂U/∂y, ∂V/∂y) 决定了 Mipmap 层级 d = log2(max(||g_x||, ||g_y||))。'
              : 'After perspective division x_s = X/Z, neither Z nor u is linear in screen space—instead, 1/Z and u/Z vary linearly! Meanwhile, the Jacobian tangent vectors g_x and g_y determine the Mipmap pyramid level d = log2(max(||g_x||, ||g_y||)).'}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800">
              <canvas ref={mathCanvasRef} width={660} height={330} className="w-full rounded-lg bg-slate-950" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">{isZh ? '深度比 Z1 / Z0' : 'Depth Ratio Z1 / Z0'}</span>
                  <span className="font-mono text-indigo-400 font-bold">{depthRatio.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.2}
                  value={depthRatio}
                  onChange={e => setDepthRatio(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">{isZh ? '屏幕比例 s' : 'Screen Fraction s'}</span>
                  <span className="font-mono text-emerald-400 font-bold">{screenS.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.01}
                  value={screenS}
                  onChange={e => setScreenS(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">{isZh ? '视线掠射倾角 Tilt' : 'Surface Grazing Tilt'}</span>
                  <span className="font-mono text-amber-400 font-bold">{tiltDeg}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={82}
                  step={1}
                  value={tiltDeg}
                  onChange={e => setTiltDeg(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {isZh ? '实验台 1：屏幕仿射扭曲 vs. 1/Z 透视校正插值' : 'Lab 1: Screen Affine Warping vs. 1/Z Perspective-Correct'}
              </h3>
              <div className="flex gap-2">
                {(['affine', 'split', 'correct'] as QuadMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setQuadMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      quadMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab1CanvasRef} width={660} height={360} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '深度跨度 Z_far / Z_near' : 'Depth Span'}</span>
                    <span className="font-mono text-indigo-400">{lab1Depth.toFixed(1)}x</span>
                  </div>
                  <input type="range" min={1} max={12} step={0.5} value={lab1Depth} onChange={e => setLab1Depth(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Yaw</span>
                    <span className="font-mono text-cyan-400">{lab1Yaw}°</span>
                  </div>
                  <input type="range" min={-45} max={45} step={1} value={lab1Yaw} onChange={e => setLab1Yaw(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Tiles</span>
                    <span className="font-mono text-emerald-400">{lab1Tiles}x{lab1Tiles}</span>
                  </div>
                  <input type="range" min={4} max={16} step={2} value={lab1Tiles} onChange={e => setLab1Tiles(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input type="checkbox" checked={showDiag} onChange={e => setShowDiag(e.target.checked)} />
                  <span>{isZh ? '高亮三角形公共对角线' : 'Highlight Shared Diagonal'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {isZh ? '实验台 2：Mipmap 彩虹层级、各向异性过滤与 TBN 法线贴图' : 'Lab 2: Mipmap Rainbow LOD, Anisotropic AF & TBN Normal Map'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(['nearest', 'trilinear', 'aniso', 'rainbow'] as FilterMode[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterMode(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      filterMode === f ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab2CanvasRef} width={660} height={360} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '掠射倾角 Pitch' : 'Grazing Pitch'}</span>
                    <span className="font-mono text-cyan-400">{lab2Pitch}°</span>
                  </div>
                  <input type="range" min={35} max={82} step={1} value={lab2Pitch} onChange={e => setLab2Pitch(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? 'TBN 法线凹凸强度' : 'TBN Bump Strength'}</span>
                    <span className="font-mono text-purple-400">{lab2Bump.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1.5} step={0.05} value={lab2Bump} onChange={e => setLab2Bump(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '点光源方位角' : 'Light Azimuth'}</span>
                    <span className="font-mono text-amber-400">{lab2Light}°</span>
                  </div>
                  <input type="range" min={-80} max={80} step={2} value={lab2Light} onChange={e => setLab2Light(parseInt(e.target.value, 10))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">UC Davis ECS 175 • Lecture 10</div>
            <h3 className="text-base font-bold text-white">Shading and Texturing (Prof. Kenneth Joy)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '讲解参数化纹理坐标 (u,v)、放大双线性插值、以及利用法线扰动欺骗人眼的凹凸贴图 (Bump / Normal Mapping)。'
                : 'Covers parametric (u,v) coordinates, magnification bilinear interpolation, and Bump / Normal Mapping.'}
            </p>
          </div>
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-cyan-400">MIT 6.837 • Lecture 14</div>
            <h3 className="text-base font-bold text-white">Texture Mapping (Prof. Justin Solomon)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '严格推导 1/w 与 u/w 透视校正插值、Lance Williams Mipmap 金字塔、屏幕空间雅可比脚印与各向异性过滤。'
                : 'Rigorous derivation of 1/w and u/w perspective-correct interpolation, Lance Williams Mipmaps, Jacobian footprints, and Anisotropic Filtering.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4 */}
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
              <canvas ref={gameCanvasRef} width={640} height={340} className="w-full rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <select
                value={gameInterp}
                onChange={e => setGameInterp(e.target.value as 'affine' | 'perspective')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="affine">Affine Linear (PS1 Style)</option>
                <option value="perspective">Hyperbolic 1/Z Perspective-Correct</option>
              </select>

              <select
                value={gameFilter}
                onChange={e => setGameFilter(e.target.value as 'none' | 'trilinear' | 'aniso8x')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="none">Nearest / No Mipmap</option>
                <option value="trilinear">Trilinear Isotropic Mipmap</option>
                <option value="aniso8x">Anisotropic 8x AF + Trilinear</option>
              </select>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '深度跨度 / 掠射强度' : 'Depth / Grazing Pitch'}</span>
                  <span className="font-mono text-cyan-400">{gamePitch.toFixed(1)}</span>
                </div>
                <input type="range" min={2} max={10} step={0.5} value={gamePitch} onChange={e => setGamePitch(parseFloat(e.target.value))} className="w-full" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? 'TBN 法线凹凸强度' : 'TBN Bump Strength'}</span>
                  <span className="font-mono text-purple-400">{gameBump.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1.2} step={0.05} value={gameBump} onChange={e => setGameBump(parseFloat(e.target.value))} className="w-full" />
              </div>

              <button
                onClick={handleVerifyMission}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white"
              >
                {isZh ? '🚀 验证当前管线配置' : '🚀 Verify Pipeline Configuration'}
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
