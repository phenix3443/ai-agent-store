# Agent Package Manifest V1 设计文档

## 1. 目标

定义一种统一的 **agent package** 格式，用来在同一个打包模型中表达 `provider` 和 `skill`。

这个 package 必须同时支持两种分发路径：

1. 上传到 store，作为标准安装单元发布
2. 不经过 store，直接安装到本地 client

这个格式将替代当前“`provider`、`skill` 是顶层市场条目类型”的假设。变更后的核心模型是：

- **package**：唯一的分发与安装单位
- **component**：package 内部的能力单位
- `provider`、`skill`：component type

这个设计必须同时支持：

- 单能力 package
- 多能力 package，例如一个 package 内包含多个 skill，或包含 provider + skill

并且后续扩展时不需要再改动根数据模型。

## 2. 非目标

V1 不定义以下内容：

- package 签名
- package 依赖解析
- package 与 package 之间的组合关系
- sandbox 或权限模型
- 计费、付费 package、授权能力
- 安装与 target sync 之外的运行时生命周期
- 图形化 package 编辑器
- MCP server component

V1 也不试图 1:1 复刻 Codex plugin 或 Claude plugin 的 manifest。它只借鉴“**一个包内包含多个组件**”这个建模方向，定义本项目自己的 store 与 client 共用格式。

## 3. 设计原则

### 3.1 Package First

系统安装和版本化的是 package，而不是单个 component。

### 3.2 Component 是内部能力单元

一个 package 可以包含一个或多个 component。V1 中 component 不独立安装，但具有独立版本字段。

### 3.3 单能力与多能力共用同一模型

多 component package 不是特殊情况。一个只有单个 component 的 package，只是 `components` 数组长度为 1 的普通 package。

### 3.4 面向 Target，但不耦合 Target 细节

manifest 可以描述一个 component 如何映射到 `claude` 或 `codex`，但不能直接写死最终宿主配置文件 patch。最终翻译工作必须由 client adapter 负责。

### 3.5 Store 与 Client 使用同一份权威格式

同一份 manifest 需要同时支持：

- store 收录
- store 搜索和展示
- 本地安装
- 本地 target sync

### 3.6 避免重复表达同一事实

如果一个事实可以由其他字段确定，就不再增加一份平行字段。

V1 因此遵循：

- 不单独维护 package 级 `supportedTargets`
- 不单独维护 component 级 `supportedTargets`

这些信息都应由 `components[].targets` 和 `components[].type` 推导出来，避免 manifest 落入“多个字段互相打架”的状态。

但在 store 收录侧，可以把这些派生结果作为 store 自己的持久化索引字段保存下来，用于搜索、过滤和展示加速。

### 3.7 启用与配置必须以 Package 为基本语义

V1 中，安装、配置、启用、停用、target sync 的基础语义都必须落在 package 级别。

原因：

- package 是唯一发布、分发、安装单位
- 用户安装的是一个完整能力包，而不是包内若干独立开关
- 如果允许 component 级单独启用，会导致“同一个 package 只启用了一半”的不一致状态

因此：

- 安装：package 粒度
- 配置：package 粒度
- 启用/停用：package 粒度
- target sync：package 粒度

component 仍然存在，但它的职责是：

- 描述 package 内部由哪些能力构成
- 提供 target adapter 所需的映射信息
- 提供 package 级配置在内部如何分发给各 component 的结构边界

## 4. 术语定义

### 4.1 Package

可发布、可安装的最小单元。

例子：

- 一个只包含 OpenAI-compatible provider 的 package
- 一个只包含 skill 的 package
- 一个同时包含多个 skill 的 package
- 一个同时包含 provider 和 skill 的 package

### 4.2 Component

package 内部的一个有类型的能力单元。

V1 的 component type：

- `provider`
- `skill`

### 4.3 Target

client 可以同步到的宿主运行时。

V1 的 target：

- `claude`
- `codex`

### 4.4 Target Adapter

client 侧实现的翻译逻辑，用来把某个 component 转换成 target 可识别的文件或配置。

