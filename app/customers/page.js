'use client';
import { useState } from 'react';
import { all } from '@/lib/db';
import { useData } from '@/lib/hooks';
import { placeName } from '@/lib/utils';

export default function Customers() {
  const [q, setQ] = useState('');
  const [list] = useData(() => all('customers'));
  const s = q.trim().toLowerCase();
  const rows = (list || []).filter(c => !s || c.fullName.toLowerCase().includes(s) || c.phone.includes(s)).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <>
      <h1 className="pt">Customers</h1>
      <p className="sub">Registered on this device</p>
      <div className="panel">
        <div className="two">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or phone" aria-label="Search customers" />
          <div style={{ alignSelf: 'center', color: 'var(--mute)', fontWeight: 600 }}>{rows.length} {rows.length === 1 ? 'customer' : 'customers'}</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {rows.length ? rows.map(c => (
            <details className="cu" key={c.id}>
              <summary>
                <img className="av2" alt="" src={c.photo} />
                <div className="rt">{c.fullName}<small>{placeName(c.village)} • {c.phone} • {c.code} • {new Date(c.createdAt).toLocaleDateString()}</small></div>
                <span className={`tag ${c.sync === 'synced' ? 't-ok' : 't-pe'}`}>{c.sync === 'synced' ? 'Synced' : 'Pending Sync'}</span>
              </summary>
              <div className="imgs">
                <figure><img alt="Photo" src={c.photo} />Photo</figure>
                <figure><img alt="Fingerprint" src={c.fingerprint} />Fingerprint</figure>
                <figure><img alt="Signature" src={c.signature} />Signature</figure>
              </div>
            </details>
          )) : <div className="empty">{s ? 'No customer matches that search.' : 'No customers yet. Use Register to add the first one.'}</div>}
        </div>
      </div>
    </>
  );
}
