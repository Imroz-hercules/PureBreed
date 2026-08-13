# UI Design System Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Hercules Reporting Module design tokens across NFM-Frontend so the shell stays always-dark (`#111827`) while content, shared UI, and charts follow light (`#f4f7fa` / `#0098cc`) and dark (`#0a0f1a` / `#22d3ee`) themes.

**Architecture:** Define CSS variables on `:root` (light) and `.dark` (dark); map them in Tailwind; lock `WaterSystemLayout` + `Sidebar` to shell tokens; replace hardcoded `#0088a9` / slate / cyan surfaces across hercules-sfms pages and charts; delete the obsolete `:root.light` slate-remap layer last.

**Tech Stack:** React + Vite, Tailwind CSS (`darkMode: ['class']`), custom `ThemeContext` (`fakieh-theme` in localStorage), Recharts/Chart.js in SFMS components.

**Constraints:** Do **not** push to GitHub. Local commits only when the user asks. Spec: `docs/superpowers/specs/2026-07-21-ui-design-system-design.md`.

---

## File map

| File | Responsibility |
|------|----------------|
| `NFM-Frontend/client/src/index.css` | Token source of truth; remove remap soup after migration |
| `NFM-Frontend/tailwind.config.ts` | `brand`, `shell`, `surface`, semantic + existing shadcn vars |
| `NFM-Frontend/client/src/contexts/ThemeContext.tsx` | Keep `light`/`dark` on `<html>` (content theme only) |
| `NFM-Frontend/client/src/lib/themeTokens.ts` | Chart/JS helpers reading CSS vars (runtime) |
| `NFM-Frontend/client/scripts/verify-theme-tokens.mjs` | Assert required CSS vars exist in `index.css` |
| `NFM-Frontend/client/src/components/hercules-sfms/WaterSystemLayout.tsx` | Always-dark header; content `bg-background`; no video BG |
| `NFM-Frontend/client/src/components/hercules-sfms/Sidebar.tsx` | Always-dark nav + cyan active indicator |
| `NFM-Frontend/client/src/components/ui/theme-toggle.tsx` | Shell-safe toggle styling |
| `NFM-Frontend/client/src/lib/chartUtils.ts` | Brand/status chart palette |
| `NFM-Frontend/client/src/components/hercules-sfms/{KPICard,ChartComponent,PieChart,DetailsPopup,MaterialForm}.tsx` | Token classes |
| `NFM-Frontend/client/src/pages/hercules-sfms/*.tsx` | Full page retheme (11 files) |
| `.gitignore` | Ignore `.superpowers/` |

**Out of scope:** `AppLayout.tsx`, `NavigationSidebar.tsx` (unused by router).

---

### Task 1: Token verification script (failing until tokens exist)

**Files:**
- Create: `NFM-Frontend/client/scripts/verify-theme-tokens.mjs`

- [ ] **Step 1: Write the verifier**

```js
// NFM-Frontend/client/scripts/verify-theme-tokens.mjs
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
```

- [ ] **Step 2: Run verifier (expect FAIL)**

Run from `NFM-Frontend`:

```bash
node client/scripts/verify-theme-tokens.mjs
```

Expected: exit 1, lists missing tokens (current CSS lacks `--brand`, `--shell-bg`, etc.).

---

### Task 2: Define design tokens in `index.css`

**Files:**
- Modify: `NFM-Frontend/client/src/index.css` (insert **after** `@tailwind` lines, **before** the existing `:root.light` remap block — keep remaps temporarily)

- [ ] **Step 1: Insert token block**

Add this block near the top of `index.css` (after Tailwind directives):

