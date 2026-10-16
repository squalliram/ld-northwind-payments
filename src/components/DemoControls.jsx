import { useState } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { FLAGS } from '../flags';
import { buildContext, syntheticUkCustomer } from '../personas';
import { submitPayment } from '../paymentService';
import { recordPaymentOutcome } from '../telemetry';

// Demo-only: simulates many UK customers so a guarded rollout has enough data to compare the
// control and treatment groups. Real traffic would come from real sessions.
export default function DemoControls({ persona, injectFault, setInjectFault, busy, setBusy }) {
  const ldClient = useLDClient();
  const [count, setCount] = useState(200);
  const [summary, setSummary] = useState(null);

  async function generate() {
    if (!ldClient) return;
    setBusy(true);
    setSummary(null);
    const stats = { v1: { n: 0, failed: 0, latency: 0 }, v2: { n: 0, failed: 0, latency: 0 } };
    for (let i = 0; i < count; i += 1) {
      await ldClient.identify(syntheticUkCustomer(i));
      const useV2 = ldClient.variation(FLAGS.payeeVerificationV2.key, FLAGS.payeeVerificationV2.fallback);
      const enabled = ldClient.variation(FLAGS.outboundPaymentsEnabled.key, FLAGS.outboundPaymentsEnabled.fallback);
      if (!enabled) continue;
      const amount = Math.round(20 + Math.random() * 800);
      const bucket = useV2 ? stats.v2 : stats.v1;
      bucket.n += 1;
      try {
        const res = await submitPayment({ amount, useV2, injectFault, wait: false });
        bucket.latency += res.latencyMs;
        recordPaymentOutcome(ldClient, { ok: true, latencyMs: res.latencyMs, amount });
      } catch (err) {
        bucket.failed += 1;
        bucket.latency += err.latencyMs;
        recordPaymentOutcome(ldClient, { ok: false, latencyMs: err.latencyMs, amount });
      }
    }
    await ldClient.flush();
    await ldClient.identify(buildContext(persona.user));
    setSummary(stats);
    setBusy(false);
  }

  const fmt = (b) => (b.n ? `${b.n} payments, ${((b.failed / b.n) * 100).toFixed(1)}% failed, ${Math.round(b.latency / b.n)} ms avg` : 'no traffic');

  return (
    <div className="card demo">
      <h3>Demo controls</h3>
      <label className="toggle">
        <input type="checkbox" checked={injectFault} onChange={(e) => setInjectFault(e.target.checked)} />
        <span>Inject a regression into v2 (slower gateway, ~35% failures)</span>
      </label>
      <div className="row">
        <input type="number" min={10} max={2000} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        <button type="button" className="secondary" onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : 'Simulate UK customer traffic'}
        </button>
      </div>
      {summary && (
        <ul className="log">
          <li><strong>v1</strong> {fmt(summary.v1)}</li>
          <li><strong>v2</strong> {fmt(summary.v2)}</li>
        </ul>
      )}
      <p className="muted small">Events are sent to LaunchDarkly as metrics that the guarded rollout monitors.</p>
    </div>
  );
}
