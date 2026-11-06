'use client';
import { useEffect, useState } from 'react';
import { gather } from '@/lib/sync';
import { useData } from '@/lib/hooks';
import { sspm } from '@/lib/utils';
import { useApp, ls } from '@/components/AppContext';

const KL = { send: 'Money sent', pay: 'Cash-out paid', cust: 'Customer registration', case: 'Case', led: 'Float entry' };

export default function Sync() {
  const { online, sync, runSync, lastSync } = useApp();
  const [items, reload] = useData(gather);
  const [auto, setAuto] = useState(true);
  useEffect(() => setAuto(ls.get('nas_auto') !== 'off'), []);
  useEffect(() => { if (!sync.running) reload(); }, [sync.running]); // eslint-disable-line
  const list = items || [], tx = list.filter(i => i.k === 'send' || i.k === 'pay'), amt = tx.reduce((a, i) => a + i.amt, 0), other = list.length - tx.length;
  const msg = sync.running || sync.msg ? sync.msg : !list.length ? 'Everything is synced.' : !online ? 'No internet. Records stay safe on this device and are pushed to the Juba server when it returns.' : 'Ready to push to the Juba server.';
  return (
    <>
      <h1 className="pt">Sync Center</h1>
      <p className="sub">Push records from this device to the Juba server</p>
      <div className="panel formcard center">
        <span className={`net ${online ? 'on' : ''}`}>{online ? 'Online' : 'Offline'}</span>
        <div className="big" style={{ marginTop: 14 }}>{tx.length} {tx.length === 1 ? 'transaction' : 'transactions'} waiting</div>
        <div style={{ color: 'var(--mute)', fontWeight: 600 }}>{sspm(amt)} to push{other ? ` • plus ${other} other ${other === 1 ? 'record' : 'records'}` : ''}</div>
        <button type="button" className="btn full" style={{ fontSize: 18, padding: 16 }} disabled={sync.running || !list.length || !online} onClick={() => runSync(false)}>SYNC NOW</button>
        {sync.running && <div className="bar"><div style={{ width: `${sync.progress}%` }} /></div>}
        <div role="status" style={{ marginTop: 12, fontWeight: 600, fontSize: 14, minHeight: 20 }}>{msg}</div>
        <label className="chk" style={{ justifyContent: 'center' }}><input type="checkbox" checked={auto} onChange={e => { setAuto(e.target.checked); ls.set('nas_auto', e.target.checked ? 'on' : 'off'); }} /><span>Sync automatically when internet returns</span></label>
        <p className="note">Last synced: <b>{lastSync || 'Never'}</b><br />Records go to a simulated Juba server until you set NEXT_PUBLIC_API_URL.</p>
      </div>
      <div className="panel formcard" style={{ marginTop: 14 }}>
        <h3>Waiting to sync</h3>
        {list.length ? list.slice(0, 30).map((i, n) => (
          <div className="row" key={n}><span className="ic pe">◷</span><div className="rt">{i.label}<small>{KL[i.k]}</small></div><div className="amt">{i.amt ? sspm(i.amt) : ''}</div></div>
        )) : <div className="empty">Nothing waiting.</div>}
        {list.length > 30 && <div className="empty">and {list.length - 30} more</div>}
      </div>
    </>
  );
}
