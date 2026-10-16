import { useEffect, useState } from 'react';
import { useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { FLAGS } from '../flags';

function describeReason(reason) {
  if (!reason) return 'No reason (fallback in use)';
  switch (reason.kind) {
    case 'OFF': return 'Flag is off';
    case 'FALLTHROUGH': return reason.inExperiment ? 'Default rule (in rollout)' : 'Default rule';
    case 'TARGET_MATCH': return 'Individually targeted';
    case 'RULE_MATCH': return `Matched targeting rule ${reason.ruleIndex + 1}`;
    case 'PREREQUISITE_FAILED': return `Prerequisite ${reason.prerequisiteKey} failed`;
    case 'ERROR': return `Error: ${reason.errorKind}`;
    default: return reason.kind;
  }
}

export default function FlagInspector({ persona }) {
  const ldClient = useLDClient();
  // Subscribes this component to flag updates so the table re-renders on every change.
  useFlags();
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (!ldClient) return undefined;
    const onChange = (changes) => {
      const time = new Date().toLocaleTimeString('en-GB');
      const entries = Object.entries(changes)
        .filter(([key]) => Object.values(FLAGS).some((f) => f.key === key))
        .map(([key, { current, previous }]) => ({ time, key, current, previous }));
      if (entries.length) setLog((prev) => [...entries, ...prev].slice(0, 8));
    };
    ldClient.on('change', onChange);
    return () => ldClient.off('change', onChange);
  }, [ldClient]);

  const rows = Object.values(FLAGS).map((flag) => {
    const detail = ldClient ? ldClient.variationDetail(flag.key, flag.fallback) : { value: flag.fallback };
    return { flag, detail };
  });

  return (
    <div className="card inspector">
      <h3>What LaunchDarkly decided for {persona.label}</h3>
      <table>
        <tbody>
          {rows.map(({ flag, detail }) => (
            <tr key={flag.key}>
              <td>
                <code>{flag.key}</code>
                <div className="muted small">{flag.purpose}</div>
              </td>
              <td className="value">
                <span className={`pill ${detail.value ? 'pill-on' : 'pill-off'}`}>{String(detail.value)}</span>
                <div className="muted small">{describeReason(detail.reason)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Live flag changes (no redeploy, no refresh)</h4>
      {log.length === 0 ? (
        <p className="muted small">Change a flag in LaunchDarkly and it will appear here within a second.</p>
      ) : (
        <ul className="log">
          {log.map((l, i) => (
            <li key={`${l.time}-${l.key}-${i}`}>
              <span className="muted">{l.time}</span> <code>{l.key}</code> {String(l.previous)} → <strong>{String(l.current)}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
