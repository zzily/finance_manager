# Finance Manager（个人财务管理前端）

一个基于 **React + TypeScript + Vite** 的个人财务管理前端项目，聚焦“收入支出、账单核销、月度复盘、交易记录”四类核心场景，帮助你更高效地管理家庭现金流并复盘交易表现。

## 功能概览

- **首页总览（Dashboard）**
  - 关键指标卡片、提醒信息、近期动态。
- **账单中心（Transactions）**
  - 账单列表、筛选、编辑、结果统计工具栏。
- **核销工作台（Settlement Workbench）**
  - 核销流程与相关弹窗（历史、确认等）。
- **复盘洞察（Monthly Review）**
  - 月度收支趋势与复盘数据展示。
- **交易日志（Trading Journal）**
  - 交易记录、编辑与指标分析。
- **账本设置（页头齿轮）**
  - 手动切换线上/本地账本、导出完整记录、管理与导入常用记录。

## 技术栈

- **框架与语言**：React 19、TypeScript
- **构建工具**：Vite 7
- **样式方案**：Tailwind CSS
- **数据请求**：Axios
- **服务端状态管理**：TanStack React Query
- **图表**：Recharts
- **UI 组件基础**：shadcn/ui + Radix UI（new-york、Tailwind v3）
- **测试**：Vitest + Testing Library

## 快速开始

### 1) 环境要求

- Node.js 20.19+ 或 22.12+（Vite 7 要求）
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

1. 打开页头的 **账本设置**。
2. 选择线上或本地账本，查询缓存按连接隔离，页面重新加载。
3. 正在保存时禁用切换。连接失败显示重试入口，不会自动切换账本或重放写入。

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

## 设计与业务约定

- 首页失败、加载、缓存和真实空账本分别展示；更新时间注明缓存的新鲜度。
- 页面顶部紧凑，手机使用固定底部导航。核销采用选账单、选收入、确认金额三步，并限制收入余额、未结金额和两位小数。
- 账单筛选写入 hash URL，跨页保留搜索、月份与返回位置。首页点击具体账单时传递 ID，找不到时不替换为另一笔。
- 交易页默认展示记录，分析位于独立标签；快速记录只需核心字段，详细复盘可随后补充。
- 常用账单模板按账本连接保存在当前设备，最多 20 条。月度模板需确认后录入，成功后标记本月已记录；可通过设置中的 JSON 导入恢复模板。
- 新版后端支持支出发生日期、自定义分类和个人消费一次支付；月份筛选及统计按发生日期计算。工作/个人分组与生活支出分类分开。
- CSV 导出当前筛选账单，版本 2 JSON 是完整账本快照，可经预检恢复到空账本；保留核销关联与交易复盘字段，重复导入不会新增记录。恢复密钥仅用于本次操作，不保存到设备。
- 后端为 [zzily/FastApi](https://github.com/zzily/FastApi)。前端先读取能力接口：旧版后端保留原流程及版本 1 导出，不展示无法保存的新字段。部署、迁移及接口说明见 [后端契约](docs/backend-contract.md)。
- shadcn 配置位于 `components.json`，复用现有 Radix 组件并采用语义主题变量。实现参考 [官方 shadcn skill](https://ui.shadcn.com/docs/skills) 与其 [SKILL.md](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md)。

实现与验证记录见 [设计优化记录](docs/design-improvements.md)。
