'use client';
import { useState } from 'react';
import { LOW_FLOAT, OPEN_FLOAT, COMM_RATE } from '@/lib/config';
import { floatNow, addLedger } from '@/lib/ledger';
import { useData } from '@/lib/hooks';
import { sspm, round2, uid } from '@/lib/utils';
import { useApp } from '@/components/AppContext';

const LABEL = { send: 'Sent money', cashout: 'Cash-out paid', topup: 'Float top-up', redeem: 'Commission moved to float' };

export default function Float() {
  const { notify, toast, refreshPending } = useApp();
  const [f, setF] = useState({ type: 'topup', amt: '', ref: '' }), [err, setErr] = useState('');
  const [s, reload] = useData(floatNow);
  if (!s) return <p className="empty">Loading…</p>;
  const low = s.float < LOW_FLOAT;
  let bal = OPEN_FLOAT;
  const rows = [...s.list].sort((a, b) => a.at - b.at).map(e => { bal += e.float; return { e, bal }; }).reverse().slice(0, 20);

  async function save() {
    const a = round2(parseFloat(f.amt.replace(/,/g, '')) || 0);
    const m = a <= 0 ? 'Enter an amount greater than zero.' : a > 10000000 ? 'Amount is too large.' : f.type === 'redeem' && a > s.comm ? `You only have ${sspm(s.comm)} commission to move.` : '';
    if (m) return setErr(m);
    setErr('');
    await addLedger({ id: uid(), type: f.type, ref: f.ref.trim(), float: a, comm: f.type === 'redeem' ? -a : 0, at: Date.now() });
    toast(f.type === 'topup' ? 'Float topped up' : 'Commission moved to float');
    notify(f.type === 'topup' ? 'Float top-up received' : 'Commission moved to float', `${sspm(a)}${f.type === 'topup' ? ' added to your float.' : ' moved from commission to float.'}`, 'in');
    setF({ ...f, amt: '', ref: '' }); refreshPending(); reload();
  }
  return (
    <>
      <h1 className="pt">My Float</h1>
      <p className="sub">Your float balance and commission</p>
      <div className="kpis">
        <div className="kpi"><div className="l">Float balance</div><div className="v" style={{ color: 'var(--blue)' }}>{sspm(s.float)}</div>
          <div className="n" style={{ fontWeight: 700, color: low ? 'var(--red)' : 'var(--green)' }}>{low ? 'Low float. Ask head office for a top up.' : 'Enough float to send money'}</div></div>
        <div className="kpi"><div className="l">Commission earned</div><div className="v" style={{ color: '#0e7a55' }}>{sspm(s.comm)}</div><div className="n">Your share of transfer fees</div></div>
      </div>
      <div className="g2">
        <div className="panel"><h3>Add to float</h3>
          <label htmlFor="type">What do you want to do?</label>
          <select id="type" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="topup">Top up float from head office</option><option value="redeem">Move commission to float</option></select>
          <label htmlFor="amt">Amount (SSP)</label><input id="amt" value={f.amt} onChange={e => setF({ ...f, amt: e.target.value })} inputMode="decimal" autoComplete="off" />
          <label htmlFor="ref">Reference or note</label><input id="ref" value={f.ref} onChange={e => setF({ ...f, ref: e.target.value })} autoComplete="off" />
          <div className="err" role="alert">{err}</div>
          <button type="button" className="btn" onClick={save}>Save</button>
          <p className="note">Sending money uses float. Cash-outs add to it. {COMM_RATE * 100}% of each transfer fee is credited to you as commission. Top-ups are only typed in here for now: head office should approve them on the server.</p>
        </div>
        <div className="panel"><h3>Float history</h3>
          {rows.map(({ e, bal }) => (
            <div className="row" key={e.id}><span className={`ic ${e.float >= 0 ? 'ok' : 'me'}`}>{e.float >= 0 ? '+' : '−'}</span>
              <div className="rt">{LABEL[e.type]}{e.ref ? ` • ${e.ref}` : ''}<small>{new Date(e.at).toLocaleString()}</small></div>
              <div className="amt">{e.float >= 0 ? '+' : '−'}{sspm(Math.abs(e.float))}<small>Balance {sspm(bal)}</small></div></div>
          ))}
          <div className="row"><span className="ic ok">•</span><div className="rt">Opening balance<small>Starting float</small></div><div className="amt">{sspm(OPEN_FLOAT)}</div></div>
        </div>
      </div>
    </>
  );
}
