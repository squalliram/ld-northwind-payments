# Northwind value playback: speaker notes

45 minutes: Our Understanding 0–15, Demo 15–30, Next Steps 30–45.
These notes are also embedded in the 19-slide PowerPoint. Questions are prompts, not a script to read in full.
Ask the primary question, listen, and use follow-ups only when useful.

## 1. Safer, faster payment releases
**Timing:** 0:00–0:30.
**Say:** “Thank you for the time. My understanding is that Northwind wants to release payment improvements more often without increasing customer risk. Today I want to check that understanding, demonstrate the controls, and agree whether a small pilot is worth doing.”
**Primary discovery, Ravi (executive sponsor):** “What would make these 45 minutes useful for you?”
**Listen for:** Growth, customer trust, regulatory exposure or engineering capacity. Repeat their priority and use it in the close.
**Transition:** “Here is how we will use the time.”

## 2. Agenda
**Timing:** 0:30–1:15.
**Say:** “Fifteen minutes to validate the business problem, fifteen for a payments release, then fifteen for concerns and a mutual plan. Please interrupt and correct anything we have assumed.”
**Primary discovery, all:** “Does that balance work, or is there a decision or concern we should prioritize?”
**Role setup:** Address James Henderson-Mills as Northwind Head of Engineering, Ravi Khera as executive sponsor, and Celina Silva as architecture/security lead. These are roleplay roles, not claims about their real jobs.
**Transition:** “Let us start with your situation, not our product.”

## 3. Our Understanding divider
**Timing:** 1:15–1:30.
**Say:** “These are hypotheses from the brief, not facts we have discovered about your bank.”
**Primary discovery, James:** “Which part of the payments release process is causing the most friction today?”
**Transition:** Move straight to the three-block understanding slide. Do not explain the divider.

## 4. Our Understanding
**Timing:** 1:30–7:30, including discovery.
**Say:** “On the left, releasing to everyone makes a defect a bank-wide problem. If recovery requires a redeploy, that exposure lasts longer. On the right, we want smaller, reversible releases and evidence before widening exposure. The bottom is the vendor-neutral capability set needed to bridge that gap.”
**Primary discovery, James:** “Walk me through the last payment release that went wrong. How was it detected, who acted, and how long until customers recovered?”
**Follow-up, Ravi:** “What did that cost in disrupted payments, customer contacts, staff time or delayed launches?”
**Follow-up, Celina:** “Which release decisions must remain gated by risk or market approval?”
**Listen for:** Actual detection/recovery times, exposure, frequency, owners and constraints. Write down their corrections. Do not assume that an incident becomes legally reportable; that depends on classification.
**Value bridge:** Targeting limits initial exposure; a kill switch shortens mitigation; release metrics inform rollback; history supports governance; minimized data and outage design support resilience.
**Guardrails:** Flags do not establish DORA compliance, prevent all incidents or replace backend authorization. Do not promise a hard cap on affected customers from a percentage allocation.
**Transition:** “Have I captured the important pains and outcomes? Which capability matters most?”

## 5. How we read your brief
**Timing:** 7:30–9:30.
**Say:** “We interpreted regulated as resilience, governance, data minimisation and market-specific release. Safer means reducing exposure and recovery time. Confidence means a release decision backed by evidence rather than a complaint.”
**Primary discovery, Celina:** “When you say regulated, which specific obligations or internal controls must this initiative satisfy?”
**Follow-up, Ravi:** “If speed and risk conflict, what is the non-negotiable?”
**Listen for:** DORA scope, outsourcing assessment, residency, retention, segregation of duties and data classification.
**Caveat:** An opaque key can still be pseudonymous personal data. No names/emails is not the same as no GDPR scope.
**Transition:** “Let us make success measurable.”

## 6. The initiative and how we'll measure it
**Timing:** 9:30–12:30.
**Say:** “These are proposed pilot criteria. Recovery under a minute is a target to test, not a service guarantee. Start below five percent of eligible UK users, then decide whether to expand based on the agreed signals.”
**Primary discovery, Ravi:** “Which two measures would justify investment, and what improvement would be meaningful?”
**Follow-up, James:** “What are your actual baseline release cadence, recovery time and change failure rate, and where is that data?”
**Follow-up, Celina:** “What evidence must we produce for a control to count as passed?”
**Listen for:** A measurable baseline, target, owner and evidence source for each selected criterion. Agree pilot go/no-go criteria.
**Caveats:** Percentage of eligible contexts is not percentage of payment attempts or a guaranteed impact ceiling. Rollback reduces harm duration; it does not automatically reduce the number of defective changes. Treat cadence and audit-effort improvements as hypotheses.
**Transition:** “A few assumptions could change the design.”

## 7. What we assumed, and what we need to ask
**Timing:** 12:30–15:00.
**Say:** “For this demo I chose web first, UK first and Observe before experimentation. Existing observability stays in place. We need to validate identity, data residency, health metrics and emergency authority before a real pilot.”
**Primary discovery, Celina:** “Where may context and event data be processed and retained, and which data categories are prohibited?”
**Follow-up, James:** “Who can change a flag at 2am, and which approvals can an emergency change bypass?”
**Follow-up, Ravi:** “Which market and customer journey should prove value first?”
**Action:** Capture unresolved requirements and assign them to the security workshop rather than guessing. If UK-first is wrong, change the pilot scope visibly.
**Transition:** “With those assumptions explicit, I will show how the controls address the priorities you selected.”

