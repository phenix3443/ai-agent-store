import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

const STATE_DIR = 'agent-store-cli'

function fileName(key: string): string {
  return `${STATE_DIR}/${key}.json`
}

export async function readLocalState<T>(key: string, fallback: T): Promise<T> {
  const path = fileName(key)
  const fileExists = await exists(path, { baseDir: BaseDirectory.AppData })
  if (!fileExists) return fallback
  const content = await readTextFile(path, { baseDir: BaseDirectory.AppData })
  return JSON.parse(content) as T
}

export async function writeLocalState<T>(key: string, value: T): Promise<void> {
  await mkdir(STATE_DIR, { baseDir: BaseDirectory.AppData, recursive: true })
  await writeTextFile(fileName(key), JSON.stringify(value), { baseDir: BaseDirectory.AppData })
}
