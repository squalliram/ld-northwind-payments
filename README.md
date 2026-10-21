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
Experimentation comes once there is trust in the release process.

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

The context sent to LaunchDarkly contains only the opaque key, `country`, `isEmployee` and
`customerType`. Names and emails are left out on purpose. Marking them as private attributes would
not be enough, because a client-side SDK still sends private attributes to LaunchDarkly for
evaluation (it only keeps them out of events and storage).

## Environment assumptions

| Area | Assumption |
| --- | --- |
| Runtime | Node.js **20.6 or later** (the setup script uses `node --env-file`). Tested on Node 20.20 on macOS. |
| Browser | Any current Chrome, Edge, Firefox or Safari. The app runs at http://localhost:5173. |
| LaunchDarkly account | A trial or paid account. Guarded rollouts (demo step 4) must be included in your plan. Everything else works on any plan. |
| LaunchDarkly project | Project key `northwind-payments`, environment `test`. You can use other keys: set `LD_PROJECT_KEY` and `LD_ENVIRONMENT_KEY` in `.env`. The app itself only needs the environment's client-side ID. |
| Environments | Segments are per environment. Every resource in the table below must exist in the environment whose client-side ID you use. |
| Backend | None. Payments and Confirmation of Payee are simulated in the browser. No real money or personal data is involved. |
| Secrets | `.env` is git-ignored. It holds the client-side ID (not secret) and, optionally, an API token (secret, used only by the setup script). |
## Setup

```bash
git clone https://github.com/squalliram/ld-northwind-payments.git
cd ld-northwind-payments
npm install
cp .env.example .env
```

### 1. Create the LaunchDarkly resources

None of the flags, segment or metrics come with the repo. You must re-create them in your own
LaunchDarkly account, with **exactly the keys below**, because the app looks them up by key.

**Option A: setup script (recommended).**

1. In LaunchDarkly, go to *Organization settings > Authorization* and create an API access token
   with the **Writer** role.
2. Put it in `.env` as `LD_API_TOKEN=...`.
3. Run:

```bash
npm run ld:setup
```

The script creates the `northwind-payments` project (Test and Production environments, with comments
required on Production changes), then the segment, metrics, flags and targeting rules in the
`test` environment. It skips anything that already exists, so it is safe to re-run. At the end it
prints the line to paste into `.env`:

```
Done. Put this in .env:
VITE_LD_CLIENT_SIDE_ID=<your client-side ID>
```

**Option B: by hand in the LaunchDarkly UI.** Create these in your project and environment. On both
flags, tick **SDKs using Client-side ID** under *Client-side SDK availability*. If you skip that, the
React SDK cannot see the flag and silently uses the code fallback.

| Type | Key | Details |
| --- | --- | --- |
| Flag (boolean, temporary) | `release-payee-verification-v2` | On. Rule 1: `user.isEmployee is true` serve `true`. Rule 2: `user is in segment beta-customers` AND `user.country is GB` serve `true`. Rule 3: `user.country is GB` serve `false` (guarded rollout goes here). Default rule `false`. Off variation `false`. |
| Flag (boolean, permanent) | `ops-outbound-payments-enabled` | On, serving `true`. Off variation `false`. Turning the flag **off** pauses all payments. |
| Segment | `beta-customers` | Include user key `usr-beta-042` |
| Metric (custom, conversion) | `payment-failed` | Event key `payment-failed`, lower is better |
| Metric (custom, numeric) | `payment-latency-ms` | Event key `payment-latency-ms`, unit ms, average, lower is better |
| Metric (custom, conversion) | `payment-submitted` | Event key `payment-submitted`, higher is better |

**Where the keys live in code.** Every flag key and metric event key is defined once, in
[`src/flags.js`](src/flags.js). If you have to use different keys in LaunchDarkly, change them there.
Persona keys and attributes used by the targeting rules (for example `usr-beta-042`) are in
[`src/personas.js`](src/personas.js).

### 2. Configure the app

Set the **client-side ID** of the environment in `.env`. Option A prints it. Otherwise find it under
*Project settings > Environments > (your environment) > Client-side ID*.

```
VITE_LD_CLIENT_SIDE_ID=<client-side ID>
```

Use the client-side ID, not the SDK key. The SDK key is a server-side secret and must never be
shipped to a browser.

### 3. Run it

```bash
npm run dev
```

Open http://localhost:5173. Vite reads `VITE_` variables when it starts, so restart the dev server
after you change `.env`.

### 4. Check that it works

