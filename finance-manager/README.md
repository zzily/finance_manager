# Finance Manager（个人财务管理前端）

一个基于 **React + TypeScript + Vite** 的个人财务管理前端项目，聚焦“交易记录、账单核销、月度复盘、交易日志”四类核心场景，帮助你更高效地管理现金流与复盘经营表现。

## 功能概览

- **首页总览（Dashboard）**
  - 关键指标卡片、提醒信息、近期动态。
- **账单中心（Transactions）**
  - 账单列表、筛选、编辑、结果统计工具栏。
- **核销工作台（Settlement Workbench）**
  - 核销流程与相关弹窗（历史、确认等）。
- **复盘洞察（Monthly Review）**
  - 月度趋势与经营复盘数据展示。
- **交易日志（Trading Journal）**
  - 交易记录、编辑与指标分析。
- **API 环境切换器（右下角悬浮按钮）**
  - 一键切换“线上/本地”环境，支持健康检查与失败自动切换。

## 技术栈

- **框架与语言**：React 19、TypeScript
- **构建工具**：Vite 7
- **样式方案**：Tailwind CSS
- **数据请求**：Axios
- **服务端状态管理**：TanStack React Query
- **图表**：Recharts
- **UI 组件基础**：Radix UI
- **测试**：Vitest + Testing Library

## 快速开始

### 1) 环境要求

- Node.js 18+（推荐 LTS）
- npm 9+

### 2) 安装依赖

```bash
npm install
```

### 3) 启动开发环境

```bash
npm run dev
```

默认启动后可在终端输出的本地地址访问（通常是 `http://localhost:5173`）。

### 4) 生产构建与预览

```bash
npm run build
npm run preview
```

## 可用脚本

```bash
npm run dev         # 启动本地开发服务
npm run build       # TypeScript 编译 + Vite 构建
npm run preview     # 预览构建产物
npm run lint        # ESLint 检查
npm run test        # 运行单次测试
npm run test:watch  # 测试监听模式
```

## API 环境说明

项目内置两套 API 环境：

- `☁️ 线上`：`https://fastapi-0tu0.onrender.com`
- `💻 本地`：`http://localhost:8000`

使用方式：

1. 打开页面右下角 **API 环境切换器**。
2. 选择目标环境后，系统会自动刷新查询缓存。
3. 当请求发生网络错误/超时/服务端 5xx 时，会自动尝试切换到下一个可用环境。

> 若你在本地联调后端，请先确保本地服务可访问（如 `http://localhost:8000/docs`）。

## 项目结构（节选）

```text
finance-manager/
├─ src/
│  ├─ components/         # 复用组件（dashboard/dialogs/ui 等）
│  ├─ hooks/              # 数据与状态 hooks
│  ├─ layouts/            # 页面框架
│  ├─ lib/                # API、格式化、工具函数
│  ├─ pages/              # 业务页面
│  ├─ test/               # 测试基础设施
│  ├─ App.tsx             # 应用入口视图调度
│  └─ main.tsx            # 挂载入口
├─ public/
├─ index.html
└─ package.json
```

## 测试与质量保障

- 使用 `Vitest` 进行单元/组件测试。
- 使用 `ESLint` 进行静态检查。

建议在提交前执行：

```bash
npm run lint
npm run test
```

## 后续可扩展方向

- 增加登录与多用户支持。
- 引入更细粒度的权限模型。
- 接入埋点与可观测性（日志、性能指标）。
- 增加 E2E 测试（如 Playwright）。

---

如果你希望，我也可以继续帮你补一版：

- 面向团队协作的 README（包含分支规范、提交规范、发布流程）
- 面向后端联调的 README（接口契约、错误码、Mock 方案）