例如：

- `skill-file`
- `mcp-registration`
- `openai-compatible-provider`
- `anthropic-compatible-provider`

manifest 只声明 adapter 名称，adapter 的真正实现放在 client 中。

### 4.5 打包阶段

把原始素材整理成标准 package 的过程。

例如：

- 现有 skill 的源仓库信息整理为标准 `source` 元数据
- 现有 `mcp` 二进制或脚本复制到 package 内
- 现有 `provider` 元数据写入 package manifest

V1 的运行时 manifest 主要描述 **打包完成后的内容**。

但对 skill component，V1 允许保留其源仓库引用，而不是强制把 skill 实体文件一并打进 package。

## 5. Package 模型

### 5.1 顶层结构

```typescript
export interface AgentPackageManifestV1 {
  schemaVersion: 1

  name: string
  displayName: string
  version: string
  description: string

  publisher: {
    slug: string
    name: string
  }

  license?: string
  homepage?: string
  repository?: string

  readme?: {
    path: string
  }

  icon?: {
    path: string
  }

  categories?: string[]
  keywords?: string[]

  components: AgentPackageComponent[]
}
```

### 5.2 顶层字段语义

#### `schemaVersion`

manifest 版本号。V1 固定为 `1`。

#### `name`

package 的机器可读名称，语义对齐 VS Code extension manifest 的 `name`。

规则：

- 只允许小写字母、数字和连字符
- 在同一个 `publisher.slug` 作用域内唯一
- 发布后不可变

package 的全局标识由 `publisher.slug` 和 `name` 组合推导：

```text
<publisher.slug>.<name>
```

例子：

- `openai.openai-provider`
- `repo.code-review-pack`

#### `displayName`

package 的展示名称，语义对齐 VS Code extension manifest 的 `displayName`。

它用于 store 和 client UI 展示，不参与唯一标识计算。

#### `version`

package 版本号，使用 semver。

package `version` 表示整个发布物的版本。

V1 中 component 也有自己的 `version` 字段，两者关系如下：

- package 是发布单位，所以 package `version` 必填
- component 是内部能力单元，所以 component `version` 也必填
- 任意 component 内容发生变化时：
  - 该 component 的 `version` 必须更新
  - 所属 package 的 `version` 也必须更新

因此：

- component `version` 表示内部能力单元自身的版本
- package `version` 表示整个发布物的版本

#### `categories`

用于 package 的展示分类，语义参考 VS Code extension manifest 的 `categories`。

它主要服务于 store 的分类浏览和筛选，不参与 client 安装语义。

#### `keywords`

用于 package 的搜索关键词，语义参考 VS Code extension manifest 的 `keywords`。

它主要服务于 store 搜索召回和过滤，不参与 client 安装语义。

#### `components`

package 内部的能力列表。

V1 要求：

- 至少包含一个 component
- component id 在 package 内唯一
- 每个 component 必须声明自己的 `version`

## 6. 组件通用模型

### 6.1 顶层类型

```typescript
export type AgentTarget = 'claude' | 'codex'

export type BuiltInTargetAdapter =
  | 'skill-file'
  | 'openai-compatible-provider'
  | 'anthropic-compatible-provider'

export type CustomTargetAdapter = `${string}.${string}`

export type TargetAdapter = BuiltInTargetAdapter | CustomTargetAdapter

export interface ExplicitTargetBinding {
  adapter?: TargetAdapter
  config?: Record<string, unknown>
}

export type TargetBinding = true | ExplicitTargetBinding

export interface BaseComponent {
  id: string
  type: 'provider' | 'skill'
  version: string

  name?: string
  description?: string

  targets: Partial<Record<AgentTarget, TargetBinding>>
}
```

### 6.2 Component 标识规则

`component.id` 只要求在 **当前 package 内唯一**。

`component.id` 不应该编码类型信息，因为已经有独立的 `type` 字段。

不推荐：

- `provider.openai`
- `skill.review`

推荐：

