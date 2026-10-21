# How AI was used

AI (Factory Droid) was used to scaffold the app, write the setup script and draft the docs. The
LaunchDarkly SDK behaviour was checked against the installed package type definitions
(`node_modules/launchdarkly-react-client-sdk/lib/types`) rather than trusted from memory.

## Prompts, in order

1. "Use this brief to build a LaunchDarkly sample app and presentation." Clarified SDK (React client),
   pillar (Observe), credentials and repo publishing before writing code.
2. Scaffolded the Vite + React app with a payments scenario chosen to match a UK bank's real
   regulatory pressure (Confirmation of Payee, APP fraud).
3. Checked `asyncWithLDProvider`, `reactOptions`, `variationDetail`, `track` and `identify`
   signatures against the installed SDK.
4. Wrote the REST API setup script, then the docs.

## Where AI output was corrected in this session

| AI draft | Problem | Fix |
| --- | --- | --- |
| Put name and email in the context as private attributes, and claimed in the README and deck that they "never reach LaunchDarkly" | False for client-side SDKs: private attributes are still sent for evaluation, only kept out of events and storage | Removed PII from the context entirely; verified by decoding the contexts the browser sends |
| Treated a green `vite build` as proof the app worked | With no `VITE_LD_CLIENT_SIDE_ID`, Vite inlined `undefined` and removed the whole app as dead code | Checked the bundle for UI strings; documented that the ID is a build-time input |
| Re-rendered the flag panel by rendering the flag count into a hidden span | A hack that hides intent | Replaced with a `useFlags()` subscription |
| First browser screenshots came out tiled and corrupted | The viewport was resized mid-capture | Dropped screenshots and verified with page text instead |

## Common LaunchDarkly mistakes from AI, designed out up front

These were checked against the SDK's type definitions instead of trusted from memory:

| Common mistake | Why it matters | What this repo does |
| --- | --- | --- |
| Using the server SDK key in a browser app | Leaks a secret to every customer | Client-side ID only, explained in `.env.example` |
| Leaving the default camelCase flag keys | Code and dashboard keys diverge, which breaks code references and incident searches | `useCamelCaseFlagKeys: false` and a single `flags.js` |
| Creating flags without client-side availability | React SDK gets `FLAG_NOT_FOUND` and silently uses fallbacks | `clientSideAvailability.usingEnvironmentId: true` in the setup script |
| No initialisation timeout | App waits indefinitely if LaunchDarkly is unreachable | `timeout: 3` and a visible fallback banner |

## Verified

- `npm run build` succeeds.
- With an invalid client-side ID, the app renders the current journey, keeps payments on, and shows
  a warning banner (`FLAG_NOT_FOUND` reasons in the inspector).
- `npm run ld:setup` ran against a real LaunchDarkly account and created every resource. A second
  run left existing resources unchanged.
- Connected to that account, the app served each persona the expected journey and reason:
  Aisha v2 (rule 1), Tom v2 (rule 2), Lena and Atelier Moreau v1 (default rule), with no fallback banner.
- Not yet verified end to end: the guarded rollout detecting the injected regression and rolling back.