```css
/* ===== Hercules SFMS design tokens ===== */
:root {
  --brand: #0098cc;
  --brand-hover: #007aa3;
  --brand-subtle: rgba(0, 152, 204, 0.06);
  --brand-ring: rgba(0, 152, 204, 0.25);

  --background: #f4f7fa;
  --surface: #ffffff;
  --surface-elevated: #ffffff;
  --surface-sunken: #f0f3f7;

  --foreground: #1a2744;
  --text-primary: #1a2744;
  --text-secondary: #3d4f66;
  --text-muted: #5a6f88;
  --text-faint: #8a9bb5;

  --card: #ffffff;
  --card-foreground: #1a2744;
  --popover: #ffffff;
  --popover-foreground: #1a2744;
  --primary: #0098cc;
  --primary-foreground: #ffffff;
  --secondary: #e6f4fa;
  --secondary-foreground: #1a2744;
  --muted: #f0f3f7;
  --muted-foreground: #5a6f88;
  --accent: #e6f4fa;
  --accent-foreground: #007aa3;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;

  --border: #dce3ed;
  --border-strong: #c5cdd8;
  --border-faint: #edf0f5;
  --input: #dce3ed;
  --ring: #0098cc;

  --success: #059669;
  --warning: #d97706;
  --danger: #dc2626;
  --info: #0098cc;

  --shell-bg: #111827;
  --shell-border: #1e293b;
  --shell-hover: #1a2233;
  --shell-text: #f0f4f8;
  --shell-text-secondary: #8899ab;
  --shell-text-muted: #556677;
  --shell-accent: #22d3ee;
  --shell-deep: #0a0f1a;

  --radius: 0.5rem;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.1);

  --chart-1: #0098cc;
  --chart-2: #059669;
  --chart-3: #d97706;
  --chart-4: #dc2626;
  --chart-5: #7c3aed;
  --chart-text-color: #3d4f66;
  --chart-axis-color: #dce3ed;

  --sidebar-background: #111827;
  --sidebar-foreground: #f0f4f8;
  --sidebar-primary: #22d3ee;
  --sidebar-primary-foreground: #0a0f1a;
  --sidebar-accent: #1a2233;
  --sidebar-accent-foreground: #f0f4f8;
  --sidebar-border: #1e293b;
  --sidebar-ring: #22d3ee;

  --nav-height: 72px;
  --sidebar-width: 220px;
  --sidebar-collapsed: 60px;
}

.dark {
  --brand: #22d3ee;
  --brand-hover: #67e8f9;
  --brand-subtle: rgba(34, 211, 238, 0.08);
  --brand-ring: rgba(34, 211, 238, 0.3);

  --background: #0a0f1a;
  --surface: #111827;
  --surface-elevated: #111827;
  --surface-sunken: #0d1320;

  --foreground: #f1f5f9;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-faint: #475569;

  --card: #111827;
  --card-foreground: #f1f5f9;
  --popover: #111827;
  --popover-foreground: #f1f5f9;
  --primary: #22d3ee;
  --primary-foreground: #0a0f1a;
  --secondary: #1a2233;
  --secondary-foreground: #f1f5f9;
  --muted: #0d1320;
  --muted-foreground: #64748b;
  --accent: #1a2233;
  --accent-foreground: #22d3ee;
  --destructive: #f87171;
  --destructive-foreground: #0a0f1a;

  --border: #1e293b;
  --border-strong: #2a3347;
  --border-faint: #1e293b;
  --input: #1e293b;
  --ring: #22d3ee;

  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --info: #60a5fa;

  /* shell tokens unchanged — always dark */
  --shell-bg: #111827;
  --shell-border: #1e293b;
  --shell-hover: #1a2233;
  --shell-text: #f0f4f8;
  --shell-text-secondary: #8899ab;
  --shell-text-muted: #556677;
  --shell-accent: #22d3ee;
  --shell-deep: #0a0f1a;

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;

  --chart-1: #22d3ee;
  --chart-2: #34d399;
  --chart-3: #fbbf24;
  --chart-4: #f87171;
  --chart-5: #a78bfa;
  --chart-text-color: #94a3b8;
  --chart-axis-color: #1e293b;
}

.section-header {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.dark .section-header {
  color: var(--brand);
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 2: Re-run verifier (expect PASS)**

```bash
node client/scripts/verify-theme-tokens.mjs
```

Expected: `OK: … required tokens found`

- [ ] **Step 3: Local commit only if user asks** (do not push)

```bash
git add NFM-Frontend/client/src/index.css NFM-Frontend/client/scripts/verify-theme-tokens.mjs
git commit -m "feat(theme): add Hercules design tokens to index.css"
```

---

### Task 3: Extend Tailwind color map

**Files:**
- Modify: `NFM-Frontend/tailwind.config.ts`

- [ ] **Step 1: Add brand / shell / surface / semantic colors**

Inside `theme.extend.colors`, add (keep existing `background`, `card`, etc.):

```ts
brand: {
  DEFAULT: "var(--brand)",
  hover: "var(--brand-hover)",
  subtle: "var(--brand-subtle)",
  ring: "var(--brand-ring)",
},
surface: {
  DEFAULT: "var(--surface)",
  elevated: "var(--surface-elevated)",
  sunken: "var(--surface-sunken)",
},
shell: {
  DEFAULT: "var(--shell-bg)",
  border: "var(--shell-border)",
  hover: "var(--shell-hover)",
  text: "var(--shell-text)",
  secondary: "var(--shell-text-secondary)",
  muted: "var(--shell-text-muted)",
  accent: "var(--shell-accent)",
  deep: "var(--shell-deep)",
},
success: "var(--success)",
warning: "var(--warning)",
danger: "var(--danger)",
info: "var(--info)",
```

Also extend `borderRadius` if needed:

```ts
xl: "var(--radius-xl)",
```

- [ ] **Step 2: Sanity-check build**

```bash
cd NFM-Frontend && npx tsc --noEmit -p client 2>&1 | head -40
```

(Or `npm run build` / `npm run check` if that is the project script.) Expected: no new errors from config.

---

### Task 4: ThemeContext (confirm content-only toggle)

**Files:**
- Modify: `NFM-Frontend/client/src/contexts/ThemeContext.tsx` only if needed

- [ ] **Step 1: Keep current behavior**

Current code already sets `document.documentElement.classList` to `light` | `dark` and persists `fakieh-theme`. That matches the architecture (content theme on `<html>`).

Optional hardening — ensure only one theme class:

```tsx
useEffect(() => {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  localStorage.setItem('fakieh-theme', theme)
}, [theme])
```

(Already present — no change required unless duplicate classes appear.)

- [ ] **Step 2: Manual check**

In DevTools, toggle theme: `<html>` class switches between `light` and `dark`; `--background` computed value flips `#f4f7fa` ↔ `#0a0f1a`.

