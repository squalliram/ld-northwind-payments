# Northwind: tell, show, tell demo guide

## Audience and value thread

| Person | Roleplay role | Discovery focus |
| --- | --- | --- |
| James Henderson-Mills | Head of Engineering | Recovery time, release cadence, squad ownership |
| Ravi Khera | Executive sponsor | Customer impact, business case, decision process |
| Celina Silva | Architecture/security lead | Identity, data, outages, governance evidence |

Use their answers, not assumed pains, in each value bite. Open with: “You told us [pain]. I will show [control], so you can [outcome].” Close each moment with: “Does that address [pain], and what remains unproven?”

## Run of show: 45 minutes, 19 slides

- **0–15, slides 1–7:** Validate Current State → Future State → Required Capabilities. Agree two pilot outcomes and correct the assumptions.
- **15–16:30, slides 8–10:** Demo divider → Tell table → architecture. Set expectations for live versus previously captured evidence.
- **16:30–25:30:** Nine-minute live sequence below.
- **25:30–30, slides 11–15:** Tell-back checklist, relevant customer proof, release path, Observe rationale and production risks. Treat slides 13–15 as short technical wrap-up, not another demo.
- **30–45, slides 16–19:** Hear concerns, agree the mutual timeline, name owners and book the next workshop.

Full slide-by-slide talk tracks and discovery questions: [SPEAKER_NOTES.md](SPEAKER_NOTES.md), also embedded in the PowerPoint.

## Preflight, before the meeting

1. Use an up-to-date clone and configure its `.env` as described in the README. Run `npm install` and `npm run dev` from that clone. Never display the API token, `.env`, SDK key or authorization headers on screen.
2. Open two tabs/windows side by side: app at `http://localhost:5173`, and LaunchDarkly → **Northwind Payments** → **Test**. UI labels can vary; verify them in the current account.
3. In the app confirm Aisha = v2/rule 1, Tom = v2/rule 2, Lena and Atelier = v1/default, with payments enabled and no regression injected. Ensure both flags are available to the client SDK.
4. Open `release-payee-verification-v2` → **Targeting**. Rules: staff true; beta segment AND GB true; GB false (guarded rollout belongs here); default false. Keep staff/beta ahead of the general UK rule.
5. Rehearse guarded rollout on rule 3 with `payment-failed` and `payment-latency-ms`, automatic rollback enabled, an appropriate small initial allocation, and sufficient observation time/traffic for this account. Plan availability and UI constraints must be checked. Do not replace the staff/beta rules with a rollout.
6. Generate traffic and capture the actual analysis/result and change history if rollback completes. Retain evidence locally with no personal data or secrets. Label recordings/screenshots with date, environment and what they prove. **No completed guarded rollback has been verified as part of this deck update.** Do not substitute a manual change and call it automatic.
7. Rehearse both the kill switch and release-flag rollback, recording observed propagation time. Show the payment UI, not real money movement.
8. Rehearse outage cases separately: (a) initialized client loses its stream, (b) fresh initialization with LD requests blocked, (c) kill command issued while disconnected. Block the SDK's actual evaluation/stream endpoints using DevTools request blocking, not the entire app. Reset blocking afterward. **These outage scenarios have not been verified as part of this update.**
9. Prepare change history with a clear demo comment. Production comments, approvals, custom roles and retention are separate controls to inspect, not implied by a Test history entry.
10. Have the deck in presenter mode with notes visible only to you. Leave the Tell-back boxes empty; tick only demonstrated items. Keep a screenshot/recording fallback only if it comes from a real rehearsal.

## Live sequence: nine minutes

### 1. Targeted release, 2:00

**Tell:** “You said every customer gets a release at once. Let us limit the first exposure without holding back the code deployment.”

**Navigate and show:**
1. App → header persona selector → Aisha. Point to **New journey (v2)** and the inspector's matched rule 1.
2. Select Tom. Show v2, matched rule 2, then LD → **Segments** → `beta-customers` to show opt-in membership. Return to the flag's Targeting tab.
3. Select Lena and Atelier. Show **Current journey (v1)** and default rule. Point to the country boundary.
4. Explain that both journeys were deployed together. The business chooses release timing separately.