## 8. Demo divider
**Timing:** 15:00–15:10.
**Say:** “This is a simulated payment journey, not a production banking system.”
**Primary discovery, James:** “Shall we use a faulty payee-verification release as the failure scenario?”
**Transition:** Move immediately to the Tell slide.

## 9. What you're about to see
**Timing:** 15:10–16:00.
**Say:** “First we limit who sees the release. Then we examine a regression and rollback. Next we pause the journey without deploying, inspect the record of the change, and discuss data and outage behaviour. Those map directly to the five capabilities we agreed.”
**Primary discovery, all:** “If we demonstrate these controls, what else would you need before approving a pilot?”
**Listen for:** A new acceptance criterion. Add it to the mutual plan.
**Execution:** State whether guarded rollback will be live, a verified rehearsal result, or a walkthrough. Do not imply a completed automatic rollback if none has been observed.
**Transition:** “One picture of the setup, then we will move into the app.”

## 10. What we built
**Timing:** 16:00–16:30, then live demo 16:30–25:30.
**Say:** “Both journeys are already deployed in React. The release flag selects v1 or v2. A separate operational flag pauses the simulated UI. The SDK sends latency and an outcome event for the selected journey.”
**Primary discovery, Celina:** “Where would authorization and payment execution live in your architecture?”
**Answer boundary:** The backend must enforce identity, eligibility, authorization and any real payment pause. Client flags are presentation controls. Secure mode binds context identity keys; it does not make browser-supplied staff/country attributes authoritative.
**Live sequence:** Targeting 2:00; guarded rollout 3:00; kill switch/release rollback 1:30; audit 1:00; data/outage behaviour 1:30. Use docs/DEMO_FLOW.md for exact navigation and value bites.
**Customer proof:** Use one short relevant story at each moment, then return to the customer's outcome. Do not read all stories.
**Fallback:** If analysis is pending, show an actually captured result from rehearsal or explain the configured workflow. If no evidence exists, mark rollback unproven and move on.
**Transition:** Return to the deck for the Tell-back checklist.

## 11. What you just saw
**Timing:** 25:30–26:15.
**Say:** “Let us check the evidence against your requirements. We demonstrated the targeting rules and the UI control. Which items do you consider proven, and which still need pilot validation?”
**Primary discovery, James:** “Would these controls have reduced the impact of the incident you described?”
**Follow-up, Celina:** “Which controls still need independent security or operational evidence?”
**Checklist discipline:** Boxes are intentionally empty. Tick only what actually happened. Separate a live result, a rehearsal recording, a configuration walkthrough and a proposal. If rollback or outage tests were not demonstrated, leave them open. Showing audit history does not prove production approvals and permissions.
**Value recap:** “Smaller exposure, mitigation without a redeploy, and a traceable decision. Weekly releases remain a pilot hypothesis, not something this demo has proved.”
**Transition:** “Other teams provide useful precedents, not guarantees.”

## 12. Where we've done this before
**Timing:** 26:15–27:30.
**Say:** “Saxo is the cadence example: roughly every three weeks to twice weekly, about sixfold. AlayaCare reported fifty percent shorter resolution time when using a flag instead of a code deployment. Ally reported ninety-seven percent fewer off-hours releases alongside more deployments.”
**Primary discovery, Ravi:** “Which comparison is closest to the outcome Northwind wants?”
**Follow-up, James:** “Would a technical reference discussion with a comparable team help?”
**Source discipline:** These are customer-reported results, not guaranteed causal effects. Tide's talk describes automatic kill switches/triggers as roadmap items, not proof of LaunchDarkly guarded rollouts. NAB is a named financial-services customer; do not invent a quantified NAB audit result. None of these stories establishes privacy compliance or outage guarantees.
**Sources:**
- Saxo Bank: https://launchdarkly.com/case-studies/saxo-bank/
- Tide, Giorgos Ampavis, feature-toggle talk: https://videos.itrevolution.com/watch/707352143
- AlayaCare and Ally customer quotations: https://launchdarkly.com/customer-stories/ and https://launchdarkly.com/customer-stories/2/
- NAB and financial-services governance context: https://launchdarkly.com/solutions/financial-services/
**Transition:** “For Northwind, the path would be incremental.”

## 13. Release: a path risk can sign off
**Timing:** 27:30–28:00.
**Say:** “Staff first, opted-in UK beta next, then eligible UK customers under metric guardrails. Other markets remain on v1 until your release authority approves. These are ordered rules, so staff and beta bypass the later UK rollout.”
**Primary discovery, James:** “Who signs off each expansion, and how would you define the eligible cohort?”
**Caveats:** A release flag selects an already deployed path; it cannot undo database writes or recover money already moved. A disconnected client cannot receive a new kill command.
**Transition:** “The evidence gate is the reason for Observe.”

