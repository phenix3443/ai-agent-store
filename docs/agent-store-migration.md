# agent-store 迁移方案：Supabase → 标准栈

> 把 agent-store 从 Supabase 迁到 [`standard-stack.md`](./standard-stack.md)（Neon + Better Auth + Drizzle），作为标准栈的**第一个样本**，迁完即成新产品 starter 模板。
> **时机**：prod 尚未上线（Waffo 未过 KYB、无真实用户数据/会话），是迁移的最佳窗口——现在几乎无数据要搬、无线上会话会断。

## 1. 现状盘点（Supabase 咬合面）

盘点自 2026-07-10 代码。分四块：

### API（`apps/api`）
| 文件 | 用途 |
|---|---|
| `src/supabase.ts` | Supabase client 工厂（service-role + anon） |
| `src/auth.ts` | `getAuthUser` → `supabase.auth.getUser(token)` 校验 JWT |
| `src/queries.ts` / `subscription-queries.ts` / `publisher-items.ts` | 用 supabase-js 读写 DB（service-role） |
| `src/app.ts` | 路由消费以上；Waffo checkout/webhook 与 Supabase 无关 |

### Store（`apps/store`，Next.js）
| 文件 | 用途 |
|---|---|
| `lib/supabase/{client,server}.ts`、`lib/auth.ts` | 浏览器/服务端 Supabase client + `getUser` |
| `middleware.ts` | 刷新 session + `getUser` |
| `app/auth/{login,callback,logout}/route.ts` | GitHub OAuth 登录 / `exchangeCodeForSession` / 登出 |
| `dashboard`、`pricing`、`ReviewsSection`、`UpgradeProButton`、`PublishModal` | 用 `getSession()` 取 access token 调 API |

### 桌面端（`apps/cli-gui`，Tauri）— 最难的一块
| 文件 | 用途 |
|---|---|
| `lib/supabase.ts` | client + `AUTH_REDIRECT_URL = 'agent-store://auth-callback'` |
| `state/Auth.tsx` | `getSession` / `onAuthStateChange` / `signInWithOAuth`(GitHub) / `exchangeCodeForSession` / `signOut` |
| `lib/deepLink.ts` | 接 `agent-store://` 深链（OAuth 回调） |

### DB / RLS
- 5 个 migration：`001_initial`（items/publishers）、`002_subscriptions`、`003_drop_item_icon_readme`、`004_reviews`、`005_item_versions`。
- 表：items、publishers、subscriptions、processed_webhooks、reviews、item_versions。
- RLS 用 `auth.uid()`（Supabase 注入），公开读限 `status='published'`，写限本人。

**当前认证模型**：三端都从 Supabase 拿 session token → 作为 Bearer 调 API → API 用 `supabase.auth.getUser` 校验；RLS 用 `auth.uid()`。数据读写基本都经 API（浏览器不直连库，除认证外），这对迁移有利。

## 2. 目标态

| 现在 | 迁移后 |
|---|---|
| Supabase Postgres | **Neon**（test 免费 / prod 付费，同引擎） |
| Supabase Auth（GitHub OAuth，JWT） | **Neon Auth**（Neon 托管的 Better Auth，用户同步进 Neon 库，GitHub social） |
| `supabase-js` 查询 | **Drizzle** |
| RLS（`auth.uid()`）做授权 | **API 层做授权**（Worker 是唯一 DB 客户端） |
| 三端 Supabase session | 三端 Better Auth session（Web handler / 桌面深链） |

## 3. 三个硬骨头（提前点名）

1. **桌面 OAuth 深链**：Supabase 现在托管了"浏览器 OAuth → `agent-store://auth-callback`"整套。改成 Better Auth 后，要由 API 的 Better Auth 端点发起/回调，深链带回 Better Auth 的 session（token 或一次性 code）。Better Auth 支持此类流程，但桌面这条**需要先做一个 spike 验证**再铺开。
2. **RLS → API 层授权**：脱离 Supabase，`auth.uid()` 的 RLS 不再成立。把授权规则（谁能发评价、谁能看自己的订阅/条目）改写进 API handler。因为浏览器本就不直连库，这步是"把隐式的 DB 规则显式化到代码"，可测试。
3. **三端换 session 来源**：Web 路由、桌面 Auth.tsx、API getAuthUser 三处同时依赖 Supabase session，需协调切换（分阶段 + 回滚点见下）。