- `openai`
- `review`

系统可以推导全局唯一的 component 引用：

```text
<publisher.slug>.<name>#<component.id>
```

例子：

```text
repo.code-review-pack#review
```

### 6.2.1 Component 版本规则

`component.version` 使用 semver。

它表示该 component 自身的版本，不等同于 package 版本。

规则：

- 每个 component 必填 `version`
- 一个 package 发布时，manifest 中所有 component 都必须显式声明版本
- V1 不要求 package 内所有 component 版本相同
- 如果任意 component 内容发生变化：
  - 该 component 的 `version` 必须更新
  - package 的 `version` 也必须更新

### 6.3 Component 与 Target 的约束

V1 不单独定义 `supportedTargets` 字段。

一个 component 的支持 target 集合直接由 `targets` 的 key 集合决定。

因此：

- 出现在 `targets` 中的 target，表示该 component 支持该 target
- package 的支持 target 集合，由所有 component 的 `targets` key 交集推导

这样定义的原因是：

- package 级启用是一个原子操作
- 只有当 package 内所有 component 都支持某个 target 时，这个 package 才能整体对该 target 生效
- 某个 target 只被部分 component 支持时，不能把它算作 package 的正式支持 target

V1 进一步要求：

- 一个 package 的支持 target 集合不能为空

也就是说，package 内所有 component 至少要共享一个公共 target。

### 6.4 Target Binding 约束

`adapter` 用来声明应该使用哪种 client adapter 把 component 翻译成 target 侧配置。

V1 规则：

- `true` 表示该 component 支持该 target，并使用该 component type 在该 target 上的默认 adapter
- 内置 adapter 使用固定字符串
- 自定义 adapter 必须使用带命名空间的格式 `<namespace>.<name>`
- object 形式可以显式声明 `adapter`，也可以只提供 `config`

例如：

- `skill-file`
- `openai-compatible-provider`
- `anthropic-compatible-provider`
- `myorg.custom-provider`

V1 的默认 adapter 映射为：

- `skill` → `skill-file`
- `provider` on `claude` → `anthropic-compatible-provider`
- `provider` on `codex` → `openai-compatible-provider`

因此，只有在需要覆盖默认 adapter，或者确实需要额外 `config` 时，才需要写 object 形式。

`config` 是 adapter 级高层元数据，但不能直接写最终 target 配置文件 patch。

### 6.5 Package 配置命名空间

V1 规定：配置的基本归属对象是 package。

但由于 package 内可能包含多个 component，且不同 component 的配置字段可能重名，所以 package 的配置结构仍然需要保留 component 边界。

推荐本地形态：

```json
{
  "packageConfig": {
    "openai": {
      "apiKey": "..."
    },
    "filesystem": {
      "ROOT": "/tmp"
    }
  }
}
```

语义上，这仍然是一个 package 的配置对象，而不是多个独立 component 配置对象。

原因：

- 配置操作对象必须是 package
- 组合包内多个 component 的字段需要隔离，避免冲突
- client 在做 package 级启用或同步时，需要一次性读取完整 package 配置

因此，`configSchema` 和 `envSchema` 仍然分别由 component 提供，但它们共同组成 package 的整体配置结构。

### 6.6 资源路径规则

所有出现在 manifest 中的本地路径都必须：

- 相对于 package 根目录解析
- 指向 package 内部资源

V1 不允许把远程 URL 作为 provider 配置文件或 stdio MCP 可执行文件的最终来源。

如果 provider 配置或 stdio MCP 可执行内容来源于远程 URL，必须在**打包阶段**先落地到 package 内部，再由 manifest 引用本地路径。

skill component 是例外：

- skill 可以保留远程源仓库引用
- client 在安装或同步 skill 时负责解析、拉取或缓存其内容

## 7. Provider Component

### 7.1 结构

```typescript
export interface ProviderComponent extends BaseComponent {
  type: 'provider'

  configSchema: JsonSchema

  models?: string[]

  provider: {
    baseUrlKey?: string
  }
}
```

