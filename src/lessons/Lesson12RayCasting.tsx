import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson12Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson12RayCasting: React.FC<Lesson12Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Tab 1 State: Ray-Sphere Chord & Parabola Microscope
  const [rayAngle, setRayAngle] = useState<number>(-6);
  const [sphereCx, setSphereCx] = useState<number>(380);
  const [sphereR, setSphereR] = useState<number>(75);
  const vis1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: Dual-View Ray Caster
  const [fov, setFov] = useState<number>(55);
  const [frontZ, setFrontZ] = useState<number>(-3.6);
  const [renderMode, setRenderMode] = useState<'shaded' | 'normal' | 'depth' | 'disc'>('shaded');
  const [selPix, setSelPix] = useState<[number, number]>([11, 8]);
  const labCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(-5);
  const [gVal2, setGVal2] = useState<number>(75);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Visualizer
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const c = vis1CanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 140, oy = 120, cy = 120;
    const rad = (rayAngle * Math.PI) / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    const Lx = sphereCx - ox, Ly = cy - oy;
    const tca = Lx * dx + Ly * dy;
    const dPerp2 = Math.max(0, Lx * Lx + Ly * Ly - tca * tca);
    const discQuarter = sphereR * sphereR - dPerp2;

    ctx.strokeStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(0, 235); ctx.lineTo(W, 235); ctx.stroke();

    ctx.fillStyle = discQuarter >= 0 ? 'rgba(6, 182, 212, 0.16)' : 'rgba(244, 63, 94, 0.12)';
    ctx.strokeStyle = discQuarter >= 0 ? '#22d3ee' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(sphereCx, cy, sphereR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx * 480, oy + dy * 480); ctx.stroke();

    const zeroY = 310;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(30, zeroY); ctx.lineTo(W - 30, zeroY); ctx.stroke();

    ctx.strokeStyle = discQuarter >= 0 ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 40; px <= W - 40; px += 4) {
      const t = px - ox;
      const ft = ((t - tca) * (t - tca) - discQuarter) * 0.008;
      const py = Math.max(245, Math.min(H - 10, zeroY - ft));
      if (px === 40) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [activeTab, rayAngle, sphereCx, sphereR]);

  // Draw Tab 2 Ray-Cast Grid
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const c = labCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const gw = 24, gh = 16;
    const cw = W / gw, ch = H / gh;
    const aspect = gw / gh;
    const tanHalf = Math.tan((fov * Math.PI) / 360);

    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const us = ((2 * (i + 0.5)) / gw - 1) * aspect * tanHalf;
        const vs = (1 - (2 * (j + 0.5)) / gh) * tanHalf;
        const len = Math.hypot(us, vs, 1);
        const d = [us / len, vs / len, -1 / len];
        const L = [-0.45, 0.05, frontZ];
        const tca = L[0] * d[0] + L[1] * d[1] + L[2] * d[2];
        const d2 = L[0] * L[0] + L[1] * L[1] + L[2] * L[2] - tca * tca;
        const disc = 1.05 * 1.05 - d2;

        let rgb = [15, 23, 42];
        if (disc >= 0) {
          const t = tca - Math.sqrt(disc);
          const pos = [t * d[0], t * d[1], t * d[2]];
          const nx = (pos[0] - L[0]) / 1.05;
          const ny = (pos[1] - L[1]) / 1.05;
          const nz = (pos[2] - L[2]) / 1.05;
          if (renderMode === 'shaded') {
            const diff = Math.max(0.2, nx * 0.5 + ny * 0.7 + nz * 0.5);
            rgb = [34 * diff, 211 * diff, 238 * diff];
          } else if (renderMode === 'normal') {
            rgb = [(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255];
          } else if (renderMode === 'depth') {
            const g = Math.max(0, Math.min(255, Math.round((1 - (t - 1.5) / 5.5) * 255)));
            rgb = [g, g, g];
          } else {
            rgb = [16, 185, 129];
          }
        }
        ctx.fillStyle = `rgb(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0})`;
        ctx.fillRect(i * cw, j * ch, cw - 1, ch - 1);
      }
    }

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.strokeRect(selPix[0] * cw + 1, selPix[1] * ch + 1, cw - 2, ch - 2);
  }, [activeTab, fov, frontZ, renderMode, selPix]);

  // Draw Tab 4 Game
  const dPerpM1 = 300 * Math.abs(Math.sin((gVal1 * Math.PI) / 180));
  const gPassed =
    (mission === 1 && Math.abs(gVal2 - dPerpM1) < 2.5) ||
    (mission === 2 && Math.abs(gVal1 - -28) <= 3 && Math.abs(gVal2 - 250) <= 10) ||
    (mission === 3 && gVal1 === -2 && gVal2 === 4);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const c = gameCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = gPassed ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`Mission ${mission} • Param1=${gVal1} | Param2=${gVal2}`, 75, 145);
  }, [activeTab, mission, gVal1, gVal2, gPassed]);

  return (
    <div className="space-y-6">
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
              <span>Stage 3 • Lesson 12 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-12.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L12: 可见性问题、深度缓冲与光线投射 (Ray Casting & Analytic Intersections)'
                : 'L12: Visibility, Z-Buffer & Ray Casting (Ray Generation & Sphere/Plane Intersections)'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Explicit-Implicit Marriage &amp; Chord Geometry • UC Davis Lec 07 • MIT 6.837 Lec 09
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
              activeTab === 'concepts' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '1. 显式射线×隐式曲面与判别式 Δ 显微镜' : '1. Explicit Ray × Implicit Surface & Δ'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 像素射线发射器与实时光线投射缓冲' : '2. Pixel Ray Caster & Depth/Normal Buffer'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. MIT 6.837 Lec 09 与 UC Davis Lec 07' : '3. MIT 6.837 Lec 09 & UC Davis Lec 07'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：深空激光雷达指挥官' : '4. 3-Mission Game: Deep-Space LiDAR Commander'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={vis1CanvasRef} width={660} height={360} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-amber-300 font-bold"><span>Angle θ</span><span>{rayAngle}°</span></div>
              <input type="range" min={-40} max={40} step={0.5} value={rayAngle} onChange={(e) => setRayAngle(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-cyan-300 font-bold"><span>Sphere X</span><span>{sphereCx}</span></div>
              <input type="range" min={60} max={540} step={2} value={sphereCx} onChange={(e) => setSphereCx(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-emerald-300 font-bold"><span>Radius R</span><span>{sphereR}</span></div>
              <input type="range" min={30} max={115} step={1} value={sphereR} onChange={(e) => setSphereR(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas
            ref={labCanvasRef}
            width={680}
            height={380}
            onPointerDown={(e) => {
              const c = labCanvasRef.current;
              if (!c) return;
              const r = c.getBoundingClientRect();
              const ix = Math.max(0, Math.min(23, Math.floor(((e.clientX - r.left) / r.width) * 24)));
              const iy = Math.max(0, Math.min(15, Math.floor(((e.clientY - r.top) / r.height) * 16)));
              setSelPix([ix, iy]);
            }}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-crosshair"
          />
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {(['shaded', 'normal', 'depth', 'disc'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setRenderMode(m)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  renderMode === m ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
            <div className="flex items-center gap-2 text-amber-300 font-bold ml-auto">
              <span>FOV {fov}°</span>
              <input type="range" min={30} max={90} value={fov} onChange={(e) => setFov(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>Z {frontZ.toFixed(1)}</span>
              <input type="range" min={-6} max={-2} step={0.1} value={frontZ} onChange={(e) => setFrontZ(Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            MIT 6.837 Lecture 09 &amp; UC Davis ECS 175 Lecture 07 (Ray Casting &amp; Visibility)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可体验双视窗 3D 上帝视角射线发射器与内嵌的 MIT 6.837 Lecture 09 课程视频。'
              : 'Open the standalone HTML page above for the Dual-View 3D God-View Ray Shooter and embedded MIT 6.837 Lecture 09 video.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '深空激光雷达与光线投射指挥官 (3 关)' : 'Deep-Space LiDAR & Ray-Cast Commander'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(-5); setGVal2(75); }
                    else if (m === 2) { setGVal1(-25); setGVal2(250); }
                    else { setGVal1(-2); setGVal2(7); }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    mission === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Mission {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <canvas ref={gameCanvasRef} width={600} height={320} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between text-amber-300"><span>Param 1</span><span>{gVal1}</span></div>
                <input
                  type="range"
                  min={mission === 3 ? -4 : -45}
                  max={mission === 3 ? 8 : 0}
                  step={mission === 1 ? 0.5 : 1}
                  value={gVal1}
                  onChange={(e) => setGVal1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 40 : mission === 2 ? 180 : 1}
                  max={mission === 1 ? 100 : mission === 2 ? 310 : 9}
                  step={mission === 2 ? 5 : 1}
                  value={gVal2}
                  onChange={(e) => setGVal2(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Calibrate ray intersection parameters'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
