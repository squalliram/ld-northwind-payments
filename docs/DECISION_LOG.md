# Decision log

> Draft. Rewrite it in your own words before you submit. The brief explicitly penalises a log that
> reads as if AI wrote it.

## 1. Three design decisions and their trade-offs

**a. React client SDK, with the risky decision still owned by the server in production.**
The payment journey is a UI change, so the flag has to be read in the browser. The client SDK gives
real-time streaming updates, which makes "instant rollback" visible. Trade-off: client-side
evaluation exposes the flag values for that customer to the browser, and a customer could fake
their context. For a bank I would add secure mode and keep any rule that affects money movement
(limits, which payment rail to use) on a server SDK. I accepted that gap here to keep the demo small.

**b. Observe (guarded rollout) instead of Iterate (experiment).**
"Safer" in a regulated bank means "we can prove a release is not hurting customers, and stop it
before it does". A guarded rollout on payment failure rate and latency answers that directly and gives
an audit trail. An A/B test answers "which is better?", which matters less until the release process
is trusted. Trade-off: I do not show statistical decision-making on product value. The same metrics
can back an experiment later, so nothing is wasted.

**c. Fallbacks are the "boring" behaviour, and the kill switch defaults to ON.**
If LaunchDarkly is unreachable, the release flag falls back to the current journey and the kill
switch falls back to payments on. Pausing payments because a third-party service is unreachable is
a bigger operational and regulatory incident (DORA operational resilience) than running the
already-approved journey. Trade-off: in a real incident where LaunchDarkly is also down, the kill
switch cannot be used, so the runbook needs a second way to stop payments.

Other choices: one flag per purpose (release vs. ops) with naming prefixes so ownership and lifetime
are obvious, targeting by country so a release follows regulatory approval market by market, and
name/email as private attributes (GDPR data minimisation).

## 2. An AI suggestion I overrode

> Replace this with an example from your own session if you have a better one.

The AI reported the first production build as passing, and it did compile. But the bundle was
150 KB and contained none of the app. Vite inlines `VITE_` variables at build time. With no
client-side ID set, `if (!clientSideID) return` became `if (true) return`, and the minifier
removed the app as dead code. A green build was hiding an app that could not run. I checked the
bundle for the UI strings rather than trusting the build output, then documented that the ID is a
build-time input (so CI needs it per environment, which matters for Test vs Production).

I also overrode a smaller AI shortcut: it forced the flag panel to re-render by printing the flag
count into a hidden element. I replaced it with a plain `useFlags()` subscription.

## 3. What I would do differently for a 50-person startup

Skip the separate Production environment with required comments and change approvals, and run
a single percentage rollout with a kill switch. The audit trail and approval workflow are there for
regulators and change-advisory boards. A startup has neither, and the friction would slow it down
without reducing much risk.

## 4. Biggest risk if a customer copied this into production

Trusting the browser to say who the customer is. Without secure mode, anyone can open dev tools,
call `identify` with `isEmployee: true` and get unreleased features. In a bank that could expose
an unapproved payment journey to the public. Fix: enable secure mode and generate the hash on the
server from the authenticated session.

## 5. With four more hours

Move the money-movement decision to a Node server SDK behind a small API, with secure mode for the
client. That closes the biggest risk above. The next priority would be release pipelines (Test to
Production with approvals) to show the change-management story auditors ask for. Experimentation
would come after that.
