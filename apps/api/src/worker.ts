import { app } from './app'

// Cloudflare Workers entry: Hono's app is itself a fetch handler. Workers passes
// secrets as the second `env` arg, surfaced to handlers as `c.env`.
export default app
