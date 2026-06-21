# Agent Package MCP V3 设计文档

## 1. 目标

MCP V3 在总体 package/component 模型不变的前提下，引入 `mcpServer`。

到这一阶段，总体抽象仍然不变：

- **package**：唯一分发与安装单位
- **component**：内部能力单元
- 按 target adapter 翻译到宿主

V3 只是新增第三类 component，而不是改 package 根模型。

## 2. 为什么 MCP 放到 V3

MCP 比 provider、skill 更复杂，原因至少有三类：

- transport 差异：`stdio`、`http`、`sse`
- 安装差异：本地可执行文件、脚本、远端服务
- 配置差异：环境变量、工作目录、命令参数、权限边界

在当前阶段，先做 MCP 会把太多 runtime 问题混进 package 设计里。

因此更合理的顺序是：

1. V1 先稳定 provider
2. V2 再稳定 skill
3. V3 最后引入 mcpServer

## 3. 范围

V3 新增：

- `mcpServer` component

V3 才真正需要处理：

- stdio MCP
- remote MCP
- MCP 相关配置 schema
- MCP target adapter

## 4. MCP Component 预期结构

```typescript
export interface McpServerBaseComponent {
  id: string
  type: 'mcpServer'
  version: string

  name?: string
  description?: string

  targets: Partial<Record<'claude' | 'codex', true | {
    adapter?: 'mcp-registration' | `${string}.${string}`
    config?: Record<string, unknown>
  }>>

  envSchema?: JsonSchema
}

export interface McpServerStdioComponent extends McpServerBaseComponent {
  transport: 'stdio'
  command: string
  args?: string[]
  cwd?: string
}

export interface McpServerRemoteComponent extends McpServerBaseComponent {
  transport: 'http' | 'sse'
  url: string
}

export type McpServerComponent =
  | McpServerStdioComponent
  | McpServerRemoteComponent
```

## 5. 语义

MCP component 描述的是：

- 这个 package 暴露一个 MCP server
- 这个 server 用什么 transport
- client 应如何把它注册到 target
- 用户还需要补什么环境变量

它不应该在 V3 里直接描述：

- 宿主配置文件 patch
- 权限白名单的最终宿主格式

这些仍然应由 client adapter 负责。

## 6. V3 的关键设计点

### 6.1 stdio 与 remote 要分开建模

`stdio` 和 `http/sse` 的安装、校验和失败模式不同，不能硬塞在一套模糊字段里。

### 6.2 `targets` 仍然保留默认 adapter 语义

对于大多数 MCP：

```json
{
  "targets": {
    "claude": true,
    "codex": true
  }
}
```

就足够表达“使用默认 MCP 注册方式”。

### 6.3 安全与权限不要在 V3 之前偷跑

MCP 真正上线时，权限和信任边界是重点，但它不应反向污染 V1/V2 的简单模型。

## 7. 示例

### 7.1 stdio MCP

```json
{
  "schemaVersion": 3,
  "name": "filesystem-mcp",
  "displayName": "Filesystem MCP",
  "version": "1.0.0",
  "description": "Filesystem MCP package",
  "publisher": {
    "slug": "repo",
    "name": "Repo"
  },
  "categories": ["mcp"],
  "keywords": ["filesystem", "mcp"],
  "components": [
    {
      "id": "filesystem",
      "type": "mcpServer",
      "version": "1.0.0",
      "transport": "stdio",
      "command": "./server",
      "envSchema": {
        "type": "object",
        "properties": {
          "ROOT": { "type": "string" }
        }
      },
      "targets": {
        "claude": true,
        "codex": true
      }
    }
  ]
}
```

### 7.2 remote MCP

```json
{
  "schemaVersion": 3,
  "name": "remote-browser-mcp",
  "displayName": "Remote Browser MCP",
  "version": "1.0.0",
  "description": "Remote browser MCP package",
  "publisher": {
    "slug": "repo",
    "name": "Repo"
  },
  "categories": ["mcp"],
  "keywords": ["browser", "mcp"],
  "components": [
    {
      "id": "browser",
      "type": "mcpServer",
      "version": "1.0.0",
      "transport": "http",
      "url": "https://mcp.example.com",
      "targets": {
        "claude": true
      }
    }
  ]
}
```

## 8. 校验规则

1. `schemaVersion` 必须等于 `3`
2. package 至少包含一个 component
3. 所有 component 必须是 `mcpServer`
4. `transport = "stdio"` 时，`command` 必填
5. `transport = "http" | "sse"` 时，`url` 必填
6. `targets` 至少包含一个 target binding

## 9. V3 才需要补齐的问题

- 命令可执行文件如何分发
- 远端 MCP 的认证模型
- envSchema 和 packageConfig 的合并方式
- MCP 权限、信任等级、风险提示
- target 对 MCP transport 的兼容差异
