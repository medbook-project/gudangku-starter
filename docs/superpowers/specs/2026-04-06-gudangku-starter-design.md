# GudangKu Starter Repo — Design Specification

**Date:** 2026-04-06
**Status:** Approved
**Approach:** B (Split by Concern)

## Overview

A starter repository for a hiring take-home assessment. Candidates receive this repo and build a warehouse shipment tracking dashboard on top of it. We build infrastructure only — no dashboard UI, no tests, no solution code.

## Fixed Requirements (from CLAUDE.md)

- Tech stack: Vite + React 18 + TypeScript (strict) + MUI 5 + TanStack React Query v5 + React Router v6 + MSW v2
- 5 mock API endpoints with defined behavior
- Status machine with 7 states and defined valid transitions
- Flawed component with exactly 10 deliberate issues
- 48px minimum touch targets (warehouse operators with gloves)
- Status colors must not rely on color alone

---

## Section 1: Type System

### Core Types

```typescript
type ShipmentStatus =
  | 'received' | 'sorting' | 'ready_to_dispatch'
  | 'dispatched' | 'delivered' | 'on_hold' | 'cancelled';

type Priority = 'normal' | 'urgent' | 'critical';

interface Carrier {
  name: string;
  phone?: string;        // Optional — some seed data has null/missing
  tracking_url?: string; // Optional
}

interface Shipment {
  id: string;              // "SHP-001" format (internal warehouse ID)
  tracking_id: string;     // External carrier tracking ID (some very long)
  status: ShipmentStatus;
  priority: Priority;
  sender: string;
  recipient: string;
  destination: string;     // Warehouse zone or address
  carrier: Carrier;
  weight_kg: number;
  package_count: number;   // Number of boxes in the shipment
  notes?: string;          // Optional, sometimes contains HTML-like content
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601 — used for "delayed" computation
  delivered_at?: string;   // ISO 8601 — only set for delivered status
}

interface StatsResponse {
  total_received: number;   // Count of status 'received'
  total_pending: number;    // Count of 'sorting' + 'ready_to_dispatch'
  total_dispatched: number; // Count of 'dispatched' + 'delivered'
  total_delayed: number;    // received/sorting/ready_to_dispatch where updated_at > 2h ago
  total_on_hold: number;    // Count of 'on_hold' + 'cancelled'
}
```

### SSE Event Types

```typescript
type NewShipmentEvent = Shipment; // Full object for local state updates

interface StatusChangeEvent {
  id: string;
  status: ShipmentStatus;
  timestamp: string;
}

interface PriorityUpdateEvent {
  id: string;
  priority: Priority;
  timestamp: string;
}
```

### AI Route Suggestion

```typescript
interface RouteSuggestionRequest {
  shipment_id: string;
  shipment_data: Shipment;
}
// Response: ReadableStream of text chunks (not SSE)
```

### Key Decisions

- `notes` is optional and sometimes contains HTML — feeds the dangerouslySetInnerHTML bug naturally
- `tracking_id` is separate from `id` — internal vs external reference, long values test text overflow
- `updated_at` (not `last_updated`) — conventional naming, used for delayed computation
- `Carrier` is nested — gives the flawed component a natural place for the null-check bug
- `package_count` — warehouses track box count, gives candidates another data point
- `NewShipmentEvent = Shipment` — explicit type alias avoids ambiguity in SSE handling
- Stats fields are aggregated categories, NOT 1:1 with statuses — tests whether candidates read the API carefully

---

## Section 2: Mock Data

### 15 Seed Shipments (SHP-001 through SHP-015)

**Status distribution (all 7 represented):**

| Status | Count | IDs |
|---|---|---|
| received | 3 | SHP-001, SHP-002, SHP-003 |
| sorting | 3 | SHP-004, SHP-005, SHP-006 |
| ready_to_dispatch | 2 | SHP-007, SHP-008 |
| dispatched | 2 | SHP-009, SHP-010 |
| delivered | 2 | SHP-011, SHP-012 |
| on_hold | 2 | SHP-013, SHP-014 |
| cancelled | 1 | SHP-015 |

**Priority distribution (~60/30/10):**
- normal: 9 (60%)
- urgent: 5 (33%)
- critical: 1 (7%)

**4 Carriers:**

| Carrier | Phone |
|---|---|
| JNE Express | Has phone |
| SiCepat | Has phone |
| AnterAja | Missing phone (undefined) |
| Pos Indonesia | Has phone |

### Edge Cases

