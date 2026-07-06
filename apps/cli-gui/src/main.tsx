import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
// Bundled locally (no CDN) so the offline Tauri app renders --mono as JetBrains Mono
// instead of falling back to the system monospace font. Only the weights actually used
// via `font-mono font-{semibold,bold,extrabold}` classes are imported.
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/jetbrains-mono/800.css'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