### 7.2 含义

provider component 用来定义：

- 用户需要填写哪些配置
- package 对外宣称支持哪些模型
- 如果存在可配置的 base URL，哪个配置字段承载它
- 配置 schema 本身应该收集哪些值

V1 不允许 provider component 在 manifest 中显式声明 `apiKeyKey`，但允许声明 `baseUrlKey`。

原因：

- `apiKeyKey` 会把 component 和当前 client 的敏感字段识别实现绑死
- package 作者不应该决定 client 如何识别“哪个字段是密钥”
- `baseUrlKey` 是 provider 的基础连接信息，不属于敏感值定位，实现上也需要稳定映射
- 因此密钥字段应由 schema 注解规范或 client 内置约定解析，而 base URL 字段可以由 manifest 显式声明

### 7.3 为什么 V1 不保留 `provider.protocol`

基于当前代码实现，provider 在 client 侧真正被消费的字段主要是：

- `configSchema`
- provider 配置值本身，例如 `apiKey`、`baseUrl`
- `targets[target].adapter`

当前仓库里的真实行为是：

- Claude 同步逻辑只会把 provider 配置写入 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL`
- Codex 同步逻辑只会把 provider 配置写入 `model_provider`、`model_providers.<slug>.base_url` 和 `auth.json`
- 本机 `code-switch-r` 的真实 `config.toml` 也表明，Codex 最终关心的是 `base_url`、`wire_api`、`requires_openai_auth` 这类宿主侧配置，而不是 manifest 里的独立 provider 协议字段

也就是说，当前阶段真正决定“如何落到宿主配置”的是 target adapter 和 client adapter 实现，而不是 `provider.protocol`。

因此 V1 先不保留 `provider.protocol`，避免引入一个当前代码并未消费、也无法稳定校验的字段。

### 7.4 Provider 配置字段识别

V1 约定：

- provider 的用户配置由 `configSchema` 定义
- 哪个字段表示 API key，不通过 provider manifest 显式声明
- 如果存在可配置的 base URL，推荐通过 `provider.baseUrlKey` 显式声明
- API key 字段识别由 schema 注解规范或 client 约定完成

也就是说，manifest 负责回答：

- 用户需要填什么配置
- 如果有 base URL，哪个字段承载它

manifest 不负责回答：

- `configSchema` 里的哪个 key 一定是“密钥字段名”

### 7.5 约束

- `configSchema` 必填
- `provider.baseUrlKey` 如果存在，必须引用 `configSchema.properties` 中存在的字段
- `targets` 至少要包含一个 target binding
- `models` 是描述性元数据，不是强制校验列表

### 7.6 Provider 互斥规则

V1 明确规定：

- 在同一个 target 上，任意时刻只能有一个 provider component 处于已启用状态

作用范围：

- 同 package 内多个 provider component 互斥
- 不同 package 中的 provider component 也互斥

这条规则延续当前 client 对 provider 的实际行为：target 在任一时刻只能连接一个生效的 provider。

### 7.7 示例

```json
{
  "id": "openai",
  "type": "provider",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "required": ["apiKey"],
    "properties": {
      "apiKey": {
        "type": "string",
        "x-agent-secret": true
      },
      "baseUrl": {
        "type": "string",
        "default": "https://api.openai.com/v1"
      }
    }
  },
  "models": ["gpt-4o", "gpt-4o-mini"],
  "provider": {
    "baseUrlKey": "baseUrl"
  },
  "targets": {
    "claude": { "adapter": "anthropic-compatible-provider" },
    "codex": { "adapter": "openai-compatible-provider" }
  }
}
```

## 8. Skill Component

### 8.1 结构

```typescript
export interface SkillComponent extends BaseComponent {
  type: 'skill'