## 4. 分阶段计划（每阶段 e2e 必须保持绿 + 可回滚）

> 原则：**test 先一直挂在现有 Supabase 上**，逐块把 Neon/Better Auth 等价物做绿再切；每阶段一个 PR，回滚 = revert 该 PR。

### Phase 0 — Neon + Drizzle schema（零行为变更）
- 建 Neon **test（免费）** + **prod（付费）** 项目。
- 用 Drizzle 重写 schema（对齐 5 个 migration 的表），`drizzle-kit` 迁移到 Neon。
- 暂不接线到运行代码，纯并行准备。**验收**：Neon 两库 schema 与 Supabase 一致。

### Phase 1 — 数据层切 Drizzle（先不动 Auth）
- API 的 `queries/subscription-queries/publisher-items` 从 supabase-js 换成 **Drizzle 打 Neon**；**认证暂仍用 Supabase**。
- 授权逻辑从 RLS 上移到 API handler。
- **验收**：目录浏览/安装、订阅落库、评价读写、版本历史全部经 Neon；e2e 绿。回滚 = 切回 supabase-js。

### Phase 2 — Auth 换 Neon Auth（大头）
- 开启 **Neon Auth**（底层 Better Auth，用户/session 同步进 Neon）；在 Neon Auth 侧配 GitHub OAuth app。
- API `getAuthUser` → 校验 Neon Auth session。
- Store：`/auth/*` 路由与 `middleware`、各组件取 token 改用 Neon Auth SDK。
- 桌面端：**先 spike 验证** Neon Auth 的浏览器 OAuth → `agent-store://auth-callback` 深链回流是否可行（单独 PR，不与其它改动混），再改 `Auth.tsx` + `deepLink`。
- **验收**：三端 GitHub 登录、entitlement 读取、发评价全通；e2e 绿。回滚 = 保留 Supabase Auth 路径于 flag 后。

### Phase 3 — 切换与清理
- 三套环境统一指向 Neon + Better Auth；下线 supabase-js 依赖与 `SUPABASE_*` secret。
- Supabase 项目**保留一段时间做备份**，稳定后再停用。
- **验收**：全链路无 Supabase 依赖；e2e 绿；Waffo 付费/试用闭环回归通过（见现有 checkout/webhook）。

## 5. 数据迁移

- 目录数据（items/publishers/…）：从 Supabase `agent-store-test` 导出 → 导入 Neon（纯表数据，直接搬）。
- 用户：Supabase `auth.users` → Better Auth 用户表。**因 prod 未上线、仅 test 用户**，可直接重建、不做复杂映射。
- 订阅（subscriptions）：test 里那条测试订阅可重建；prod 上线后由 Waffo webhook 自然落库。

## 6. 配置/密钥变更

移除：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`NEXT_PUBLIC_SUPABASE_*`。
新增：`DATABASE_URL`（Neon）、Neon Auth 项目级 keys（project id + publishable + secret server key）、GitHub OAuth app 凭据。
新增模板：`apps/api/.dev.vars.example`、补 `apps/store/.env.local.example` 的 `NEXT_PUBLIC_API_URL`。

## 7. 风险与待验证

- **桌面深链回流**（Phase 2 最大不确定项）→ 先做独立 spike，不要和其它改动混在一个 PR。
- **e2e 依赖**：e2e 用到 Supabase 的地方需同步切到 Neon/Better Auth，否则门禁会红。
- **Waffo 不动**：支付这条与 Supabase 无关，迁移全程不碰；仅注意 webhook 落库的目标从 Supabase 表变成 Neon 表（Phase 1 覆盖）。
- **RLS 心智转变**：授权从"数据库兜底"变"代码兜底"，需补 API 层授权测试。

## 8. 顺序小结

Phase 0（准备，零风险）→ Phase 1（数据层，可回滚）→ Phase 2（Auth，含桌面 spike）→ Phase 3（切换清理）。全程 test 不断线、每阶段 e2e 卡绿、每阶段独立 PR。
