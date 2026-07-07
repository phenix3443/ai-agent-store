// Open a pull request against the registry repo from a web-form submission, so
// non-GitHub-savvy users can contribute a package without leaving the store. The
// PR then goes through the same validate + review as any contribution.
export type RegistryEnv = { REGISTRY_PAT?: string; REGISTRY_REPO?: string }

export interface SubmitManifest {
  slug: string
  name: string
  description: string
  category: 'provider' | 'skill' | 'mcp'
  version: string
  compatibleWith: string[]
  tags: string[]
  installHook: { steps: unknown[] }
  metadata: Record<string, unknown>
}

/** Minimal server-side validation; the registry's CI does the full schema check. */
export function validateSubmit(m: SubmitManifest): string | null {
  if (!m || typeof m !== 'object') return 'Invalid submission'
  if (!/^[a-z0-9-]+$/.test(m.slug ?? '')) return 'slug must be kebab-case ([a-z0-9-])'
  if (!['provider', 'skill', 'mcp'].includes(m.category)) return 'invalid category'
  if (!m.name?.trim()) return 'name is required'
  if (!m.description?.trim()) return 'description is required'
  if (!Array.isArray(m.installHook?.steps)) return 'installHook.steps is required'
  if (!Array.isArray(m.compatibleWith) || m.compatibleWith.length === 0) return 'compatibleWith is required'
  return null
}

function utf8Base64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function pick(env: RegistryEnv | undefined, k: keyof RegistryEnv): string | undefined {
  return env?.[k] ?? (typeof process !== 'undefined' ? process.env?.[k] : undefined)
}

export async function submitToRegistry(
  env: RegistryEnv | undefined,
  manifest: SubmitManifest,
  publisher: { slug: string; name: string }
): Promise<{ url: string } | { error: string; status: 502 | 503 }> {
  const token = pick(env, 'REGISTRY_PAT')
  if (!token) return { error: 'Registry submissions are not configured', status: 503 }
  const repo = pick(env, 'REGISTRY_REPO') ?? 'ai-agent-store/registry'
  const gh = `https://api.github.com/repos/${repo}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'agent-store',
    'Content-Type': 'application/json',
  }

  const full = { $schema: '../schema/package.schema.json', ...manifest, publisher: { ...publisher, tier: 'community' } }
  const path = `${manifest.category}/${manifest.slug}.json`
  const content = utf8Base64(JSON.stringify(full, null, 2) + '\n')

  const refRes = await fetch(`${gh}/git/ref/heads/main`, { headers })
  if (!refRes.ok) return { error: 'Failed to read the registry', status: 502 }
  const baseSha = ((await refRes.json()) as { object: { sha: string } }).object.sha

  const branch = `submit/${manifest.slug}-${crypto.randomUUID().slice(0, 8)}`
  const brRes = await fetch(`${gh}/git/refs`, { method: 'POST', headers, body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }) })
  if (!brRes.ok) return { error: 'Failed to create a branch', status: 502 }

  // If the package already exists, update it (needs the current blob sha).
  const existing = await fetch(`${gh}/contents/${path}?ref=main`, { headers })
  const sha = existing.ok ? ((await existing.json()) as { sha: string }).sha : undefined

  const putRes = await fetch(`${gh}/contents/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: `Add ${manifest.category}: ${manifest.slug}`, content, branch, ...(sha ? { sha } : {}) }),
  })
  if (!putRes.ok) return { error: 'Failed to commit the manifest', status: 502 }

  const prRes = await fetch(`${gh}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Add ${manifest.category}: ${manifest.name}`,
      head: branch,
      base: 'main',
      body: `Submitted via the Agent Store web form by @${publisher.slug}.`,
    }),
  })
  if (!prRes.ok) return { error: 'Failed to open the pull request', status: 502 }
  const pr = (await prRes.json()) as { html_url: string }
  return { url: pr.html_url }
}
