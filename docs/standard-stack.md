# 标准后端栈（所有独立产品复用）

> 定稿 2026-07-10。这是每个新产品的默认后端选型与约定。目标：**很多独立小产品、test 免费、prod 付费换稳定、环境之间零差异债**。
> agent-store 是第一个迁到这套栈的产品（见 [`agent-store-migration.md`](./agent-store-migration.md)），迁完即作为新产品的 starter 模板。

## 1. 选型总览

| 层 | 选型 | 为什么 |
|---|---|---|
| 计算 | **Cloudflare Workers** + **Hono** | 已在用；一个账号无限 Worker，按量、边际成本≈0 |
| 数据库 | **Neon**（serverless Postgres） | 免费档 ~100 项目 + scale-to-zero（不像 Supabase 2 项目/7 天暂停）→ test 免费；prod 上付费档换常驻+备份。**test/prod 同引擎** |
| 认证 | **Better Auth**（每产品各自实例，共享配置包） | 自托管、$0、用户存自己库、不按 MAU 收费；跨产品无耦合 |
| 数据访问 | **Drizzle ORM** | 类型安全 + 迁移工具（drizzle-kit）；不锁厂商；边缘友好 |
| 对象存储 | **Cloudflare R2**（按需） | 同账号、零 egress |
| 支付 | **Waffo Pancake**（MoR） | 已接；见 agent-store |

**明确不用**：Supabase（免费仅 2 项目/账号 + 7 天暂停，扛不住"很多产品"）；D1/Turso（SQLite：无 RLS、单写、要把 Postgres 重写成 SQLite = 正是要避免的差异债，AI 向量也弱）。

## 2. 环境模型

三套环境，规则：**dev 与 test 共用外部服务与数据；prod 与 test 完全隔离；三者同技术栈只换实例。**

| 维度 | dev（本地） | test（线上） | prod（线上） |
|---|---|---|---|
| Worker | `wrangler dev` @127.0.0.1 | `<app>-test` | `<app>-prod` |
| Neon | 指向 test 的免费库（共用） | 免费项目 | **独立付费项目** |
| Better Auth | 指向 test 库 | test 库 | prod 库（独立用户表） |
| 前端 API 地址 | `http://127.0.0.1:8787` | `<app>-test.workers.dev` | prod 域名 |
| 数据 | ← 与 test 同一份 → | 共享 | 隔离 |

要点：**同一个 Postgres 引擎贯穿三套环境**，schema/查询/迁移完全一致，杜绝"test 一套 prod 另一套"的行为分叉。

## 3. 认证：Model 2（每产品独立 + 共享模板）

- 每个产品跑**自己的 Better Auth 实例**，用户表在**该产品自己的 Neon 库**里 → 产品间用户/数据完全隔离，无共享依赖、无单点故障。
- 只建**一次** auth 配置包（如 `packages/auth`）：封装 session 策略、GitHub/Google social provider、Drizzle adapter、cookie/JWT 约定。新产品 `import` 后只填**该产品的 DB 连接 + OAuth app 凭据**，分钟级接好，不重写。
- **消费方**：
  - Web（Next.js）：Better Auth 的 Next handler 挂在 `/api/auth/*`；客户端用 `authClient` 取 session。
  - 桌面/CLI（Tauri）：系统浏览器走 OAuth → 深链 `<app>://auth-callback` 带回 session；本地存 token，之后作为 Bearer 调 API。
  - API（Worker）：用 Better Auth 的 session/JWT 校验替代原来的第三方 `getUser`。
- **演进口子**：需要跨产品单点登录时，把某产品的 Better Auth 升级成中央 **OIDC Provider**，其它产品当客户端接入。Model 2 → 中央 SSO 平滑，反向很痛，所以默认从 Model 2 起步。

## 4. 数据访问与授权

- **Drizzle** 定义 schema（TS）+ `drizzle-kit` 生成/执行迁移，替代手写 SQL 迁移与 `supabase-js`。
- **授权放在 API 层，不依赖数据库 RLS**。理由：新架构里 **API（Worker）是数据库的唯一客户端**（用 service 级连接），浏览器/桌面端只经 API 访问数据，不直连库。因此把"谁能读写什么"写进 Worker 代码，比依赖 Postgres RLS 更直观、可测试（RLS 依赖的 `auth.uid()` 是 Supabase 注入的，脱离 Supabase 就不成立）。
- 需要向量/AI：Neon 有 `pgvector`，直接用。

## 5. 配置与密钥约定

- 本地：`apps/api/.dev.vars`（gitignore），`.dev.vars.example` 入库做模板，值指向 **test 的共享服务**。
- 线上：`wrangler secret put <KEY> --env test|production`。禁止把密钥写进 `wrangler.toml`。
- 标准 env 键：
  - `DATABASE_URL`（Neon 连接串，含 pooler）
  - `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`
  - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`（每产品各自的 OAuth app）
  - 产品相关（如 Waffo 的 `WAFFO_*`）
- 前端构建期：`NEXT_PUBLIC_API_URL` 按环境注入（dev=`http://127.0.0.1:8787`，test/prod=对应 Worker）。

## 6. CI/CD 与分支纪律

- **一律走 PR**：`分支 → PR → e2e 绿 → merge`。分支保护 `strict + required: e2e`，**不 admin bypass**（见记忆 `no-bypass-pr-flow`）。
- e2e 是真跑 agent + 真装包的端到端测试；部署 gated 在 e2e 成功之上。
- Worker 部署：`wrangler deploy --env test|production`。

## 7. 起一个新产品的清单

1. `clone` agent-store starter（迁移完成后即成模板）。
2. Neon：建 **test 免费项目** + **prod 付费项目**；把连接串设成 `<app>-test` / `<app>-prod` 的 secret。
3. Better Auth：新建该产品的 GitHub OAuth app，填 `GITHUB_CLIENT_*` + `BETTER_AUTH_*`；`packages/auth` 直接复用。
4. Drizzle：改 schema，`drizzle-kit push` 到 test/prod。
5. 前端 `NEXT_PUBLIC_API_URL` 指向对应 Worker。
6. 建分支开 PR，e2e 绿后 merge、部署。

## 8. 成本速览

- **test/dev**：Neon 免费 + Workers 免费额度 + Better Auth 自托管 = **$0**。
- **prod（每产品）**：Neon 付费档（约 $19/月起，常驻+备份）+ Workers 按量 + R2 按需。auth 无额外月费。
- 产品越多，靠"每产品一个 Neon 项目 + scale-to-zero"把闲置成本压到接近 0；真到规模再谈单产品的付费档。
