# GudangKu Starter Repo

## What this is

A **starter repository** for a hiring assessment take-home challenge. Candidates receive this repo and build a warehouse shipment tracking dashboard on top of it. **You are building the starter — NOT the solution.**

## Your role

You are building infrastructure that candidates will use. You create:
- Project skeleton (Vite + React + TS + MUI)
- Mock API (MSW) with 5 endpoints
- TypeScript type definitions
- MUI theme with warehouse branding
- One deliberately flawed AI-generated component (for code review task)
- Documentation (README.md, DECISIONS.md template)

You do NOT create:
- Any dashboard UI (candidates build this)
- Any charts or data visualizations
- Any tests (candidates may write their own)
- Any solution code for the assessment tasks

## Tech stack

- **Framework:** Vite + React 18 + TypeScript (strict mode)
- **UI Library:** MUI 5 (Material UI) with custom theme
- **Server State:** TanStack React Query v5
- **Routing:** React Router v6
- **Mock API:** MSW (Mock Service Worker) v2
- **Linting:** ESLint + Prettier

## Design constraints

- Minimum touch target: **48px** (warehouse operators wear gloves, use tablets)
- Status colors must not rely on color alone — use icons + labels
- All UI text in the mock data should be in English (candidates may localize)

## Mock API specification

### GET /api/shipments
Returns today's shipments. Supports query params: `?status=received&priority=urgent`

Response: `Shipment[]`

### PATCH /api/shipments/:id/status
Updates shipment status. **Must validate against the status machine** — return 400 for invalid transitions.

Request body: `{ status: ShipmentStatus }`
Response: `Shipment` (updated) or `{ error: string }` with 400

### GET /api/shipments/stream (SSE)
Server-Sent Events stream. Emits events every **3–8 seconds** (randomized):
- `new_shipment` — a new package arrived
- `status_change` — an existing shipment changed status
- `priority_update` — a shipment's priority changed

Event format:
```
event: status_change
data: {"id": "SHP-042", "status": "sorting", "timestamp": "2026-04-06T10:30:00Z"}
```

### POST /api/ai/route-suggestion
Streams AI-generated routing suggestion token by token.

Request body: `{ shipment_id: string, shipment_data: Shipment }`
Response: Streaming text (50–100ms per token, 8–15 tokens total)

**Important — the ambiguous requirement:** Approximately 30% of the time, the AI suggestion should **contradict** the shipment's current priority. Example: suggest "normal routing" for a "critical" package. This is intentional — candidates must decide how to handle this in their UI and defend their decision in DECISIONS.md.

### GET /api/shipments/stats
Returns daily aggregate statistics computed from mock data.

Response:
```json
{
  "total_received": 8,
  "total_dispatched": 5,
  "total_pending": 4,
  "total_delayed": 2,
  "total_on_hold": 1
}
```

## Status machine

Valid transitions only. All others should return 400:

```
received → sorting
sorting → ready_to_dispatch
sorting → on_hold
ready_to_dispatch → dispatched
dispatched → delivered
on_hold → sorting
on_hold → cancelled
```

Terminal states: `delivered`, `cancelled` (no further transitions allowed)

## Flawed component specification (ai-generated-component.tsx)

This is a **shipment detail modal** that candidates review and fix in Task 3.

Must contain **exactly these 10 deliberate issues:**

| # | Category | Issue | Severity |
|---|----------|-------|----------|
| 1 | TypeScript | Uses `any` for the shipment prop | Medium |
| 2 | TypeScript | Missing null check on optional `carrier.phone` before `.split()` | High |
| 3 | Accessibility | Modal has no `aria-labelledby` or `role="dialog"` | Medium |
| 4 | Accessibility | Close button is `<div onClick>` instead of `<button>` — no keyboard nav | High |
| 5 | Performance | Inline style objects in render: `style={{ margin: 10 }}` | Low |
| 6 | Performance | `useEffect` with missing dependency array — runs every render | High |
| 7 | Data Mutation | Directly mutates shipment object: `shipment.status = 'new'` | Critical |
| 8 | Error Handling | `fetch()` with no `.catch()` and no error boundary | High |
| 9 | Security | Uses `dangerouslySetInnerHTML` to render shipment notes | Critical |
| 10 | UX | Uses `window.confirm()` instead of MUI Dialog for status change | Low |

The component must:
- **Render without crashing** (issues are subtle, not fatal)
- **Look plausibly AI-generated** (slightly verbose, inconsistent naming, over-commented in places)
- Use a mix of camelCase and snake_case variable names
- Have some correct, well-written code alongside the flaws

## Mock data requirements

Create 15–20 seed shipments with:
- All 7 statuses represented
- Mix of priorities: normal (60%), urgent (30%), critical (10%)
- 3–4 different carrier names
- Some edge cases: missing carrier phone, null timestamps, very long tracking IDs
- Timestamps spanning today's working hours (06:00–18:00)

## File structure target

```
gudangku-starter/
├── src/
│   ├── main.tsx                          # Entry: QueryClient + Theme + Router + MSW init
│   ├── App.tsx                           # Root with Routes for / and /performance
│   ├── vite-env.d.ts                     # Env variable types
│   ├── api/
│   │   ├── types.ts                      # Shipment, ShipmentStatus, Priority, StatsResponse, etc.
│   │   ├── handlers.ts                   # MSW request handlers (all 5 endpoints)
│   │   ├── mock-data.ts                  # 15–20 seed shipments
│   │   └── browser.ts                    # MSW browser worker setup
│   ├── theme/
│   │   ├── index.ts                      # MUI createTheme with full config
│   │   └── palette.ts                    # Status colors, priority colors, brand colors
│   ├── components/
│   │   └── ai-generated-component.tsx    # Flawed component for Task 3
│   └── pages/
│       ├── Dashboard.tsx                 # Placeholder with TODO comments
│       └── Performance.tsx               # Placeholder with TODO comments
├── public/
│   └── mockServiceWorker.js             # MSW service worker (generated)
├── CLAUDE.md                             # This file (remove before sharing with candidates)
├── AGENTS.md                             # Agent config (remove before sharing with candidates)
├── DECISIONS.md                          # Template for candidates
├── README.md                             # Candidate-facing documentation
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── tsconfig.json
├── vite.config.ts
└── package.json
```

## Important reminders

- **Do NOT build dashboard UI.** Pages are placeholders only.
- **Do NOT write tests.** Candidates decide their own testing strategy.
- **DO make the mock API realistic** — include delays, error responses, edge cases.
- **DO make the flawed component subtle** — a senior should catch issues, but they shouldn't be obvious at first glance.
- **REMOVE CLAUDE.md and AGENTS.md** from the repo before sharing with candidates.
