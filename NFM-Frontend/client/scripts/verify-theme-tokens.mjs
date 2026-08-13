import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cssPath = path.resolve(__dirname, '../src/index.css')
const css = fs.readFileSync(cssPath, 'utf8')

const required = [
  '--brand', '--brand-hover', '--brand-subtle', '--brand-ring',
  '--background', '--surface', '--surface-elevated', '--surface-sunken',
  '--foreground', '--text-primary', '--text-secondary', '--text-muted', '--text-faint',
  '--border', '--border-strong', '--border-faint',
  '--success', '--warning', '--danger', '--info',
  '--shell-bg', '--shell-border', '--shell-hover', '--shell-text',
  '--shell-text-secondary', '--shell-text-muted', '--shell-accent', '--shell-deep',
  '--card', '--primary', '--radius',
]

const missing = required.filter((t) => !css.includes(t + ':') && !css.includes(t + ' :'))
if (missing.length) {
  console.error('Missing theme tokens in index.css:\n' + missing.map((m) => `  - ${m}`).join('\n'))
  process.exit(1)
}
console.log(`OK: ${required.length} required tokens found in index.css`)
