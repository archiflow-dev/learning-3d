import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../App';

interface Lesson05Props {
  lang: Language;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onBackToPortal: () => void;
}

type Mat4 = number[];

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

function mat4Identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4Mul(A: Mat4, B: Mat4): Mat4 {
  const C = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += A[r * 4 + k] * B[k * 4 + c];
      C[r * 4 + c] = s;
    }
  }
  return C;
}

function mat4Translate(tx: number, ty: number, tz: number): Mat4 {
  return [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1];
}

function mat4RotX(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
}

function mat4RotY(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
}

function mat4RotZ(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function mat4TransformPoint(M: Mat4, p: [number, number, number]): [number, number, number] {
  return [
    M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3],
    M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7],
    M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]
  ];
}

function mat4RigidInverse(M: Mat4): Mat4 {
  const r00 = M[0], r01 = M[1], r02 = M[2], tx = M[3];
  const r10 = M[4], r11 = M[5], r12 = M[6], ty = M[7];
  const r20 = M[8], r21 = M[9], r22 = M[10], tz = M[11];
  const itx = -(r00 * tx + r10 * ty + r20 * tz);
  const ity = -(r01 * tx + r11 * ty + r21 * tz);
  const itz = -(r02 * tx + r12 * ty + r22 * tz);
  return [r00, r10, r20, itx, r01, r11, r21, ity, r02, r12, r22, itz, 0, 0, 0, 1];
}

interface SceneNode {
  id: string;
  parent: string | null;
  depth: number;
  nameZh: string;
  nameEn: string;
  color: string;
  local: Mat4;
  parentWorld: Mat4;
  world: Mat4;
  chain: string[];
}

const DFS_OPS = [
  { code: 'CTM = Identity()', node: 'Root', descZh: '初始化矩阵栈，栈底放入世界单位矩阵 I。', descEn: 'Initialize Matrix Stack with Identity matrix I at bottom.' },
  { code: 'pushMatrix(); multMatrix(M_shoulder); draw(UpperArm)', node: 'UpperArm', descZh: '压栈备份 I；右乘大臂矩阵 M_shoulder 并绘制蓝色大臂。', descEn: 'Push I; right-multiply M_shoulder and draw Upper Arm.' },
  { code: 'pushMatrix(); multMatrix(M_elbow); draw(Forearm)', node: 'Forearm', descZh: '压栈备份大臂标架；右乘前臂矩阵 M_elbow 并绘制绿色前臂。', descEn: 'Push UpperArm frame; right-multiply M_elbow and draw Forearm.' },
  { code: 'pushMatrix(); multMatrix(M_wrist); draw(WristHub)', node: 'Wrist', descZh: '压栈备份前臂标架；右乘手腕矩阵 M_wrist，到达分叉枢纽 Wrist！', descEn: 'Push Forearm frame; right-multiply M_wrist at branching hub!' },
  { code: 'pushMatrix(); // Enter Branch 1: Left Finger', node: 'LeftFinger', descZh: '【进入分支 1：左手指】先调用 pushMatrix() 保护手腕标架不被污染！', descEn: '[Enter Branch 1: Left Finger] Call pushMatrix() to protect Wrist frame!' },
  { code: 'multMatrix(M_leftFinger); draw(LeftFinger)', node: 'LeftFinger', descZh: '右乘左手指局部偏移与张开角 M_leftFinger，绘制左手指（此时 CTM 在左指尖）。', descEn: 'Right-multiply M_leftFinger and draw Left Finger (CTM is now at Left Finger tip).' },
  { code: 'popMatrix(); // Exit Branch 1 -> Restore Wrist!', node: 'Wrist', descZh: '【关键一步】左手指画完，调用 popMatrix() 弹出左手指矩阵，CTM 瞬间回滚到手腕中心！', descEn: '[CRITICAL] Call popMatrix() after Left Finger so CTM rolls back to Wrist hub!' },
  { code: 'pushMatrix(); // Enter Branch 2: Right Finger', node: 'RightFinger', descZh: '【进入分支 2：右手指】从干净的手腕标架再次 pushMatrix()！', descEn: '[Enter Branch 2: Right Finger] Push clean Wrist frame for Right Finger!' },
  { code: 'multMatrix(M_rightFinger); draw(RightFinger)', node: 'RightFinger', descZh: '右乘右手指局部矩阵 M_rightFinger，绘制对称的右手指！', descEn: 'Right-multiply M_rightFinger and draw symmetric Right Finger!' },
  { code: 'popMatrix(); // Exit Branch 2', node: 'Wrist', descZh: '右手指绘制完毕，popMatrix() 回到手腕标架。', descEn: 'Pop Right Finger matrix, returning to Wrist frame.' },
  { code: 'popMatrix(); // Exit Wrist -> Forearm', node: 'Forearm', descZh: '手腕子树全部完成，popMatrix() 回退到前臂标架。', descEn: 'Wrist subtree done; pop back to Forearm frame.' },
  { code: 'popMatrix(); // Exit Forearm -> UpperArm', node: 'UpperArm', descZh: '前臂子树完成，popMatrix() 回退到大臂标架。', descEn: 'Forearm subtree done; pop back to UpperArm frame.' },
  { code: 'popMatrix(); // Exit UpperArm -> Root (Done!)', node: 'Root', descZh: '整棵场景图 DFS 遍历完成，矩阵栈回归初始状态 [I]！', descEn: 'Full Scene Graph DFS complete; stack restored to [I]!' }
];

