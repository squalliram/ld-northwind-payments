import { METRICS } from './flags';

// Every payment attempt emits the same three signals so the control and treatment groups of a
// guarded rollout are measured identically, regardless of which code path served them.
export function recordPaymentOutcome(ldClient, { ok, latencyMs, amount }) {
  if (!ldClient) return;
  ldClient.track(METRICS.latency, undefined, latencyMs);
  if (ok) {
    ldClient.track(METRICS.submitted, undefined, amount);
  } else {
    ldClient.track(METRICS.failed);
  }
}
