import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson11Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Vec3 = [number, number, number];

interface Mesh3D {
  verts: Vec3[];
  faces: number[][];
  scheme: 'cc' | 'loop';
}

function makeBaseMesh3D(kind: 'cube' | 'star' | 'torus' | 'octa'): Mesh3D {
  if (kind === 'cube') {
    return {
      verts: [
        [-1.1, -1.1, -1.1], [1.1, -1.1, -1.1], [1.1, 1.1, -1.1], [-1.1, 1.1, -1.1],
        [-1.1, -1.1, 1.1], [1.1, -1.1, 1.1], [1.1, 1.1, 1.1], [-1.1, 1.1, 1.1]
      ],
      faces: [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]],
      scheme: 'cc'
    };
  }
  if (kind === 'star') {
    return {
      verts: [
        [-0.7, -0.7, -0.7], [0.7, -0.7, -0.7], [0.7, 0.7, -0.7], [-0.7, 0.7, -0.7],
        [-0.7, -0.7, 0.7], [0.7, -0.7, 0.7], [0.7, 0.7, 0.7], [-0.7, 0.7, 0.7],
        [0, 1.9, 0], [0, -1.9, 0], [1.9, 0, 0], [-1.9, 0, 0]
      ],
      faces: [
        [2, 6, 8], [6, 7, 8], [7, 3, 8], [3, 2, 8],
        [0, 1, 9], [1, 5, 9], [5, 4, 9], [4, 0, 9],
        [1, 2, 10], [2, 6, 10], [6, 5, 10], [5, 1, 10],
        [0, 4, 11], [4, 7, 11], [7, 3, 11], [3, 0, 11]
      ],
      scheme: 'cc'
    };
  }
  if (kind === 'torus') {
    const verts: Vec3[] = [];
    const faces: number[][] = [];
    const R = 1.15, r = 0.48, N = 6, M = 4;
    for (let i = 0; i < N; i++) {
      const u = (i / N) * Math.PI * 2;
      for (let j = 0; j < M; j++) {
        const v = (j / M) * Math.PI * 2;
        verts.push([
          (R + r * Math.cos(v)) * Math.cos(u),
          r * Math.sin(v),
          (R + r * Math.cos(v)) * Math.sin(u)
        ]);
      }
    }
    for (let i = 0; i < N; i++) {
      const ni = (i + 1) % N;
      for (let j = 0; j < M; j++) {
        const nj = (j + 1) % M;
        faces.push([i * M + j, ni * M + j, ni * M + nj, i * M + nj]);
      }
    }
    return { verts, faces, scheme: 'cc' };
  }
  return {
    verts: [[1.45, 0, 0], [-1.45, 0, 0], [0, 1.45, 0], [0, -1.45, 0], [0, 0, 1.45], [0, 0, -1.45]],
    faces: [
      [2, 0, 4], [2, 4, 1], [2, 1, 5], [2, 5, 0],
      [3, 4, 0], [3, 1, 4], [3, 5, 1], [3, 0, 5]
    ],
    scheme: 'loop'
  };
}

