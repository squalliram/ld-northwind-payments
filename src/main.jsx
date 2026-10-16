import React from 'react';
import ReactDOM from 'react-dom/client';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import App from './App';
import { PERSONAS, buildContext } from './personas';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
const clientSideID = import.meta.env.VITE_LD_CLIENT_SIDE_ID;

function ConfigError() {
  return (
    <div className="config-error">
      <h1>LaunchDarkly is not configured</h1>
      <p>
        Copy <code>.env.example</code> to <code>.env</code> and set <code>VITE_LD_CLIENT_SIDE_ID</code> to the
        <strong> client-side ID</strong> of your environment, then restart <code>npm run dev</code>.
      </p>
    </div>
  );
}

async function start() {
  if (!clientSideID) {
    root.render(<ConfigError />);
    return;
  }

  // asyncWithLDProvider waits for flags before first render, so a customer never sees the new
  // journey flash in and then disappear. `timeout` caps that wait: if LaunchDarkly is unreachable
  // the app renders with the code-level fallbacks in flags.js instead of hanging.
  const LDProvider = await asyncWithLDProvider({
    clientSideID,
    context: buildContext(PERSONAS[0].user),
    timeout: 3,
    options: {
      evaluationReasons: true,
      application: { id: 'northwind-payments-web', version: '1.0.0' },
    },
    // Keep flag keys exactly as they appear in LaunchDarkly so code search and code references
    // find them. The SDK default would turn them into camelCase.
    reactOptions: { useCamelCaseFlagKeys: false },
  });

  root.render(
    <React.StrictMode>
      <LDProvider>
        <App />
      </LDProvider>
    </React.StrictMode>,
  );
}

start();