| Shipment | Edge Case | Purpose |
|---|---|---|
| SHP-003 | `carrier.phone` is undefined (AnterAja) | Triggers flawed component .split() crash |
| SHP-007 | Very long tracking_id (30+ chars) | Tests text overflow handling |
| SHP-011 | `delivered_at` is set | Tests optional field handling |
| SHP-013 | `notes` contains HTML + script tag | Feeds dangerouslySetInnerHTML XSS bug |
| SHP-002, SHP-004 | `updated_at` > 2 hours ago | Count toward total_delayed in stats |
| SHP-015 | Cancelled, no delivered_at, notes is null | Terminal state edge case |

### Timestamps

All `created_at` values span today (2026-04-06) from 06:00 to 18:00. `updated_at` is same or later.

### Shipment Factory (for SSE new_shipment events)

- IDs start at SHP-016 (next after seed data), increment
- Randomizes: carrier (from the 4), priority (weighted 60/30/10), package_count (1-8), weight_kg (0.5-50)
- Always: status = 'received', created_at and updated_at = current time
- Plausible sender/recipient names from a small pool

### AI Suggestion Bank (~10 suggestions)

- 5-6 normal suggestions matching priority (e.g., "Priority express routing — expedited handling confirmed")
- 3-4 contradiction suggestions (e.g., "Standard ground routing — no priority handling needed")
- Selection: 70% priority-appropriate, 30% contradiction

---

## Section 3: MSW Handler Architecture

All 5 endpoints in a single `handlers.ts`. Handlers share an in-memory `shipments` array (seeded from mock-data.ts) so mutations from PATCH and SSE events are visible in subsequent GET calls.

### GET /api/shipments

- Returns in-memory shipments array
- Supports `?status=` and `?priority=` query params (optional, AND logic if both)
- Delay: 200-500ms (randomized)
- Always returns 200 with Shipment[]

### PATCH /api/shipments/:id/status

- Looks up by ID, 404 if not found
- Validates against status machine — 400 with `{ error: "Invalid transition from X to Y" }` if invalid
- On success: mutates status + updated_at, returns updated Shipment
- Delay: 100-300ms
- Status machine: `Map<ShipmentStatus, ShipmentStatus[]>` of valid next-states

### GET /api/shipments/stream (SSE)

- Returns ReadableStream writing SSE-formatted text chunks
- Every 3-8 seconds (randomized), emits one of:
  - `new_shipment` (20%) — uses factory, pushes to in-memory array
  - `status_change` (50%) — picks random non-terminal shipment, advances one valid step
  - `priority_update` (30%) — picks random shipment, changes priority
- Fallback: if no non-terminal shipments exist for status_change, emit new_shipment instead
- Format: `event: <type>\ndata: <json>\n\n`
- Runs indefinitely until client disconnect

### POST /api/ai/route-suggestion

- Validates request body (shipment_id, shipment_data required), 400 if missing
- Picks suggestion: 70% priority-appropriate, 30% contradiction
- Returns ReadableStream of raw text chunks (NOT SSE), one word at a time, 50-100ms apart

### GET /api/shipments/stats

- Computes aggregates from in-memory array on each call
- Mapping: total_received = received, total_pending = sorting + ready_to_dispatch, total_dispatched = dispatched + delivered, total_delayed = received/sorting/ready_to_dispatch with updated_at > 2h, total_on_hold = on_hold + cancelled
- Delay: 100-200ms
- Always returns 200

---

## Section 4: Theme & Palette

### Brand Colors (theme/palette.ts)

- Primary: #1B5E20 (dark green — warehouse safety/go)
- Secondary: #E65100 (deep orange — urgency/attention)
- Background: #FAFAFA (light gray)

### Status Colors

| Status | Color | Hex |
|---|---|---|
| received | Blue | #2196F3 |
| sorting | Orange | #FF9800 |
| ready_to_dispatch | Purple | #9C27B0 |
| dispatched | Cyan | #00BCD4 |
| delivered | Green | #4CAF50 |
| on_hold | Red | #F44336 |
| cancelled | Gray | #9E9E9E |

### Priority Colors

| Priority | Color | Hex |
|---|---|---|
| normal | Blue-gray | #78909C |
| urgent | Orange | #FF9800 |
| critical | Red | #D32F2F |

### MUI Theme Overrides (theme/index.ts)

- MuiButton: min-height 48px
- MuiIconButton: min-width/height 48px
- MuiListItemButton: min-height 48px
- MuiTab: min-height 48px
- Shape: borderRadius 8
- Typography: Roboto (MUI default)

### Key Decisions

- normal priority = blue-gray (not green) — green reserved for positive signals (delivered)
- Palette in separate file — candidates import color maps from multiple components
- 48px touch targets from spec (gloved warehouse operators on tablets)
- Typed as Record<Status/Priority, string> — TypeScript catches missing entries

---

## Section 5: Flawed Component

`src/components/ai-generated-component.tsx` — a shipment detail modal, ~150-180 lines.

### Component Signature

```typescript
ShipmentDetailModal({ shipment, open, onClose })
```