Signed in as Aisha Patel (the default persona), you should see:

- **no** yellow "LaunchDarkly could not be reached" banner
- the **New journey (v2)** badge on the payment form
- in the right-hand panel, `release-payee-verification-v2` = `true`, reason *Matched targeting rule 1*,
  and `ops-outbound-payments-enabled` = `true`

Switch to Lena Schmidt (DE): the form changes to **Current journey (v1)** without a page reload.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "LaunchDarkly is not configured" page | `VITE_LD_CLIENT_SIDE_ID` is empty. Set it and restart `npm run dev`. |
| Yellow banner, reasons show `Error: FLAG_NOT_FOUND` | Wrong client-side ID, or the flags don't have *SDKs using Client-side ID* ticked, or they were created in a different environment. |
| Aisha gets v1, reason *Default rule* | Rule 1 is missing or the flag is off in this environment. |
| Tom Hughes gets v1 | The `beta-customers` segment is missing in this environment, or doesn't include `usr-beta-042`. |
| `npm run ld:setup` says the token was rejected | The API token is wrong, expired, or doesn't have the Writer role. |
| `node: bad option: --env-file` | Node is older than 20.6. Upgrade Node. |

## Demo script

For the timed tell-show-tell presentation, product navigation, customer stories and honest fallbacks,
see [`docs/DEMO_FLOW.md`](docs/DEMO_FLOW.md). Slide-by-slide discovery questions and talk tracks are in
[`docs/SPEAKER_NOTES.md`](docs/SPEAKER_NOTES.md) and embedded in the PowerPoint.

1. **Targeting.** Switch personas in the header. Aisha and Tom get the new journey, Lena and Atelier
   Moreau do not. The right-hand panel shows the value and the *reason* (which rule matched).
2. **Kill switch.** In LaunchDarkly, turn `ops-outbound-payments-enabled` off. The app pauses
   payments in about a second with no refresh, and the change appears in the live log. Turn it back on.
3. **Instant rollback.** Turn `release-payee-verification-v2` off. Every customer is back on v1.
4. **Guarded rollout (Observe).** Set it up once in LaunchDarkly:
   1. Open `release-payee-verification-v2` in the `test` environment and find rule 3 (UK customers).
   2. Change what the rule serves from `false` to **Guarded rollout**, rolling out `true`.
   3. Add the metrics `payment-failed` and `payment-latency-ms`, and turn on **automatic rollback**.
   4. Review and save.

   Back in the app, tick **Inject a regression into v2** and click **Simulate UK customer traffic**
   (200 synthetic UK customers who match rule 3). The v2 group's failure rate and latency rise. The
   panel summarises both groups, and LaunchDarkly flags the regression and rolls the rule back to
   `false`. Analysis requires sufficient traffic and observation time; repeated simulations reuse
   context keys and do not guarantee a decision. Rehearse and verify the completed rollback before
   presenting it as proven.
5. **Audit.** Open the flag's *History* tab to see who changed what, when, and the comment explaining why.

## Project layout

```
src/
  flags.js               flag keys, fallbacks and metric event keys in one place
  personas.js            demo customers and context builder (no PII sent)
  telemetry.js           sends the three guardrail events for every payment
  paymentService.js      simulated payments API with an injectable regression
  components/
    PaymentForm.jsx      v1 and v2 payment journeys, kill switch handling
    FlagInspector.jsx    flag values, evaluation reasons, live change log
    DemoControls.jsx     regression toggle and synthetic traffic generator
scripts/
  setup-launchdarkly.mjs creates project, segment, metrics, flags and rules via the REST API
docs/
  AI_USAGE.md            how AI was used and where it was overridden
  DEMO_FLOW.md           timed demo navigation, value bites, stories and fallbacks
  SPEAKER_NOTES.md       talk tracks and discovery questions for all 19 slides
  northwind-value-playback.pptx   value playback deck
.env.example             every environment variable, with where to find each value
```

## Known limitations (not production-ready)

- **Browser flags are not authorization.** Production must enforce identity, eligibility and payment
  execution on the backend. Secure mode can protect context identity keys, but it does not make
  arbitrary browser-supplied attributes trustworthy.
- Payments and Confirmation of Payee are simulated.
- The traffic generator calls `identify` in a loop to create synthetic customers. That is for the
  demo only.

## Reviewer access

Reviewers are invited as members of the `northwind-payments` LaunchDarkly project (*Organization
settings > Members > Invite members*), so the flags, segment, environments, metrics and change
history can be reviewed in the LaunchDarkly UI.