  source: {
    kind: 'github'
    repo: string
    ref?: string
    path?: string
    format?: 'markdown' | 'yaml' | 'text'
  }
}
```

### 8.2 含义

skill component 表示一个可安装到 target 宿主中的可复用指令、提示词或技能资产。

V1 中，skill 不要求把实际内容打进 package。

manifest 可以只保留 skill 的源仓库定位信息，由 client 在安装或同步时获取实际内容。

### 8.3 约束

- `source.kind` 必填，V1 固定为 `github`
- `source.repo` 必填，格式为 `<owner>/<repo>`
- `source.ref` 可选，用来固定分支、tag 或 commit
- `source.path` 可选，用来指向仓库内的 skill 文件路径；缺省时由 target adapter 或 client 约定决定默认入口
- `targets` 至少要包含一个 target binding
- V1 假定一个 skill component 对应一个逻辑 skill 入口
- 某些 target 不支持的格式可以由 client 在安装时拒绝

### 8.4 示例

```json
{
  "id": "review",
  "type": "skill",
  "version": "1.0.0",
  "source": {
    "kind": "github",
    "repo": "acme/agent-skills",
    "ref": "main",
    "path": "skills/review/SKILL.md",
    "format": "markdown"
  },
  "targets": {
    "claude": { "adapter": "skill-file" },
    "codex": { "adapter": "skill-file" }
  }
}
```

## 9. MCP Server Component

### 9.1 结构

```typescript
export interface McpServerBaseComponent extends BaseComponent {
  type: 'mcpServer'
  envSchema?: JsonSchema
}

export interface McpServerStdioComponent extends McpServerBaseComponent {
  transport: 'stdio'
  command: string
  args?: string[]
  cwd?: string
}

export interface McpServerRemoteComponent extends McpServerBaseComponent {
  transport: 'sse' | 'http'
  url: string
}

export type McpServerComponent =
  | McpServerStdioComponent
  | McpServerRemoteComponent
