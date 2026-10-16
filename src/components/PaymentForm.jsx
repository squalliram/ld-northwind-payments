import { useState } from 'react';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import { confirmationOfPayee, submitPayment } from '../paymentService';
import { recordPaymentOutcome } from '../telemetry';

const HIGH_VALUE_THRESHOLD = 1000;

export default function PaymentForm({ persona, useV2, paymentsEnabled, injectFault }) {
  const ldClient = useLDClient();
  const [payee, setPayee] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('250');
  const [cop, setCop] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const numericAmount = Number(amount) || 0;
  const needsFraudWarning = useV2 && numericAmount >= HIGH_VALUE_THRESHOLD;
  const copBlocks = useV2 && (!cop || cop.result === 'NO_MATCH');
  const canSend =
    paymentsEnabled && !sending && payee && account.length >= 8 && numericAmount > 0 &&
    !copBlocks && (!needsFraudWarning || acknowledged);

  function checkPayee() {
    setCop(confirmationOfPayee(payee, account));
  }

  async function send(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await submitPayment({ amount: numericAmount, useV2, injectFault });
      recordPaymentOutcome(ldClient, { ok: true, latencyMs: res.latencyMs, amount: numericAmount });
      setStatus({ ok: true, text: `Payment of £${numericAmount.toFixed(2)} sent. Reference ${res.reference} (${res.latencyMs} ms).` });
    } catch (err) {
      recordPaymentOutcome(ldClient, { ok: false, latencyMs: err.latencyMs, amount: numericAmount });
      setStatus({ ok: false, text: `${err.message}. No money has left your account.` });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={send} className="payment">
      <div className="payment-head">
        <h2>Send money</h2>
        <span className={`pill ${useV2 ? 'pill-new' : ''}`}>{useV2 ? 'New journey (v2)' : 'Current journey (v1)'}</span>
      </div>
      <p className="muted">Hi {persona.label.split(' ')[0]}, who would you like to pay?</p>

      {!paymentsEnabled && (
        <div className="banner danger">
          Outbound payments are paused while we fix an issue. Your money is safe and no payments have been lost.
        </div>
      )}

      <label>
        Name on the account
        <input value={payee} onChange={(e) => { setPayee(e.target.value); setCop(null); }} placeholder="e.g. Jane Smith" />
      </label>
      <label>
        Account number
        <input value={account} onChange={(e) => { setAccount(e.target.value.replace(/\D/g, '')); setCop(null); }} maxLength={8} placeholder="8 digits" />
      </label>

      {useV2 && (
        <div className="cop">
          <button type="button" className="secondary" onClick={checkPayee} disabled={!payee || account.length < 8}>
            Check payee details
          </button>
          {cop && <div className={`cop-result cop-${cop.result.toLowerCase()}`}>{cop.message}</div>}
          <small className="muted">Account numbers ending in 9 return no match, ending in 7 a close match.</small>
        </div>
      )}

      <label>
        Amount (GBP)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
      </label>

      {needsFraudWarning && (
        <label className="fraud">
          <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
          <span>
            Could this be a scam? Northwind will never ask you to move money to a safe account. I confirm I know and trust
            this payee.
          </span>
        </label>
      )}

      <button type="submit" disabled={!canSend}>{sending ? 'Sending…' : 'Send payment'}</button>
      {status && <div className={`banner ${status.ok ? 'ok' : 'danger'}`}>{status.text}</div>}
    </form>
  );
}