## 14. Observe: why we chose it over Iterate
**Timing:** 28:00–28:45.
**Say:** “The first question is whether v2 harms customers, not whether it wins an experiment. Each attempt records latency plus either failure or completion. The rollout can compare those signals before we expand.”
**Primary discovery, James:** “Which customer-impact signal should stop the rollout, and who owns its threshold?”
**Follow-up, Celina:** “How much exposure and observation time is acceptable before a decision?”
**Caveats:** Numbers on this slide are simulated illustrations. The configured latency metric is an average, not p95. Conversion metrics are context-based, not a direct per-attempt rate when a user makes multiple payments. Repeated simulations reuse keys, so do not claim every run adds new independent users. Analysis needs sufficient eligible traffic and time; it is not an immediate promise.
**Transition:** “Here are the design choices and the production gaps.”

## 15. Decisions, trade-offs and risks
**Timing:** 28:45–30:00.
**Say:** “I chose a client SDK for a visible demo, not to authorize money movement. Observe comes before experimentation. We exclude names and emails rather than relying on private attributes. The largest production gap is trusting browser state for anything sensitive.”
**Primary discovery, Celina:** “Which risk here would block a pilot, and what evidence would clear it?”
**Follow-up, James:** “Would you prefer server-side enforcement in the first pilot scope?”
**Technical precision:** Client SDK private attributes are still sent for remote evaluation. Opaque identifiers can still be personal data. Secure mode does not sign arbitrary attributes. On stream loss, known flag values and cold-start defaults are different cases; fail-open payments-on is an explicit business decision, not universally safe.
**Curveball method:** Acknowledge, clarify impact, tie to an acceptance criterion, state what evidence is missing, and visibly update the plan. Do not bluff.
**Transition:** “Before we discuss a pilot, let us surface your concerns.”

## 16. Next Steps divider
**Timing:** 30:00–30:15.
**Say:** “We have seen the mechanics. Now the question is whether the outcome and evidence justify the next investment.”
**Primary discovery, Ravi:** “What is the biggest reason you might decide not to proceed?”
**Transition:** Stop speaking and let the objection land before moving on.

## 17. Concerns we expect, and how we'd answer
**Timing:** 30:15–36:15, primarily discussion.
**Say:** “These are common concerns, but I would rather hear yours than argue against a list.”
**Primary discovery, Celina:** “Which architecture, privacy or third-party risk concern remains unresolved?”
**Follow-up, James:** “What would your team need that a homegrown toggle does not provide today?”
**Follow-up, Ravi:** “What competes with this initiative for budget, and what is the cost of leaving the process unchanged?”
**Responses:** Outage: distinguish retained values, cold starts and inability to deliver a remote command. Data: review opaque keys, attributes, telemetry, region and retention. CAB: validate approvals, custom roles, emergency procedures and evidence export. Build: compare ongoing engineering/control cost, not just the first boolean toggle.
**Listen for:** A genuine blocker versus an information request. Confirm priority, owner and next evidence. Do not claim that all fallbacks or governance controls have been tested.
**Transition:** “If we resolve those points, here is a bounded plan to make a decision.”

## 18. Next steps: a mutual plan to a pilot
**Timing:** 36:15–43:45.
**Say:** “Week one: baseline and criteria. Week two: architecture, privacy and operational review. Weeks three to six: one squad, one real release. Week seven: readout against the criteria and a commercial decision. This is a proposal, not a committed schedule.”
**Primary discovery, Ravi:** “If we meet the agreed criteria, who owns the decision and what else is required for approval?”
**Follow-up, James:** “Which squad, release and engineering owner can we commit to?”
**Follow-up, Celina:** “Can we name an architecture/security counterpart and agree the evidence checklist?”
**Business case:** Baseline incident count × recovery hours × agreed cost/hour, plus release/on-call and audit time saved, minus license and implementation cost. Use customer inputs, avoid double counting and do not invent ROI. Capture benefit owner and data source in week one.
**Explicit ask:** Name the executive sponsor, pilot team and workshop owner. Agree a date and attendees for the week-one workshop. Ask what procurement/security steps must run in parallel.
**Exit criteria:** A pilot scope, two measurable outcomes, test cases for backend enforcement/outages, and a decision owner. If security review blocks the live pilot, make the immediate next step a design workshop instead.
**Transition:** Summarize their actual commitments, not the template's assumed commitments.

## 19. Thank you
**Timing:** 43:45–45:00.
**Say:** “We agreed that [their priority] matters most. The pilot will test [two measures]. The open issue is [blocker], owned by [name]. Our next step is [workshop], on [date], with [attendees]. Have I captured that correctly?”
**Primary discovery, Ravi:** “Are we aligned to take that next step?”
**Follow-up, all:** “Is there a stakeholder or condition missing before we close?”
**Action:** Fill the date/owner on the slide only after agreement. If no agreement, record the blocker and the owner of the evidence needed, without claiming a committed pilot.
**Close:** Thank them. Leave the repository link visible. Do not reopen a generic “any questions?” loop after securing the next step.