function catmullClarkStep(mesh: Mesh3D, creaseAmount = 0): Mesh3D {
  const { verts, faces } = mesh;
  const V = verts.length;

  const facePts: Vec3[] = faces.map((f) => {
    const s: Vec3 = [0, 0, 0];
    f.forEach((vi) => {
      s[0] += verts[vi][0];
      s[1] += verts[vi][1];
      s[2] += verts[vi][2];
    });
    return [s[0] / f.length, s[1] / f.length, s[2] / f.length];
  });

  const edgeMap = new Map<string, number>();
  const edges: { v0: number; v1: number; faces: number[] }[] = [];
  const vertFaces: number[][] = Array.from({ length: V }, () => []);
  const vertEdges: number[][] = Array.from({ length: V }, () => []);

  faces.forEach((f, fi) => {
    f.forEach((v0, idx) => {
      vertFaces[v0].push(fi);
      const v1 = f[(idx + 1) % f.length];
      const key = v0 < v1 ? `${v0}_${v1}` : `${v1}_${v0}`;
      if (!edgeMap.has(key)) {
        const ei = edges.length;
        edgeMap.set(key, ei);
        edges.push({ v0: Math.min(v0, v1), v1: Math.max(v0, v1), faces: [fi] });
        vertEdges[v0].push(ei);
        vertEdges[v1].push(ei);
      } else {
        edges[edgeMap.get(key)!].faces.push(fi);
      }
    });
  });

  const edgePts: Vec3[] = edges.map((e) => {
    const p0 = verts[e.v0], p1 = verts[e.v1];
    const mid: Vec3 = [0.5 * (p0[0] + p1[0]), 0.5 * (p0[1] + p1[1]), 0.5 * (p0[2] + p1[2])];
    if (e.faces.length < 2) return mid;
    const f0 = facePts[e.faces[0]], f1 = facePts[e.faces[1]];
    const smooth: Vec3 = [
      0.25 * (p0[0] + p1[0] + f0[0] + f1[0]),
      0.25 * (p0[1] + p1[1] + f0[1] + f1[1]),
      0.25 * (p0[2] + p1[2] + f0[2] + f1[2])
    ];
    const isTop = p0[1] > 0.45 && p1[1] > 0.45;
    const c = isTop ? creaseAmount : 0;
    return [
      (1 - c) * smooth[0] + c * mid[0],
      (1 - c) * smooth[1] + c * mid[1],
      (1 - c) * smooth[2] + c * mid[2]
    ];
  });

  const newVerts: Vec3[] = verts.map((v, vi) => {
    const n = vertFaces[vi].length;
    if (n === 0) return [...v] as Vec3;
    const Favg: Vec3 = [0, 0, 0];
    vertFaces[vi].forEach((fi) => {
      Favg[0] += facePts[fi][0];
      Favg[1] += facePts[fi][1];
      Favg[2] += facePts[fi][2];
    });
    Favg[0] /= n; Favg[1] /= n; Favg[2] /= n;

    const Ravg: Vec3 = [0, 0, 0];
    const m = vertEdges[vi].length || 1;
    vertEdges[vi].forEach((ei) => {
      const e = edges[ei];
      Ravg[0] += 0.5 * (verts[e.v0][0] + verts[e.v1][0]);
      Ravg[1] += 0.5 * (verts[e.v0][1] + verts[e.v1][1]);
      Ravg[2] += 0.5 * (verts[e.v0][2] + verts[e.v1][2]);
    });
    Ravg[0] /= m; Ravg[1] /= m; Ravg[2] /= m;

    const smooth: Vec3 = [
      ((n - 3) * v[0] + Favg[0] + 2 * Ravg[0]) / n,
      ((n - 3) * v[1] + Favg[1] + 2 * Ravg[1]) / n,
      ((n - 3) * v[2] + Favg[2] + 2 * Ravg[2]) / n
    ];
    const isTop = v[1] > 0.45;
    const c = isTop ? creaseAmount : 0;
    return [
      (1 - c) * smooth[0] + c * v[0],
      (1 - c) * smooth[1] + c * v[1],
      (1 - c) * smooth[2] + c * v[2]
    ];
  });

  const edgeOffset = V;
  const faceOffset = V + edges.length;
  const allVerts: Vec3[] = [...newVerts, ...edgePts, ...facePts];
  const newFaces: number[][] = [];

  faces.forEach((f, fi) => {
    const fIdx = faceOffset + fi;
    const len = f.length;
    for (let i = 0; i < len; i++) {
      const vCurr = f[i];
      const vNext = f[(i + 1) % len];
      const vPrev = f[(i - 1 + len) % len];
      const kNext = vCurr < vNext ? `${vCurr}_${vNext}` : `${vNext}_${vCurr}`;
      const kPrev = vCurr < vPrev ? `${vCurr}_${vPrev}` : `${vPrev}_${vCurr}`;
      const eNext = edgeOffset + edgeMap.get(kNext)!;
      const ePrev = edgeOffset + edgeMap.get(kPrev)!;
      newFaces.push([vCurr, eNext, fIdx, ePrev]);
    }
  });

  return { verts: allVerts, faces: newFaces, scheme: 'cc' };
}

