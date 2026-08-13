# UI Design System Migration — Hercules SFMS (NFM-Frontend)

**Date:** 2026-07-21  
**Status:** Approved for planning  
**Scope:** Full pass — tokens, shell, all hercules-sfms pages, shared UI, charts (strict)  
**Approach:** Token foundation + codebase sweep (Approach 1)

---

## 1. Goals

Migrate NFM-Frontend light/dark UI to the Hercules Reporting Module design system:

- Always-dark app shell (top bar + sidebar) at `#111827`
- Content area only follows light/dark theme
- Brand `#0098cc` (light) / `#22d3ee` (dark)
- Page backgrounds `#f4f7fa` (light) / `#0a0f1a` (dark)
- Prefer CSS variables over one-off hex
- Strict application: surfaces, text, borders, buttons, tables, forms, **and charts** use design tokens

### Non-goals

- Rewriting unused legacy shells (`AppLayout.tsx`, `NavigationSidebar.tsx`) unless needed for compile/import cleanup
- Changing backend APIs or business logic
- Adding Report Builder / Hercules AI modules (tokens documented for future parity only)

---

## 2. Decisions (validated)

| Decision | Choice |
|----------|--------|
| Visual target | Always-dark shell + tokenized light/dark content |
| Scope | Full pass (foundation + all live hercules-sfms pages + shared UI) |
| Charts / decorative UI | Strict — brand/status tokens; clean light surfaces; soften/remove cyber video/gradients that break light mode |
| Implementation approach | CSS tokens + Tailwind mapping + component/page sweep |

---

## 3. Architecture

```
<html class="light|dark">          ← ThemeContext toggles content theme
├── Top bar (72px) #111827         ← always dark
├── Sidebar (220px / 60px) #111827 ← always dark
└── Main content                   ← --background, --surface, --text-*
```

Theme toggle flips only the content theme class on `<html>`. Shell components must not use `light:bg-white` or other light-mode surface flips.

---

## 4. Token contract

Defined in `client/src/index.css` under `:root` (light) and `.dark` (dark).

### 4.1 Brand

| Token | Light | Dark |
|-------|-------|------|
| `--brand` | `#0098cc` | `#22d3ee` |
| `--brand-hover` | `#007aa3` | `#67e8f9` |
| `--brand-subtle` | `rgba(0, 152, 204, 0.06)` | `rgba(34, 211, 238, 0.08)` |
| `--brand-ring` | `rgba(0, 152, 204, 0.25)` | `rgba(34, 211, 238, 0.3)` |

### 4.2 Surfaces

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#f4f7fa` | `#0a0f1a` |
| `--surface` | `#ffffff` | `#111827` |
| `--surface-elevated` | `#ffffff` | `#111827` |
| `--surface-sunken` | `#f0f3f7` | `#0d1320` |

### 4.3 Text

| Token | Light | Dark |
|-------|-------|------|
| `--text-primary` / `--foreground` | `#1a2744` | `#f1f5f9` |
| `--text-secondary` | `#3d4f66` | `#94a3b8` |
| `--text-muted` | `#5a6f88` | `#64748b` |
| `--text-faint` | `#8a9bb5` | `#475569` |

### 4.4 Borders

| Token | Light | Dark |
|-------|-------|------|
| `--border` | `#dce3ed` | `#1e293b` |
| `--border-strong` | `#c5cdd8` | `#2a3347` |
| `--border-faint` | `#edf0f5` | `#1e293b` |

### 4.5 Semantic

| Token | Light | Dark |
|-------|-------|------|
| `--success` | `#059669` | `#34d399` |
| `--warning` | `#d97706` | `#fbbf24` |
| `--danger` | `#dc2626` | `#f87171` |
| `--info` | `#0098cc` | `#60a5fa` |

### 4.6 Shell (fixed — same in both themes)

| Token | Value |
|-------|-------|
| `--shell-bg` | `#111827` |
| `--shell-border` | `#1e293b` |
| `--shell-hover` | `#1a2233` |
| `--shell-text` | `#f0f4f8` |
| `--shell-text-secondary` | `#8899ab` |
| `--shell-text-muted` | `#556677` |
| `--shell-accent` | `#22d3ee` |
| `--shell-deep` | `#0a0f1a` |

### 4.7 Radius, shadow, motion

- Radius: `--radius` `0.5rem`; sm/md/lg/xl as in source design system
- Shadows: soft in light; **none in dark**
- Transitions: fast 0.15s, normal 0.25s, slow 0.3s

### 4.8 Tailwind mapping

