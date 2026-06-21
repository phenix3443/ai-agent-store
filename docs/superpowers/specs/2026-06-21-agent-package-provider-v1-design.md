# Agent Package Provider V1 设计文档

## 1. 目标

Provider V1 只开发 `provider`。

但总体抽象保持不变：

- **package**：唯一分发与安装单位
- **component**：package 内部能力单元
- 未来 component type 仍然会扩展到 `skill`、`mcpServer`

也就是说，V1 不是推翻总体设计重来，而是在同一套总模型下，先只落地 `provider` 这一类 component。

## 2. 分阶段原则

### 2.1 总模型先稳定

即使 V1 只支持 provider，manifest 顶层仍然使用 package/component 模型。

这样做的目的：

- 避免 V2 skill、V3 mcp 再做根模型迁移
- store、client、registry 的主干结构可以从 V1 就稳定下来

### 2.2 V1 只做单一 component type

V1 允许的 component type 只有：

- `provider`

V1 不处理：

- `skill`
- `mcpServer`
- 混合包

### 2.3 V1 先对齐当前代码

当前仓库和本机 Codex/Claude 配置逻辑表明，provider 真正需要的核心信息只有：

- 用户配置 schema
- base URL 对应哪个配置字段
- target 适配关系
- 可选的模型声明

当前代码没有稳定消费 `provider.protocol` 这类更抽象的字段，因此 V1 不引入它。

## 3. 顶层 Manifest

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

  components: [ProviderComponent]
}
```

说明：

- `components` 在 V1 固定为长度 `1`
- 唯一 component 必须是 `provider`
- package 全局标识仍然按 VS Code 风格推导为 `<publisher.slug>.<name>`

## 4. Target 模型

```typescript
export type AgentTarget = 'claude' | 'codex'

export type BuiltInTargetAdapter =
  | 'openai-compatible-provider'
  | 'anthropic-compatible-provider'

export type CustomTargetAdapter = `${string}.${string}`
export type TargetAdapter = BuiltInTargetAdapter | CustomTargetAdapter

export interface ExplicitTargetBinding {
  adapter?: TargetAdapter
  config?: Record<string, unknown>
}

export type TargetBinding = true | ExplicitTargetBinding
```

V1 默认 adapter 映射：

- `provider` on `claude` → `anthropic-compatible-provider`
- `provider` on `codex` → `openai-compatible-provider`

因此：

- `targets.claude = true` 合法
- `targets.codex = true` 合法
- 只有需要覆盖默认 adapter 或补充 adapter 级 `config` 时，才需要写 object

## 5. Provider Component

### 5.1 结构

```typescript
export interface ProviderComponent {
  id: string
  type: 'provider'
  version: string

  name?: string
  description?: string

  targets: Partial<Record<AgentTarget, TargetBinding>>

  configSchema: JsonSchema
  models?: string[]

  provider: {
    baseUrlKey?: string
  }
}
```

### 5.2 字段语义

#### `configSchema`

定义用户需要填写哪些配置。

基于当前代码，client 最终真正会读取的典型字段是：

- `apiKey`
- `baseUrl`

但 manifest 不强制字段名必须固定成这两个字符串。

#### `models`

描述性元数据，用来表达这个 provider 宣称支持哪些模型。

它主要服务于：

- store 展示
- 搜索过滤
- CLI `info` 展示

它不是 runtime 强校验字段。

#### `provider.baseUrlKey`

表示 `configSchema.properties` 中哪个字段承载 base URL。

保留这个字段的原因是：

- 当前代码和宿主配置最终都确实依赖 base URL
- 这是连接信息，不是敏感字段
- 由 manifest 显式声明，比靠 client 猜字段名更稳定

V1 不允许显式声明 `apiKeyKey`。

原因：

- 当前 client 对密钥字段仍然是宿主侧实现细节
- 把 `apiKeyKey` 写死进 manifest，会把敏感字段识别逻辑提前固化

## 6. 为什么 V1 不保留 `provider.protocol`

基于当前代码事实：

- Claude 同步时写入 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL`
- Codex 同步时写入 `model_provider`、`model_providers.<slug>.base_url` 和 `auth.json`
- 本机真实 `code-switch-r` 的 `config.toml` 里，Codex 关注的是 `base_url`、`wire_api`、`requires_openai_auth`

当前真正决定“如何落到宿主配置”的，是：

- `targets[target].adapter`
- client adapter 实现
- provider 配置值本身

因此 V1 不保留 `provider.protocol`。

这个字段如果未来需要，也应该在 V2+ 基于真实多协议场景再引入，而不是在 V1 预埋一个当前代码并未消费的抽象字段。

## 7. Package 级语义

### 7.1 安装/配置/启用

V1 基础语义全部是 package 级：

- `install package`
- `configure package`
- `enable package for target`
- `disable package for target`

虽然 V1 只有一个 provider component，这条规则仍然保留，因为它是未来多 component package 的总原则。

### 7.2 package target

V1 中 package 只有一个 provider component，因此：

- package 的支持 target 集合 = 该 provider component 的 `targets` key 集合

### 7.3 本地配置形态

即使 V1 只有一个 component，仍然建议按 package/component 边界保存配置，避免未来迁移：

```json
{
  "packageConfig": {
    "openai": {
      "apiKey": "...",
      "baseUrl": "https://api.openai.com/v1"
    }
  }
}
```

其中：

- `openai` 来自 `components[0].id`
- 里面的字段来自该 component 的 `configSchema`

## 8. 示例

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
        "baseUrlKey": "baseUrl"
      },
      "targets": {
        "claude": true,
        "codex": true
      }
    }
  ]
}
```

## 9. 与当前代码的映射

V1 provider design 直接对齐当前实现：

- store 里的 `configSchema` → `ProviderComponent.configSchema`
- store 里的 `supportedModels` → `ProviderComponent.models`
- provider 本地 `config.json` → `packageConfig.<componentId>`
- Claude 写入：
  - `ANTHROPIC_AUTH_TOKEN`
  - `ANTHROPIC_BASE_URL`
- Codex 写入：
  - `model_provider`
  - `model_providers.<slug>.base_url`
  - `auth.json`

## 10. 校验规则

1. `schemaVersion` 必须等于 `1`
2. `name`、`displayName`、`version`、`description`、`publisher`、`components` 为必填
3. `components.length` 必须等于 `1`
4. `components[0].type` 必须等于 `provider`
5. `publisher.slug + "." + name` 必须形成全局唯一 package identifier
6. provider component 必须包含合法的 `version`
7. provider component 必须至少包含一个 target binding
8. `targets` 的 key 只能是 `claude` 或 `codex`
9. `configSchema` 必填
10. `provider.baseUrlKey` 如果存在，必须引用 `configSchema.properties` 中存在的字段

## 11. 刻意延后到 V2/V3 的内容

- skill component
- mcpServer component
- 多 component package 的真实安装与同步
- component 之间的显式依赖关系
- package 权限模型