function loopStep(mesh: Mesh3D): Mesh3D {
  const { verts, faces } = mesh;
  const V = verts.length;
  const edgeMap = new Map<string, number>();
  const edges: { v0: number; v1: number; opp: number[] }[] = [];
  const nbrs: Set<number>[] = Array.from({ length: V }, () => new Set<number>());

  faces.forEach((f) => {
    for (let i = 0; i < 3; i++) {
      const v0 = f[i], v1 = f[(i + 1) % 3], vOpp = f[(i + 2) % 3];
      nbrs[v0].add(v1); nbrs[v1].add(v0);
      const key = v0 < v1 ? `${v0}_${v1}` : `${v1}_${v0}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, edges.length);
        edges.push({ v0: Math.min(v0, v1), v1: Math.max(v0, v1), opp: [vOpp] });
      } else {
        edges[edgeMap.get(key)!].opp.push(vOpp);
      }
    }
  });

  const newVerts: Vec3[] = verts.map((v, vi) => {
    const list = Array.from(nbrs[vi]);
    const n = list.length;
    const cTerm = 0.375 + 0.25 * Math.cos((2 * Math.PI) / n);
    const beta = (1 / n) * (0.625 - cTerm * cTerm);
    const sum: Vec3 = [0, 0, 0];
    list.forEach((ni) => {
      sum[0] += verts[ni][0];
      sum[1] += verts[ni][1];
      sum[2] += verts[ni][2];
    });
    const w0 = 1 - n * beta;
    return [w0 * v[0] + beta * sum[0], w0 * v[1] + beta * sum[1], w0 * v[2] + beta * sum[2]];
  });

  const edgePts: Vec3[] = edges.map((e) => {
    const p0 = verts[e.v0], p1 = verts[e.v1];
    if (e.opp.length < 2) return [0.5 * (p0[0] + p1[0]), 0.5 * (p0[1] + p1[1]), 0.5 * (p0[2] + p1[2])];
    const o0 = verts[e.opp[0]], o1 = verts[e.opp[1]];
    return [
      0.375 * (p0[0] + p1[0]) + 0.125 * (o0[0] + o1[0]),
      0.375 * (p0[1] + p1[1]) + 0.125 * (o0[1] + o1[1]),
      0.375 * (p0[2] + p1[2]) + 0.125 * (o0[2] + o1[2])
    ];
  });

  const allVerts: Vec3[] = [...newVerts, ...edgePts];
  const getE = (a: number, b: number) => V + edgeMap.get(a < b ? `${a}_${b}` : `${b}_${a}`)!;
  const newFaces: number[][] = [];
  faces.forEach(([v0, v1, v2]) => {
    const e01 = getE(v0, v1), e12 = getE(v1, v2), e20 = getE(v2, v0);
    newFaces.push([v0, e01, e20], [v1, e12, e01], [v2, e20, e12], [e01, e12, e20]);
  });

  return { verts: allVerts, faces: newFaces, scheme: 'loop' };
}

export const Lesson11Subdivision2: React.FC<Lesson11Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'halfedge' | 'game'>('concepts');

  // Tab 1 State: Stencil Explorer
  const [stencilMode, setStencilMode] = useState<'cc' | 'loop'>('cc');
  const [valence, setValence] = useState<number>(4);
  const stencilCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: 3D Subdivision Studio
  const [meshKind, setMeshKind] = useState<'cube' | 'star' | 'torus' | 'octa'>('cube');
  const [level, setLevel] = useState<number>(2);
  const [crease, setCrease] = useState<number>(0);
  const labCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gVal1, setGVal1] = useState<number>(24);
  const [gVal2, setGVal2] = useState<number>(4);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Tab 1 Stencil Explorer
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const c = stencilCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.5, R = 105;

    for (let i = 0; i < valence; i++) {
      const ang = (i / valence) * Math.PI * 2 - Math.PI / 2;
      const ex = cx + Math.cos(ang) * R, ey = cy + Math.sin(ang) * R;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(ex, ey, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, stencilMode, valence]);

  // Draw Tab 2 3D Subdivision Studio
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const c = labCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    let cur = makeBaseMesh3D(meshKind);
    for (let k = 0; k < level; k++) {
      cur = cur.scheme === 'cc' ? catmullClarkStep(cur, crease) : loopStep(cur);
    }

    const yaw = 0.65, pitch = 0.42;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const proj = cur.verts.map((v) => {
      const x1 = v[0] * cy - v[2] * sy;
      const z1 = v[0] * sy + v[2] * cy;
      const y2 = v[1] * cp - z1 * sp;
      const z2 = v[1] * sp + z1 * cp;
      const s = (4.8 / (4.8 + z2 * 0.4)) * 120;
      return [W * 0.5 + x1 * s, H * 0.52 - y2 * s, z2] as [number, number, number];
    });

    cur.faces.forEach((f) => {
      ctx.fillStyle = cur.scheme === 'cc' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(6, 182, 212, 0.22)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      f.forEach((vi, idx) => {
        const [sx, sy] = proj[vi];
        if (idx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }, [activeTab, meshKind, level, crease]);

  // Draw Tab 4 Game
  const gPassed =
    (mission === 1 && gVal1 === 36 && gVal2 === 6) ||
    (mission === 2 && gVal1 === 3 && gVal2 === 1) ||
    (mission === 3 && gVal1 === 5 && gVal2 === 5);

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
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
              <button
                onClick={onBackToPortal}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isZh ? '← 返回课程总目录 (Index)' : '← Back to Course Index'}
              </button>
              <span>•</span>
              <span>Stage 2 Capstone • Lesson 11 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-11.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L11: 细分曲面 (Part 2)：Catmull-Clark、Loop 细分算法与半边数据结构 (Half-Edge)'
                : 'L11: Subdivision Surfaces (Part 2): Catmull-Clark, Loop & Half-Edge Data Structure'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Tensor Stencil Derivation • UC Davis ECS 175 Lec 17 (Kenneth Joy) • Pixar Semi-Sharp Creases
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
              activeTab === 'concepts' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '1. 1D 张量积推导 Catmull-Clark 与 Loop 掩模' : '1. Tensor Stencils: Catmull-Clark & Loop'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 3D 实时细分工坊 (Catmull-Clark & Loop + 折痕)' : '2. 3D Real-Time Subdivision Studio'}
          </button>
          <button
            onClick={() => setActiveTab('halfedge')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'halfedge' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. 半边数据结构 (Half-Edge) 指针漫游器' : '3. Half-Edge Pointer Walker'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：皮克斯细分与半边架构师' : '4. 3-Mission Game: Pixar Subdivision Architect'}
          </button>
        </div>
      </div>

      {/* TAB 1 */}
      {activeTab === 'concepts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">
              {isZh
                ? '交互透视镜：Catmull-Clark 与 Loop 奇异点权重 (Valence n = 3..10)'
                : 'Interactive Visualizer: Catmull-Clark vs Loop Stencil Weights'}
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setStencilMode('cc')}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  stencilMode === 'cc' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Catmull-Clark
              </button>
              <button
                onClick={() => setStencilMode('loop')}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  stencilMode === 'loop' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Loop
              </button>
              <span className="text-amber-300 font-bold">n = {valence}</span>
              <input
                type="range"
                min={3}
                max={10}
                value={valence}
                onChange={(e) => setValence(Number(e.target.value))}
              />
            </div>
          </div>
          <canvas ref={stencilCanvasRef} width={600} height={300} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
        </div>
      )}

      {/* TAB 2 */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <canvas ref={labCanvasRef} width={700} height={420} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {(['cube', 'star', 'torus', 'octa'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setMeshKind(k)}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  meshKind === k ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {k.toUpperCase()}
              </button>
            ))}
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span>Level k = {level}</span>
              <input type="range" min={0} max={3} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>Crease s = {crease.toFixed(2)}</span>
              <input type="range" min={0} max={1} step={0.05} value={crease} onChange={(e) => setCrease(Number(e.target.value))} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 */}
      {activeTab === 'halfedge' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            Half-Edge Data Structure (`h.next`, `h.twin`, `h.twin.next`) &amp; UC Davis ECS 175 Lecture 17
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”可体验交互式半边数据结构指针漫游器（单步调试 h.next、h.twin 与 h.twin.next 一环遍历）以及内嵌的 UC Davis ECS 175 Lecture 17 视频。'
              : 'Open the standalone HTML page above for the interactive Half-Edge Pointer Walker and UC Davis ECS 175 Lecture 17.'}
          </p>
        </div>
      )}

      {/* TAB 4 */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '皮克斯细分曲面与半边架构师 (3 关)' : 'Pixar Subdivision & Half-Edge Architect'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    if (m === 1) { setGVal1(24); setGVal2(4); }
                    else if (m === 2) { setGVal1(2); setGVal2(2); }
                    else { setGVal1(2); setGVal2(3); }
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
                  min={mission === 1 ? 12 : 1}
                  max={mission === 1 ? 48 : 6}
                  step={mission === 1 ? 2 : 1}
                  value={gVal1}
                  onChange={(e) => setGVal1(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-cyan-300"><span>Param 2</span><span>{gVal2}</span></div>
                <input
                  type="range"
                  min={1}
                  max={mission === 1 ? 12 : 6}
                  step={1}
                  value={gVal2}
                  onChange={(e) => setGVal2(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div className={gPassed ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {gPassed ? '★ MISSION CLEARED!' : '● Adjust parameters to balance stencil / half-edge loop'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
