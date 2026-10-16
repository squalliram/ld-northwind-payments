// Single source of truth for every flag the app reads.
// `fallback` is what the app does if LaunchDarkly is unreachable or the flag is missing,
// so each fallback must be the behaviour we are already comfortable running in production.
export const FLAGS = {
  payeeVerificationV2: {
    key: 'release-payee-verification-v2',
    fallback: false,
    purpose: 'Release flag (temporary). New payment journey with Confirmation of Payee and fraud warnings.',
  },
  outboundPaymentsEnabled: {
    key: 'ops-outbound-payments-enabled',
    fallback: true,
    purpose: 'Operational kill switch (permanent). Turns all outbound payments off without a deploy.',
  },
};

// Custom event keys. Each one is backed by a metric in LaunchDarkly that guarded rollouts watch.
export const METRICS = {
  submitted: 'payment-submitted',
  failed: 'payment-failed',
  latency: 'payment-latency-ms',
};
