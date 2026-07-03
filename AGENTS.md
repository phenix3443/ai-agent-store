# Agent Rules

## Provider switching / local proxy features

Before designing or implementing anything related to provider switching, local HTTP
proxying for Claude Code / Codex, config injection/restore, or model mapping — first
check whether these reference implementations already solved it:

- https://github.com/Rogers-F/code-switch-R (Go/Wails; local relay on `providerrelay.go`,
  config injection/restore in `claudesettings.go`/`codexsettings.go`/`proxystate.go`)
- https://github.com/farion1231/cc-switch (Tauri/Rust; proxy engine under
  `src-tauri/src/proxy/`, direct-injection path in `services/provider/mod.rs`)

If either repo (or a local checkout of either) is available, read the relevant source
before proposing a new design. Prefer adapting their proven approach over inventing one
from scratch — only deviate where this repo's stack or scope genuinely requires it, and
say so explicitly.
