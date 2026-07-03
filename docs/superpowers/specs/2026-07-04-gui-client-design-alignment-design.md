# GUI 客户端 UI 对齐设计稿 Design

**Goal:** 把 `apps/cli-gui`（Tauri 桌面客户端）的实际 UI 从"标签页 + 简单列表"重构为与 `docs/ui/Agent Store.dc.html`「CLI 客户端」页签一致的三栏商店式布局：图标导航条 + 分组列表 + 详情面板 + 右侧信息栏，并保留一个可折叠的终端日志面板。

## 背景

用户反馈现有 `apps/cli-gui` 实现与设计稿观感差距过大。经比对（截图 + 设计稿 HTML/JS 源码阅读）确认差距点：

1. 现有导航是四个独立文字标签（已安装/浏览/更新/收藏），各自渲染独立、极简的一行式列表；设计稿是单一列表，按「已安装」「推荐」分组，通过搜索框 `@` token 或图标筛选切换视图。
2. 现有实现点击列表项没有任何详情展示；设计稿点击后在中间展开完整详情面板（头部信息、安装命令、`概览/评价/版本` tab、安装步骤、适用场景），右侧还有独立信息栏（安装信息/市场数据/分类/资源链接）。
3. 设计稿供应商行有「编辑」「复制」两个动作；现有实现只有「配置」（对应编辑，已用 `ProviderEditModal` 实现）和「卸载」，没有「复制」。
4. 现有实现有常驻底部终端面板承担操作反馈；设计稿没有终端面板这个概念。
5. 「收藏」「更新」在设计稿里不是独立标签页，而是通过筛选 token（`@updates` `@enabled` 等）或导航图标（更新）实现。

## 范围决策（已与用户确认）

- 完全对齐设计稿的视觉与交互结构（单列表分组 + 详情面板 + 右侧信息栏），这是本次改动的主体。
- 废弃现有「更新」「收藏」独立标签页，改为搜索框旁筛选 chip / `@` token，「更新」保留为一个可切换的列表视图（沿用设计稿的 nav 概念）。
- 详情面板三个 tab 全部实现出 UI；概览有真实数据支撑，评价/版本无后端数据支撑时显示明显的占位内容（空态文案或固定说明性文字），不新增假数据后端。
- 终端面板保留，但默认折叠为一行，可展开/收起，不再占用常驻布局空间。
- 「复制供应商配置」按钮对应真实能力，需要新增 engine/RPC 支持（见下）。

## 架构

### 布局结构（`App.tsx` 重写）

```
┌─TitleBar──────────────────────────────────────────────┐
├─IconRail─┬─ListPanel─────┬─DetailPanel──────┬─InfoPanel─┤
│ 浏览      │ 目标应用下拉    │ 头部/操作/命令行    │ 安装信息   │
│ 更新(N)   │ 搜索框(@过滤)  │ Tab(概览/评价/版本) │ 市场      │
│ ──分类──  │ 已安装(分组)   │ Tab 内容           │ 分类      │
│ 全部/供应商│ 推荐(分组)     │                   │ 资源链接   │
│ 技能/MCP  │               │                   │           │
│ ──设置──  │               │                   │           │
├──────────┴───────────────┴───────────────────┴──────────┤
│ TerminalPane（默认折叠为一行，可展开）                         │
└───────────────────────────────────────────────────────┘
```

`section`（installed/browse/updates/favorites）从 `AppState` 中移除，替换为：
- `navView: 'browse' | 'updates'`（IconRail 顶部两个入口）
- `categoryFilter: 'all' | 'provider' | 'skill' | 'mcp'`（IconRail 分类图标）
- `listFilter: 'all' | 'featured' | 'popular' | 'recent' | 'installed' | 'updates' | 'enabled' | 'disabled'`（搜索框 `@` token 或筛选下拉，对应设计稿的 `filterDiscovery`/`filterStatus`）
- `selectedSlug: string | null`（当前详情面板展示的项，来自已安装或推荐列表）

### 组件拆分（新建/重写，均在 `apps/cli-gui/src/components/`）

- `IconRail.tsx`（新建）：替代 `Sidebar.tsx` 的导航部分。渲染 `浏览`/`更新`（badge = 有更新的已安装项数量）图标按钮 + 分类图标按钮（全部/供应商/技能/MCP，点击设置 `categoryFilter`）+ 底部设置齿轮图标（复用现有 `SettingsModal`）。
- `ResourceList.tsx`（重写自 `InstalledList.tsx` + `BrowseList.tsx` 合并）：
  - 顶部：目标应用下拉（取代 Sidebar 原来的 Claude/Codex 按钮组）+ 搜索框（输入以 `@` 开头时弹出 token 选择菜单，选中后设置 `listFilter` 并把输入框回显成 `@xxx`；否则按文本过滤名称/描述）。
  - 中部：按 `showInstalledSection`/`showRecommendedSection`（由 `listFilter` 决定，逻辑照抄设计稿 `showInstalled`/`showRecommended` 数组判断）渲染「已安装」「推荐」两个分组标题 + 计数。
  - 已安装行：图标、slug、publisher · category、启用 toggle（现有 `toggleEnabled` 逻辑不变）、供应商专属的「编辑」（打开 `ProviderEditModal`，逻辑不变）「复制」（新增，见下）按钮、卸载。行内展示 rating/downloads 需要额外一次 `info(slug)` 调用补全（见「数据获取」）。
  - 推荐行：图标、name、rating、downloads、「安装」按钮（逻辑不变，来自 `BrowseList` 现有 `install`）。
  - 点击任意行 `onClick`（非按钮区域）设置 `selectedSlug`。
