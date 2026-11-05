export interface VideoReference {
  course: 'UCD' | 'MIT' | 'EXT';
  code: string;
  title: string;
  youtubeUrl: string;
  embedId?: string;
}

export interface LessonItem {
  id: string;
  number: number;
  stageId: number;
  title: string;
  subtitle: string;
  concepts: string[];
  playgroundTitle: string;
  playgroundDescription: string;
  videos: VideoReference[];
  isImplemented?: boolean;
}

export interface StageInfo {
  id: number;
  title: string;
  englishTitle: string;
  description: string;
  badgeColor: string;
}

export const STAGES: StageInfo[] = [
  {
    id: 1,
    title: 'Stage 1: 3D 数学与空间变换基石',
    englishTitle: '3D Math & Spatial Transformations',
    description: '建立点与向量、仿射标架、齐次矩阵、任意轴旋转、四元数与相机变换的几何直觉。',
    badgeColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 2,
    title: 'Stage 2: 曲线、曲面与 3D 几何表示',
    englishTitle: 'Curves, Surfaces & 3D Geometry Foundation',
    description: '从 Bézier 与 B-Spline 参数曲线过渡到张量积曲面、Chaikin/Catmull-Clark/Loop 细分曲面。',
    badgeColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 3,
    title: 'Stage 3: 光线追踪与物理全局光照',
    englishTitle: 'Ray Tracing & Global Illumination',
    description: '手写理解射线求交、重心坐标、CSG、Whitted 递归光追、BVH 加速结构、反走样与蒙特卡洛路径追踪。',
    badgeColor: 'from-cyan-500 to-blue-600'
  },
  {
    id: 4,
    title: 'Stage 4: 光栅化、着色与实时 GPU 管线',
    englishTitle: 'Rasterization, Shading & Real-Time GPU Pipeline',
    description: '打通透视投影、视锥体裁剪、扫描转换、Z-Buffer、Phong/PBR 材质、透视校正纹理与实时阴影。',
    badgeColor: 'from-indigo-500 to-purple-600'
  },
  {
    id: 5,
    title: 'Stage 5: 动画、物理仿真与镜头运动',
    englishTitle: 'Animation, Physics Simulation & Camera Motion',
    description: '弧长参数化相机轨迹、骨骼蒙皮 (Skinning / SSD)、粒子系统 ODE 积分器稳定性与实时布料仿真。',
    badgeColor: 'from-pink-500 to-rose-600'
  },
  {
    id: 6,
    title: 'Stage 6: 色彩科学、后处理与现代 3D Foundation',
    englishTitle: 'Color Science, Post-Processing & Modern 3D Foundation',
    description: 'CIE 色彩空间与 Gamma、卷积后处理与 Tone Mapping、VR 显示光学，以及 glTF/WebGPU/3DGS 现代全景。',
    badgeColor: 'from-violet-500 to-fuchsia-600'
  }
];

