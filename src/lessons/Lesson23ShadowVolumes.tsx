import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson23Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type StencilMethod = 'zpass' | 'zfail';

function segIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): { t: number; u: number; x: number; y: number } | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-6) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { t, u, x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

export const Lesson23ShadowVolumes: React.FC<Lesson23Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Umbra / Penumbra & Live 4x4 Matrix M_shadow
  const [lightRadius, setLightRadius] = useState<number>(24);
  const [lightX, setLightX] = useState<number>(-1.2);
  const [lightY, setLightY] = useState<number>(4.5);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: Planar Projection Shadow & Anti-Shadow
  const [lab1Ly, setLab1Ly] = useState<number>(4.2);
  const [lab1Lx, setLab1Lx] = useState<number>(-1.5);
  const [lab1Tilt, setLab1Tilt] = useState<number>(0);
  const [clipAnti, setClipAnti] = useState<boolean>(true);
  const lab1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: Stencil Shadow Volume Ray Sandbox (Z-Pass vs Carmack's Reverse Z-Fail)
  const [method, setMethod] = useState<StencilMethod>('zpass');
  const [rayDeg, setRayDeg] = useState<number>(8);
  const [camOffset, setCamOffset] = useState<number>(-220);
  const lab2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [gameClip, setGameClip] = useState<'off' | 'on'>('off');
  const [gameSil, setGameSil] = useState<'off' | 'on'>('off');
  const [gameAlgo, setGameAlgo] = useState<'zpass' | 'zfail_uncapped' | 'zfail_capped'>('zpass');
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

    const floorY = H - 44;
    const lx = W * 0.5 + lightX * 70;
    const ly = floorY - lightY * 50;
    const occY = floorY - 110;
    const occX1 = W * 0.5 - 55;
    const occX2 = W * 0.5 + 55;

    const projectX = (srcX: number, targetX: number) => {
      const dyL = floorY - ly;
      const dyO = occY - ly;
      return srcX + ((targetX - srcX) * dyL) / Math.max(10, dyO);
    };

    const umbraL = projectX(lx - lightRadius, occX1);
    const umbraR = projectX(lx + lightRadius, occX2);
    const penL = projectX(lx + lightRadius, occX1);
    const penR = projectX(lx - lightRadius, occX2);

    if (lightRadius > 0) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.beginPath();
      ctx.moveTo(occX1, occY);
      ctx.lineTo(occX2, occY);
      ctx.lineTo(penR, floorY);
      ctx.lineTo(penL, floorY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(occX1, occY);
    ctx.lineTo(occX2, occY);
    ctx.lineTo(Math.max(umbraL, umbraR), floorY);
    ctx.lineTo(Math.min(umbraL, umbraR), floorY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, floorY);
    ctx.lineTo(W - 24, floorY);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(occX1, occY - 8, occX2 - occX1, 12);

    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx - lightRadius, ly);
    ctx.lineTo(lx + lightRadius, ly);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, lightRadius, lightX, lightY]);

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

        const tiltRad = (lab1Tilt * Math.PI) / 180;
        const nx = -Math.sin(tiltRad);
        const ny = Math.cos(tiltRad);
        const originX = W * 0.5;
        const originY = H * 0.76;
        const scale = 54;
        const toScreen = (x: number, y: number): [number, number] => [originX + x * scale, originY - y * scale];

        const [p1x, p1y] = toScreen(-5.2, -(-5.2 * nx) / ny);
        const [p2x, p2y] = toScreen(5.2, -(5.2 * nx) / ny);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        const poly: Array<[number, number]> = [
          [-0.9, 2.2],
          [0.9, 2.2],
          [0.6, 3.1],
          [-0.6, 3.1]
        ];

        const dotL = nx * lab1Lx + ny * lab1Ly;
        const projPts = poly.map(([vx, vy]) => {
          const dotV = nx * vx + ny * vy;
          const ws = dotL - dotV;
          const safeW = Math.abs(ws) < 1e-4 ? 1e-4 : ws;
          return {
            px: (dotL * vx - lab1Lx * dotV) / safeW,
            py: (dotL * vy - lab1Ly * dotV) / safeW,
            ws
          };
        });

        const valid = projPts.filter(p => p.ws > 0 || !clipAnti);
        if (valid.length >= 2) {
          const xs = valid.map(p => p.px);
          const minX = Math.max(-5.0, Math.min(...xs));
          const maxX = Math.min(5.0, Math.max(...xs));
          const [s1x, s1y] = toScreen(minX, -(minX * nx) / ny);
          const [s2x, s2y] = toScreen(maxX, -(maxX * nx) / ny);
          ctx.strokeStyle = projPts.some(p => p.ws <= 0) && !clipAnti ? '#f43f5e' : '#22d3ee';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(s1x, s1y);
          ctx.lineTo(s2x, s2y);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        poly.forEach(([vx, vy], idx) => {
          const [sx, sy] = toScreen(vx, vy);
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const [lxS, lyS] = toScreen(lab1Lx, lab1Ly);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(lxS, lyS, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const c2 = lab2CanvasRef.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const W = c2.width;
        const H = c2.height;
        ctx.clearRect(0, 0, W, H);

        const lx = 370;
        const ly = 44;
        const occluder = { x1: 300, y1: 145, x2: 425, y2: 145 };
        const receiverWallX = 610;
        const extScale = 2.7;
        const leftFarX = lx + (occluder.x1 - lx) * extScale;
        const leftFarY = ly + (occluder.y1 - ly) * extScale;
        const rightFarX = lx + (occluder.x2 - lx) * extScale;
        const rightFarY = ly + (occluder.y2 - ly) * extScale;

        const camX = 345 + camOffset;
        const camY = 235;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
        ctx.beginPath();
        ctx.moveTo(occluder.x1, occluder.y1);
        ctx.lineTo(occluder.x2, occluder.y2);
        ctx.lineTo(rightFarX, rightFarY);
        ctx.lineTo(leftFarX, leftFarY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(occluder.x1, occluder.y1);
        ctx.lineTo(leftFarX, leftFarY);
        ctx.stroke();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(occluder.x2, occluder.y2);
        ctx.lineTo(rightFarX, rightFarY);
        ctx.stroke();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(receiverWallX, 45);
        ctx.lineTo(receiverWallX, H - 35);
        ctx.stroke();

        const rad = (rayDeg * Math.PI) / 180;
        const dirX = Math.cos(rad);
        const dirY = Math.sin(rad);
        const hitWallT = (receiverWallX - camX) / dirX;
        const surfX = receiverWallX;
        const surfY = camY + hitWallT * dirY;
        const infX = camX + dirX * 900;
        const infY = camY + dirY * 900;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(surfX, surfY);
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(surfX, surfY);
        ctx.lineTo(infX, infY);
        ctx.stroke();
        ctx.restore();

        const walls = [
          { x1: occluder.x1, y1: occluder.y1, x2: leftFarX, y2: leftFarY, name: 'Left' },
          { x1: rightFarX, y1: rightFarY, x2: occluder.x2, y2: occluder.y2, name: 'Right' },
          { x1: occluder.x2, y1: occluder.y2, x2: occluder.x1, y2: occluder.y1, name: 'LightCap' },
          { x1: leftFarX, y1: leftFarY, x2: rightFarX, y2: rightFarY, name: 'DarkCap' }
        ];

        const cx = (occluder.x1 + occluder.x2 + leftFarX + rightFarX) * 0.25;
        const cy = (occluder.y1 + occluder.y2 + leftFarY + rightFarY) * 0.25;

        walls.forEach(w => {
          const hit = segIntersect(camX, camY, infX, infY, w.x1, w.y1, w.x2, w.y2);
          if (hit) {
            const ex = w.x2 - w.x1;
            const ey = w.y2 - w.y1;
            let nx = -ey;
            let ny = ex;
            if (nx * (cx - w.x1) + ny * (cy - w.y1) > 0) {
              nx = -nx;
              ny = -ny;
            }
            const isFront = dirX * nx + dirY * ny < 0;
            const dist = Math.hypot(hit.x - camX, hit.y - camY);
            const beforeSurf = dist < hitWallT;
            let delta = 0;
            if (method === 'zpass' && beforeSurf && w.name !== 'DarkCap') {
              delta = isFront ? 1 : -1;
            } else if (method === 'zfail' && !beforeSurf) {
              delta = isFront ? -1 : 1;
            }
            if (delta !== 0) {
              ctx.fillStyle = delta > 0 ? '#10b981' : '#f43f5e';
              ctx.beginPath();
              ctx.arc(hit.x, hit.y, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 10px monospace';
              ctx.fillText(delta > 0 ? '+1' : '-1', hit.x - 6, hit.y + 3);
            }
          }
        });

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(lx, ly, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(camX, camY, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [activeTab, lab1Ly, lab1Lx, lab1Tilt, clipAnti, method, rayDeg, camOffset]);

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

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(150, 65, 9, 0, Math.PI * 2);
    ctx.fill();

    if (gameSil === 'on') {
      ctx.fillStyle = gameAlgo === 'zfail_capped' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(244, 63, 94, 0.22)';
      ctx.beginPath();
      ctx.moveTo(250, 130);
      ctx.lineTo(360, 115);
      ctx.lineTo(600, 275);
      ctx.lineTo(410, 315);
      ctx.closePath();
      ctx.fill();
    }

    if (gameClip === 'off') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
      ctx.fillRect(28, 240, 115, 12);
    }

    ctx.fillStyle = '#6366f1';
    ctx.fillRect(250, 115, 110, 20);
  }, [activeTab, gameClip, gameSil, gameAlgo]);

  const handleVerifyMission = () => {
    let ok = false;
    if (mission === 1) ok = gameClip === 'on';
    else if (mission === 2) ok = gameClip === 'on' && gameSil === 'on';
    else ok = gameClip === 'on' && gameSil === 'on' && gameAlgo === 'zfail_capped';

    if (ok) {
      setPassed(prev => ({ ...prev, [mission]: true }));
      setGameFeedback({
        ok: true,
        msg: isZh
          ? `🎉 恭喜通过关卡 ${mission}！你的阴影体积与模板缓冲引擎已验证通过！`
          : `🎉 Mission ${mission} Complete! Your shadow volume and stencil pipeline is verified!`
      });
    } else {
      setGameFeedback({
        ok: false,
        msg: isZh
          ? '⚠️ 参数未达标：请检查 w_s > 0 裁剪、轮廓边挤出或 Carmack\'s Reverse (Z-Fail + Caps)！'
          : '⚠️ Check w_s > 0 clipping, Silhouette Extrusion, or Carmack\'s Reverse (Z-Fail + Caps)!'
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
            <span>Stage 4 • L23</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isZh
              ? 'L23: 阴影算法 (Part 1)：平面投影阴影与阴影体 (Shadow Volumes)'
              : 'L23: Planar Projection Shadows, Silhouette Edges & Stencil Shadow Volumes'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="lessons/lesson-23.html"
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
          { id: 2 as const, zh: '🔬 2. 平面阴影与 Stencil 阴影体实验室', en: '🔬 2. Planar & Stencil Shadow Labs' },
          { id: 3 as const, zh: '🎬 3. 名校公开课与笔记', en: '🎬 3. Course Videos & Notes' },
          { id: 4 as const, zh: '🎮 4. 闯关游戏：Doom 3 阴影架构师', en: '🎮 4. Game: Doom 3 Shadow Architect' }
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
              ? '齐次外积平面阴影矩阵 M = (Π·L)I - LΠ^T 与本影/半影光学锥'
              : 'Homogeneous Outer-Product Shadow Matrix M = (Π·L)I - LΠ^T & Umbra/Penumbra'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800">
              <canvas ref={mathCanvasRef} width={660} height={320} className="w-full rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '面光源半径 R_light' : 'Area Light Radius'}</span>
                  <span className="font-mono text-amber-400">{lightRadius}</span>
                </div>
                <input type="range" min={0} max={55} step={1} value={lightRadius} onChange={e => setLightRadius(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '光源横向位置 L_x' : 'Light X'}</span>
                  <span className="font-mono text-indigo-400">{lightX.toFixed(1)}</span>
                </div>
                <input type="range" min={-3} max={3} step={0.1} value={lightX} onChange={e => setLightX(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '光源高度 L_y' : 'Light Y'}</span>
                  <span className="font-mono text-cyan-400">{lightY.toFixed(1)}</span>
                </div>
                <input type="range" min={1.8} max={8} step={0.1} value={lightY} onChange={e => setLightY(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {isZh ? '实验台 1：平面投影矩阵 M_shadow 与反阴影 (w_s < 0) 裁剪' : 'Lab 1: Planar Shadow Matrix & Anti-Shadow Clipping'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab1CanvasRef} width={660} height={340} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '点光源高度 L_y' : 'Light Height L_y'}</span>
                    <span className="font-mono text-amber-400">{lab1Ly.toFixed(1)}</span>
                  </div>
                  <input type="range" min={0.8} max={6} step={0.1} value={lab1Ly} onChange={e => setLab1Ly(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '点光源横向位置 L_x' : 'Light X'}</span>
                    <span className="font-mono text-indigo-400">{lab1Lx.toFixed(1)}</span>
                  </div>
                  <input type="range" min={-4} max={4} step={0.1} value={lab1Lx} onChange={e => setLab1Lx(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '平面倾角 Tilt' : 'Plane Tilt'}</span>
                    <span className="font-mono text-cyan-400">{lab1Tilt}°</span>
                  </div>
                  <input type="range" min={-20} max={20} step={1} value={lab1Tilt} onChange={e => setLab1Tilt(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input type="checkbox" checked={clipAnti} onChange={e => setClipAnti(e.target.checked)} />
                  <span>{isZh ? '开启 w_s > 0 反阴影裁剪' : 'Clip w_s <= 0 Anti-Shadows'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">
                {isZh ? '实验台 2：阴影体 (Shadow Volume) Z-Pass vs. Carmack\'s Reverse Z-Fail' : 'Lab 2: Shadow Volume Z-Pass vs. Carmack\'s Reverse Z-Fail'}
              </h3>
              <div className="flex gap-2">
                {(['zpass', 'zfail'] as StencilMethod[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      method === m ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m.toUpperCase()}
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
                    <span>{isZh ? '视线探测角' : 'Probe Ray Angle'}</span>
                    <span className="font-mono text-cyan-400">{rayDeg}°</span>
                  </div>
                  <input type="range" min={-36} max={38} step={1} value={rayDeg} onChange={e => setRayDeg(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '相机位置 (拖入阴影锥内试试)' : 'Camera Offset'}</span>
                    <span className="font-mono text-amber-400">{camOffset}</span>
                  </div>
                  <input type="range" min={-240} max={40} step={5} value={camOffset} onChange={e => setCamOffset(parseInt(e.target.value, 10))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">UC Davis ECS 175 • Lecture 18</div>
            <h3 className="text-base font-bold text-white">Shadows, Part 1 (Prof. Kenneth Joy)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '讲解本影与半影、Blinn 平面投影阴影矩阵推导，以及从轮廓边挤出半无穷阴影体积锥。'
                : 'Covers Umbra and Penumbra, Blinn planar projection shadow matrices, and Crow shadow volumes.'}
            </p>
          </div>
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-cyan-400">MIT 6.837 • Lecture 15</div>
            <h3 className="text-base font-bold text-white">Shadows in Rasterization (Prof. Justin Solomon)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '剖析光栅化管线中的模板阴影体计数 (Z-Pass vs. Carmack\'s Reverse Z-Fail) 与无穷远视锥体封口。'
                : 'Analyzes Stencil Shadow Volume counting (Z-Pass vs. Carmack\'s Reverse Z-Fail) and infinite frustum capping.'}
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
                value={gameClip}
                onChange={e => setGameClip(e.target.value as 'off' | 'on')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="off">Anti-Shadow Clipping: OFF</option>
                <option value="on">Anti-Shadow Clipping: ON (w_s &gt; 0)</option>
              </select>

              <select
                value={gameSil}
                onChange={e => setGameSil(e.target.value as 'off' | 'on')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="off">Silhouette Edge Extrusion: OFF</option>
                <option value="on">Silhouette Edge Extrusion: ON</option>
              </select>

              <select
                value={gameAlgo}
                onChange={e => setGameAlgo(e.target.value as 'zpass' | 'zfail_uncapped' | 'zfail_capped')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="zpass">Classic Z-Pass (+1 Front / -1 Back)</option>
                <option value="zfail_uncapped">Z-Fail without Caps</option>
                <option value="zfail_capped">Carmack's Reverse (Z-Fail + Light/Dark Caps)</option>
              </select>

              <button
                onClick={handleVerifyMission}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white"
              >
                {isZh ? '🚀 验证阴影引擎管线' : '🚀 Verify Shadow Engine'}
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
