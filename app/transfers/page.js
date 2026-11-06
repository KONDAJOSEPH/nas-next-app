'use client';
import { all } from '@/lib/db';
import { useData } from '@/lib/hooks';
import { money } from '@/lib/utils';
import Receipt from '@/components/Receipt';

export default function Transfers() {
  const [list] = useData(() => all('transfers'));
  const rows = [...(list || [])].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <>
      <h1 className="pt">Transfers</h1>
      <p className="sub">Sent from this device</p>
      <div className="panel">
        <div style={{ color: 'var(--mute)', fontWeight: 600 }}>{rows.length} {rows.length === 1 ? 'transfer' : 'transfers'}</div>
        {rows.length ? rows.map(t => (
          <details className="cu" key={t.id}>
            <summary>
              <span className="ic ok">→</span>
              <div className="rt">{t.receiptId}<small>{t.from} → {t.to} • {new Date(t.createdAt).toLocaleDateString()}</small></div>
              <div className="amt">{money(t.total)}
                <small><span className={`tag ${t.smsStatus === 'queued' ? 't-pe' : 't-ok'}`}>SMS {t.smsStatus}</span> {t.paid && <span className="tag t-sy">Paid out</span>}</small>
              </div>
            </summary>
            <div style={{ margin: '12px auto 0', display: 'flex', justifyContent: 'center' }}><Receipt t={t} /></div>
          </details>
        )) : <div className="empty">No transfers yet. Use Send Money to make the first one.</div>}
      </div>
    </>
  );
}
