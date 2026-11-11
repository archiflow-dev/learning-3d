import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson26Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

export const Lesson26Skinning: React.FC<Lesson26Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);

  // Tab 1: Manifold Chord Shrinkage cos(theta/2) vs Dual Quaternion Arc
  const [mathTheta, setMathTheta] = useState<number>(120);
  const [mathWeight, setMathWeight] = useState<number>(0.5);
  const mathCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 1: Elbow Bend, Weight Heatmap & Inverse Bind Pose B_i^-1
  const [elbowAngle, setElbowAngle] = useState<number>(85);
  const [sigma, setSigma] = useState<number>(0.38);
  const [useInvBind, setUseInvBind] = useState<boolean>(true);
  const lab1CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 Lab 2: LBS Candy-Wrapper Collapse vs DQS Twist Arena
  const [twistDeg, setTwistDeg] = useState<number>(156);
  const lab2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [passed, setPassed] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({ 1: false, 2: false, 3: false });
  const [gameBind, setGameBind] = useState<'wrong' | 'correct'>('wrong');
  const [gameSigma, setGameSigma] = useState<number>(0.02);
  const [gameMethod, setGameMethod] = useState<'lbs' | 'dqs'>('lbs');
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

    const w2 = mathWeight;
    const w1 = 1 - w2;
    const theta = (mathTheta * Math.PI) / 180;
    const bx = w1 + w2 * Math.cos(theta);
    const by = w2 * Math.sin(theta);
    const rLbs = Math.hypot(bx, by);

    const cx1 = 165;
    const cy1 = 160;
    const R = 105;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx1, cy1, R, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx1, cy1, R, -theta, 0);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx1 + R, cy1);
    ctx.lineTo(cx1 + R * Math.cos(theta), cy1 - R * Math.sin(theta));
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx1 + R * bx, cy1 - R * by, 6, 0, Math.PI * 2);
    ctx.fill();

    const dqsAngle = w2 * theta;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx1 + R * Math.cos(dqsAngle), cy1 - R * Math.sin(dqsAngle), 6, 0, Math.PI * 2);
    ctx.fill();

    const cx2 = 480;
    const cy2 = 160;
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx2, cy2, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#f43f5e';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx2, cy2, Math.max(2, R * rLbs), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [activeTab, mathTheta, mathWeight]);

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

        const shoulder = { x: 140, y: 205 };
        const elbowBind = { x: 325, y: 205 };
        const rad = (-elbowAngle * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const skinVertex = (vx: number, vy: number) => {
          const s = (vx - elbowBind.x) / 170;
          const t = Math.max(0, Math.min(1, (s + sigma) / (2 * Math.max(0.01, sigma))));
          const w1 = t * t * (3 - 2 * t);
          const w0 = 1 - w1;
          let p1x: number;
          let p1y: number;
          if (useInvBind) {
            const lx = vx - elbowBind.x;
            const ly = vy - elbowBind.y;
            p1x = elbowBind.x + lx * cosA - ly * sinA;
            p1y = elbowBind.y + lx * sinA + ly * cosA;
          } else {
            p1x = elbowBind.x + vx * cosA - vy * sinA;
            p1y = elbowBind.y + vx * sinA + vy * cosA;
          }
          return { x: w0 * vx + w1 * p1x, y: w0 * vy + w1 * p1y, w1 };
        };

        const cols = 42;
        const topPts = [];
        const botPts = [];
        for (let i = 0; i <= cols; i++) {
          const vx = 140 + (i / cols) * 350;
          topPts.push(skinVertex(vx, 205 - 34));
          botPts.push(skinVertex(vx, 205 + 34));
        }

        for (let i = 0; i < cols; i++) {
          const w = topPts[i].w1;
          const r = Math.floor(255 * Math.min(1, w * 1.8));
          const g = Math.floor(220 * (1 - Math.abs(w - 0.5) * 1.7));
          const b = Math.floor(255 * Math.min(1, (1 - w) * 1.8));
          ctx.fillStyle = `rgba(${r},${g},${b},0.38)`;
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(topPts[i].x, topPts[i].y);
          ctx.lineTo(topPts[i + 1].x, topPts[i + 1].y);
          ctx.lineTo(botPts[i + 1].x, botPts[i + 1].y);
          ctx.lineTo(botPts[i].x, botPts[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        const wrist = { x: elbowBind.x + 165 * cosA, y: elbowBind.y + 165 * sinA };
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(shoulder.x, shoulder.y);
        ctx.lineTo(elbowBind.x, elbowBind.y);
        ctx.lineTo(wrist.x, wrist.y);
        ctx.stroke();
      }
    }

    const c2 = lab2CanvasRef.current;
    if (c2) {
      const ctx = c2.getContext('2d');
      if (ctx) {
        const W = c2.width;
        const H = c2.height;
        ctx.clearRect(0, 0, W, H);
        const phi = (twistDeg * Math.PI) / 180;

        const drawCyl = (cy: number, isDQS: boolean, col: string) => {
          const startX = 85;
          const len = 490;
          const baseR = 48;
          const slices = 40;
          for (let i = 0; i <= slices; i += 4) {
            const w = i / slices;
            const x = startX + w * len;
            const bx = 1 - w + w * Math.cos(phi);
            const by = w * Math.sin(phi);
            const rScale = isDQS ? 1.0 : Math.hypot(bx, by);
            ctx.strokeStyle = i === slices / 2 ? '#fde047' : col;
            ctx.lineWidth = i === slices / 2 ? 2.5 : 1.3;
            ctx.beginPath();
            ctx.ellipse(x, cy, 9, Math.max(1.5, baseR * rScale), 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        };

        drawCyl(95, false, '#f43f5e');
        drawCyl(255, true, '#10b981');
      }
    }
  }, [activeTab, elbowAngle, sigma, useInvBind, twistDeg]);

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

    const startX = 85;
    const len = 450;
    const cy = 160;
    const baseR = 48;
    const phi = (165 * Math.PI) / 180;
    const offsetBug = gameBind === 'wrong' ? -65 : 0;

    for (let i = 0; i <= 36; i += 2) {
      const w = i / 36;
      const x = startX + w * len;
      const bx = 1 - w + w * Math.cos(phi);
      const by = w * Math.sin(phi);
      const rScale = gameMethod === 'dqs' ? 1.0 : Math.hypot(bx, by);
      const yOff = i > 18 ? offsetBug : 0;
      ctx.strokeStyle = gameMethod === 'dqs' && gameBind === 'correct' ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, cy + yOff, 8, Math.max(2, baseR * rScale), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [activeTab, gameBind, gameSigma, gameMethod]);

  const handleVerifyMission = () => {
    let ok = false;
    if (mission === 1) ok = gameBind === 'correct';
    else if (mission === 2) ok = gameBind === 'correct' && gameSigma >= 0.28 && gameSigma <= 0.55;
    else ok = gameBind === 'correct' && gameSigma >= 0.28 && gameMethod === 'dqs';

    if (ok) {
      setPassed(prev => ({ ...prev, [mission]: true }));
      setGameFeedback({
        ok: true,
        msg: isZh
          ? `🎉 恭喜通过关卡 ${mission}！你的角色骨骼蒙皮与双四元数 DQS 管线完全达标！`
          : `🎉 Mission ${mission} Complete! Your skeletal skinning and DQS pipeline is verified!`
      });
    } else {
      setGameFeedback({
        ok: false,
        msg: isZh
          ? '⚠️ 参数未达标：请检查 M_i = T_i B_i⁻¹、权重柔化半径 σ ∈ [0.28, 0.55] 或双四元数 DQS 选项！'
          : '⚠️ Check M_i = T_i B_i⁻¹, Weight Falloff σ ∈ [0.28, 0.55], or Dual Quaternion Skinning (DQS)!'
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
            <span>Stage 5 • L26</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isZh
              ? 'L26: 角色动画与骨骼蒙皮 (Skeletal Animation, LBS & Dual Quaternions)'
              : 'L26: Rigging, Bind Pose Matrices, Linear Blend Skinning (LBS) & DQS'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="lessons/lesson-26.html"
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
          { id: 2 as const, zh: '🔬 2. 权重热力图与糖果纸扭转实验室', en: '🔬 2. Weight Heatmap & Candy-Wrapper Labs' },
          { id: 3 as const, zh: '🎬 3. 名校公开课与笔记', en: '🎬 3. Course Videos & Notes' },
          { id: 4 as const, zh: '🎮 4. 闯关游戏：首席角色蒙皮技术总监', en: '🎮 4. Game: Chief Rigging Director' }
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
              ? '旋转流形弦长坍缩 cos(θ/2) vs. 双四元数测地弧 DQS 横截面对比仪'
              : 'Manifold Chord Shrinkage cos(θ/2) vs. Dual-Quaternion Cross-Section Visualizer'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800">
              <canvas ref={mathCanvasRef} width={650} height={320} className="w-full rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-5 border border-slate-800 space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '前臂扭转角 θ' : 'Forearm Twist θ'}</span>
                  <span className="font-mono text-indigo-400">{mathTheta}°</span>
                </div>
                <input type="range" min={0} max={180} step={2} value={mathTheta} onChange={e => setMathTheta(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '前臂权重 w2' : 'Forearm Weight w2'}</span>
                  <span className="font-mono text-cyan-400">{mathWeight.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.02} value={mathWeight} onChange={e => setMathWeight(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {isZh ? '实验台 1：双骨手肘弯曲、权重热力图与 B_i⁻¹ 绑定逆矩阵' : 'Lab 1: Elbow Bend, Weight Heatmap & Inverse Bind Matrix'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab1CanvasRef} width={660} height={350} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '屈肘角 θ_elbow' : 'Elbow Bend Angle'}</span>
                    <span className="font-mono text-indigo-400">{elbowAngle}°</span>
                  </div>
                  <input type="range" min={-125} max={125} step={1} value={elbowAngle} onChange={e => setElbowAngle(parseInt(e.target.value, 10))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '权重过渡半径 σ' : 'Weight Falloff σ'}</span>
                    <span className="font-mono text-cyan-400">{sigma.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.01} max={0.75} step={0.02} value={sigma} onChange={e => setSigma(parseFloat(e.target.value))} className="w-full" />
                </div>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input type="checkbox" checked={useInvBind} onChange={e => setUseInvBind(e.target.checked)} />
                  <span>{isZh ? '乘以绑定姿态逆矩阵 B_i⁻¹' : 'Multiply by Inverse Bind Matrix B_i⁻¹'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {isZh ? '实验台 2：LBS 糖果纸坍缩 vs. DQS 双四元数保体积扭转竞技场' : 'Lab 2: LBS Candy-Wrapper Collapse vs. DQS Twist Arena'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 border border-slate-800">
                <canvas ref={lab2CanvasRef} width={660} height={350} className="w-full rounded-lg" />
              </div>
              <div className="lg:col-span-4 bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>{isZh ? '前臂轴向扭转角' : 'Axial Twist Angle'}</span>
                    <span className="font-mono text-rose-400">{twistDeg}°</span>
                  </div>
                  <input type="range" min={0} max={180} step={2} value={twistDeg} onChange={e => setTwistDeg(parseInt(e.target.value, 10))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-cyan-400">MIT 6.837 • Lecture 06</div>
            <h3 className="text-base font-bold text-white">Computer Animation & Skinning (Prof. Justin Solomon)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '讲解骨骼层级变换、绑定姿态逆矩阵 B_i⁻¹、线性混合蒙皮 (LBS / SSD) 及其糖果纸体积坍缩缺陷。'
                : 'Covers skeletal hierarchies, inverse bind pose matrices B_i⁻¹, Linear Blend Skinning (LBS), and candy-wrapper collapse.'}
            </p>
          </div>
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">Kavan et al. 2007 • Dual Quaternion Skinning</div>
            <h3 className="text-base font-bold text-white">Skinning with Dual Quaternions (SIGGRAPH)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isZh
                ? '利用单位双四元数将旋转与平移耦合在 SE(3) 流形上插值，彻底根除关节扭转时的体积损失。'
                : 'Blends rigid transformations on the SE(3) manifold using unit dual quaternions to eliminate volume loss under twist.'}
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
                value={gameBind}
                onChange={e => setGameBind(e.target.value as 'wrong' | 'correct')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="wrong">Wrong: M_i = T_i (Missing B_i⁻¹)</option>
                <option value="correct">Correct: M_i = T_i * B_i⁻¹</option>
              </select>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{isZh ? '权重过渡柔化半径 σ' : 'Weight Falloff σ'}</span>
                  <span className="font-mono text-cyan-400">{gameSigma.toFixed(2)}</span>
                </div>
                <input type="range" min={0.02} max={0.6} step={0.02} value={gameSigma} onChange={e => setGameSigma(parseFloat(e.target.value))} className="w-full" />
              </div>

              <select
                value={gameMethod}
                onChange={e => setGameMethod(e.target.value as 'lbs' | 'dqs')}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 p-2 text-white"
              >
                <option value="lbs">Linear Blend Skinning (LBS)</option>
                <option value="dqs">Dual Quaternion Skinning (DQS)</option>
              </select>

              <button
                onClick={handleVerifyMission}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white"
              >
                {isZh ? '🚀 验证角色蒙皮管线' : '🚀 Verify Skinning Pipeline'}
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
