#!/usr/bin/env node
// Creates (or reuses) everything the demo needs in LaunchDarkly: project, environments, segment,
// metrics, flags and targeting rules. Safe to re-run: existing objects are left as they are.
//
// Usage: npm run ld:setup   (reads LD_API_TOKEN, LD_PROJECT_KEY, LD_ENVIRONMENT_KEY from .env)

const API = 'https://app.launchdarkly.com/api/v2';
const token = process.env.LD_API_TOKEN;
const projectKey = process.env.LD_PROJECT_KEY || 'northwind-payments';
const envKey = process.env.LD_ENVIRONMENT_KEY || 'test';

if (!token) {
  console.error('LD_API_TOKEN is not set. Create a Writer API access token and add it to .env.');
  process.exit(1);
}

const SEMANTIC = 'application/json; domain-model=launchdarkly.semanticpatch';

async function ld(method, path, body, contentType = 'application/json') {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: token, 'Content-Type': contentType },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

async function createIfMissing(label, path, body) {
  const res = await ld('POST', path, body);
  if (res.status === 201 || res.status === 200) {
    console.log(`  created  ${label}`);
  } else if (res.status === 409) {
    console.log(`  exists   ${label}`);
  } else {
    throw new Error(`Creating ${label} failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
}

async function ensureProject() {
  const existing = await ld('GET', `/projects/${projectKey}`);
  if (existing.status === 401 || existing.status === 403) {
    throw new Error(`LaunchDarkly rejected LD_API_TOKEN (${existing.status}). Check it is valid, not expired, and has the Writer role.`);
  }
  if (existing.status === 200) {
    if (!existing.data.environments?.some?.((e) => e.key === envKey)) {
      const envs = await ld('GET', `/projects/${projectKey}/environments/${envKey}`);
      if (envs.status !== 200) throw new Error(`Project ${projectKey} has no environment "${envKey}". Set LD_ENVIRONMENT_KEY to an existing environment.`);
    }
    console.log(`  exists   project ${projectKey}`);
    return;
  }
  await createIfMissing(`project ${projectKey}`, '/projects', {
    key: projectKey,
    name: 'Northwind Payments',
    tags: ['se-homework'],
    environments: [
      { key: 'test', name: 'Test', color: '7B42BC' },
      // Production asks for confirmation and a comment on every change, so the audit log shows why
      // a flag moved, not just who moved it.
      { key: 'production', name: 'Production', color: 'C4314B', confirmChanges: true, requireComments: true },
    ],
  });
}

const booleanFlag = ({ key, name, description, trueName, falseName, onIsTrue, temporary, tags }) => ({
  key,
  name,
  description,
  temporary,
  tags,
  variations: [
    { value: true, name: trueName },
    { value: false, name: falseName },
  ],
  defaults: { onVariation: onIsTrue ? 0 : 1, offVariation: 1 },
  clientSideAvailability: { usingEnvironmentId: true, usingMobileKey: false },
});

async function main() {
  console.log(`Project ${projectKey}, environment ${envKey}`);
  await ensureProject();

  await createIfMissing('segment beta-customers', `/segments/${projectKey}/${envKey}`, {
    key: 'beta-customers',
    name: 'Beta customers',
    description: 'Customers who have opted into early access. Managed by the digital banking team.',
    tags: ['payments'],
  });
  const seg = await ld('PATCH', `/segments/${projectKey}/${envKey}/beta-customers`, [
    { op: 'replace', path: '/included', value: ['usr-beta-042'] },
  ]);
  if (seg.status !== 200) throw new Error(`Updating segment failed (${seg.status}): ${JSON.stringify(seg.data)}`);

  const metrics = [
    { key: 'payment-failed', name: 'Payment failure rate', eventKey: 'payment-failed', isNumeric: false, successCriteria: 'LowerThanBaseline' },
    { key: 'payment-latency-ms', name: 'Payment latency (ms)', eventKey: 'payment-latency-ms', isNumeric: true, unit: 'ms', unitAggregationType: 'average', analysisType: 'mean', successCriteria: 'LowerThanBaseline' },
    { key: 'payment-submitted', name: 'Payment completion', eventKey: 'payment-submitted', isNumeric: false, successCriteria: 'HigherThanBaseline' },
  ];
  for (const m of metrics) {
    await createIfMissing(`metric ${m.key}`, `/metrics/${projectKey}`, {
      ...m,
      kind: 'custom',
      randomizationUnits: ['user'],
      tags: ['payments', 'guardrail'],
    });
  }

  await createIfMissing('flag release-payee-verification-v2', `/flags/${projectKey}`, booleanFlag({
    key: 'release-payee-verification-v2',
    name: 'Release: Payee verification v2',
    description: 'New payment journey with Confirmation of Payee and high-value scam warnings. Remove after full UK rollout.',
    trueName: 'New journey',
    falseName: 'Current journey',
    onIsTrue: false,
    temporary: true,
    tags: ['payments', 'release'],
  }));

  await createIfMissing('flag ops-outbound-payments-enabled', `/flags/${projectKey}`, booleanFlag({
    key: 'ops-outbound-payments-enabled',
    name: 'Ops: Outbound payments enabled',
    description: 'Kill switch. Turn this flag OFF to pause all outbound payments during an incident.',
    trueName: 'Payments on',
    falseName: 'Payments paused',
    onIsTrue: true,
    temporary: false,
    tags: ['payments', 'kill-switch'],
  }));

  const flag = (await ld('GET', `/flags/${projectKey}/release-payee-verification-v2?env=${envKey}`)).data;
  const envConfig = flag.environments[envKey];
  if (envConfig.rules.length === 0) {
    const on = flag.variations.find((v) => v.value === true)._id;
    const off = flag.variations.find((v) => v.value === false)._id;
    const user = (attribute, op, values) => ({ contextKind: 'user', attribute, op, values, negate: false });
    const res = await ld('PATCH', `/flags/${projectKey}/release-payee-verification-v2`, {
      environmentKey: envKey,
      comment: 'Initial targeting: staff, then UK beta customers, then UK guarded rollout.',
      instructions: [
        { kind: 'addRule', description: 'Internal staff (dogfooding)', clauses: [user('isEmployee', 'in', [true])], variationId: on },
        { kind: 'addRule', description: 'UK beta customers', clauses: [user('segmentMatch', 'segmentMatch', ['beta-customers']), user('country', 'in', ['GB'])], variationId: on },
        { kind: 'addRule', description: 'UK customers (guarded rollout goes here)', clauses: [user('country', 'in', ['GB'])], variationId: off },
        { kind: 'updateFallthroughVariationOrRollout', variationId: off },
        { kind: 'turnFlagOn' },
      ],
    }, SEMANTIC);
    if (res.status !== 200) throw new Error(`Targeting release flag failed (${res.status}): ${JSON.stringify(res.data)}`);
    console.log('  updated  targeting for release-payee-verification-v2');
  } else {
    console.log('  exists   targeting for release-payee-verification-v2 (left unchanged)');
  }

  const kill = await ld('PATCH', `/flags/${projectKey}/ops-outbound-payments-enabled`, {
    environmentKey: envKey,
    comment: 'Payments on by default.',
    instructions: [{ kind: 'turnFlagOn' }],
  }, SEMANTIC);
  if (kill.status !== 200) throw new Error(`Turning kill switch on failed (${kill.status}): ${JSON.stringify(kill.data)}`);
  console.log('  updated  ops-outbound-payments-enabled is ON');

  const env = await ld('GET', `/projects/${projectKey}/environments/${envKey}`);
  console.log(`\nDone. Put this in .env:\nVITE_LD_CLIENT_SIDE_ID=${env.data._id}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