---

### Task 5: Always-dark shell — `WaterSystemLayout`

**Files:**
- Modify: `NFM-Frontend/client/src/components/hercules-sfms/WaterSystemLayout.tsx`

- [ ] **Step 1: Replace root / background / header / main classes**

Target patterns (remove video background and light shell flips):

```tsx
return (
  <div className="h-screen bg-shell text-shell-text flex relative overflow-hidden">
    {/* no video / slate gradient backdrop */}
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

    <div className="flex-1 flex flex-col relative z-10 min-w-0">
      <header
        className="h-[72px] min-h-[72px] bg-shell border-b border-shell-border px-5 flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-shell-text">Khamis-Historical</h1>
          <p className="text-sm text-shell-secondary">{getPageTitle()}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-shell-secondary">Production Manager</span>
            <div className="w-9 h-9 rounded-full bg-shell-hover border border-[#2a3347] flex items-center justify-center">
              <User className="h-[18px] w-[18px] text-shell-secondary" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setLocation('/admin')}
              className="p-2 rounded-lg bg-shell-hover text-shell-muted hover:text-shell-text focus:outline-none focus:ring-2 focus:ring-shell-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg bg-shell-hover text-shell-muted hover:text-danger focus:outline-none focus:ring-2 focus:ring-shell-accent transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="text-xs text-shell-muted border-l border-shell-border pl-4">
            <div>{formatCurrentTime()}</div>
            <div className="text-shell-accent">{formatCurrentTimeOnly()}</div>
          </div>

          <div className="flex items-center space-x-4 border-l border-shell-border pl-4">
            <img src={asmLogo} alt="ASM Logo" className="h-12 w-auto bg-white/95 rounded-lg p-1" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative smooth-scroll bg-background text-foreground">
        <div className="relative z-10 max-w-full page-transition page-transition-enter-active">
          {children}
        </div>
      </main>
    </div>
  </div>
)
```

- [ ] **Step 2: Remove unused video import** if `futuristicNeonVideo` is no longer referenced.

- [ ] **Step 3: Visual check**

Toggle light/dark: header stays `#111827`; main canvas flips `#f4f7fa` / `#0a0f1a`.

---

### Task 6: Always-dark `Sidebar`

**Files:**
- Modify: `NFM-Frontend/client/src/components/hercules-sfms/Sidebar.tsx`

- [ ] **Step 1: Apply shell tokens**

Root container:

```tsx
className={`bg-shell border-r border-shell-border
  ${collapsed ? 'w-[60px]' : 'w-[220px]'}
  transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
  flex flex-col h-full`}
```

Nav item (active):

```tsx
className={`h-12 flex items-center gap-3 rounded-lg px-3.5
  ${active
    ? 'bg-shell-hover text-shell-text shadow-[0_0_12px_rgba(34,211,238,0.1)] relative'
    : 'text-shell-secondary hover:bg-shell-hover hover:text-shell-text'}
`}
```

Active indicator (3px):

```tsx
{active && (
  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r bg-shell-accent shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
)}
```