**Value bite:** “Smaller initial exposure and market-specific release let the squad deliver without a bank-wide launch.”

**Customer proof:** Saxo Bank moved from roughly one release every three weeks to twice weekly, about 6×. This is a relevant cadence example, not Northwind's guaranteed result.

**Ask James:** “Which cohort would you trust first, and who owns eligibility?”

**Fallback:** If a persona matches incorrectly, show the actual reason and inspect the rule/environment. Do not change unrelated account settings mid-demo. Use verified prior evidence or mark targeting pending.

### 2. Guarded rollout and regression, 3:00

**Tell:** “You said complaints find regressions. Now we will use release-specific failure and latency signals to decide whether to keep expanding.”

**Navigate and show:**
1. LD → release flag → **Targeting** → rule 3 (GB) → guarded rollout configuration/results. Show treatment true, control false, selected metrics and automatic rollback setting.
2. App → **Demo controls** → tick **Inject a regression into v2** → **Simulate UK customer traffic** (default 200).
3. Point to v1/v2 summary: payment count, observed failure percentage, average latency. This is app-generated simulation evidence, not the LD statistical verdict.
4. Return to LD → guarded rollout analysis/results. Show the actual status and, if complete, automatic rollback evidence and resulting served variation.
5. Explain that staff and beta match earlier rules and can remain on v2. Rolling back rule 3 is not the same as turning off the whole release flag.

**Value bite:** “We can stop widening exposure on evidence, reducing the duration and reach of a harmful release.”

**Customer proof:** Tide's talk is a control-pattern example: decoupled deployments/releases, with automatic kill switches and Datadog triggers described as roadmap items. It is **not** evidence Tide used this guarded rollout feature. Offer no fabricated 1:1 guarded-rollout customer result.

**Ask James:** “What health signal should stop a rollout, and how long can we observe it?”

**Fallback at 90 seconds if analysis remains pending:** Say “The events are arriving, but analysis has not reached a decision.” Show an actual rehearsal capture if available, explicitly labeled. Otherwise explain the configuration and leave auto-rollback unchecked. Never wait indefinitely or imply the 200 synthetic contexts guarantee a result.

**Metric caveats:** Latency is a mean, not p95. Failure/completion metrics are context-based conversions, not a transaction denominator for repeat payers. Repeated runs reuse context keys; they are not all new independent users. A small allocation is not a hard ceiling on affected customers. Keep the approved pilot's metric design separate from this toy simulation.

### 3. Kill switch and journey rollback, 1:30

**Tell:** “You said recovery requires a redeploy. Here are two distinct controls: pause the journey, or return to the previous journey.”

**Navigate and show:**
1. LD → flags → `ops-outbound-payments-enabled` → Test → turn targeting off, serving false. Add a reason if prompted.
2. App → observe paused payment form and inspector update without refresh. State the observed time, not “always one second.”
3. Re-enable and confirm the form recovers.
4. Release flag → turn off (false). Show v1 even for Aisha. Restore it afterward. Do not leave a live guarded rollout running unintentionally; agree rehearsal reset state first.

**Value bite:** “An operator can mitigate a customer-visible journey without building and deploying new code.”

**Customer proof:** AlayaCare reported 50% shorter resolution time when using a flag instead of a code deployment. Healthcare is an adjacent regulated setting, not a bank reference.

**Ask James:** “Who should be authorized to do this at 2am, and how would you test that authority?”

**Caveat/fallback:** This controls simulated browser UI, not real payment execution or in-flight transfers. If streaming fails, do not claim a remote command reached a disconnected client. Show actual state, then discuss backend enforcement. No claim of undoing money movement.

### 4. Change history and governance, 1:00

**Tell:** “You need to explain the decision later, not only make it quickly now.”

