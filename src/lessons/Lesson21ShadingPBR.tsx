import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson21Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type PBRChannel = 'combined' | 'diffuse' | 'specular' | 'D' | 'F' | 'G';

function ggxD(ndoth: number, rough: number): number {
  const a = rough * rough;
  const a2 = a * a;
  const d = ndoth * ndoth * (a2 - 1.0) + 1.0;
  return a2 / (Math.PI * d * d);
}

function smithG(ndotv: number, ndotl: number, rough: number): number {
  const r = rough + 1.0;
  const k = (r * r) / 8.0;
  const gv = ndotv / (ndotv * (1.0 - k) + k);
  const gl = ndotl / (ndotl * (1.0 - k) + k);
  return gv * gl;
}

export const Lesson21ShadingPBR: React.FC<Lesson21Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1A state: Flat vs Gouraud vs Phong
  const [freqLx, setFreqLx] = useState<number>(0.0);
  const freqCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 1B state: Microfacet V-Cavity & GGX Polar Lobe
  const [mfRough, setMfRough] = useState<number>(0.35);
  const mfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 state: Real-Time PBR Sphere
  const [pbrChannel, setPbrChannel] = useState<PBRChannel>('combined');
  const [pbrRough, setPbrRough] = useState<number>(0.22);
  const [pbrMetal, setPbrMetal] = useState<number>(1.0);
  const [pbrAlbedo, setPbrAlbedo] = useState<[number, number, number]>([1.0, 0.78, 0.34]);
  const [pbrLightDeg, setPbrLightDeg] = useState<number>(35);
  const pbrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Mini-Game state
  const [m1Ans, setM1Ans] = useState<string>('gouraud');
  const [m2Ans, setM2Ans] = useState<string>('wrong1');
  const [m3Ans, setM3Ans] = useState<string>('D');

  const m1Passed = m1Ans === 'phong';
  const m2Passed = m2Ans === 'gold';
  const m3Passed = m3Ans === 'G';

  // Draw Tab 1A: Flat vs Gouraud vs Phong
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = freqCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const modes = [
      { id: 'flat', title: '1. Flat (Per-Face)', cx: 90 },
      { id: 'gouraud', title: '2. Gouraud (Per-Vertex)', cx: 260 },
      { id: 'phong', title: '3. Phong (Per-Pixel)', cx: 430 }
    ];

    const R = 68;
    const cy = 122;
    const L = { x: freqLx, y: -0.25, z: Math.sqrt(Math.max(0.1, 1 - freqLx * freqLx - 0.0625)) };
    const V = { x: 0, y: 0, z: 1 };
    const Hvec = { x: L.x + V.x, y: L.y + V.y, z: L.z + V.z };
    const hLen = Math.hypot(Hvec.x, Hvec.y, Hvec.z);
    Hvec.x /= hLen;
    Hvec.y /= hLen;
    Hvec.z /= hLen;

    const evalBlinn = (nx: number, ny: number, nz: number) => {
      const ndotl = Math.max(0, nx * L.x + ny * L.y + nz * L.z);
      const ndoth = Math.max(0, nx * Hvec.x + ny * Hvec.y + nz * Hvec.z);
      return Math.min(1.0, 0.12 + 0.48 * ndotl + 0.85 * Math.pow(ndoth, 42));
    };

    const qStep = 34;
    modes.forEach(m => {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(m.title, m.cx - 56, 24);

      for (let dy = -R; dy <= R; dy += 2) {
        for (let dx = -R; dx <= R; dx += 2) {
          if (dx * dx + dy * dy > R * R) continue;
          let I = 0;
          if (m.id === 'flat') {
            const fx = Math.floor((dx + R) / qStep) * qStep - R + qStep * 0.5;
            const fy = Math.floor((dy + R) / qStep) * qStep - R + qStep * 0.5;
            const nx = fx / R;
            const ny = fy / R;
            const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
            I = evalBlinn(nx, ny, nz);
          } else if (m.id === 'gouraud') {
            const gx = (dx + R) / qStep;
            const gy = (dy + R) / qStep;
            const ix = Math.floor(gx);
            const iy = Math.floor(gy);
            const tx = gx - ix;
            const ty = gy - iy;
            const vertI = (vx: number, vy: number) => {
              const px = (vx * qStep - R) / R;
              const py = (vy * qStep - R) / R;
              const pz = Math.sqrt(Math.max(0.05, 1 - px * px - py * py));
              return evalBlinn(px, py, pz);
            };
            I =
              (1 - tx) * (1 - ty) * vertI(ix, iy) +
              tx * (1 - ty) * vertI(ix + 1, iy) +
              (1 - tx) * ty * vertI(ix, iy + 1) +
              tx * ty * vertI(ix + 1, iy + 1);
          } else {
            const nx = dx / R;
            const ny = dy / R;
            const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
            I = evalBlinn(nx, ny, nz);
          }
          const c = Math.round(I * 245);
          ctx.fillStyle = `rgb(${Math.round(c * 0.35)}, ${Math.round(c * 0.72)}, ${c})`;
          ctx.fillRect(m.cx + dx, cy + dy, 2.2, 2.2);
        }
      }
    });
  }, [activeTab, freqLx]);

  // Draw Tab 1B: Microfacet V-Cavity & GGX Polar Lobe
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = mfCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const baseY = 215;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const x = 18 + (i / 16) * 235;
      const amp = mfRough * 48;
      const y = i % 2 === 0 ? baseY - amp : baseY + amp * 0.4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const pCx = 390;
    const pCy = 215;
    const pScale = 64;
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.arc(pCx, pCy, 105, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const theta = (i / 120) * Math.PI - Math.PI * 0.5;
      const ndoth = Math.cos(theta);
      const r = Math.min(2.5, ggxD(ndoth, mfRough)) * pScale;
      const x = pCx + Math.sin(theta) * r;
      const y = pCy - Math.cos(theta) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }, [activeTab, mfRough]);

  // Draw Tab 2: Real-Time PBR Sphere
  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = pbrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.5;
    const R = 150;
    const phi = (pbrLightDeg * Math.PI) / 180;
    const L = { x: Math.sin(phi) * 0.82, y: -0.42, z: Math.cos(phi) * 0.82 };
    const lLen = Math.hypot(L.x, L.y, L.z);
    L.x /= lLen;
    L.y /= lLen;
    L.z /= lLen;

    const Hvec = { x: L.x, y: L.y, z: L.z + 1.0 };
    const hLen = Math.hypot(Hvec.x, Hvec.y, Hvec.z);
    Hvec.x /= hLen;
    Hvec.y /= hLen;
    Hvec.z /= hLen;

    const F0 = [
      0.04 * (1 - pbrMetal) + pbrAlbedo[0] * pbrMetal,
      0.04 * (1 - pbrMetal) + pbrAlbedo[1] * pbrMetal,
      0.04 * (1 - pbrMetal) + pbrAlbedo[2] * pbrMetal
    ];

    const step = 2;
    for (let py = cy - R; py <= cy + R; py += step) {
      for (let px = cx - R; px <= cx + R; px += step) {
        const nx = (px - cx) / R;
        const ny = (py - cy) / R;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1.0) continue;
        const nz = Math.sqrt(1.0 - r2);

        const ndotl = Math.max(0.001, nx * L.x + ny * L.y + nz * L.z);
        const ndotv = Math.max(0.001, nz);
        const ndoth = Math.max(0.0, nx * Hvec.x + ny * Hvec.y + nz * Hvec.z);

        const D = ggxD(ndoth, pbrRough);
        const G = smithG(ndotv, ndotl, pbrRough);
        const fPow = Math.pow(1.0 - ndotv, 5);
        const F = [
          F0[0] + (1.0 - F0[0]) * fPow,
          F0[1] + (1.0 - F0[1]) * fPow,
          F0[2] + (1.0 - F0[2]) * fPow
        ];

        const denom = 4.0 * ndotl * ndotv;
        const spec = [(D * G * F[0]) / denom, (D * G * F[1]) / denom, (D * G * F[2]) / denom];
        const kD = [
          (1.0 - F[0]) * (1.0 - pbrMetal),
          (1.0 - F[1]) * (1.0 - pbrMetal),
          (1.0 - F[2]) * (1.0 - pbrMetal)
        ];
        const diff = [
          (kD[0] * pbrAlbedo[0]) / Math.PI,
          (kD[1] * pbrAlbedo[1]) / Math.PI,
          (kD[2] * pbrAlbedo[2]) / Math.PI
        ];

        const rad = 3.6;
        let out = [0, 0, 0];
        if (pbrChannel === 'combined') {
          out = [
            (diff[0] + spec[0]) * rad * ndotl + F[0] * 0.14,
            (diff[1] + spec[1]) * rad * ndotl + F[1] * 0.14,
            (diff[2] + spec[2]) * rad * ndotl + F[2] * 0.14
          ];
        } else if (pbrChannel === 'diffuse') {
          out = [diff[0] * rad * ndotl, diff[1] * rad * ndotl, diff[2] * rad * ndotl];
        } else if (pbrChannel === 'specular') {
          out = [spec[0] * rad * ndotl, spec[1] * rad * ndotl, spec[2] * rad * ndotl];
        } else if (pbrChannel === 'D') {
          const dv = Math.min(1.0, D * 0.25);
          out = [dv, dv, dv];
        } else if (pbrChannel === 'F') {
          out = F;
        } else {
          out = [G, G, G];
        }

        const tm = (v: number) =>
          Math.min(255, Math.round(Math.pow(v / (1 + v * 0.45), 1 / 2.2) * 255));
        ctx.fillStyle = `rgb(${tm(out[0])}, ${tm(out[1])}, ${tm(out[2])})`;
        ctx.fillRect(px, py, step, step);
      }
    }
  }, [activeTab, pbrChannel, pbrRough, pbrMetal, pbrAlbedo, pbrLightDeg]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1.5">
            <button
              onClick={onBackToPortal}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              {isZh ? '← 返回课程总目录' : '← Back to Index'}
            </button>
            <span>•</span>
            <span>Stage 4 • Lesson 21 / 32</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isZh
              ? 'L21: 光照与着色模型：从 Phong 到现代微表面 PBR'
              : 'L21: Shading Models — Flat/Gouraud/Phong, Blinn-Phong & Cook-Torrance PBR'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Flat / Gouraud / Phong Shading Frequencies • Halfway Vector H • Energy Conservation •
            Cook–Torrance Microfacet BRDF (GGX D, Schlick F, Smith G)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="lessons/lesson-21.html"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 transition"
          >
            {isZh ? '↗ 全屏打开独立 HTML 课件' : '↗ Open Standalone HTML'}
          </a>
          <button
            onClick={onToggleComplete}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:text-white'
            }`}
          >
            {isCompleted ? (isZh ? '✓ 已完成本课' : '✓ Completed') : isZh ? '标记完成' : 'Mark Complete'}
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 1, zh: '1. 📐 3B1B 着色频率与微表面 D-F-G 直觉', en: '1. 📐 3B1B Shading Freq & D-F-G Intuition' },
          { id: 2, zh: '2. 🌐 实时 PBR 材质球与 D/F/G 拆解实验室', en: '2. 🌐 Real-Time PBR Sphere & D/F/G Lab' },
          { id: 3, zh: '3. 🎥 UCD L08 / MIT L13 & GLSL PBR 源码', en: '3. 🎥 UCD L08 / MIT L13 & GLSL Code' },
          { id: 4, zh: '4. 🎮 3 关 PBR 首席技术美术挑战', en: '4. 🎮 3-Mission PBR Material Game' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 1 | 2 | 3 | 4)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {isZh ? t.zh : t.en}
          </button>
        ))}
      </div>

      {/* TAB 1 */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-indigo-300">
              1. Flat vs. Gouraud vs. Phong Shading Frequency
            </h2>
            <canvas
              ref={freqCanvasRef}
              width={520}
              height={215}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex items-center gap-4 text-xs">
              <span>Light Aim X:</span>
              <input
                type="range"
                min={-0.8}
                max={0.8}
                step={0.02}
                value={freqLx}
                onChange={e => setFreqLx(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <span className="font-mono text-cyan-400">{freqLx.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-emerald-300">
              2. Microfacet V-Cavity Profile & GGX Energy-Conserving Lobe D(h)
            </h2>
            <canvas
              ref={mfCanvasRef}
              width={520}
              height={250}
              className="w-full rounded-xl bg-slate-950 border border-slate-800"
            />
            <div className="flex items-center gap-4 text-xs">
              <span>Roughness:</span>
              <input
                type="range"
                min={0.08}
                max={0.95}
                step={0.02}
                value={mfRough}
                onChange={e => setMfRough(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-400"
              />
              <span className="font-mono text-emerald-400">{mfRough.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              🌐 Real-Time Cook–Torrance PBR Material Sphere & D/F/G Decomposer
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {(['combined', 'diffuse', 'specular', 'D', 'F', 'G'] as PBRChannel[]).map(ch => (
                <button
                  key={ch}
                  onClick={() => setPbrChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase ${
                    pbrChannel === ch ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6">
              <canvas
                ref={pbrCanvasRef}
                width={380}
                height={380}
                className="w-full aspect-square rounded-xl bg-slate-950 border border-slate-800"
              />
            </div>
            <div className="lg:col-span-6 space-y-3 text-xs">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setPbrAlbedo([1.0, 0.78, 0.34]);
                    setPbrMetal(1.0);
                    setPbrRough(0.22);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold"
                >
                  🪙 24K Gold
                </button>
                <button
                  onClick={() => {
                    setPbrAlbedo([0.88, 0.14, 0.18]);
                    setPbrMetal(0.0);
                    setPbrRough(0.18);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold"
                >
                  🚗 Red Car Paint
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span>Roughness:</span>
                  <span className="font-mono text-emerald-400">{pbrRough.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1.0}
                  step={0.01}
                  value={pbrRough}
                  onChange={e => setPbrRough(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
                <div className="flex justify-between">
                  <span>Metallic:</span>
                  <span className="font-mono text-amber-400">{pbrMetal.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.02}
                  value={pbrMetal}
                  onChange={e => setPbrMetal(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between">
                  <span>Light Azimuth:</span>
                  <span className="font-mono text-cyan-400">{pbrLightDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-80}
                  max={80}
                  step={2}
                  value={pbrLightDeg}
                  onChange={e => setPbrLightDeg(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h2 className="text-lg font-bold text-amber-300">
            🎥 UC Davis ECS 175 Lecture 08 & MIT 6.837 Lecture 13 (Shading & Microfacet PBR)
          </h2>
          <p className="leading-relaxed">
            {isZh
              ? 'Cook–Torrance 微表面 PBR 将表面建模为无数微小平面镜的集合：半程向量 H 是能够将入射光 L 反射入视线 V 的唯一微平面法线朝向，D(h) 统计朝向 H 的微镜面面积密度，F(v,h) 计算菲涅尔反射率，G(l,v) 扣除微山谷的自阴影与视线掩蔽。'
              : 'Cook–Torrance microfacet PBR models a surface as microscopic mirrors: only facets aligned with the halfway vector H reflect L into V, combined via D(h), F(v,h), and Smith shadowing-masking G(l,v).'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-emerald-300">
              {isZh ? '🎮 3 关 PBR 与材质首席技术美术挑战赛' : '🎮 3-Mission PBR Material Game'}
            </h2>
            <div className="flex gap-2 text-xs font-bold">
              <span
                className={`px-3 py-1 rounded-full border ${
                  m1Passed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                M1: {m1Passed ? '✓' : '...'}
              </span>
              <span
                className={`px-3 py-1 rounded-full border ${
                  m2Passed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                M2: {m2Passed ? '✓' : '...'}
              </span>
              <span
                className={`px-3 py-1 rounded-full border ${
                  m3Passed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                M3: {m3Passed ? '✓' : '...'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-cyan-400">Mission 1: Missing Center Highlight</div>
              <select
                value={m1Ans}
                onChange={e => setM1Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="flat">Flat Shading</option>
                <option value="gouraud">Gouraud Shading (Per-Vertex)</option>
                <option value="phong">Phong Shading (Per-Pixel Normal Interp)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400">Mission 2: 24K Gold Conductor Physics</div>
              <select
                value={m2Ans}
                onChange={e => setM2Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="wrong1">Diffuse = Gold, F0 = 0.04</option>
                <option value="gold">Diffuse k_d = 0, Tinted F0 = (1.0, 0.78, 0.34)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400">Mission 3: Grazing Angle Attenuation</div>
              <select
                value={m3Ans}
                onChange={e => setM3Ans(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
              >
                <option value="D">D(h) — Normal Distribution</option>
                <option value="F">F(v, h) — Fresnel</option>
                <option value="G">G(l, v, α) — Smith Shadowing-Masking</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