export const LESSONS: LessonItem[] = [
  // ==================== STAGE 1 ====================
  {
    id: 'L01',
    number: 1,
    stageId: 1,
    title: '图形学全景与 3D 向量几何直觉',
    subtitle: 'Computer Graphics Panorama, Coordinate Handedness, Dot & Cross Product',
    concepts: ['图形学四大支柱', '右手系 vs 左手系', '点积 (投影与夹角)', '叉积 (法向量与有向面积)'],
    playgroundTitle: '3D 向量点积/叉积实验室 + 四大支柱实时渲染器',
    playgroundDescription: '拖拽两个 3D 向量实时观察正交投影、叉积法线翻转与平行四边形面积，并体验用叉积+点积驱动的实时 3D 网格渲染。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-01',
        title: 'Lecture 01: Introduction to Computer Graphics (Kenneth Joy)',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+1'
      },
      {
        course: 'MIT',
        code: 'MIT-01',
        title: 'Lecture 01: Introduction to Computer Graphics (Justin Solomon)',
        youtubeUrl: 'https://www.youtube.com/watch?v=tPzC879i-ag&list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi',
        embedId: 'tPzC879i-ag'
      }
    ]
  },
  {
    id: 'L02',
    number: 2,
    stageId: 1,
    title: '线性变换、仿射标架 (Frames) 与 4×4 齐次坐标矩阵',
    subtitle: 'Linear Transformations, Coordinate Frames & 4x4 Homogeneous Matrices',
    concepts: [
      '矩阵的列 = 变换后的基向量 (3Blue1Brown)',
      '高维线性切变 (w=1 Shear) 诞生齐次平移',
      '仿射标架 (O; u, v, w) 与父子骨骼层级树',
      '法向量逆转置矩阵 (M⁻¹)ᵀ 推导'
    ],
    playgroundTitle: '4×4 齐次矩阵透视器 + w=1 高维切变沙盒 + 机械臂标架树 + 3关小游戏',
    playgroundDescription: '交互体验 3D 高维切变如何在 w=1 切片上产生平移、法向量 (M⁻¹)ᵀ 对比、4×4 矩阵列与局部标架实时映射、机械臂正向运动学与 3 关矩阵闯关游戏。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-03',
        title: 'Lecture 03: Moving Objects in Space',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+3'
      },
      {
        course: 'MIT',
        code: 'MIT-04',
        title: 'Lecture 04: Coordinates and Transformations (Part 1)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L03',
    number: 3,
    stageId: 1,
    title: '3D 旋转数学：欧拉角、轴角与罗德里格斯公式',
    subtitle: '3D Rotations, Gimbal Lock & Rodrigues Rotation Formula',
    concepts: ['正交矩阵性质', '欧拉角与万向节死锁 (Gimbal Lock)', '绕任意轴旋转几何分解', 'Rodrigues 公式推导'],
    playgroundTitle: '万向节死锁与任意轴旋转模拟器',
    playgroundDescription: '亲手将 Pitch 推到 90° 触发三环万向节死锁，体验 SO(3) 转置求逆对偶性与罗德里格斯三维分解探针，并畅玩 3 关深空陀螺仪救援游戏。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-04',
        title: 'Lecture 04: Rotations about an Arbitrary Axis',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+4'
      },
      {
        course: 'MIT',
        code: 'MIT-04',
        title: 'Lecture 04: Coordinates and Transformations (Part 2)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L04',
    number: 4,
    stageId: 1,
    title: '四元数 (Quaternions) 深度解密与球面插值',
    subtitle: 'Quaternions, Hamilton Product & SLERP',
    concepts: ['复数旋转到四元数', '半角三明治公式 qpq⁻¹ 4D 几何证明', '双重覆盖 (q ≡ -q) 与 720° 拓扑', 'LERP vs SLERP 超球面大圆测地线插值'],
    playgroundTitle: '4D 三明治分步透视器 + S³ 超球面 SLERP/欧拉轨迹对比仪 + 3关星际对接游戏',
    playgroundDescription: '亲手拆解左乘 q 与右乘 q⁻¹ 如何在第 4 维 w 中相互抵消并叠加出 2(θ/2)=θ 旋转，在 S³ 超球面上对比 SLERP 大圆测地线与欧拉角插值，并畅玩 3 关太空舱姿态对接小游戏。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-09',
        title: 'Lecture 09: Quaternions',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+9'
      }
    ]
  },
  {
    id: 'L05',
    number: 5,
    stageId: 1,
    title: '层级建模 (Hierarchical Modeling) 与场景图',
    subtitle: 'Scene Graphs, Matrix Stacks & Forward Kinematics',
    concepts: ['局部空间 vs 世界空间', '树状场景图 (Scene Graph)', '矩阵栈 (Push/Pop Matrix)', '多关节正向运动学'],
    playgroundTitle: '交互式场景图与多关节 3D 机械臂',
    playgroundDescription: '亲手对比矩阵链从左往右与从右往左两种几何读法，单步执行 pushMatrix/popMatrix 并模拟漏写 popMatrix 的分叉错位 Bug，在 3D 场景图中检视父子累积矩阵链与逆变换雷达。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-11',
        title: 'Lecture 11: The Hierarchical Modeling System',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+11'
      },
      {
        course: 'MIT',
        code: 'MIT-05',
        title: 'Lecture 05: Hierarchical Modeling',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L06',
    number: 6,
    stageId: 1,
    title: '相机变换 (The Camera Transform) 与观察空间',
    subtitle: 'World-to-Eye Space & LookAt Matrix Derivation',
    concepts: ['Eye / Target / Up 参数', '用叉积构建相机正交基 (u, v, w)', '平移与旋转逆矩阵合成', '世界空间 vs 观察空间对偶性'],
    playgroundTitle: '双视窗相机矩阵实验室 (God View + Camera View)',
    playgroundDescription: '亲手体验世界到观察空间两步逆变换 (I → T(-e) → Rᵀ·T(-e)) 连续变形、两次叉积锻造相机正交基 (w → u → v) 与 90° 天顶奇异点压力测试，在双视窗实验室同步观察上帝视角视锥体与第一人称视角，并挑战 3 关侦察卫星相机标定游戏。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-05',
        title: 'Lecture 05: The Camera Transform',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+5'
      }
    ]
  },

  // ==================== STAGE 2 ====================
  {
    id: 'L07',
    number: 7,
    stageId: 2,
    title: '平面参数曲线与 Bézier 曲线几何学',
    subtitle: 'Parametric Curves, Bernstein Polynomials & de Casteljau Algorithm',
    concepts: ['显式/隐式/参数曲线对比', 'Hermite 插值', 'Bernstein 基函数', 'de Casteljau 递归线性插值'],
    playgroundTitle: 'de Casteljau 步进交互画板',
    playgroundDescription: '亲手拖拽控制点体验 3 层 de Casteljau 递归插值金字塔、凸包阴影、切向量 P''(t)=3(R₁-R₀) 与左右子树细分，测试破坏单位分解 (ΣBᵢ≠1) 引发的仿射崩塌，并畅玩 3 关星际跃迁轨道设计师游戏。',
    isImplemented: true,
    videos: [
      {
        course: 'UCD',
        code: 'UCD-02',
        title: 'Lecture 02: Curves in the Plane',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+2'
      },
      {
        course: 'MIT',
        code: 'MIT-02',
        title: 'Lecture 02: Cubic Curves',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L08',
    number: 8,
    stageId: 2,
    title: '样条曲线进阶：连续性、Catmull-Rom 与 B-Splines',
    subtitle: 'C^n / G^n Continuity, Local Control & B-Splines',
    concepts: ['C0/C1/C2 参数连续性', 'G1/G2 几何连续性', 'Catmull-Rom 插值样条', '均匀三次 B-Spline 与局部控制'],
    playgroundTitle: '样条连续性与曲率梳实验室',
    playgroundDescription: '用曲率梳显微镜观察两段曲线接头在 C⁰/G¹/C¹/C² 下的速度与加速度跳变，在 7 点样条竞技场同屏对比 Catmull-Rom (C¹ 穿点) 与均匀三次 B-Spline (C² 逼近) 的局部 4 点滑动窗口，并畅玩 3 关磁悬浮过山车连续性工程师游戏。',
    isImplemented: true,
    videos: [
      {
        course: 'MIT',
        code: 'MIT-03',
        title: 'Lecture 03: Curves II / Splines',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L09',
    number: 9,
    stageId: 2,
    title: '3D 参数曲面：张量积曲面 (Tensor Product Patches)',
    subtitle: 'Bicubic Bézier Patches, Partial Derivatives & Surface Normals',
    concepts: ['双参数曲面 S(u,v)', '偏导数 ∂S/∂u × ∂S/∂v 求法线', '4×4 控制网格 (16 控制点)', 'Utah Teapot 曲面片拆解'],
    playgroundTitle: '3D Bézier 曲面片捏合工坊',
    playgroundDescription: '在 3D 空间升降 4×4 控制网格节点，实时可视化 (u,v) 等参线网格与曲面法向量场。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-13',
        title: 'Lecture 13: Curves and Surfaces',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+13'
      },
      {
        course: 'MIT',
        code: 'MIT-03',
        title: 'Lecture 03: Curves II & Surfaces',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L10',
    number: 10,
    stageId: 2,
    title: '细分曲面 (Part 1)：从 Chaikin 切角到网格拓扑',
    subtitle: 'Subdivision Curves, Chaikin Corner-Cutting & Mesh Topology',
    concepts: ['Chaikin 切角细分 (1/4, 3/4)', '细分矩阵特征值分析', '流形网格与奇异点 (Extraordinary Vertices)'],
    playgroundTitle: 'Chaikin 切角与极限收敛放大镜',
    playgroundDescription: '点击 Refine 一步步观察粗糙多边形如何通过局部切角规则收敛为光滑 B 样条曲线。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-16',
        title: 'Lecture 16: Subdivision Surfaces, Part 1',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+16'
      }
    ]
  },
  {
    id: 'L11',
    number: 11,
    stageId: 2,
    title: '细分曲面 (Part 2)：Catmull-Clark 与 Loop 细分算法',
    subtitle: 'Catmull-Clark Quad Subdivision, Loop Triangle Subdivision & Half-Edge',
    concepts: ['Face / Edge / Vertex 顶点更新权重', 'Catmull-Clark 四边形细分', 'Loop 三角形细分', '半边数据结构 (Half-Edge)'],
    playgroundTitle: 'Catmull-Clark & Loop 3D 实时细分器',
    playgroundDescription: '对 3D 低模进行 0~4 级实时细分，调节折痕锐度 (Crease) 并高亮奇异点邻域权重。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-17',
        title: 'Lecture 17: Subdivision Surfaces, Part 2',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+17'
      }
    ]
  },

  // ==================== STAGE 3 ====================
  {
    id: 'L12',
    number: 12,
    stageId: 3,
    title: '可见性问题、深度缓冲与光线投射 (Ray Casting)',
    subtitle: 'Ray Generation, Ray-Sphere/Plane Intersection & Z-Buffer vs Ray Casting',
    concepts: ['针孔相机射线方程 r(t) = o + td', '射线与平面/球体解析求交', '二次方程判别式 Δ 几何意义', 'Object-order vs Image-order 渲染'],
    playgroundTitle: '像素射线发射与球体求交可视化器',
    playgroundDescription: '点击虚拟成像平面上的任意像素发射 3D 射线，动态展示判别式 Δ > 0 / = 0 / < 0 与最近交点 t。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-07',
        title: 'Lecture 07: Depth Buffers and Ray Tracing',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+7'
      },
      {
        course: 'MIT',
        code: 'MIT-09',
        title: 'Lecture 09: Introduction to Rendering and Ray Casting',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L13',
    number: 13,
    stageId: 3,
    title: '重心坐标 (Barycentric Coordinates)、三角形求交与 CSG',
    subtitle: 'Barycentric Interpolation, Möller–Trumbore & Constructive Solid Geometry',
    concepts: ['重心坐标 (α,β,γ) 面积比定义', 'Möller–Trumbore 快速求交', 'CSG 射线区间布尔运算 (并/交/差)', '法向量逆转置变换 (M⁻¹)ᵀ'],
    playgroundTitle: '重心坐标插值与 CSG 射线布尔实验室',
    playgroundDescription: '在三角形内拖动采样点观察面积比权重与属性插值；切换两个几何体的射线交点区间布尔运算。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-10',
        title: 'Lecture 10: Ray Casting II (Barycentric Coordinates & CSG)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L14',
    number: 14,
    stageId: 3,
    title: '递归光线追踪 (Whitted-Style Ray Tracing)',
    subtitle: 'Shadow Rays, Mirror Reflection, Snell Refraction & Ray Trees',
    concepts: ['Shadow Bias (ε) 防自遮挡', '镜面反射向量推导', '斯涅尔折射定律与全内反射 (TIR)', 'Fresnel 方程与递归光线树'],
    playgroundTitle: '交互式光线树 (Ray Tree) 与折射追踪器',
    playgroundDescription: '调节玻璃球折射率 η 与入射角，实时展开反射、折射与阴影射线的完整递归树。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-15',
        title: 'Lecture 15: Ray Tracing',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+15'
      },
      {
        course: 'MIT',
        code: 'MIT-11',
        title: 'Lecture 11: Ray Tracing I (Reflection, Refraction, Ray Trees)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L15',
    number: 15,
    stageId: 3,
    title: '空间加速结构：包围盒层次 (BVH) 与 KD-Tree',
    subtitle: 'AABB Slab Test, Bounding Volume Hierarchies, SAH & KD-Trees',
    concepts: ['AABB Slab 射线求交算法', 'BVH 树构建与遍历', '表面积启发式 (SAH)', 'BVH (划分对象) vs KD-Tree (划分空间)'],
    playgroundTitle: 'BVH 树遍历步进透视镜',
    playgroundDescription: '发射一条射线穿过复杂场景，单步动画演示 BVH 节点剔除过程，对比 O(N) 与 O(log N) 求交次数。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-12',
        title: 'Lecture 12: Ray Tracing II / Acceleration Structures',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L16',
    number: 16,
    stageId: 3,
    title: '信号处理、采样理论与反走样 (Antialiasing)',
    subtitle: 'Nyquist Frequency, Aliasing, Supersampling & Reconstruction Filters',
    concepts: ['走样 (Jaggies / Moiré) 的频域本质', 'Nyquist 采样定理', 'SSAA / MSAA / 分层抖动采样 (Stratified)', 'Box / Tent / Gaussian 重建滤波器'],
    playgroundTitle: '走样与超采样像素显微镜',
    playgroundDescription: '在放大像素网格下观察高频棋盘格与斜边三角形，切换不同采样分布与滤波核对比反走样效果。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-15',
        title: 'Lecture 15: Antialiasing (Sampling and Reconstruction)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L17',
    number: 17,
    stageId: 3,
    title: '全局光照 (Global Illumination) 与蒙特卡洛路径追踪',
    subtitle: 'The Rendering Equation, Monte Carlo Integration & Path Tracing',
    concepts: ['辐射度量学 (Radiance / Irradiance)', 'Kajiya 渲染方程', '蒙特卡洛积分与重要性采样', '软阴影、焦散与色彩溢色 (Color Bleeding)'],
    playgroundTitle: 'Cornell Box 渐进式路径追踪实验室',
    playgroundDescription: '实时累计采样数 (SPP)，切换弹射次数 (Bounces) 与余弦重要性采样，直观观察噪点收敛与色彩溢色。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-16',
        title: 'Lecture 16: Global Illumination',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },

  // ==================== STAGE 4 ====================
  {
    id: 'L18',
    number: 18,
    stageId: 4,
    title: '投影变换与视锥体裁剪 (Projection & Clipping)',
    subtitle: 'Perspective Projection Matrix, NDC Space & Sutherland-Hodgman Clipping',
    concepts: ['正交投影 vs 透视投影矩阵', '非线性深度 z/w 与 Z-Fighting', 'Cohen-Sutherland 线段裁剪', 'Sutherland-Hodgman 多边形逐边裁剪'],
    playgroundTitle: '视锥体挤压变形与多边形裁剪沙盒',
    playgroundDescription: '同步观察透视视锥体如何被矩阵非线性变换为 [-1,1]³ NDC 立方体，并逐步演示跨边界多边形裁剪。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-06',
        title: 'Lecture 06: Clipping',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+6'
      },
      {
        course: 'MIT',
        code: 'MIT-17',
        title: 'Lecture 17: Rasterization I',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L19',
    number: 19,
    stageId: 4,
    title: '扫描转换 (Scan Conversion) 与三角形光栅化',
    subtitle: 'Bresenham Line Drawing, Scanline Filling & GPU Edge Functions',
    concepts: ['Bresenham 整数画线法', '扫描线活性边表 (AET)', '现代 GPU 并行边缘函数 (Edge Equation)', 'Top-Left 共享边填充规则'],
    playgroundTitle: 'GPU 像素级三角形光栅化模拟器',
    playgroundDescription: '在放大像素网格上拖动三角形顶点，实时显示每个像素中心的三个有向边函数符号与激活过程。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-12',
        title: 'Lecture 12: Scan Conversion',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+12'
      },
      {
        course: 'MIT',
        code: 'MIT-18',
        title: 'Lecture 18: Rasterization II (Part 1)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L20',
    number: 20,
    stageId: 4,
    title: '可见面判定算法与现代深度缓冲管线',
    subtitle: 'Painter Algorithm, BSP Trees, Z-Buffer & Deferred Shading Intro',
    concepts: ['画家算法与循环遮挡悖论', 'BSP 二叉空间分割树', '逐像素 Z-Buffer 深度测试', 'Early-Z 与延迟着色 (G-Buffer)'],
    playgroundTitle: '画家算法循环遮挡 vs Z-Buffer 对决台',
    playgroundDescription: '构造三个相互穿插遮挡的三角形，直观演示按面排序为何失败，以及逐像素深度缓冲如何解决。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-14',
        title: 'Lecture 14: Visible Surface Algorithms',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+14'
      },
      {
        course: 'MIT',
        code: 'MIT-18',
        title: 'Lecture 18: Rasterization II (Part 2)',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L21',
    number: 21,
    stageId: 4,
    title: '光照与着色模型：从 Phong 到现代微表面 PBR',
    subtitle: 'Flat/Gouraud/Phong Shading, Blinn-Phong & Cook-Torrance Microfacet PBR',
    concepts: ['Lambert 漫反射与半程向量 H', 'Flat vs Gouraud vs Phong 着色频率', '能量守恒与 BRDF', 'Cook-Torrance 微表面模型 (D, F, G)'],
    playgroundTitle: '材质球着色演化与 PBR 微表面实验室',
    playgroundDescription: '同屏对比 Flat/Gouraud/Phong，并实时调节 PBR 材质球的 Roughness、Metallic 与微表面法线分布曲线。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-08',
        title: 'Lecture 08: Color and Shading',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+8'
      },
      {
        course: 'MIT',
        code: 'MIT-13',
        title: 'Lecture 13: Shading',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L22',
    number: 22,
    stageId: 4,
    title: '纹理映射 (Texture Mapping)、透视校正与 Mipmap',
    subtitle: 'UV Mapping, Perspective-Correct Interpolation, Mipmaps & Normal Mapping',
    concepts: ['屏幕空间仿射扭曲 vs 1/z 透视校正插值', '双线性与三线性过滤', 'Mipmap 层级计算与各向异性过滤', '切线空间法线贴图 (TBN Matrix)'],
    playgroundTitle: '透视校正插值与 Mipmap 层级可视化仪',
    playgroundDescription: '一键对比错误的仿射纹理插值与正确的透视校正插值，开启 Mipmap 彩色层级视图并测试法线贴图光照。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-10',
        title: 'Lecture 10: Shading and Texturing',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+10'
      },
      {
        course: 'MIT',
        code: 'MIT-14',
        title: 'Lecture 14: Texture Mapping',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L23',
    number: 23,
    stageId: 4,
    title: '阴影算法 (Part 1)：平面投影阴影与阴影体 (Shadow Volumes)',
    subtitle: 'Planar Projection Shadows, Silhouette Edges & Stencil Shadow Volumes',
    concepts: ['本影 (Umbra) 与半影 (Penumbra)', '平面投影阴影矩阵推导', '轮廓边检测与阴影体积挤出', 'Stencil Buffer +1/-1 深度通行计数'],
    playgroundTitle: '阴影体 (Shadow Volume) 射线计数沙盒',
    playgroundDescription: '可视化几何体沿光线方向挤出的阴影体积锥，演示视线穿过前后壁时模板缓冲计数器的变化。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-18',
        title: 'Lecture 18: Shadows, Part 1',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+18'
      }
    ]
  },
  {
    id: 'L24',
    number: 24,
    stageId: 4,
    title: '阴影算法 (Part 2)：Shadow Mapping、深度偏移与软阴影 PCF',
    subtitle: 'Two-Pass Shadow Mapping, Shadow Acne, Bias & Percentage Closer Filtering',
    concepts: ['光源空间深度图渲染', 'Shadow Acne 成因与 Slope-Scale Bias', 'Peter Panning 悬浮伪影', 'PCF 软阴影滤波核'],
    playgroundTitle: 'Shadow Map 双视角调试工作台',
    playgroundDescription: '同屏展示光源深度纹理与主相机画面，亲手调参复现 Shadow Acne 摩尔纹并用 Bias 与 PCF 修复。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-19',
        title: 'Lecture 19: Shadows, Part 2',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+19'
      },
      {
        course: 'MIT',
        code: 'MIT-19',
        title: 'Lecture 19: Shadow Maps',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },

  // ==================== STAGE 5 ====================
  {
    id: 'L25',
    number: 25,
    stageId: 5,
    title: '相机运动 (Camera Motion)、关键帧与弧长参数化',
    subtitle: 'Camera Path Interpolation, Arc-Length Parameterization & Orientation Splines',
    concepts: ['关键帧插值与 Ease-In/Ease-Out', '为什么参数 t 匀速会导致镜头忽快忽慢', '弧长参数化查找表 (Arc-Length Reparameterization)', 'Frenet 标架与四元数朝向平滑'],
    playgroundTitle: '3D 电影运镜轨迹与弧长匀速编辑器',
    playgroundDescription: '在 3D 样条路径上对比“参数 t 匀速”与“弧长 s 匀速”的相机运动速度，实时调整时间缓动曲线。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-20',
        title: 'Lecture 20: Camera Motion',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+20'
      }
    ]
  },
  {
    id: 'L26',
    number: 26,
    stageId: 5,
    title: '角色动画与骨骼蒙皮 (Skeletal Animation & Skinning)',
    subtitle: 'Rigging, Bind Pose Matrices & Linear Blend Skinning (LBS / SSD)',
    concepts: ['骨骼层级与 Bind Pose 逆矩阵', '线性混合蒙皮公式 ∑ w_i T_i B_i⁻¹ v', '顶点权重热力图', 'Candy-Wrapper 体积坍缩缺陷与双四元数蒙皮'],
    playgroundTitle: '骨骼蒙皮权重绘制与关节扭转实验室',
    playgroundDescription: '旋转双骨关节并调节顶点混合权重，观察平滑蒙皮过渡以及大角度扭转时的糖果纸坍缩现象。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-06',
        title: 'Lecture 06: Computer Animation & Skinning',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L27',
    number: 27,
    stageId: 5,
    title: '粒子系统与常微分方程数值积分 (ODEs & Euler Methods)',
    subtitle: 'Phase Space, Explicit/Implicit Euler, Midpoint & RK4 Stability',
    concepts: ['一阶与二阶常微分方程状态向量', '相空间向量场', '显式欧拉为何能量无界爆炸', '隐式欧拉、半隐式欧拉与 RK4 精度对比'],
    playgroundTitle: 'ODE 数值积分器稳定性竞技场',
    playgroundDescription: '在弹簧谐振子相空间中同时运行 Explicit Euler、Symplectic Euler、Midpoint 与 RK4，调大 Δt 观察发散与收敛。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-07',
        title: 'Lecture 07: Particle Systems & ODEs',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L28',
    number: 28,
    stageId: 5,
    title: '质点弹簧系统与实时布料仿真 (Mass-Spring & Cloth Simulation)',
    subtitle: 'Structural/Shear/Bending Springs, Hooke Law, Damping & Collision Constraints',
    concepts: ['结构弹簧、剪切弹簧与弯曲弹簧拓扑', '胡克定律与速度阻尼力', '显式/半隐式时间步进与刚度危机', '球体碰撞检测与位置约束'],
    playgroundTitle: '3D 交互式布料风洞与张力可视化沙盒',
    playgroundDescription: '用鼠标拖拽或取消布料固定针脚，开启风场与碰撞球，按受力大小实时着色内部弹簧张力。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-08',
        title: 'Lecture 08: Mass-Spring Systems & Cloth Simulation',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },

  // ==================== STAGE 6 ====================
  {
    id: 'L29',
    number: 29,
    stageId: 6,
    title: '色彩科学 (Color Science)：从人眼感知到 CIE 与 Gamma',
    subtitle: 'Human Cone Response, Metamers, CIE 1931 XYZ, Gamut & sRGB Gamma',
    concepts: ['光谱功率分布与同色异谱 (Metamerism)', 'L/M/S 视锥细胞响应', 'CIE 1931 色度图与色域三角形', 'Linear Space 渲染与 sRGB Gamma 2.2 校正'],
    playgroundTitle: 'CIE 色度图探索器与线性光照对比仪',
    playgroundDescription: '交互采样 CIE 1931 马蹄图色域，并同屏对比“sRGB 非线性空间直接光照”与“Linear 工作流”的物理准确性。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-20',
        title: 'Lecture 20: Color',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L30',
    number: 30,
    stageId: 6,
    title: '图像处理、卷积核与实时后处理管线 (Post-Processing)',
    subtitle: '2D Convolution, Gaussian Blur, Edge Detection, Bloom & ACES Tone Mapping',
    concepts: ['2D 离散卷积与可分离高斯模糊', 'Sobel 梯度边缘检测', 'HDR 帧缓冲与泛光 (Bloom)', 'Reinhard vs ACES Filmic 色调映射曲线'],
    playgroundTitle: '实时后处理与色调映射曲线工作台',
    playgroundDescription: '自定义 3×3 卷积核参数，调节 HDR 曝光度、Bloom 阈值并实时观察 ACES S-Curve 对高光的平滑压缩。',
    videos: [
      {
        course: 'MIT',
        code: 'MIT-21',
        title: 'Lecture 21: Image Processing',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L31',
    number: 31,
    stageId: 6,
    title: '显示设备原理、VR 光学与图形学分支全景',
    subtitle: 'Subpixel Layouts, Refresh Rates, VR Lens Distortion & Branches in CG',
    concepts: ['OLED/LCD 子像素排列与 ClearType', '双目视差 (Binocular Disparity) 与 vergence-accommodation 冲突', 'VR 透镜桶形畸变与枕形预校正', '科学可视化、几何处理与图形学全分支'],
    playgroundTitle: 'VR 透镜预畸变与子像素阵列显微镜',
    playgroundDescription: '调节 VR 透镜畸变系数 k₁/k₂ 与双目瞳距，并放大观察 RGB 与 PenTile 子像素排布渲染。',
    videos: [
      {
        course: 'UCD',
        code: 'UCD-21',
        title: 'Lecture 21: Branches in Computer Graphics',
        youtubeUrl: 'https://www.youtube.com/results?search_query=UC+Davis+Computer+Graphics+Fall+2009+Lecture+21'
      },
      {
        course: 'MIT',
        code: 'MIT-22',
        title: 'Lecture 22: Output Devices',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  },
  {
    id: 'L32',
    number: 32,
    stageId: 6,
    title: '现代 3D Foundation 终极贯通：glTF、WebGPU 与 3D Gaussian Splatting',
    subtitle: 'Modern 3D Scene Standards (glTF/USD), WebGPU Compute & 3DGS / Neural Rendering',
    concepts: ['glTF 2.0 & OpenUSD 现代资产结构', 'WebGL 状态机 vs WebGPU 现代命令管线', '显式网格 vs 隐式 SDF Raymarching', '3D Gaussian Splatting (3DGS) 协方差矩阵投影与 Alpha 混合'],
    playgroundTitle: '现代 3D 四大表示法同屏实验室 (Mesh / Voxel / SDF / 3DGS)',
    playgroundDescription: '将整门课程所学的 3D 变换、协方差矩阵、光栅化与球谐光照融会贯通，实时交互操控 3D 高斯椭球泼溅合成。',
    videos: [
      {
        course: 'EXT',
        code: 'EXT-32',
        title: 'Capstone: Modern 3D Foundation & Neural Rendering Bridge',
        youtubeUrl: 'https://www.youtube.com/playlist?list=PLQ3UicqQtfNtqt2yL3KgKV-yn0NEPbRVi'
      }
    ]
  }
];
