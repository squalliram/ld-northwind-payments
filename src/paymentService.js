// Stand-in for the core banking payments API. Latency and failure rates are simulated so the
// demo can show what a guarded rollout sees when a release regresses.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function confirmationOfPayee(payeeName, accountNumber) {
  const name = payeeName.trim().toLowerCase();
  if (!name) return { result: 'NO_MATCH', message: 'Enter the name on the account.' };
  if (accountNumber.endsWith('9')) {
    return { result: 'NO_MATCH', message: 'The name does not match the account. Check with the payee before you continue.' };
  }
  if (name.includes('ltd') || accountNumber.endsWith('7')) {
    return { result: 'CLOSE_MATCH', message: `The account holder's name is a close match: "${payeeName.replace(/ltd/i, 'Limited')}".` };
  }
  return { result: 'MATCH', message: 'The name matches the account.' };
}

// `wait: false` lets the traffic generator produce realistic latency values without real delays.
export async function submitPayment({ amount, useV2, injectFault, wait = true }) {
  const baseLatency = useV2 ? 320 : 280;
  const jitter = Math.random() * 200;
  const degraded = useV2 && injectFault;
  const latencyMs = Math.round(baseLatency + jitter + (degraded ? 1200 : 0));
  if (wait) await sleep(latencyMs);

  const failureRate = degraded ? 0.35 : 0.02;
  const ok = Math.random() > failureRate;

  if (!ok) {
    const err = new Error(degraded ? 'Payments gateway timeout (v2 path)' : 'Payments gateway rejected the request');
    err.latencyMs = latencyMs;
    throw err;
  }
  return { reference: `NWB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, amount, latencyMs };
}