- `DetailPanel.tsx`（新建）：
  - 无选中项时渲染空态："从左侧选择一个资源查看详情"（照抄设计稿文案）。
  - 有选中项时渲染头部（icon/name/官方徽标(`publisher.tier==='official'`时)/已发布徽标/publisher/downloads/rating/category）、操作区（已安装→"已安装"只读态 + 收藏按钮占位；未安装→"安装"按钮，逻辑同 `BrowseList.install`）、命令行展示 `agent-store add {slug}`（纯文本展示 + 复制按钮，非可执行）、`概览/评价/版本` tab。
  - `概览` tab：描述、安装步骤（渲染 `installHook.steps`，为空时不展示该子块）、适用场景（渲染 category 对应的一段固定说明文字，参照设计稿 `provider`/`skill`/`mcp` 三段文案）。
  - `评价` tab：无评论数据时展示空态"暂无评价"。
  - `版本` tab：展示一行「当前版本 v{version}」，无版本历史时不展示列表。
- `InfoSidebar.tsx`（新建）：安装信息（标识/版本/更新时间/工具数——工具数取 `configSchema` 或 MCP 的能力数，若无法获取则不展示该行）、市场（发布时间/最近发布，取 `createdAt`/`updatedAt`）、分类（`tags`）、资源链接（`readmeUrl` 等，若字段为空则该链接行不渲染，不展示假链接）。
- `TerminalPane.tsx`（改造，不重写）：加一个折叠状态（`AppState` 新增 `terminalExpanded: boolean`，默认 `false`），折叠时只显示一行 header + 展开箭头，展开时保留现有滚动日志区域。

### 数据获取

- 复用现有 `list`、`search`、`info` RPC，不新增查询类 RPC。
- 已安装行要展示 name/description/rating/downloads：在 `list` 返回后，对每个 `InstalledItem` 并发调用 `info(slug)` 补全展示字段，合并进本地状态（`EnrichedInstalledItem = InstalledItem & Pick<ItemDetail, 'name'|'description'|'publisher'|'tags'|'downloads'>`）。`rating` 字段 `info` 未返回时前端按 0 处理。
- 推荐行数据直接来自 `search` 返回的 `Item[]`，字段已完整。
- 详情面板：已安装项传入 `info(slug)` 的完整结果；推荐项直接传入 `search` 结果里对应的 `Item` 对象（前端保留一份 `Map<slug, Item>` 缓存，不重复请求）。

### 新增能力：复制供应商配置

- `apps/client-core/src/config/provider.ts`：新增 `duplicateProviderConnection(aasHome, sourceSlug, newSlug): Promise<void>`，读取源 provider 目录下的 `config.json`，复制 `connection` 字段（baseUrl/authType/modelMapping 等）写入新 slug 目录的 `config.json`，新连接不复制 enabled 状态（写入时不做 sync，需要用户手动启用）。
- `apps/client-core/src/engine.ts`：新增 `duplicateProvider(slug): Promise<{ newSlug: string }>`。生成新 slug 策略：`{slug}-copy`，若已存在则追加序号 `{slug}-copy-2`、`{slug}-copy-3` 直至不冲突；写 `manifest.json`（`category: 'provider'`, `enabledFor: {}`）+ 调 `duplicateProviderConnection`。
- `apps/cli/src/commands/rpc.ts`：新增 `duplicateProvider` 分支，入参 `[slug]`，返回 `{ newSlug }`。
- GUI「复制」按钮：仅在 `category === 'provider'` 的已安装行展示，调用 RPC 成功后刷新列表并在终端面板记录 `✓ 已复制 {slug} → {newSlug}`。

## 测试与自测计划

- 单元测试：`duplicateProviderConnection`（生成的 config.json 内容正确、不复制 enabled 状态）、`engine.duplicateProvider`（slug 冲突时的序号递增逻辑）、`rpc.ts` 新分支的参数透传。
- 组件测试（若现有 GUI 测试基建支持，沿用现有模式；否则以手动浏览器验证为主，不引入新测试框架）。
- **收尾自测（必做）**：`make dev-gui` 启动桌面客户端，人工走查：分类筛选切换、`@` token 搜索过滤、点击已安装/推荐项打开详情面板与右侧信息栏、供应商复制按钮实际生效（列表出现新条目）、终端面板折叠/展开、启用/禁用/卸载/安装全流程日志正确。这是"完整实现、不打折"目标的验收环节，必须实际操作验证而非仅凭代码审查。

## 不做的事（YAGNI）

- 不实现登录/发布/设置弹窗以外的账户体系（设计稿右上角"Y"头像/登录态在 GUI 客户端场景没有对应后端，本次不做）。
- "收藏"不做持久化后端：GUI 侧用 `AppState` 内存态维护一个 `favoriteSlug: Set<string>`（详情面板的心形按钮切换），仅在当前会话有效，刷新应用后清空；`listFilter` 的 `favorites` 值按此内存态过滤已安装+推荐列表。
- 不新增评价/版本历史的存储或 API。
