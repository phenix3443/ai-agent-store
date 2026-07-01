import { createEngine } from './engine'
import { runSearch } from './commands/search'
import { runList } from './commands/list'
import { runInfo } from './commands/info'
import { runInstall } from './commands/install'
import { runUninstall } from './commands/uninstall'
import { runEnable } from './commands/enable'
import { runDisable } from './commands/disable'
import { runConfig } from './commands/config'
import { runSync } from './commands/sync'
import { runUpdate } from './commands/update'
import { runRpc } from './commands/rpc'

const USAGE = `aas — AI Agent Store CLI

Usage: aas <command> [options]

Commands:
  search <query>                   Search the market
  install <slug>                   Install an item (or update if already installed)
  uninstall <slug>                 Uninstall an item
  enable <slug> --for <tool>       Enable for claude or codex
  disable <slug> --for <tool>      Disable for claude or codex
  config <slug>                    Configure an item's settings
  sync [--for <tool>]              Sync enabled items to tool configs
  update [slug]                    Update installed items
  list [--for <tool>]              List installed items
  info <slug>                      Show item details`

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE)
    return
  }

  const engine = createEngine()

  switch (command) {
    case 'search':    await runSearch(engine, rest); break
    case 'list':      await runList(engine, rest); break
    case 'info':      await runInfo(engine, rest); break
    case 'install':   await runInstall(engine, rest); break
    case 'uninstall': await runUninstall(engine, rest); break
    case 'enable':    await runEnable(engine, rest); break
    case 'disable':   await runDisable(engine, rest); break
    case 'config':    await runConfig(engine, rest); break
    case 'sync':      await runSync(engine, rest); break
    case 'update':    await runUpdate(engine, rest); break
    case '__rpc': {
      const code = await runRpc(engine, rest)
      process.exit(code)
    }
    default:
      console.error(`Unknown command: ${command}`)
      console.log(USAGE)
      process.exit(1)
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
