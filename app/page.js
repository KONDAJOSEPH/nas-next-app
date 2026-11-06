'use client';
import Link from 'next/link';
import { all } from '@/lib/db';
import { floatNow } from '@/lib/ledger';
import { useData } from '@/lib/hooks';
import { money, sspm, placeName } from '@/lib/utils';
import { useApp } from '@/components/AppContext';

export default function Dashboard() {
  const { online, pending } = useApp();
  const [d] = useData(async () => {
    const [t, c, k, f] = await Promise.all([all('transfers'), all('customers'), all('cases'), floatNow()]);
    return { t, c, k, f };
  });
  if (!d) return <p className="empty">Loading…</p>;
  const day = new Date().toDateString();
  const today = d.t.filter(x => new Date(x.createdAt).toDateString() === day).length + d.t.filter(x => x.paid && new Date(x.paid.at).toDateString() === day).length;
  const recent = [...d.t].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const open = d.k.filter(x => x.status === 'Open').sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  return (
    <>
      <h1 className="pt">Overview Dashboard</h1>
      <p className="sub">Real-time overview of agent operations and case management</p>
      <div className="kpis">
        <div className="kpi"><div className="l">Transactions Today</div><div className="v">{today}</div><div className="n">Sent and paid out on this device</div></div>
        <div className="kpi"><div className="l">Agent Float</div><div className="v" style={{ color: 'var(--blue)' }}>{sspm(d.f.float)}</div><div className="n">Available to send</div></div>
        <div className="kpi"><div className="l">My Commission</div><div className="v" style={{ color: '#0e7a55' }}>{sspm(d.f.comm)}</div><div className="n">Earned so far</div></div>
        <div className="kpi"><div className="l">Customers</div><div className="v">{d.c.length}</div><div className="n">Registered on this device</div></div>
        <div className="kpi"><div className="l">Sync Status</div><div className="v" style={{ fontSize: 22 }}>{online ? 'Online' : 'Offline'} • {pending} Pending</div><div className="n">Pending records to sync</div></div>
      </div>
      <div className="g2">
        <div className="panel">
          <h3>Recent Transactions</h3>
          {recent.length ? recent.map(t => (
            <div className="row" key={t.id}>
              <span className={`ic ${t.paid ? 'ok' : 'pe'}`}>{t.paid ? '✓' : '◷'}</span>
              <div className="rt">{t.receiptId} • {placeName(t.place)}<small>{t.from} → {t.to} • {new Date(t.createdAt).toLocaleString()}</small></div>
              <div className="amt">{money(t.amount)}<small>{t.paid ? 'Paid out' : 'Awaiting collection'}</small></div>
            </div>
          )) : <div className="empty">No transfers yet. <Link href="/send/" style={{ color: 'var(--blue)' }}>Send money</Link></div>}
        </div>
        <div className="panel">
          <h3>Open Cases / Complaints</h3>
          {open.length ? open.map(c => (
            <div className="row" key={c.id}>
              <span className={`ic ${c.priority === 'High' ? 'hi' : 'me'}`}>!</span>
              <div className="rt">Case #{c.code} • {c.type} • {placeName(c.place)}<small>Priority: <span className={`tag t-${c.priority}`}>{c.priority}</span> • {c.name}</small></div>
            </div>
          )) : <div className="empty">No open cases. <Link href="/cases/" style={{ color: 'var(--blue)' }}>Add a case</Link></div>}
        </div>
      </div>
    </>
  );
}
