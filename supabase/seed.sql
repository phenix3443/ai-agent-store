-- supabase/seed.sql
-- Local E2E test data. Applied by: supabase db reset (after migrations).
--
-- Two groups of rows:
-- 1. "Test Co" publisher + its 3 items: functional fixtures exercised by
--    scripts/local-e2e.sh (install/config/enable/disable round-trip).
-- 2. The Web Store mock catalog (apps/store/lib/mock/publishers.ts and
--    apps/store/lib/mock/items.ts): 4 publishers / 7 items, seeded here so
--    the GUI's "浏览" search results (real Supabase via `search` RPC) stay
--    visually consistent with what the Web Store shows from its static
--    mock module.

INSERT INTO publishers (slug, name, avatar_url, tier, bio) VALUES
  ('anthropic', 'Anthropic', 'https://api.dicebear.com/9.x/shapes/svg?seed=anthropic', 'official', '构建 Claude 与 Claude Code 的团队官方发布。'),
  ('openai', 'OpenAI', 'https://api.dicebear.com/9.x/shapes/svg?seed=openai', 'official', 'GPT 系列模型的官方供应商配置。'),
  ('yls-me', 'YLS.me', 'https://api.dicebear.com/9.x/shapes/svg?seed=yls', 'verified', '已验证的第三方模型中转服务。'),
  ('devfox', 'devfox', 'https://api.dicebear.com/9.x/shapes/svg?seed=devfox', 'community', '独立开发者，专注前端工具技能。'),
  ('agent-store', 'Agent Store', 'https://api.dicebear.com/9.x/shapes/svg?seed=agent-store', 'official', 'Agent Store 官方内置组件。'),
  ('skyapi', 'SkyAPI', 'https://api.dicebear.com/9.x/shapes/svg?seed=skyapi', 'community', '稳定线路、免翻墙接入 Claude Code 的第三方中转服务。');

-- Skill: Superpowers (Anthropic)
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'superpowers',
  'Superpowers',
  '一套用于头脑风暴、写计划、TDD 执行的技能合集，覆盖完整开发流程。',
  'https://example.com/readme/superpowers.md',
  'https://api.dicebear.com/9.x/icons/svg?seed=superpowers',
  'skill', '2.4.0',
  (SELECT id FROM publishers WHERE slug = 'anthropic'),
  ARRAY['claude','codex'], ARRAY['workflow','planning','tdd'], 128000, 4.9, 'published',
  $${"steps":[]}$$,
  $${"contentUrl":"https://example.com/content/superpowers.zip"}$$
);

-- Skill: PDF Processing (Anthropic)
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'pdf-processing',
  'PDF Processing',
  '读取、生成、审阅 PDF 文件，支持渲染检查与内容抽取。',
  'https://example.com/readme/pdf-processing.md',
  'https://api.dicebear.com/9.x/icons/svg?seed=pdf',
  'skill', '1.3.2',
  (SELECT id FROM publishers WHERE slug = 'anthropic'),
  ARRAY['claude','codex'], ARRAY['pdf','documents'], 64500, 4.7, 'published',
  $${"steps":[]}$$,
  $${"contentUrl":"https://example.com/content/pdf-processing.zip"}$$
);

-- Skill: Frontend Design (devfox)
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'frontend-design',
  'Frontend Design',
  '为新建或重塑 UI 提供有主见的视觉设计指导，避免千篇一律的默认样式。',
  'https://example.com/readme/frontend-design.md',
  'https://api.dicebear.com/9.x/icons/svg?seed=frontend',
  'skill', '1.0.5',
  (SELECT id FROM publishers WHERE slug = 'devfox'),
  ARRAY['claude'], ARRAY['design','frontend','ui'], 31200, 4.5, 'published',
  $${"steps":[]}$$,
  $${"contentUrl":"https://example.com/content/frontend-design.zip"}$$
);

-- Provider: local (built-in relay) — the endpoint Claude/Codex point at; forwards
-- to upstream providers by level. No upstream API key. Rendered specially in the
-- CLI client (LOCAL_PROVIDER_SENTINEL __local__); this catalog row is its store listing.
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'local',
  '本地中转',
  '内置本地中转：将 Claude Code / Codex 的 baseURL 指向本机监听端口，请求按 Level 优先级转发到已配置的上游供应商，失败自动降级。无需 API 密钥。',
  'https://example.com/readme/local.md',
  'https://api.dicebear.com/9.x/icons/svg?seed=local-relay',
  'provider', '1.0.0',
  (SELECT id FROM publishers WHERE slug = 'agent-store'),
  ARRAY['claude','codex'], ARRAY['relay','local','内置'], 0, 5.0, 'published',
  $${"steps":[]}$$,
  $${"configSchema":{},"supportedModels":[]}$$
);