```

### 9.2 含义

MCP server component 用来声明一个可以注册到一个或多个 target 中的 MCP 服务。

### 9.3 约束

对于 `transport: "stdio"`：

- `command` 必填
- `args` 和 `cwd` 可选
- `command` 指向的路径或可执行入口必须在 package 安装后可解析

对于 `transport: "sse"` 或 `transport: "http"`：

- `url` 必填

通用约束：

- `targets` 至少要包含一个 target binding
- `envSchema` 是可选字段，用来描述这个 component 需要用户提供哪些环境变量

### 9.4 示例

```json
{
  "id": "filesystem",
  "type": "mcpServer",
  "version": "1.0.0",
  "transport": "stdio",
  "command": "./server",
  "args": [],
  "envSchema": {
    "type": "object",
    "properties": {
      "ROOT": { "type": "string" }
    }
  },
  "targets": {
    "claude": { "adapter": "mcp-registration" },
    "codex": { "adapter": "mcp-registration" }
  }
}
```

## 10. 完整 Manifest 示例

### 10.1 单能力 Package

```json
{
  "schemaVersion": 1,
  "name": "openai-provider",
  "displayName": "OpenAI Provider",
  "version": "1.0.0",
  "description": "OpenAI-compatible provider package",
  "publisher": {
    "slug": "openai",
    "name": "OpenAI"
  },
  "categories": ["provider"],
  "keywords": ["openai", "llm", "openai-compatible"],
  "components": [
    {
      "id": "openai",
      "type": "provider",
      "version": "1.0.0",
      "configSchema": {
        "type": "object",
        "required": ["apiKey"],
        "properties": {
          "apiKey": {
            "type": "string",
            "x-agent-secret": true
          },
          "baseUrl": {
            "type": "string",
            "default": "https://api.openai.com/v1"
          }
        }
      },
      "models": ["gpt-4o", "gpt-4o-mini"],
      "provider": {
        "protocol": "openai-compatible",
        "baseUrlKey": "baseUrl"
      },
      "targets": {
        "claude": { "adapter": "anthropic-compatible-provider" },
        "codex": { "adapter": "openai-compatible-provider" }
      }
    }
  ]
}
```

### 10.2 多能力 Package

```json
{
  "schemaVersion": 1,
  "name": "code-review-pack",
  "displayName": "Code Review Pack",
  "version": "1.0.0",
  "description": "Skill and MCP package for code review flows",
  "publisher": {
    "slug": "repo",
    "name": "Repo"
  },
  "categories": ["bundle"],
  "keywords": ["code-review", "skill", "mcp"],
  "components": [
    {
      "id": "review",
      "type": "skill",
      "version": "1.2.0",
      "source": {
        "kind": "github",
        "repo": "repo/code-review-skills",
        "ref": "main",
        "path": "skills/review/SKILL.md",
        "format": "markdown"
      },
      "targets": {
        "codex": { "adapter": "skill-file" }
      }
    },
    {
      "id": "filesystem",
      "type": "mcpServer",
      "version": "2.0.0",
      "transport": "stdio",
      "command": "./server",
      "targets": {
        "codex": { "adapter": "mcp-registration" }
      }
    }
  ]
}
```

## 11. Package 目录结构

V1 不强制要求固定的内部目录布局，只要求 manifest 中引用的文件路径都能相对于 package 根目录正确解析。

推荐目录结构：

```text
my-package/
├── agent-package.json
├── README.md
├── icon.png
├── mcp/
│   └── server
└── assets/
```

唯一硬约束是：manifest 中出现的本地路径都必须相对于 package 根目录可解析。

## 12. Store 模型变化

### 12.1 Store 基本单位

store 应该发布和索引 **package**，而不是原始的 provider / skill / mcp item。

### 12.2 搜索与过滤

store 可以在收录时，从 manifest 中派生出可搜索字段，并将其持久化到 store 自己的 package 记录中。

建议的派生字段：

- package identifier（由 `publisher.slug + "." + name` 推导）
- package name
- package displayName
- package version
- publisher
- target 集合（由所有 component 的 `targets` key 交集推导）
- component 数量
- component type 集合
- provider component 宣称支持的 models
- categories
- keywords

其中，package 级 `targets` 应作为 store 记录中的显式字段维护，而不是在列表展示或搜索时重复现算。

store 收录时必须校验：

- store 中写入的 package 级 `targets`，等于所有 component `targets` key 的交集
- 该交集不能为空

### 12.3 分类语义

当前顶层 item category 应降级为 **派生展示结果**，而不是权威存储类型。

V1 的默认派生规则：

- 只有 `provider` component：分类为 `provider`
- 只有 `skill` component：分类为 `skill`
- 只有 `mcpServer` component：分类为 `mcp`
- 含有多于一种 component type：分类为 `bundle`

例如：

- 一个只包含 provider component 的 package，可以展示在 Providers 下
- 一个只包含 skill component 的 package，可以展示在 Skills 下
- 一个同时包含 skill 和 MCP 的 package，可以展示在 Bundles 下，也可以同时出现在对应过滤视图中

## 13. Client 模型变化

### 13.1 安装流程

client 安装的是 package，然后在 package 内逐个安装 component。

高层流程：

1. 加载 package manifest
2. 校验 manifest
3. 把 package 内容复制到本地 package 存储目录
4. 遍历 `components`
5. 按 component type 分发给对应 installer
6. 把已安装 package 元数据写入本地 registry

### 13.1.1 安装后的 registry 粒度

package 是安装单位，但 registry 至少要能表达：

- package 已安装
- package 中有哪些 component
- package 在哪些 target 上启用

因此，V1 的 registry 设计不应再只保留当前 item 级 `slug/category/enabledFor` 结构，而需要升级为 package-first 结构，并记录 package 级启用状态。

### 13.2 Sync 流程

target sync 改为 package 驱动。

对于每个已安装 package：

1. 读取 package 的 components
2. 判断当前 target 是否属于该 package 的支持 target 集合
3. 如果是，则遍历 package 内全部 component
4. 按 `component.type` 分发
5. 使用 `targets[target].adapter` 翻译成最终 target 配置

### 13.2.1 启用与停用语义

V1 定义：

- `install package`：安装整个 package 的所有资源
- `configure package`：写入一个 package 的完整配置对象
- `enable package for target`：把整个 package 启用到某个 target
- `disable package for target`：把整个 package 从某个 target 取消

不定义：

- `enable component for target`
- `disable component for target`
- “只配置 package 中某一个 component” 作为基础持久化语义

原因：

- package 是用户认知中的安装和启用对象
- package 级启用必须保持原子性
- package 内 component 只是内部构成，不应暴露为独立启用状态机

如果 CLI 或 GUI 未来提供更细粒度的调试入口，它也只能是临时诊断能力，不应写入 V1 的标准持久化状态模型。

### 13.3 本地存储结构

当前 `~/.agents/providers`、`~/.agents/skills`、`~/.agents/mcps` 的按类别存储结构，应演进为按 package 存储。

推荐的 V1 本地结构：

```text
~/.agents/
├── packages/
│   └── <publisher.slug>.<name>/
│       ├── agent-package.json
│       └── ...
└── registry.json
```

这意味着本地存储模型会从当前的“category-first”变成“package-first”。

## 14. 从当前模型迁移

当前 marketplace item 可以 1:1 映射成单 component package：

### Provider Item → Package

- package 内含一个 `provider` component
- 当前 `configSchema` 映射到 provider component 的 `configSchema`
- 当前 `supportedModels` 映射到 provider component 的 `models`

### Skill Item → Package

- package 内含一个 `skill` component
- 当前 skill 的仓库地址、ref、入口路径映射到 `source`
- manifest 保留源仓库引用，不强制内置 skill 实体文件

### MCP Item → Package

- package 内含一个 `mcpServer` component
- 当前 `transport`、`serverCommand`、`configSchema` 映射到 MCP component 的对应字段
- 如果现有 MCP 安装依赖远程二进制或脚本，也应在打包阶段落地到 package 内

因此，V1 的迁移主要是结构迁移，而不是概念迁移。

## 15. 校验规则

V1 manifest 校验必须保证：

1. `schemaVersion` 必须等于 `1`
2. `name`、`displayName`、`version`、`description`、`publisher`、`components` 为必填
3. `name` 必须符合允许的标识符格式
4. `publisher.slug` 必须符合允许的标识符格式
5. `publisher.slug + "." + name` 必须能形成全局唯一 package identifier
6. component id 在 package 内必须唯一
7. 每个 component 必须包含合法的 `version`
8. 每个 component 必须有合法的 `type`
9. 每个 component 至少需要一个 target binding
10. `targets` 的 key 只能是已知 target
11. 所有 component 的 `targets` key 交集不能为空
12. provider component 必须包含 `configSchema` 和 `provider`
13. skill component 必须包含合法的 `source`
14. `mcpServer` component 必须满足 transport 对应的结构约束
15. 所有 `path` 字段都必须是相对 package 根目录的合法路径
16. stdio MCP 的 `command` 如果是相对路径，必须相对于 package 根目录可解析

## 16. 刻意延后的开放问题

这些问题不在 V1 内解决：

1. `categories` 是否应该像 VS Code 一样限制为枚举集合，而不是任意字符串？
2. `adapter` 是否应继续保持字符串形式，还是改成强类型判别联合对象？
3. package 内 component 之间是否应该允许显式引用，例如 skill 依赖同包内某个 MCP component？
4. package 是否需要声明权限、信任等级或风险级别？
5. store 的分类过滤对多 component package 应该视作多分类成员，还是只视作 bundle？
6. future target 是否允许 package 声明额外宿主，例如 `cursor`、`windsurf`、`chatgpt`？

## 17. 推荐结论

建议把这版 package 模型作为新的权威抽象：

- **package** 是唯一发布与安装单位
- **component** 是唯一能力抽象
- `provider`、`skill`、`mcpServer` 只是 component type
- target 的最终配置翻译仍然放在 client 中，不放在 manifest patch 中

这样可以同时覆盖当前的单能力 package 和未来类似 Codex plug 的多能力 package，而不需要再做一次根模型重构。
