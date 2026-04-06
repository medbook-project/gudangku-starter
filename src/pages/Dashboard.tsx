import { Typography, Box } from '@mui/material';

/**
 * GudangKu — Shipment Tracking Dashboard
 *
 * This is your main workspace. Build the warehouse shipment tracking dashboard here.
 *
 * ─── Assessment Tasks ─────────────────────────────────────────────────────────
 *
 * Task 1 — Shipment Tracking Dashboard
 *   Build a real-time dashboard showing today's shipments.
 *   Acceptance criteria:
 *   - Fetch shipments from GET /api/shipments
 *   - Display shipment list with status, priority, carrier, and destination
 *   - Support filtering by status and/or priority
 *   - Connect to GET /api/shipments/stream (SSE) and update the UI in real-time
 *     when new_shipment, status_change, and priority_update events arrive
 *   - Display stats from GET /api/shipments/stats
 *   - Status indicators must use icons + labels, NOT color alone
 *     (warehouse operators may be color-blind; all touch targets must be ≥ 48px)
 *
 * Task 2 — AI Route Suggestion Panel
 *   Add a panel or drawer that shows AI-generated routing suggestions.
 *   Acceptance criteria:
 *   - Trigger a POST /api/ai/route-suggestion for a selected shipment
 *   - Stream the response token-by-token using response.body.getReader()
 *     (this is a ReadableStream of raw text chunks, NOT SSE)
 *   - Display the suggestion as it streams in
 *   - Handle the ~30% case where the AI suggestion contradicts the shipment's
 *     priority — document your UX decision in DECISIONS.md
 *
 * Task 3 — Code Review: src/components/ai-generated-component.tsx
 *   Review the AI-generated shipment detail modal and fix all issues you find.
 *   Acceptance criteria:
 *   - Identify and fix all bugs (there are 10 deliberate issues of varying severity)
 *   - Document each issue found, its severity, and your fix in DECISIONS.md
 *
 * Task 4 — DECISIONS.md (ongoing)
 *   Fill in DECISIONS.md as you work. This is assessed alongside your code.
 *
 * ─── Available API Endpoints ──────────────────────────────────────────────────
 *
 *   GET    /api/shipments               — list shipments (supports ?status= ?priority=)
 *   PATCH  /api/shipments/:id/status    — update status (validates status machine)
 *   GET    /api/shipments/stream        — SSE stream of real-time events
 *   POST   /api/ai/route-suggestion     — streaming AI routing suggestion
 *   GET    /api/shipments/stats         — daily aggregate statistics
 */
export default function Dashboard() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        GudangKu — Shipment Tracking Dashboard
      </Typography>
      <Typography color="text.secondary">
        Build your dashboard here. See the task comments above for acceptance criteria.
      </Typography>
    </Box>
  );
}
