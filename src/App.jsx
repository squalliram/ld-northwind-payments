import { useState } from 'react';
import { useFlags, useLDClient, useLDClientError } from 'launchdarkly-react-client-sdk';
import { FLAGS } from './flags';
import { PERSONAS, buildContext } from './personas';
import PersonaSwitcher from './components/PersonaSwitcher';
import PaymentForm from './components/PaymentForm';
import FlagInspector from './components/FlagInspector';
import DemoControls from './components/DemoControls';

export function readFlag(flags, flag) {
  const value = flags[flag.key];
  return value === undefined ? flag.fallback : value;
}

export default function App() {
  const flags = useFlags();
  const ldClient = useLDClient();
  const ldError = useLDClientError();
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [switching, setSwitching] = useState(false);
  const [injectFault, setInjectFault] = useState(false);
  const [busy, setBusy] = useState(false);

  const useV2 = readFlag(flags, FLAGS.payeeVerificationV2);
  const paymentsEnabled = readFlag(flags, FLAGS.outboundPaymentsEnabled);

  async function changePersona(next) {
    setSwitching(true);
    await ldClient?.identify(buildContext(next.user));
    setPersona(next);
    setSwitching(false);
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">
          <span className="logo">N</span> Northwind Bank
        </div>
        <PersonaSwitcher personas={PERSONAS} current={persona} onChange={changePersona} disabled={switching || busy} />
      </header>

      {ldError && (
        <div className="banner warn">
          LaunchDarkly could not be reached. The app is running on its safe fallbacks (existing payment journey, payments on).
        </div>
      )}

      <main className="grid">
        <section className="card">
          <PaymentForm
            key={persona.id}
            persona={persona}
            useV2={useV2}
            paymentsEnabled={paymentsEnabled}
            injectFault={injectFault}
          />
        </section>

        <aside className="side">
          <FlagInspector persona={persona} />
          <DemoControls
            persona={persona}
            injectFault={injectFault}
            setInjectFault={setInjectFault}
            busy={busy}
            setBusy={setBusy}
          />
        </aside>
      </main>
    </div>
  );
}
