import { Typography, Box } from '@mui/material';

/**
 * GudangKu — Shift Performance Analytics
 *
 * Task 5 (Staff+ Stretch) — Shift Performance View
 *
 *   This view is for warehouse shift managers (not floor operators).
 *   Attempt only if you have time remaining after Tasks 1–4.
 *
 *   Build a shift performance analytics view that shows:
 *   - Throughput over the shift (shipments processed per hour)
 *   - Bottleneck identification (which status has the longest dwell time)
 *   - Carrier performance comparison
 *   - Priority distribution over time
 *
 *   Data source: derive from GET /api/shipments using created_at / updated_at timestamps.
 *   No additional API endpoint is provided — you decide how to compute the metrics.
 *
 *   Document your approach and any assumptions in DECISIONS.md (Section 6).
 */
export default function Performance() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shift Performance Analytics
      </Typography>
      <Typography color="text.secondary">
        Staff+ stretch task. See the task comments above for requirements.
      </Typography>
    </Box>
  );
}
