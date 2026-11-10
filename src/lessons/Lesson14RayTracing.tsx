import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson14Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson14RayTracing: React.FC<Lesson14Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Tab 1 State: Vector Optics & TIR
  const [theta1, setTheta1] = useState<number>(45);
  const [eta1, setEta1] = useState<number>(1.0);
  const [eta2, setEta2] = useState<number>(1.5);
  const opticsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: Ray Tree & Whitted Sphere
  const [rayY, setRayY] = useState<number>(145);
  const [ior, setIor] = useState<number>(1.52);
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const treeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(25);
  const [gVal2, setGVal2] = useState<number>(2);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Optics Visualizer
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const c = opticsCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.5, R = 125;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(W - 20, cy); ctx.stroke();

    const rad = (theta1 * Math.PI) / 180;
    const sin1 = Math.sin(rad), cos1 = Math.cos(rad);
    const sin2 = (eta1 / eta2) * sin1;
    const k = 1 - sin2 * sin2;

    // Incident
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(cx - sin1 * R, cy - cos1 * R); ctx.lineTo(cx, cy); ctx.stroke();

    // Reflected
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = k < 0 ? 4.5 : 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sin1 * R, cy - cos1 * R); ctx.stroke();

    if (k >= 0) {
      const cos2 = Math.sqrt(k);
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sin2 * R, cy + cos2 * R); ctx.stroke();
    } else {
      ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 14px monospace';
      ctx.fillText('⚡ TOTAL INTERNAL REFLECTION (k < 0)!', cx - 150, cy + 50);
    }
  }, [activeTab, theta1, eta1, eta2]);

  // Draw Tab 2 Ray Tree Lab
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const c = treeCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const cx = 310, cy = 180, R = 95;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    const dy = rayY - cy;
    if (Math.abs(dy) < R) {
      const dx = Math.sqrt(R * R - dy * dy);
      const hit1: [number, number] = [cx - dx, rayY];
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(40, rayY); ctx.lineTo(hit1[0], hit1[1]); ctx.stroke();

      const n1: [number, number] = [(hit1[0] - cx) / R, (hit1[1] - cy) / R];
      const dot1 = n1[0];
      const r1: [number, number] = [1 - 2 * dot1 * n1[0], -2 * dot1 * n1[1]];
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(hit1[0], hit1[1]); ctx.lineTo(hit1[0] + r1[0] * 140, hit1[1] + r1[1] * 140); ctx.stroke();

      if (maxDepth >= 2) {
        const ratio = 1 / ior;
        const cosI = -dot1;
        const k = Math.max(0, 1 - ratio * ratio * (1 - cosI * cosI));
        const t1: [number, number] = [
          ratio + (ratio * cosI - Math.sqrt(k)) * n1[0],
          (ratio * cosI - Math.sqrt(k)) * n1[1]
        ];
        const chord = 2 * R * Math.sqrt(k);
        const hit2: [number, number] = [hit1[0] + t1[0] * chord, hit1[1] + t1[1] * chord];
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(hit1[0], hit1[1]); ctx.lineTo(hit2[0], hit2[1]); ctx.stroke();
      }
    }
  }, [activeTab, rayY, ior, maxDepth]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && Math.abs(gVal1 - 40) <= 2 && gVal2 === 2) ||
    (mission === 2 && Math.abs(gVal1 - 45) <= 2 && Math.abs(gVal2 - 1.5) <= 0.06) ||
    (mission === 3 && gVal1 >= 45 && Math.abs(gVal2 - 1.6) <= 0.06);

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
              <span>Stage 3 • Lesson 14 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-14.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L14: 递归光线追踪 (Whitted-Style Ray Tracing)：反射、斯涅尔折射与光线树'
                : 'L14: Whitted-Style Recursive Ray Tracing: Reflection, Snell Refraction & Ray Trees'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Vector Optics Decomposition • MIT 6.837 Lec 11 (Justin Solomon) • UC Davis Lec 15
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
            {isZh ? '1. 向量正交分解推导反射、斯涅尔折射与 TIR' : '1. Vector Reflection, Snell Refraction & TIR'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 递归光线树 (Ray Tree) 与水晶球光追实验室' : '2. Recursive Ray Tree & Glass Sphere Lab'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. MIT 6.837 Lec 11 与 GLSL 光学核代码' : '3. MIT 6.837 Lec 11 & GLSL Kernels'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：光学棱镜与光纤总工程师' : '4. 3-Mission Game: Optical & Fiber Engineer'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={opticsCanvasRef} width={600} height={330} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-amber-300 font-bold"><span>Incident θ₁</span><span>{theta1}°</span></div>
              <input type="range" min={0} max={88} value={theta1} onChange={(e) => setTheta1(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-cyan-300 font-bold"><span>Top η₁</span><span>{eta1.toFixed(2)}</span></div>
              <input type="range" min={1.0} max={2.4} step={0.05} value={eta1} onChange={(e) => setEta1(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-emerald-300 font-bold"><span>Bottom η₂</span><span>{eta2.toFixed(2)}</span></div>
              <input type="range" min={1.0} max={2.4} step={0.05} value={eta2} onChange={(e) => setEta2(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={treeCanvasRef} width={660} height={360} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-amber-300 font-bold"><span>Ray Height Y</span><span>{rayY}</span></div>
              <input type="range" min={95} max={245} value={rayY} onChange={(e) => setRayY(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-cyan-300 font-bold"><span>Glass IOR η</span><span>{ior.toFixed(2)}</span></div>
              <input type="range" min={1.05} max={2.4} step={0.05} value={ior} onChange={(e) => setIor(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between text-emerald-300 font-bold"><span>Max Depth D</span><span>{maxDepth}</span></div>
              <input type="range" min={1} max={5} step={1} value={maxDepth} onChange={(e) => setMaxDepth(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            MIT 6.837 Lecture 11 &amp; UC Davis ECS 175 Lecture 15 (Recursive Ray Tracing)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可体验 Shadow Bias (ε) 自遮挡显微镜、实时 Whitted 光追帧缓冲与内嵌课程视频。'
              : 'Open the standalone HTML page above for the Shadow Bias (ε) Acne Microscope, live Whitted ray-traced buffer, and embedded lectures.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '光学棱镜与深海光纤总工程师 (3 关)' : 'Optical Prism & Fiber-Optic Chief Engineer'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(25); setGVal2(2); }
                    else if (m === 2) { setGVal1(45); setGVal2(1.25); }
                    else { setGVal1(30); setGVal2(1.6); }
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
                  min={10}
                  max={75}
                  step={1}
                  value={gVal1}
                  onChange={(e) => setGVal1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2}</span></div>
                <input
                  type="range"
                  min={mission === 1 ? 1 : 1.1}
                  max={mission === 1 ? 5 : 2.2}
                  step={mission === 1 ? 1 : 0.05}
                  value={gVal2}
                  onChange={(e) => setGVal2(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Adjust optical parameters to clear mission'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