**Navigate and show:** Flag → **History / Change history** → latest demo change → actor, timestamp, before/after and comment. Explain where Production comments, approval rules and roles would be inspected. Do not create or enforce new policies during the presentation unless authorized.

**Value bite:** “A traceable change can reduce evidence collection and support risk-based approvals.”

**Customer proof:** NAB is a named LaunchDarkly financial-services customer. Use it as sector context, not as proof of a specific audit saving or approval workflow. Propose a reference conversation if available, without promising one.

**Ask Celina:** “What must the evidence include, and what retention/export requirements apply?”

**Fallback:** If history is unavailable, mark it open and use a genuine previously captured entry, labeled as such. A comment is not a four-eyes approval.

### 5. Data and outage behaviour, 1:30

**Tell:** “A new release control must not become a hidden source of payment risk.”

**Navigate and show:**
1. App/DevTools → inspect only the decoded synthetic LD context, not full headers or the environment file. Show `key`, `country`, `isEmployee`, `customerType`; names/emails are absent. Technical SDK metadata may also be present in requests.
2. If rehearsed, demonstrate initialized stream loss and fresh blocked initialization separately. Explain retained known values versus code defaults (release false, payments true).
3. Explain the limit: new kill commands cannot arrive while disconnected. A payments-on fallback is a deliberate fail-open policy requiring risk approval. Browser attributes are not authoritative.

**Value bite:** “Minimize the data footprint and make failure behaviour explicit, so architecture and risk can assess it.”

**Customer proof:** No cited story here proves this privacy/outage design. Ally's 97% reduction in off-hours releases and 300% increase in production deployments supports the overall operating-model outcome only. Do not stretch it into a resilience guarantee.

**Ask Celina:** “Is that failure policy acceptable, and what belongs on the bank's backend instead?”

**Fallback:** If outage behaviour is not rehearsed, do not improvise it. Explain the test matrix and leave the box open. Remove request blocking and confirm normal SDK connection before leaving.

## Tell back and close

Return to **slide 11**. Check each row only at the level actually demonstrated. A configuration walkthrough is not a completed rollback. A Test audit entry is not proof of approval enforcement.

“You asked for [their priority]. We showed [observed evidence]. The open items are [gaps]. Would testing those in one squad give you enough confidence to make a decision?”

Use **slide 12** for the one or two customer stories most relevant to their answers, not a five-story monologue. Slides 13–15 are a short release/Observe/risk recap. At minute 30 move into concerns.

On **slide 18**, build the business case with customer inputs: incident recovery cost, on-call/release time, audit effort, implementation cost and license cost. Avoid double counting; assign a benefit owner. Ask for sponsor, pilot squad, workshop date and decision owner. Write only actual commitments on slide 19.

## Evidence status at this update

- Previously verified: Aisha/Tom receive v2 through their respective rules; Lena/Atelier receive v1. Decoded context excludes names/emails.
- Not verified by this deck task: completed guarded auto-rollback, measured kill-switch propagation, disconnected/cold-start behaviour, Production approval enforcement.
- No live account configuration was changed by this deck task.
- The app is a demo. Production needs backend authorization and enforcement; secure mode alone does not make arbitrary browser attributes trustworthy.

## Customer source links and boundaries

- **Saxo:** https://launchdarkly.com/case-studies/saxo-bank/ . Roughly every three weeks → twice weekly; 6× is an approximate cadence comparison.
- **Tide:** https://videos.itrevolution.com/watch/707352143 . Talk by Giorgos Ampavis. Distinguish deployed use from roadmap.
- **AlayaCare / Ally:** https://launchdarkly.com/customer-stories/ and https://launchdarkly.com/customer-stories/2/ . Customer-reported 50% shorter resolution (flags versus redeploy) and 97% fewer off-hours releases / 300% more deployments (2020–2023).
- **NAB / sector governance:** https://launchdarkly.com/solutions/financial-services/ . Named customer and product capabilities, not a measured NAB audit outcome.
- All comparisons are context-specific. None proves Northwind's ROI, compliance, transaction authorization or outage safety.
