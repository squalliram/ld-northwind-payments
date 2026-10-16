# Northwind Bank: safer payment releases with LaunchDarkly

A sample payments app for a fictional regulated EMEA bank. It shows how LaunchDarkly lets the bank
ship a change to a high-risk journey (outbound payments) faster, without raising risk:

- **Release**: a temporary release flag, targeting (staff, then UK beta customers, then UK customers),
  and an operational kill switch for instant rollback without a deploy.
- **Observe**: every payment emits failure, latency and completion events. These back LaunchDarkly
  metrics that a **guarded rollout** watches, so a regression is caught and rolled back automatically
  before most customers see it.

Why Observe and not Iterate: for a bank with low risk appetite, the first question leadership asks is
"how do we know a release is not hurting customers?", not "which variant converts better?".
Experimentation comes once there is trust in the release process. See [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md).

## The scenario in the app

Northwind is rolling out **Payee verification v2**: a new payment journey with a Confirmation of Payee
check and a scam warning on high-value payments. Both are things UK regulators expect (PSR
Confirmation of Payee, APP fraud reimbursement). The change touches the money-movement path, so
it must reach customers gradually and be reversible in seconds.

| Persona | Attributes | Expected result |
| --- | --- | --- |
| Aisha Patel | `isEmployee: true`, `country: GB` | v2 (staff dogfooding rule) |
| Tom Hughes | in `beta-customers` segment, `country: GB` | v2 (UK beta rule) |
| Lena Schmidt | `country: DE` | v1 (not yet approved outside the UK) |
| Atelier Moreau SARL | `country: FR`, `customerType: business` | v1 |

Name and email are sent as **private attributes**, so they never reach LaunchDarkly. Targeting only
uses the opaque key, `country`, `isEmployee` and `customerType`.

## Prerequisites

- Node.js 20 or later
- A LaunchDarkly account (a trial works)
- Optional: a LaunchDarkly API access token with the Writer role, to create flags with the setup script

## Setup

```bash
git clone https://github.com/squalliram/ld-northwind-payments.git
cd ld-northwind-payments
npm install
cp .env.example .env
```

### 1. Create the LaunchDarkly resources

**Option A: script (recommended).** Put `LD_API_TOKEN` in `.env`, then run:

```bash
npm run ld:setup
```

It creates the `northwind-payments` project (Test and Production environments, with comments
required on Production changes), the segment, metrics, flags and targeting rules shown below, and
prints the client-side ID. It is safe to re-run.

**Option B: by hand in the LaunchDarkly UI.** Create these in your project. On both flags, tick
**SDKs using Client-side ID** under *Client-side SDK availability*. If you skip that, the React SDK
cannot see the flag and silently uses the code fallback.

| Type | Key | Details |
| --- | --- | --- |
| Flag (boolean, temporary) | `release-payee-verification-v2` | On. Rule 1: `user.isEmployee is true` serve `true`. Rule 2: `user is in segment beta-customers` AND `user.country is GB` serve `true`. Rule 3: `user.country is GB` serve `false` (guarded rollout goes here). Default rule `false`. Off variation `false`. |
| Flag (boolean, permanent) | `ops-outbound-payments-enabled` | On, serving `true`. Off variation `false`. Turning the flag **off** pauses all payments. |
| Segment | `beta-customers` | Include user key `usr-beta-042` |
| Metric (custom, conversion) | `payment-failed` | Event key `payment-failed`, lower is better |
| Metric (custom, numeric) | `payment-latency-ms` | Event key `payment-latency-ms`, unit ms, lower is better |
| Metric (custom, conversion) | `payment-submitted` | Event key `payment-submitted`, higher is better |

### 2. Configure the app

Set the **client-side ID** of the environment in `.env`:

```
VITE_LD_CLIENT_SIDE_ID=<client-side ID from Project settings > Environments>
```

Use the client-side ID, not the SDK key. The SDK key is a server-side secret and must never be
shipped to a browser.

### 3. Run it

```bash
npm run dev
```

Open http://localhost:5173. Vite reads `VITE_` variables at build time, so restart the dev server
after you change `.env`.

## Demo script

1. **Targeting.** Switch personas in the header. Aisha and Tom get the new journey, Lena and Atelier
   Moreau do not. The right-hand panel shows the value and the *reason* (which rule matched).
2. **Kill switch.** In LaunchDarkly, turn `ops-outbound-payments-enabled` off. The app pauses
   payments in about a second with no refresh, and the change appears in the live log. Turn it back on.
3. **Instant rollback.** Turn `release-payee-verification-v2` off. Every customer is back on v1.
4. **Guarded rollout (Observe).** Edit rule 3 (UK customers) to a *Guarded rollout*, add the
   `payment-failed` and `payment-latency-ms` metrics, and turn on automatic rollback. Back in the app,
   tick **Inject a regression into v2** and click **Simulate UK customer traffic**. The regressed
   group's failure rate and latency rise, and LaunchDarkly detects the regression and rolls the rule back.
5. **Audit.** Open the flag's *History* tab to see who changed what, when, and the comment explaining why.

## Project layout

```
src/
  flags.js               flag keys, fallbacks and metric event keys in one place
  personas.js            demo customers and context builder (private attributes)
  telemetry.js           sends the three guardrail events for every payment
  paymentService.js      simulated payments API with an injectable regression
  components/
    PaymentForm.jsx      v1 and v2 payment journeys, kill switch handling
    FlagInspector.jsx    flag values, evaluation reasons, live change log
    DemoControls.jsx     regression toggle and synthetic traffic generator
scripts/
  setup-launchdarkly.mjs creates project, segment, metrics, flags and rules via the REST API
docs/
  DECISION_LOG.md        decisions, trade-offs and risks
  AI_USAGE.md            how AI was used and where it was overridden
```

## Known limitations (not production-ready)

- **No secure mode.** A client-side app can claim any context key. Production use needs secure mode,
  with the context hash computed by the bank's backend. See the decision log.
- Payments and Confirmation of Payee are simulated.
- The traffic generator calls `identify` in a loop to create synthetic customers. That is for the
  demo only.