Icons inactive: `text-shell-muted`; active/hover: `text-shell-text`. Labels: `text-[13px] font-medium`.

- [ ] **Step 2: Visual check** — sidebar never turns white in light mode.

---

### Task 7: Shell-safe `ThemeToggle`

**Files:**
- Modify: `NFM-Frontend/client/src/components/ui/theme-toggle.tsx`

- [ ] **Step 1: Restyle for dark shell**

```tsx
<button
  onClick={toggleTheme}
  className="relative w-14 h-7 bg-shell-hover border border-shell-border rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-shell-accent"
  aria-label="Toggle theme"
>
  {/* keep sun/moon handle logic; use text-shell-secondary / amber for icons */}
</button>
```

Track should look correct on `#111827` in both content themes (toggle lives in the shell).

---

### Task 8: Chart token helpers (strict)

**Files:**
- Create: `NFM-Frontend/client/src/lib/themeTokens.ts`
- Modify: `NFM-Frontend/client/src/lib/chartUtils.ts`
- Modify: chart-related CSS in `index.css` (tooltip/axis → use `var(--chart-text-color)`, `var(--brand)`, `var(--surface)`)

- [ ] **Step 1: Create CSS-var readers**

```ts
// themeTokens.ts
export function cssVar(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function chartPalette() {
  return {
    brand: cssVar('--brand', '#0098cc'),
    success: cssVar('--success', '#059669'),
    warning: cssVar('--warning', '#d97706'),
    danger: cssVar('--danger', '#dc2626'),
    info: cssVar('--info', '#0098cc'),
    muted: cssVar('--text-muted', '#5a6f88'),
    text: cssVar('--chart-text-color', '#3d4f66'),
    surface: cssVar('--surface', '#ffffff'),
    border: cssVar('--border', '#dce3ed'),
    series: [
      cssVar('--chart-1', '#0098cc'),
      cssVar('--chart-2', '#059669'),
      cssVar('--chart-3', '#d97706'),
      cssVar('--chart-4', '#dc2626'),
      cssVar('--chart-5', '#7c3aed'),
    ],
  }
}
```

- [ ] **Step 2: Replace `chartColors` in `chartUtils.ts`**

```ts
import { chartPalette } from './themeTokens'

/** Prefer chartPalette() at render time so theme toggles update colors. */
export const chartColors = {
  brand: 'var(--brand)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  // legacy aliases → brand/status
  cyberBlue: 'var(--brand)',
  electricBlue: 'var(--info)',
  neonGreen: 'var(--success)',
  neonAmber: 'var(--warning)',
  neonOrange: 'var(--warning)',
  cyberPurple: 'var(--chart-5)',
}

export { chartPalette }
```

- [ ] **Step 3: Update `ChartComponent.tsx` / `PieChart.tsx`** to use `chartPalette().series` or `var(--chart-N)` instead of hardcoded cyan/hsl neon.

- [ ] **Step 4: Soften Recharts tooltip CSS** to use tokens:

```css
.recharts-tooltip-wrapper .recharts-default-tooltip {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  color: var(--text-primary) !important;
}
```

Remove forced `#06b6d4` tooltip colors.

---

### Task 9: Shared SFMS components

**Files:**
- Modify: `KPICard.tsx`, `DetailsPopup.tsx`, `MaterialForm.tsx` (and any remaining hardcodes in chart components)

**Replacement cheat sheet:**

| Old | New |
|-----|-----|
| `#0088a9` / `#007b98` | `bg-brand` / `hover:bg-brand-hover` / `text-brand` |
| `bg-white` + `dark:bg-slate-900` | `bg-surface` |
| `bg-slate-950` page | `bg-background` |
| `text-slate-900` / `dark:text-white` | `text-foreground` or `text-[color:var(--text-primary)]` |
| `border-slate-200` / `border-slate-700` | `border-border` |
| `text-cyan-400` accents | `text-brand` |
| `text-emerald-*` status | `text-success` |
| `text-amber-*` | `text-warning` |
| `text-red-*` | `text-danger` |

- [ ] **Step 1: Apply cheat sheet to each shared component**
- [ ] **Step 2: Grep**

```bash
rg "#0088a9|#007b98" NFM-Frontend/client/src/components/hercules-sfms
```

Expected: no matches.

---

### Task 10: Priority pages — KPI + Reports + Calendar

**Files:**
- Modify: `KPIDashboard.tsx`, `KPICarousel.tsx`, `KPIOverview.tsx`
- Modify: `Reports.tsx`, `ReportsPage.tsx`
- Modify: `BatchCalendar.tsx`

