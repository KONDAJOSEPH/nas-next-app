'use client';
import { useEffect, useRef, useState } from 'react';
import { all, putMany } from '@/lib/db';
import { useData } from '@/lib/hooks';
import { fmtMB } from '@/lib/utils';
import { useApp, ls } from '@/components/AppContext';

const Row = ({ ok, label, detail }) => <div className="row"><span className={`ic ${ok ? 'ok' : 'me'}`}>{ok ? '✓' : '!'}</span><div className="rt">{label}<small>{detail}</small></div></div>;
const STORES = ['customers', 'transfers', 'ledger', 'cases'];

export default function Offline() {
  const { online, refreshPending } = useApp(), file = useRef();
  const [msg, setMsg] = useState(''), [bmsg, setBmsg] = useState(''), [install, setInstall] = useState(null), [tick, setTick] = useState(0);
  const [d] = useData(async () => {
    const [counts, persisted, est] = await Promise.all([
      Promise.all(STORES.map(s => all(s).then(l => l.length))),
      navigator.storage?.persisted ? navigator.storage.persisted() : false,
      navigator.storage?.estimate ? navigator.storage.estimate() : null,
    ]);
    return { counts, persisted, est, sw: !!navigator.serviceWorker?.controller };
  }, [tick]);
  useEffect(() => { const h = e => { e.preventDefault(); setInstall(e); }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h); }, []);
  if (!d) return <p className="empty">Loading…</p>;
  const us = d.est?.quota ? Math.round(d.est.usage / d.est.quota * 100) : null, last = ls.get('nas_last_backup');

  async function backup() {
    const data = { app: 'nas', v: 1, at: new Date().toISOString() };
    for (const s of STORES) data[s] = await all(s);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = `nas-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    ls.set('nas_last_backup', new Date().toLocaleString()); setBmsg(`Backup file created: ${data.customers.length} customers, ${data.transfers.length} transfers.`); setTick(t => t + 1);
  }
  function restore(e) {
    const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = async () => {
      let data; try { data = JSON.parse(rd.result); if (data.app !== 'nas' || !STORES.every(s => Array.isArray(data[s]))) throw 0; } catch { return setBmsg('This is not a Nas backup file.'); }
      let n = 0;
      for (const s of STORES) { const have = new Set((await all(s)).map(x => x.id)), add = data[s].filter(x => !have.has(x.id)); n += add.length; await putMany(s, add); }
      setBmsg(n ? `Restored ${n} records that were missing on this device.` : 'Nothing to restore. This device already has all of them.'); refreshPending(); setTick(t => t + 1);
    };
    rd.readAsText(f); e.target.value = '';
  }
  return (
    <>
      <h1 className="pt">Offline Center</h1>
      <p className="sub">Check this device is ready to work without internet</p>
      <div className="panel formcard">
        <h3>Offline readiness</h3>
        <Row ok={online} label="Connection" detail={online ? 'Online' : 'Offline. Everything on this device still works.'} />
        <Row ok label="Local database" detail="Saving to this device (IndexedDB)" />
        <Row ok={d.persisted} label="Storage protection" detail={d.persisted ? 'Protected from automatic clearing' : 'Not protected. The browser may clear data if the phone runs low on space.'} />
        <Row ok={d.sw} label="App saved for offline" detail={d.sw ? 'Ready. The app opens without internet.' : 'Not saved yet. Open the hosted app once with internet, then reload.'} />
        <Row ok={us === null || us < 80} label="Space used" detail={us === null ? 'Not reported by this browser' : `${us}% of ${fmtMB(d.est.quota)}${us >= 80 ? '. Back up and clear old records.' : ''}`} />
        <Row ok label="Records on this device" detail={`${d.counts[0]} customers, ${d.counts[1]} transfers, ${d.counts[3]} cases`} />
        <Row ok={!!last} label="Last backup" detail={last || 'Never. Make a backup now.'} />
        <div className="btns">
          {!d.persisted && navigator.storage?.persist && <button type="button" className="btn" onClick={() => navigator.storage.persist().then(ok => { setMsg(ok ? 'Your data is now protected.' : 'The browser did not allow it. Installing the app usually helps.'); setTick(t => t + 1); })}>Protect my data</button>}
          {install && <button type="button" className="btn ghost" onClick={() => { install.prompt(); setInstall(null); }}>Install app</button>}
        </div>
        <div role="status" style={{ marginTop: 10, fontWeight: 600, fontSize: 14, minHeight: 20 }}>{msg}</div>
      </div>
      <div className="panel formcard" style={{ marginTop: 14 }}>
        <h3>Backup</h3>
        <p className="note" style={{ marginTop: 0, marginBottom: 12 }}>Save everything on this device to a file, or restore from one. Back up every day and before clearing the browser or changing phones.</p>
        <div className="btns" style={{ marginTop: 0 }}><button type="button" className="btn" onClick={backup}>Back up data</button><button type="button" className="btn ghost" onClick={() => file.current.click()}>Restore from file</button></div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={restore} />
        <div role="status" style={{ marginTop: 10, fontWeight: 600, fontSize: 14, minHeight: 20 }}>{bmsg}</div>
      </div>
    </>
  );
}