### 10 Deliberate Bugs

| # | Category | Bug | Location |
|---|---|---|---|
| 1 | TypeScript | `any` for shipment prop | Props type definition |
| 2 | TypeScript | Missing null check on `carrier.phone` before `.split()` | Carrier info section |
| 3 | Accessibility | No `aria-labelledby` or `role="dialog"` | Modal container |
| 4 | Accessibility | Close button is `<div onClick>` not `<button>` | Top-right close X |
| 5 | Performance | Inline style objects in render | 2-3 elements with `style={{...}}` |
| 6 | Performance | `useEffect` with no dependency array | Fetch for AI suggestion |
| 7 | Data Mutation | `shipment.status = 'received'` | "Reset status" handler |
| 8 | Error Handling | `fetch()` with `.then()` but no `.catch()` | The useEffect fetch |
| 9 | Security | `dangerouslySetInnerHTML` for notes | Notes section |
| 10 | UX | `window.confirm()` for status change | Status change action |

### AI-Generated Texture

- Over-commented in some sections, under-commented in others
- Mix of camelCase and snake_case variable names
- Unused import: `Tooltip` from @mui/material
- Some unnecessary useMemo wrappers on static values
- Correct, well-structured code alongside the flaws (status badge, timestamp formatting)
- Renders without crashing on happy path (SHP-001 with carrier phone works fine)

---

## Section 6: App Shell & Pages

### Routes (App.tsx)

- `/` → Dashboard
- `/performance` → Performance

No nav bar or layout wrapper — candidates build their own.

### Dashboard.tsx (placeholder)

TODO comments referencing:
- Task 1: Build the shipment tracking dashboard
- Task 2: Add AI route suggestion panel (side panel / drawer)
- Task 3: Review and fix src/components/ai-generated-component.tsx
- Task 4: Document decisions in DECISIONS.md (ongoing)

Includes list of available API endpoints.

### Performance.tsx (placeholder)

- Task 5 (Staff+ stretch): Build Shift Performance analytics view
- Notes: for warehouse shift manager (not floor operator), optional task

### main.tsx (entry point)

1. Await MSW worker.start() before rendering
2. QueryClientProvider (TanStack React Query)
3. ThemeProvider (MUI custom theme)
4. BrowserRouter (React Router)
5. Render App

### browser.ts (MSW setup)

Standard MSW v2 browser worker setup importing handlers.

---

## Section 7: Tooling & Documentation

### ESLint (.eslintrc.cjs)

- Extends: eslint:recommended, plugin:react/recommended, plugin:@typescript-eslint/recommended, plugin:react-hooks/recommended
- Rules: react/react-in-jsx-scope off, @typescript-eslint/no-explicit-any warn
- Parser: @typescript-eslint/parser

### Prettier (.prettierrc)

- semi: true, singleQuote: true, tabWidth: 2, trailingComma: 'all'

### TypeScript (tsconfig.json)

- strict: true
- target: ES2020, module: ESNext, moduleResolution: bundler
- jsx: react-jsx
- Path alias: @/* → src/*

### Vite (vite.config.ts)

- React plugin, path alias matching tsconfig

### DECISIONS.md Template

6 required sections matching scoring rubric:
1. AI Tool Usage Log
2. Architectural Decisions
3. Ambiguous Requirement Decision
4. AI Code Review Analysis
5. Trade-offs & Time Allocation
6. Task 5: Shift Performance (if attempted)

### README.md

- Project overview with warehouse context
- Quick start (npm install && npm run dev)
- Assessment tasks 1-5 with descriptions and acceptance criteria
- API reference with example requests/responses
- Status machine diagram (text-based)
- Tech stack with doc links
- Submission instructions
- Time limit: "Maximum 4 hours. We analyze commit timestamps. Tasks 1-4 are the senior bar. Task 5 is Staff+ stretch — attempt only if time remaining."

---

## File Structure

```
gudangku-starter/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── api/
│   │   ├── types.ts
│   │   ├── handlers.ts
│   │   ├── mock-data.ts
│   │   └── browser.ts
│   ├── theme/
│   │   ├── index.ts
│   │   └── palette.ts
│   ├── components/
│   │   └── ai-generated-component.tsx
│   └── pages/
│       ├── Dashboard.tsx
│       └── Performance.tsx
├── public/
│   └── mockServiceWorker.js (generated by MSW)
├── DECISIONS.md
├── README.md
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Implementation Notes

- Work directly on main branch (no worktrees)
- Each task gets its own git commit
- No TDD — candidates write their own tests
- Human review checkpoints: T5 (types), T10 (AI handler), T14 (flawed component), T18 (README)
- Quality gates: tsc --noEmit passes, no any (except flawed component), no console.log (except handlers)
- Remove CLAUDE.md and AGENTS.md before sharing with candidates
