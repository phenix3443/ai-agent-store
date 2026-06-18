import type { InstalledItem } from './engine'

/** Shape of ~/.agents/registry.json */
export interface RegistryJson {
  installed: InstalledItem[]
}