Expose at least: `brand`, `brand-hover`, `brand-subtle`, `background`, `surface`, `foreground`, `border`, `success`, `warning`, `danger`, `info`, `shell` (and related shell text keys as needed). Wire shadcn-style `background` / `foreground` / `card` / `primary` / `border` to these vars so `bg-background`, `text-foreground`, `bg-card` work.

---

## 5. Shell chrome

### Top bar (`WaterSystemLayout` header)

- Height 72px, background `#111827`, bottom border `#1e293b`
- Icons/text: primary `#f0f4f8`, secondary `#8899ab`, muted `#556677`
- Hover surfaces `#1a2233`; focus ring `#22d3ee`
- Live pill: success green; theme toggle styled for dark shell

### Sidebar

- Expanded 220px / collapsed 60px; top offset 72px
- Background `#111827`; edge border `#1e293b`
- Item height 48px; active/hover `#1a2233`
- Active indicator: 3px `#22d3ee`
- Icons inactive `#556677` → active `#f0f4f8`; labels inactive `#8899ab` → active `#f0f4f8`

---

## 6. Content & charts (strict)

- Page canvas: `bg-background` / `var(--background)`
- Cards/panels: `bg-surface` + `border-border`
- Primary CTAs / active tabs: `bg-brand` / `text-brand` (replace `#0088a9`, `#007b98`)
- Section headers: 11px uppercase tracking; dark mode may use brand accent for `.section-header`
- Charts: series and accents from brand + semantic tokens; legends/tooltips use `--surface` / `--text-*`
- Remove or gate video backgrounds / heavy cyber gradients so light mode remains clean flat surfaces

---

## 7. Implementation phases

### Phase 1 — Foundation

1. Rewrite token layer in `client/src/index.css`
2. Update `tailwind.config.ts`
3. Keep `ThemeContext` class toggle (`light` | `dark` on `<html>`)
4. Lock always-dark shell in `WaterSystemLayout.tsx`, `Sidebar.tsx`, `theme-toggle.tsx`
5. Remove obsolete `:root.light` slate-remap overrides only after components use tokens (avoid mid-migration flash)

### Phase 2 — Shared UI

6. `components/ui/*` primitives (button, input, card, tabs, etc.)
7. Hercules shared: KPICard, ChartComponent, PieChart, DetailsPopup, MaterialForm, etc.

### Phase 3 — Pages

8. All `pages/hercules-sfms/*` — priority order: KPIDashboard, Reports/ReportsPage, BatchCalendar, then Admin, Databases, PLC*, Dashboard, KPICarousel, KPIOverview

### Phase 4 — Verify & hygiene

9. Manual toggle light ↔ dark on each major route; grep for leftover `#0088a9`, shell `light:bg-white`, unreadable chart text
10. Add `.superpowers/` to `.gitignore`
11. Optional: align `client/index.html` theme-color with brand

---

## 8. Files (primary)

| File | Role |
|------|------|
| `NFM-Frontend/client/src/index.css` | Token source of truth |
| `NFM-Frontend/tailwind.config.ts` | Utility mapping |
| `NFM-Frontend/client/src/contexts/ThemeContext.tsx` | Theme class toggle |
| `NFM-Frontend/client/src/components/hercules-sfms/WaterSystemLayout.tsx` | Shell + content frame |
| `NFM-Frontend/client/src/components/hercules-sfms/Sidebar.tsx` | Always-dark nav |
| `NFM-Frontend/client/src/components/ui/theme-toggle.tsx` | Shell-safe toggle |
| `NFM-Frontend/client/src/pages/hercules-sfms/*` | Page retheme |
| `NFM-Frontend/client/src/components/hercules-sfms/*` | Shared SFMS widgets |

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Removing `:root.light` remaps breaks pages still on slate utilities | Land tokens first; migrate high-traffic pages; then delete remaps; grep for leftovers |
| Chart libraries hardcode colors | Centralize chart color helpers reading CSS vars |
| Always-dark shell regresses if someone re-adds `light:bg-white` | Document shell rule; code review focus on layout/sidebar |

---

## 10. Success criteria

- [ ] Top bar and sidebar remain `#111827` in both themes
- [ ] Content background is `#f4f7fa` (light) and `#0a0f1a` (dark)
- [ ] Primary actions use `#0098cc` / `#22d3ee` (no `#0088a9` / `#007b98` on live routes)
- [ ] Text/borders readable in both themes on KPI, Reports, Calendar, Admin
- [ ] Charts use brand/status tokens and remain readable in both themes
- [ ] Design tokens live in CSS variables; Tailwind utilities map to them

---

## 11. Next step

After user review/approval of this spec: write an implementation plan via the writing-plans skill, then implement Phase 1 → 4.
