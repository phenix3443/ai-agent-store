# Agent Package Skill V2 设计文档

## 1. 目标

Skill V2 在不改变总体 package/component 抽象的前提下，引入 `skill`。

总体设计保持不变：

- **package**：唯一分发与安装单位
- **component**：内部能力单元
- package 级安装、配置、启用、同步语义保持不变

V2 的工作，不是重新定义模型，而是在已经稳定的 package 模型里新增 `skill` 这一类 component。

## 2. 范围

V2 只开发：

- `skill`

V2 不开发：

- `mcpServer`

V2 推荐的实现边界：

- 允许 `skill-only package`
- 是否允许 `provider + skill` 混合包，可以在实现层延后
- 但 manifest 总模型必须从 V2 起具备表达这种组合的能力

## 3. Skill 的核心判断

V2 对 skill 采用“源引用模型”，不强制把 skill 内容打进 package。

原因：

- skill 内容通常较长
- skill 通常天然存放在 GitHub 仓库里
- 保留源仓库引用，比把内容复制进 package 更符合维护方式

因此，manifest 只描述：

- skill 来源于哪个仓库
- 固定到哪个 ref
- skill 入口文件路径是什么

真正的拉取、缓存、同步，由 client 负责。

## 4. Skill Component

### 4.1 结构

```typescript
export interface SkillComponent {
  id: string
  type: 'skill'
  version: string

  name?: string
  description?: string

  targets: Partial<Record<'claude' | 'codex', true | {
    adapter?: 'skill-file' | `${string}.${string}`
    config?: Record<string, unknown>
  }>>

  source: {
    repo: string
    ref?: string
    path: string
    format?: 'markdown' | 'yaml' | 'text'
  }
}
```

### 4.2 为什么这样设计

#### 不保留 `source.kind`

如果 V2 只支持 GitHub，那么：

- `source.kind: "github"` 没有信息增益
- 它只是在 schema 里重复“V2 当前只支持 GitHub”这个版本事实

因此 V2 直接约定：

- `source.repo` 默认就是 GitHub 仓库，格式 `<owner>/<repo>`

如果未来要扩展 GitLab、本地仓库或 registry，再在 V3+ 引入判别字段。

#### `source.path` 必填

V2 不建议让 skill 入口依赖“默认猜测”。

因为：

- skill 文件位置并不天然标准化
- 不同仓库结构差异很大
- client 猜默认入口会让行为不透明

因此 V2 要求 `source.path` 必填。

#### `targets` 可以用 `true`

对于绝大多数 skill：

- `claude` 默认就是 `skill-file`
- `codex` 默认也是 `skill-file`

所以：

```json
{
  "targets": {
    "claude": true,
    "codex": true
  }
}
```

就足够了。

只有真的要覆盖默认 adapter 或补充 adapter 级配置时，才需要 object 形式。

## 5. 语义

skill component 表示一个可安装到 target 宿主中的可复用指令、提示词或技能资产。

manifest 提供的是：

- skill 身份
- skill 版本
- skill 源仓库位置
- skill 入口文件
- skill 支持哪些 target

manifest 不负责：

- 直接内嵌 skill 正文
- 描述 client 具体如何 clone/fetch/cache

## 6. 示例

```json
{
  "schemaVersion": 2,
  "name": "code-review-skill",
  "displayName": "Code Review Skill",
  "version": "1.0.0",
  "description": "Code review skill package",
  "publisher": {
    "slug": "repo",
    "name": "Repo"
  },
  "categories": ["skill"],
  "keywords": ["code-review", "skill"],
  "components": [
    {
      "id": "review",
      "type": "skill",
      "version": "1.0.0",
      "source": {
        "repo": "repo/code-review-skills",
        "ref": "main",
        "path": "skills/review/SKILL.md",
        "format": "markdown"
      },
      "targets": {
        "claude": true,
        "codex": true
      }
    }
  ]
}
```

## 7. Store 与 Client 影响

### 7.1 Store

Store 收录时新增 skill 相关索引字段：

- component type = `skill`
- source repo
- source ref
- target 集合

### 7.2 Client

Client 在安装或同步 skill 时需要：

1. 根据 `source.repo` / `source.ref` / `source.path` 获取内容
2. 做本地缓存
3. 生成宿主需要的 skill 文件
4. 按 target 默认 adapter 或显式 adapter 同步

## 8. 校验规则

1. `schemaVersion` 必须等于 `2`
2. package 至少包含一个 component
3. 所有 component 必须是 `skill`
4. `source.repo` 必须符合 `<owner>/<repo>` 格式
5. `source.path` 必填
6. `targets` 至少包含一个 target binding
7. `targets` 的 key 只能是 `claude` 或 `codex`

## 9. 刻意延后到 V3 的内容

- mcpServer component
- skill 与 mcp 的组合包
- 非 GitHub skill source
- skill source 的认证、缓存失效与离线策略