-- Provider: yls (伊莉思 Code) — real China relay for Codex CLI. Pre-fills the codex
-- endpoint connection on install; user supplies the Bearer API key.
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'yls',
  'YLS Code 中转',
  '伊莉思 Code 中转服务，国内直连免翻墙接入 Codex CLI（GPT-5 Code）与 Claude Code；此预设接入其 Codex 端点，按订阅计费。',
  'https://docs.ylsagi.io/',
  'https://api.dicebear.com/9.x/icons/svg?seed=yls-code',
  'provider', '1.0.0',
  (SELECT id FROM publishers WHERE slug = 'yls-me'),
  ARRAY['codex'], ARRAY['relay','codex','国产中转'], 32000, 4.7, 'published',
  $${"steps":[{"type":"config","patch":{"apiKey":"","baseUrl":"https://code.ylsagi.com/codex","authType":"bearer","upstreamProtocol":"auto","level":1}}]}$$,
  $${"configSchema":{"type":"object","required":["apiKey"],"properties":{"apiKey":{"type":"string","description":"API 密钥 (Bearer)"},"baseUrl":{"type":"string","description":"API 地址","default":"https://code.ylsagi.com/codex"},"authType":{"type":"string","default":"bearer"},"upstreamProtocol":{"type":"string","default":"auto"},"level":{"type":"number","default":1}}},"supportedModels":["gpt-5-codex","gpt-5"]}$$
);

-- Provider: skyapi — real China relay for Claude Code (Anthropic protocol). Pre-fills
-- the claude endpoint connection on install; user supplies the x-api-key.
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'skyapi',
  'SkyAPI 中转',
  'SkyAPI 中转服务，稳定线路免翻墙接入 Claude Code，兼容 Cursor / Cline / Windsurf 等客户端。',
  'https://www.skyapi.org/docs/zh-CN/',
  'https://api.dicebear.com/9.x/icons/svg?seed=skyapi',
  'provider', '1.0.0',
  (SELECT id FROM publishers WHERE slug = 'skyapi'),
  ARRAY['claude'], ARRAY['relay','claude','国产中转'], 21000, 4.5, 'published',
  $${"steps":[{"type":"config","patch":{"apiKey":"","baseUrl":"http://150.158.2.79:8888","authType":"anthropic","upstreamProtocol":"auto","level":1}}]}$$,
  $${"configSchema":{"type":"object","required":["apiKey"],"properties":{"apiKey":{"type":"string","description":"API 密钥 (x-api-key)"},"baseUrl":{"type":"string","description":"API 地址","default":"http://150.158.2.79:8888"},"authType":{"type":"string","default":"anthropic"},"upstreamProtocol":{"type":"string","default":"auto"},"level":{"type":"number","default":1}}},"supportedModels":["claude-opus-4-8","claude-sonnet-5","claude-haiku-4-5-20251001","claude-opus-4-5"]}$$
);

-- MCP: Filesystem MCP (Anthropic)
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'filesystem-mcp',
  'Filesystem MCP',
  '本地文件系统访问的 MCP 服务，通过 stdio 启动。',
  'https://example.com/readme/filesystem-mcp.md',
  'https://api.dicebear.com/9.x/icons/svg?seed=fs-mcp',
  'mcp', '0.5.3',
  (SELECT id FROM publishers WHERE slug = 'anthropic'),
  ARRAY['claude','codex'], ARRAY['mcp','filesystem'], 45600, 4.6, 'published',
  $${"steps":[]}$$,
  $${"transport":"stdio","serverCommand":"npx -y @modelcontextprotocol/server-filesystem","configSchema":{}}$$
);

-- MCP: Web Search MCP (devfox)
INSERT INTO items (
  slug, name, description, readme_url, icon,
  category, version, publisher_id,
  compatible_with, tags, downloads, rating, status,
  install_hook, metadata
) VALUES (
  'web-search-mcp',
  'Web Search MCP',
  '远程 HTTP MCP 服务，提供实时网页检索能力。',
  'https://example.com/readme/web-search-mcp.md',
  'https://api.dicebear.com/9.x/icons/svg?seed=search-mcp',
  'mcp', '1.1.0',
  (SELECT id FROM publishers WHERE slug = 'devfox'),
  ARRAY['claude'], ARRAY['mcp','search'], 9400, 4.1, 'published',
  $${"steps":[]}$$,
  $${"transport":"http","url":"https://mcp.example.com/web-search","configSchema":{}}$$
);
