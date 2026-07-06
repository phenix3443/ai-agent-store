import { open } from '@tauri-apps/plugin-shell'

/** Opens a URL in the system browser. Wrapped so tests can mock it without touching plugin-shell's Command. */
export function openExternal(url: string): Promise<void> {
  return open(url)
}