export const Lesson05Hierarchical: React.FC<Lesson05Props> = ({
  lang,
  isCompleted,
  onToggleComplete,
  onBackToPortal
}) => {
  const isZh = lang === 'zh';
  const [activeTab, setActiveTab] = useState<'concepts' | 'lab' | 'videos' | 'game'>('concepts');

  // Visualizer 1 State: Left-to-Right vs Right-to-Left Duality
  const [dualityMode, setDualityMode] = useState<'LTR' | 'RTL'>('LTR');
  const [dualityStep, setDualityStep] = useState<number>(3);
  const [dualTheta1, setDualTheta1] = useState<number>(35);
  const [dualTheta2, setDualTheta2] = useState<number>(-50);
  const [dualTheta3, setDualTheta3] = useState<number>(40);
  const dualityCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Visualizer 2 State: DFS Matrix Stack Stepper
  const [dfsStep, setDfsStep] = useState<number>(12);
  const [buggyPop, setBuggyPop] = useState<boolean>(false);
  const stackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 2 State: 3D Scene Graph Lab
  const [labPreset, setLabPreset] = useState<'robot' | 'solar'>('robot');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('wrist');
  const [baseYaw, setBaseYaw] = useState<number>(25);
  const [shoulderPitch, setShoulderPitch] = useState<number>(30);
  const [elbowPitch, setElbowPitch] = useState<number>(-45);
  const [wristRoll, setWristRoll] = useState<number>(20);
  const [fingerSpread, setFingerSpread] = useState<number>(24);
  const [camYaw, setCamYaw] = useState<number>(0.65);
  const [camPitch, setCamPitch] = useState<number>(0.42);
  const labCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tab 4 State: 3-Mission Mini-Game
  const [mission, setMission] = useState<1 | 2 | 3>(1);
  const [gamePopFixed, setGamePopFixed] = useState<boolean>(false);
  const [gTheta1, setGTheta1] = useState<number>(38);
  const [gTheta2, setGTheta2] = useState<number>(-18);
  const [gTheta3, setGTheta3] = useState<number>(5);
  const [gGrip, setGGrip] = useState<number>(34);
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper 2D drawing
  const drawBone2D = (
    ctx: CanvasRenderingContext2D,
    M: Mat4,
    len: number,
    ox: number,
    oy: number,
    color: string,
    alpha = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const p0 = mat4TransformPoint(M, [0, 0, 0]);
    const p1 = mat4TransformPoint(M, [len, 0, 0]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox + p0[0], oy - p0[1]);
    ctx.lineTo(ox + p1[0], oy - p1[1]);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ox + p0[0], oy - p0[1], 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const drawClaw2D = (
    ctx: CanvasRenderingContext2D,
    M: Mat4,
    len: number,
    ox: number,
    oy: number,
    color: string,
    alpha = 1
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const p0 = mat4TransformPoint(M, [0, 0, 0]);
    const pMid = mat4TransformPoint(M, [len * 0.65, 0, 0]);
    const pTop = mat4TransformPoint(M, [len, 14, 0]);
    const pBot = mat4TransformPoint(M, [len, -14, 0]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox + p0[0], oy - p0[1]);
    ctx.lineTo(ox + pMid[0], oy - pMid[1]);
    ctx.lineTo(ox + pTop[0], oy - pTop[1]);
    ctx.moveTo(ox + pMid[0], oy - pMid[1]);
    ctx.lineTo(ox + pBot[0], oy - pBot[1]);
    ctx.stroke();
    ctx.restore();
  };

  const drawGrid2D = (
    ctx: CanvasRenderingContext2D,
    M: Mat4,
    ox: number,
    oy: number,
    color: string,
    label: string
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    const step = 28;
    for (let i = -2; i <= 3; i++) {
      const p1 = mat4TransformPoint(M, [i * step, -2 * step, 0]);
      const p2 = mat4TransformPoint(M, [i * step, 2 * step, 0]);
      ctx.beginPath();
      ctx.moveTo(ox + p1[0], oy - p1[1]);
      ctx.lineTo(ox + p2[0], oy - p2[1]);
      ctx.stroke();

      const q1 = mat4TransformPoint(M, [-1 * step, i * step, 0]);
      const q2 = mat4TransformPoint(M, [3 * step, i * step, 0]);
      ctx.beginPath();
      ctx.moveTo(ox + q1[0], oy - q1[1]);
      ctx.lineTo(ox + q2[0], oy - q2[1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const orig = mat4TransformPoint(M, [0, 0, 0]);
    const ux = mat4TransformPoint(M, [40, 0, 0]);
    const vy = mat4TransformPoint(M, [0, 40, 0]);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox + orig[0], oy - orig[1]);
    ctx.lineTo(ox + ux[0], oy - ux[1]);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox + orig[0], oy - orig[1]);
    ctx.lineTo(ox + vy[0], oy - vy[1]);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(label, ox + orig[0] + 6, oy - orig[1] - 8);
    ctx.restore();
  };

  // Draw Visualizer 1
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = dualityCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const ox = 140, oy = H - 90;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 35) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 35) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const L1 = 110, L2 = 85, L3 = 45;
    const M1_rot = mat4RotZ(deg2rad(dualTheta1));
    const M1 = mat4Mul(M1_rot, mat4Translate(L1, 0, 0));
    const M2_rot = mat4RotZ(deg2rad(dualTheta2));
    const M2 = mat4Mul(M2_rot, mat4Translate(L2, 0, 0));
    const M3 = mat4RotZ(deg2rad(dualTheta3));

    const F0 = mat4Identity();
    const F1 = M1;
    const F2 = mat4Mul(M1, M2);
    const F3 = mat4Mul(F2, M3);

    drawBone2D(ctx, M1_rot, L1, ox, oy, '#38bdf8', 0.18);
    drawBone2D(ctx, mat4Mul(M1, M2_rot), L2, ox, oy, '#34d399', 0.18);
    drawClaw2D(ctx, F3, L3, ox, oy, '#fbbf24', 0.18);

    if (dualityMode === 'LTR') {
      if (dualityStep === 0) {
        drawGrid2D(ctx, F0, ox, oy, '#94a3b8', 'F₀ (World)');
      } else if (dualityStep === 1) {
        drawBone2D(ctx, M1_rot, L1, ox, oy, '#38bdf8', 1);
        drawGrid2D(ctx, F1, ox, oy, '#38bdf8', 'F₁ = M₁');
      } else if (dualityStep === 2) {
        drawBone2D(ctx, M1_rot, L1, ox, oy, '#38bdf8', 0.75);
        drawBone2D(ctx, mat4Mul(M1, M2_rot), L2, ox, oy, '#34d399', 1);
        drawGrid2D(ctx, F2, ox, oy, '#34d399', 'F₂ = M₁·M₂');
      } else {
        drawBone2D(ctx, M1_rot, L1, ox, oy, '#38bdf8', 0.85);
        drawBone2D(ctx, mat4Mul(M1, M2_rot), L2, ox, oy, '#34d399', 0.85);
        drawClaw2D(ctx, F3, L3, ox, oy, '#fbbf24', 1);
        drawGrid2D(ctx, F3, ox, oy, '#fbbf24', 'F₃ = M₁·M₂·M₃');
      }
    } else {
      drawGrid2D(ctx, F0, ox, oy, '#64748b', 'Fixed World F₀');
      if (dualityStep === 0) {
        drawClaw2D(ctx, F0, L3, ox, oy, '#fbbf24', 1);
      } else if (dualityStep === 1) {
        drawClaw2D(ctx, M3, L3, ox, oy, '#fbbf24', 1);
      } else if (dualityStep === 2) {
        drawBone2D(ctx, M2_rot, L2, ox, oy, '#34d399', 1);
        drawClaw2D(ctx, mat4Mul(M2, M3), L3, ox, oy, '#fbbf24', 1);
      } else {
        drawBone2D(ctx, M1_rot, L1, ox, oy, '#38bdf8', 1);
        drawBone2D(ctx, mat4Mul(M1, M2_rot), L2, ox, oy, '#34d399', 1);
        drawClaw2D(ctx, F3, L3, ox, oy, '#fbbf24', 1);
      }
    }
  }, [activeTab, dualityMode, dualityStep, dualTheta1, dualTheta2, dualTheta3]);

  // Draw Visualizer 2: DFS Matrix Stack
  useEffect(() => {
    if (activeTab !== 'concepts') return;
    const canvas = stackCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 340, oy = 285;
    const M1_r = mat4RotZ(deg2rad(42));
    const M1 = mat4Mul(M1_r, mat4Translate(95, 0, 0));
    const M2_r = mat4RotZ(deg2rad(-35));
    const M2 = mat4Mul(M2_r, mat4Translate(80, 0, 0));
    const M3 = mat4RotZ(deg2rad(15));
    const F1 = M1;
    const F2 = mat4Mul(F1, M2);
    const F3 = mat4Mul(F2, M3);

    if (dfsStep >= 1) drawBone2D(ctx, M1_r, 95, ox, oy, '#38bdf8', 1);
    if (dfsStep >= 2) drawBone2D(ctx, mat4Mul(F1, M2_r), 80, ox, oy, '#34d399', 1);

    const M_left_start = mat4Mul(F3, mat4Mul(mat4Translate(0, 12, 0), mat4RotZ(deg2rad(25))));
    const M_left_end = mat4Mul(M_left_start, mat4Translate(44, 0, 0));
    if (dfsStep >= 5) drawBone2D(ctx, M_left_start, 44, ox, oy, '#f472b6', 1);

    if (dfsStep >= 8) {
      const baseForRight = buggyPop ? M_left_end : F3;
      const M_right_start = mat4Mul(baseForRight, mat4Mul(mat4Translate(0, -12, 0), mat4RotZ(deg2rad(-25))));
      drawBone2D(ctx, M_right_start, 44, ox, oy, buggyPop ? '#ef4444' : '#a78bfa', 1);
    }

    // Mini Tree Nodes
    const treeNodes = [
      { id: 'Root', x: 115, y: 50, label: 'Root (I)' },
      { id: 'UpperArm', x: 115, y: 110, label: 'UpperArm (M₁)' },
      { id: 'Forearm', x: 115, y: 170, label: 'Forearm (M₂)' },
      { id: 'Wrist', x: 115, y: 230, label: 'Wrist Hub (M₃)' },
      { id: 'LeftFinger', x: 58, y: 305, label: 'Left Finger' },
      { id: 'RightFinger', x: 178, y: 305, label: 'Right Finger' }
    ];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]];
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(treeNodes[a].x, treeNodes[a].y);
      ctx.lineTo(treeNodes[b].x, treeNodes[b].y);
      ctx.stroke();
    });
    const activeNode = DFS_OPS[dfsStep].node;
    treeNodes.forEach((n) => {
      const isAct = n.id === activeNode;
      ctx.fillStyle = isAct ? '#10b981' : '#1e293b';
      ctx.strokeStyle = isAct ? '#6ee7b7' : '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(n.x - 46, n.y - 14, 92, 28, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isAct ? '#022c22' : '#e2e8f0';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 4);
    });
    ctx.textAlign = 'left';
  }, [activeTab, dfsStep, buggyPop]);

  // Build Scene Graph Nodes for Tab 2
  const buildNodes = (): SceneNode[] => {
    const M_base = mat4RotY(deg2rad(baseYaw));
    const M_shoulder = mat4Mul(mat4Translate(0, 0.7, 0), mat4RotZ(deg2rad(shoulderPitch)));
    const M_elbow = mat4Mul(mat4Translate(0, 1.35, 0), mat4RotZ(deg2rad(elbowPitch)));
    const M_wrist = mat4Mul(mat4Translate(0, 1.15, 0), mat4RotY(deg2rad(wristRoll)));
    const M_left = mat4Mul(mat4Translate(-0.22, 0.35, 0), mat4RotZ(deg2rad(fingerSpread)));
    const M_right = mat4Mul(mat4Translate(0.22, 0.35, 0), mat4RotZ(deg2rad(-fingerSpread)));
    const M_sensor = mat4Mul(mat4Translate(0, 0.35, 0.28), mat4RotX(deg2rad(20)));

    const raw: Omit<SceneNode, 'parentWorld' | 'world' | 'chain'>[] = [
      { id: 'base', parent: null, depth: 0, nameZh: 'Base Turret (底座转台)', nameEn: 'Base Turret', color: '#6366f1', local: M_base },
      { id: 'shoulder', parent: 'base', depth: 1, nameZh: 'Upper Arm (大臂)', nameEn: 'Upper Arm', color: '#38bdf8', local: M_shoulder },
      { id: 'elbow', parent: 'shoulder', depth: 2, nameZh: 'Forearm (前臂)', nameEn: 'Forearm', color: '#34d399', local: M_elbow },
      { id: 'wrist', parent: 'elbow', depth: 3, nameZh: 'Wrist Hub (手腕枢纽)', nameEn: 'Wrist Hub', color: '#fbbf24', local: M_wrist },
      { id: 'leftFinger', parent: 'wrist', depth: 4, nameZh: '├─ Left Finger (左爪)', nameEn: '├─ Left Finger', color: '#f472b6', local: M_left },
      { id: 'rightFinger', parent: 'wrist', depth: 4, nameZh: '├─ Right Finger (右爪)', nameEn: '├─ Right Finger', color: '#a78bfa', local: M_right },
      { id: 'sensor', parent: 'wrist', depth: 4, nameZh: '└─ Laser Scanner (雷达)', nameEn: '└─ Laser Scanner', color: '#22d3ee', local: M_sensor }
    ];
    const map: Record<string, SceneNode> = {};
    return raw.map((r) => {
      let parentWorld = mat4Identity();
      let world = r.local;
      let chain = [`M_${r.id}`];
      if (r.parent && map[r.parent]) {
        parentWorld = map[r.parent].world;
        world = mat4Mul(parentWorld, r.local);
        chain = [...map[r.parent].chain, `M_${r.id}`];
      }
      const full: SceneNode = { ...r, parentWorld, world, chain };
      map[r.id] = full;
      return full;
    });
  };

  const sceneNodes = buildNodes();
  const activeSceneNode = sceneNodes.find((n) => n.id === selectedNodeId) || sceneNodes[0];

  // Draw Tab 2 3D Canvas
  useEffect(() => {
    if (activeTab !== 'lab') return;
    const canvas = labCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const project = (p: [number, number, number]): [number, number] => {
      const cy = Math.cos(camYaw), sy = Math.sin(camYaw);
      const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
      const x1 = p[0] * cy - p[2] * sy;
      const z1 = p[0] * sy + p[2] * cy;
      const y1 = p[1] * cp - z1 * sp;
      const z2 = p[1] * sp + z1 * cp + 6.8;
      const scale = 420 / Math.max(1.5, z2);
      return [W * 0.5 + x1 * scale, H * 0.68 - y1 * scale];
    };

    const drawLine3D = (a: [number, number, number], b: [number, number, number], col: string, lw = 2) => {
      const pa = project(a), pb = project(b);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    };

    for (let i = -3; i <= 3; i++) {
      drawLine3D([i, 0, -3], [i, 0, 3], '#1e293b', 1);
      drawLine3D([-3, 0, i], [3, 0, i], '#1e293b', 1);
    }

    const map: Record<string, SceneNode> = {};
    sceneNodes.forEach((n) => { map[n.id] = n; });

    const pairs: [string, string, string, number][] = [
      ['base', 'shoulder', '#6366f1', 9],
      ['shoulder', 'elbow', '#38bdf8', 8],
      ['elbow', 'wrist', '#34d399', 6],
      ['wrist', 'leftFinger', '#f472b6', 4],
      ['wrist', 'rightFinger', '#a78bfa', 4],
      ['wrist', 'sensor', '#22d3ee', 4]
    ];
    pairs.forEach(([pId, cId, col, lw]) => {
      drawLine3D(
        mat4TransformPoint(map[pId].world, [0, 0, 0]),
        mat4TransformPoint(map[cId].world, [0, 0, 0]),
        col,
        lw
      );
    });

    ['leftFinger', 'rightFinger'].forEach((fId) => {
      drawLine3D(
        mat4TransformPoint(map[fId].world, [0, 0, 0]),
        mat4TransformPoint(map[fId].world, [0, 0.55, 0]),
        map[fId].color,
        5
      );
    });

    sceneNodes.forEach((n) => {
      const isSel = n.id === activeSceneNode.id;
      const len = isSel ? 0.75 : 0.3;
      const lw = isSel ? 3.5 : 1.5;
      const o = mat4TransformPoint(n.world, [0, 0, 0]);
      drawLine3D(o, mat4TransformPoint(n.world, [len, 0, 0]), '#f43f5e', lw);
      drawLine3D(o, mat4TransformPoint(n.world, [0, len, 0]), '#10b981', lw);
      drawLine3D(o, mat4TransformPoint(n.world, [0, 0, len]), '#38bdf8', lw);
    });
  }, [activeTab, labPreset, selectedNodeId, baseYaw, shoulderPitch, elbowPitch, wristRoll, fingerSpread, camYaw, camPitch]);

  // Draw Tab 4 Mini-Game Canvas
  const targetCoords: Record<1 | 2 | 3, [number, number]> = {
    1: [175, 115],
    2: [155, 165],
    3: [195, 75]
  };
  const currentTarget = targetCoords[mission];

  const L1 = 105, L2 = 85, L3 = 35;
  const gM1_r = mat4RotZ(deg2rad(gTheta1));
  const gM1 = mat4Mul(gM1_r, mat4Translate(L1, 0, 0));
  const gM2_r = mat4RotZ(deg2rad(gTheta2));
  const gM2 = mat4Mul(gM2_r, mat4Translate(L2, 0, 0));
  const gM3_r = mat4RotZ(deg2rad(gTheta3));
  const gM3 = mat4Mul(gM3_r, mat4Translate(L3, 0, 0));
  const gF1 = gM1;
  const gF2 = mat4Mul(gF1, gM2);
  const gF3 = mat4Mul(gF2, gM3);

  const clawWorldPos = mat4TransformPoint(gF3, [0, 0, 0]);
  const localTargetPos = mat4TransformPoint(mat4RigidInverse(gF3), [currentTarget[0], currentTarget[1], 0]);
  const distErr = Math.hypot(clawWorldPos[0] - currentTarget[0], clawWorldPos[1] - currentTarget[1]);
  const alignDot = Math.cos(deg2rad(gTheta1 + gTheta2 + gTheta3 - (-15)));

  const missionCleared =
    (mission === 1 && gamePopFixed && gGrip >= 13 && gGrip <= 19 && distErr < 24) ||
    (mission === 2 && distErr < 14) ||
    (mission === 3 && distErr < 16 && alignDot > 0.96);

  useEffect(() => {
    if (activeTab !== 'game') return;
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const ox = 150, oy = H - 85;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Target circle
    ctx.save();
    ctx.translate(ox + currentTarget[0], oy - currentTarget[1]);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawBone2D(ctx, gM1_r, L1, ox, oy, '#38bdf8', 1);
    drawBone2D(ctx, mat4Mul(gF1, gM2_r), L2, ox, oy, '#34d399', 1);
    drawBone2D(ctx, mat4Mul(gF2, gM3_r), L3, ox, oy, '#fbbf24', 1);

    const M_left = mat4Mul(gF3, mat4Mul(mat4Translate(0, 10, 0), mat4RotZ(deg2rad(gGrip - 15))));
    const M_left_tip = mat4Mul(M_left, mat4Translate(38, 0, 0));
    drawBone2D(ctx, M_left, 38, ox, oy, '#f472b6', 1);

    const rightBase = gamePopFixed ? gF3 : M_left_tip;
    const M_right = mat4Mul(rightBase, mat4Mul(mat4Translate(0, -10, 0), mat4RotZ(deg2rad(-(gGrip - 15)))));
    drawBone2D(ctx, M_right, 38, ox, oy, gamePopFixed ? '#a78bfa' : '#ef4444', 1);
    drawGrid2D(ctx, gF3, ox, oy, '#fbbf24', 'F_claw');
  }, [activeTab, mission, gamePopFixed, gTheta1, gTheta2, gTheta3, gGrip]);

  return (
    <div className="space-y-6">
      {/* Top Lesson Banner */}
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
              <span>Stage 1 • Lesson 05 / 32</span>
              <span>•</span>
              <a
                href="lessons/lesson-05.html"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                {isZh ? '在新窗口打开独立 HTML 页面 ↗' : 'Open Standalone HTML Artifact ↗'}
              </a>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isZh
                ? 'L05: 层级建模 (Hierarchical Modeling)、场景图与矩阵栈'
                : 'L05: Hierarchical Modeling, Scene Graphs & Matrix Stacks'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3Blue1Brown Local- vs. World-Frame Duality • UC Davis ECS 175 Lec 11 (Kenneth Joy) • MIT 6.837 Lec 05 (Justin Solomon)
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

        {/* 4 Section Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'concepts' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '1. 3Blue1Brown 深度直觉与矩阵栈步进' : '1. 3Blue1Brown Intuition & Matrix Stack DFS'}
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'lab' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '2. 3D 场景图与多关节机械臂实验室' : '2. 3D Scene Graph & Multi-Branch FK Lab'}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'videos' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-300 border border-slate-800'
            }`}
          >
            {isZh ? '3. UC Davis Lec 11 & MIT 6.837 Lec 05' : '3. University Lectures & Notes'}
          </button>
          <button
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'game'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            🎮 {isZh ? '4. 3关实战游戏：空间站机械臂排障' : '4. 3-Mission Game: Orbital Manipulator'}
          </button>
        </div>
      </div>

      {/* TAB 1: CONCEPTS */}
      {activeTab === 'concepts' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {isZh
                  ? '透视镜 1：为什么矩阵链 M₁·M₂·M₃·p 既能“从左往右读”又能“从右往左读”？'
                  : 'Visualizer 1: Left-to-Right (Moving Local Frame) vs. Right-to-Left (Fixed World) Duality'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setDualityMode('LTR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    dualityMode === 'LTR' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isZh ? '读法 A：从左往右 (移动局部标架)' : 'Mode A: Left-to-Right (Local Frame)'}
                </button>
                <button
                  onClick={() => setDualityMode('RTL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    dualityMode === 'RTL' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isZh ? '读法 B：从右往左 (固定世界原点)' : 'Mode B: Right-to-Left (Fixed World)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7">
                <canvas ref={dualityCanvasRef} width={600} height={340} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => setDualityStep(s)}
                      className={`px-3 py-2 rounded-lg font-bold border text-left ${
                        dualityStep === s
                          ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200'
                          : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      Step {s}
                    </button>
                  ))}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-cyan-300">
                    <span>M₁ Shoulder θ₁</span>
                    <span>{dualTheta1}°</span>
                  </div>
                  <input type="range" min={-80} max={80} value={dualTheta1} onChange={(e) => setDualTheta1(Number(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-emerald-300">
                    <span>M₂ Elbow θ₂</span>
                    <span>{dualTheta2}°</span>
                  </div>
                  <input type="range" min={-110} max={110} value={dualTheta2} onChange={(e) => setDualTheta2(Number(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-amber-300">
                    <span>M₃ Wrist Claw θ₃</span>
                    <span>{dualTheta3}°</span>
                  </div>
                  <input type="range" min={-90} max={90} value={dualTheta3} onChange={(e) => setDualTheta3(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Visualizer 2: DFS Matrix Stack */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {isZh
                  ? '透视镜 2：场景图 DFS 遍历与矩阵栈 (pushMatrix / popMatrix) 实时步进'
                  : 'Visualizer 2: Live Scene Graph DFS & Hardware Matrix Stack Stepper'}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setDfsStep(Math.max(0, dfsStep - 1))} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold">
                  ◀ Prev
                </button>
                <button onClick={() => setDfsStep(Math.min(DFS_OPS.length - 1, dfsStep + 1))} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white">
                  Next ▶
                </button>
                <button
                  onClick={() => {
                    const next = !buggyPop;
                    setBuggyPop(next);
                    if (next && dfsStep < 8) setDfsStep(8);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    buggyPop ? 'bg-rose-600 border-rose-400 text-white' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  🐞 {isZh ? `模拟忘记 popMatrix() Bug: ${buggyPop ? '开' : '关'}` : `Forget popMatrix() Bug: ${buggyPop ? 'ON' : 'OFF'}`}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7">
                <canvas ref={stackCanvasRef} width={600} height={340} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
              </div>
              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-emerald-400 font-bold">
                    Op {dfsStep} / {DFS_OPS.length - 1}:
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 font-mono text-emerald-300">
                    {DFS_OPS[dfsStep].code}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {isZh ? DFS_OPS[dfsStep].descZh : DFS_OPS[dfsStep].descEn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3D SCENE GRAPH LAB */}
      {activeTab === 'lab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-indigo-300 mb-2">
                  {isZh ? '🌳 点击场景图节点检视矩阵链' : '🌳 Click Scene Graph Node'}
                </div>
                {sceneNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    style={{ paddingLeft: `${10 + n.depth * 14}px` }}
                    className={`w-full text-left py-2 pr-3 rounded-lg border transition flex items-center justify-between ${
                      selectedNodeId === n.id
                        ? 'bg-indigo-950/80 border-indigo-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{isZh ? n.nameZh : n.nameEn}</span>
                    <span className="font-mono text-[10px] text-slate-400">d={n.depth}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between"><span>Base Yaw θ₁</span><span>{baseYaw}°</span></div>
                  <input type="range" min={-180} max={180} value={baseYaw} onChange={(e) => setBaseYaw(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between"><span>Shoulder Pitch θ₂</span><span>{shoulderPitch}°</span></div>
                  <input type="range" min={-85} max={85} value={shoulderPitch} onChange={(e) => setShoulderPitch(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between"><span>Elbow Pitch θ₃</span><span>{elbowPitch}°</span></div>
                  <input type="range" min={-120} max={120} value={elbowPitch} onChange={(e) => setElbowPitch(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between"><span>Wrist Roll θ₄</span><span>{wristRoll}°</span></div>
                  <input type="range" min={-180} max={180} value={wristRoll} onChange={(e) => setWristRoll(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between"><span>Gripper Spread θ₅</span><span>{fingerSpread}°</span></div>
                  <input type="range" min={5} max={45} value={fingerSpread} onChange={(e) => setFingerSpread(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <canvas
                ref={labCanvasRef}
                width={740}
                height={400}
                onPointerMove={(e) => {
                  if (e.buttons === 1) {
                    setCamYaw((y) => y + e.movementX * 0.008);
                    setCamPitch((p) => Math.max(-0.2, Math.min(1.2, p + e.movementY * 0.008)));
                  }
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 cursor-grab"
              />
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                M_world({activeSceneNode.id}) = {activeSceneNode.chain.join(' · ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VIDEOS */}
      {activeTab === 'videos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <h3 className="text-lg font-bold text-white">
            UC Davis ECS 175 Lecture 11 (Kenneth Joy) & MIT 6.837 Lecture 05 (Justin Solomon)
          </h3>
          <p>
            {isZh
              ? '点击上方“在新窗口打开独立 HTML 页面”即可观看内嵌的 MIT 6.837 Lecture 05 视频播放器与 Kenneth Joy 教授的局部枢轴建模黄金法则完整讲义。'
              : 'Open the standalone HTML artifact above for the embedded MIT 6.837 Lecture 05 video player and Prof. Kenneth Joy Lecture 11 notes.'}
          </p>
        </div>
      )}

      {/* TAB 4: 3-MISSION MINI-GAME */}
      {activeTab === 'game' && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">
              🎮 {isZh ? '空间站分叉机械臂排障与正向运动学抓取挑战' : 'Orbital Station Manipulator Repair & FK Challenge'}
            </h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMission(m);
                    setGamePopFixed(m !== 1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    mission === m ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Mission {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7">
              <canvas ref={gameCanvasRef} width={620} height={380} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            </div>
            <div className="lg:col-span-5 space-y-3 text-xs">
              {mission === 1 && (
                <button
                  onClick={() => setGamePopFixed(!gamePopFixed)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold border ${
                    gamePopFixed
                      ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200'
                      : 'border-rose-500 bg-rose-900/60 text-white'
                  }`}
                >
                  {gamePopFixed
                    ? '✅ popMatrix() 已添加 (左右爪已恢复同源手腕标架)'
                    : '❌ 点击修复：在 Left Finger 后添加 popMatrix()'}
                </button>
              )}

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between"><span>Shoulder θ₁</span><span>{gTheta1}°</span></div>
                <input type="range" min={-90} max={90} value={gTheta1} onChange={(e) => setGTheta1(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between"><span>Elbow θ₂</span><span>{gTheta2}°</span></div>
                <input type="range" min={-130} max={130} value={gTheta2} onChange={(e) => setGTheta2(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between"><span>Wrist θ₃</span><span>{gTheta3}°</span></div>
                <input type="range" min={-120} max={120} value={gTheta3} onChange={(e) => setGTheta3(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between"><span>Gripper Spread θ_grip</span><span>{gGrip}°</span></div>
                <input type="range" min={5} max={45} value={gGrip} onChange={(e) => setGGrip(Number(e.target.value))} className="w-full" />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1">
                <div>Target in Claw Local Frame: ({localTargetPos[0].toFixed(1)}, {localTargetPos[1].toFixed(1)})</div>
                <div>Distance Error: {distErr.toFixed(1)} px {mission === 3 ? `| dot=${alignDot.toFixed(2)}` : ''}</div>
                <div className={missionCleared ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {missionCleared ? '★ MISSION CLEARED!' : '● Adjust joints until Local Target ≈ (0, 0)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
