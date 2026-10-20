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
no names or emails in the context at all (GDPR data minimisation).

## 2. An AI suggestion I overrode

The AI's design for customer privacy was to put name and email in the LaunchDarkly context and
mark them as **private attributes**. It then wrote that they "never reach LaunchDarkly" into the
README, and "no names or emails are sent" into the deck, as our answer to the data-protection
objection.

That is true for server-side SDKs. It is not true for the client-side SDK I chose. LaunchDarkly's
own docs say a client-side SDK still sends private attributes to LaunchDarkly to evaluate flags.
They are only kept out of analytics events and not stored. So the line we were about to give a
bank's InfoSec team and DPO was wrong.

I removed name and email from the context entirely. No targeting rule uses them, so there was never
a reason to send them. The context is now only the opaque key, `country`, `isEmployee` and
`customerType`. I checked this by decoding the contexts the browser sends to LaunchDarkly and
reading the event payloads: no names or emails, and targeting still works for every persona.

Why my call was better: the AI chose the feature whose name sounded right and wrote a confident
claim on top of it. Private attributes are the right tool when you have to target on a sensitive
value. Data minimisation (GDPR) says not to send what you don't use. And in a regulated deal, one
wrong answer to the security reviewer costs more trust than the demo earns.

A smaller catch: the first production build "passed" but Vite had removed the whole app as dead
code, because the client-side ID is inlined at build time. I checked the bundle, not the green tick.
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
