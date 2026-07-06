/**
 * Registers a handler for incoming `agent-store://` deep links (the OAuth callback).
 * Safe outside Tauri (dynamic import + catch) so it no-ops in tests/dev browser.
 * Returns an unlisten function.
 */
export async function onDeepLink(handler: (url: string) => void): Promise<() => void> {
  try {
    const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link')
    return await onOpenUrl((urls) => {
      for (const url of urls) handler(url)
    })
  } catch {
    return () => {}
  }
}
