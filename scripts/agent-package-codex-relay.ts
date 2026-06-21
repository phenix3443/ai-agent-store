import { sanitizeCodexResponsesRequest } from '../apps/client-core/src/agent-package-codex-relay'

const port = Number(process.env['AGENT_PACKAGE_CODEX_RELAY_PORT'] ?? '18100')
const upstreamBaseUrl = (process.env['AGENT_PACKAGE_CODEX_UPSTREAM_BASE_URL']
  ?? process.env['YLS_ME_BASE_URL']
  ?? 'https://code.ylsagi.com/codex').replace(/\/+$/, '')
const upstreamApiKey = process.env['AGENT_PACKAGE_CODEX_UPSTREAM_API_KEY']
  ?? process.env['YLS_ME_API_KEY']

if (!upstreamApiKey) {
  throw new Error('Missing AGENT_PACKAGE_CODEX_UPSTREAM_API_KEY or YLS_ME_API_KEY')
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true, upstreamBaseUrl, port })
    }

    if (request.method !== 'POST' || url.pathname !== '/responses') {
      return new Response('Not Found', { status: 404 })
    }

    let payload: Record<string, unknown>
    try {
      payload = await request.json()
    } catch {
      return Response.json({ error: 'invalid request body' }, { status: 400 })
    }

    const upstreamResponse = await fetch(`${upstreamBaseUrl}/responses`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${upstreamApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(sanitizeCodexResponsesRequest(payload)),
    })

    const headers = new Headers()
    const contentType = upstreamResponse.headers.get('content-type')
    if (contentType) headers.set('content-type', contentType)

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    })
  },
})

console.error(`agent-package-codex-relay listening on http://127.0.0.1:${server.port}`)