- [ ] **Step 1: Replace brand hex and dual slate/light classes** using the cheat sheet from Task 9.
- [ ] **Step 2: Cards/tables**

```tsx
// card
className="bg-surface border border-border rounded-lg shadow-[var(--shadow-sm)]"

// table header
className="text-[10px] font-semibold uppercase text-[color:var(--text-muted)]"

// primary button
className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-md text-sm font-medium"
```

- [ ] **Step 3: Grep pages**

```bash
rg "#0088a9|#007b98" NFM-Frontend/client/src/pages/hercules-sfms
```

Expected: remaining hits only outside these six files (cleared in Task 11).

- [ ] **Step 4: Manual** — toggle theme on `/`, reports, calendar routes.

---

### Task 11: Remaining pages

**Files:**
- Modify: `Admin.tsx`, `Databases.tsx`, `Dashboard.tsx`, `PLCConfiguration.tsx`, `PLCReportsPage.tsx`

- [ ] **Step 1: Same cheat sheet as Task 9–10**
- [ ] **Step 2: Full grep (expect zero)**

```bash
rg "#0088a9|#007b98" NFM-Frontend/client/src --glob '!**/index.css'
```

Expected: no matches in TS/TSX (print CSS in Reports may keep a print-only brand if needed — prefer `var(--brand)` there too).

---

### Task 12: Shared UI primitives (as needed)

**Files:**
- Modify: `NFM-Frontend/client/src/components/ui/button.tsx`, `input.tsx`, `card.tsx`, `tabs.tsx` (and others that hardcode cyan/slate)

- [ ] **Step 1:** Prefer `bg-primary` / `border-input` / `bg-card` which now resolve to tokens.
- [ ] **Step 2:** If a primitive uses `#0088a9` or `cyan-500`, switch to `brand` / `primary`.

---

### Task 13: Remove obsolete CSS remaps + hygiene

**Files:**
- Modify: `NFM-Frontend/client/src/index.css` (delete large `:root.light .light\:…` and forced cyan/slate override sections that fight tokens — keep Embla and any still-needed chart helpers that already use vars)
- Modify: `.gitignore` (ensure `.superpowers/` is listed)
- Modify: `NFM-Frontend/client/index.html` theme-color → `#0098cc` (optional)

- [ ] **Step 1: Delete remap block** starting at `/* Professional Light Theme…` through obsolete cyan force-overrides, **only after** Tasks 5–12 no longer depend on `light:bg-white` remaps.
- [ ] **Step 2: Re-run**

```bash
node client/scripts/verify-theme-tokens.mjs
rg "light:bg-white" NFM-Frontend/client/src/components/hercules-sfms
```

Expected: verifier OK; no `light:bg-white` on shell components.

- [ ] **Step 3: Confirm `.gitignore` contains**

```
.superpowers/
```

---

### Task 14: Final verification checklist

- [ ] **Step 1: Automated**

```bash
cd NFM-Frontend
node client/scripts/verify-theme-tokens.mjs
rg "#0088a9|#007b98" client/src --glob '*.{tsx,ts,jsx,js}'
rg "light:bg-white" client/src/components/hercules-sfms
```

Expected: tokens OK; zero old brand hex; zero shell light flips.

- [ ] **Step 2: Manual (both themes)**

| Route | Check |
|-------|--------|
| Any page | Top bar + sidebar stay `#111827` |
| KPI Dashboard | Content bg + cards + brand buttons |
| Reports | Tables readable; CTAs brand |
| Batch Calendar | Cards/borders |
| Admin | Forms/inputs |
| Charts | Series use brand/status; tooltips readable |

- [ ] **Step 3: Do not push.** Local commit only if the user explicitly asks.

---

## Spec coverage (self-review)

| Spec requirement | Task(s) |
|------------------|---------|
| Always-dark shell `#111827` | 5, 6, 7 |
| Content `#f4f7fa` / `#0a0f1a` | 2, 5 |
| Brand `#0098cc` / `#22d3ee` | 2, 3, 9–12 |
| CSS variables + Tailwind | 2, 3 |
| Strict charts | 8 |
| Full page pass | 10, 11 |
| Remove remap soup | 13 |
| `.superpowers/` gitignore | 13 |
| No GitHub push | Header + Task 14 |

**Placeholder scan:** none intentional.  
**Type consistency:** `chartPalette` / `cssVar` / Tailwind `brand` / `shell` / `surface` names match across tasks.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-21-ui-design-system.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach? (Reminder: nothing will be pushed to GitHub.)
