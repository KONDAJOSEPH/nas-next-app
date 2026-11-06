'use client';
import { useState } from 'react';
import { PLACES } from '@/lib/config';
import { all, put } from '@/lib/db';
import { useData } from '@/lib/hooks';
import { cleanPhone, uid, placeName } from '@/lib/utils';
import { useApp } from '@/components/AppContext';

const TYPES = ['Failed Transfer', 'Account Issue', 'Commission Dispute', 'Wrong Deposit', 'Other'];

export default function Cases() {
  const { toast, refreshPending } = useApp();
  const [f, setF] = useState({ name: '', phone: '', place: PLACES[0][0], type: TYPES[0], priority: 'Medium', desc: '' });
  const [err, setErr] = useState(''), [filter, setFilter] = useState('All');
  const [list, reload] = useData(() => all('cases'));
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const rows = (list || []).filter(c => filter === 'All' || c.status === filter).sort((a, b) => b.createdAt - a.createdAt);

  async function save() {
    if (!f.name.trim() || !f.desc.trim()) return setErr('Enter the customer name and describe what happened.');
    setErr('');
    const max = (list || []).reduce((m, c) => Math.max(m, parseInt(c.code.slice(1), 10)), 1000), code = `C${max + 1}`;
    await put('cases', { id: uid(), code, type: f.type, place: f.place, priority: f.priority, status: 'Open', name: f.name.trim(), phone: cleanPhone(f.phone), desc: f.desc.trim(), createdAt: Date.now(), sync: 'pending' });
    toast(`Case #${code} saved on this device`); setF({ ...f, name: '', phone: '', desc: '' }); refreshPending(); reload();
  }
  async function resolve(c) { await put('cases', { ...c, status: 'Resolved', sync: 'pending' }); refreshPending(); reload(); }

  return (
    <>
      <h1 className="pt">Cases</h1>
      <p className="sub">Log a customer complaint. Works without internet.</p>
      <div className="g2">
        <div className="panel"><h3>Add case</h3>
          <div className="two"><div><label htmlFor="n">Customer name</label><input id="n" value={f.name} onChange={set('name')} /></div><div><label htmlFor="p">Phone number</label><input id="p" value={f.phone} onChange={set('phone')} inputMode="tel" /></div></div>
          <div className="two"><div><label htmlFor="pl">Location</label><select id="pl" value={f.place} onChange={set('place')}>{PLACES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
            <div><label htmlFor="ty">Case type</label><select id="ty" value={f.type} onChange={set('type')}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div></div>
          <label htmlFor="pr">Priority</label><select id="pr" value={f.priority} onChange={set('priority')}><option>High</option><option>Medium</option><option>Low</option></select>
          <label htmlFor="d">What happened?</label><textarea id="d" value={f.desc} onChange={set('desc')} />
          <div className="err" role="alert">{err}</div>
          <button type="button" className="btn" onClick={save}>Save case</button>
        </div>
        <div className="panel"><h3>All cases</h3>
          <div className="chips">{['All', 'Open', 'Resolved'].map(x => <button key={x} type="button" className={`chip ${x === filter ? 'on' : ''}`} onClick={() => setFilter(x)}>{x}</button>)}</div>
          {rows.length ? rows.map(c => (
            <div className="row" key={c.id}>
              <span className={`ic ${c.status === 'Resolved' ? 'ok' : c.priority === 'High' ? 'hi' : 'me'}`}>{c.status === 'Resolved' ? '✓' : '!'}</span>
              <div className="rt">Case #{c.code} • {c.type} • {placeName(c.place)}
                <small>Priority: <span className={`tag t-${c.priority}`}>{c.priority}</span> &nbsp;{c.status} • {new Date(c.createdAt).toLocaleDateString()}{c.sync === 'pending' && <> &nbsp;<span className="tag t-pe">Pending Sync</span></>}<br />{c.name}{c.phone ? ` · ${c.phone}` : ''}<br />{c.desc}</small>
                {c.status === 'Open' && <button type="button" className="btn ghost sm" onClick={() => resolve(c)}>Mark resolved</button>}
              </div>
            </div>
          )) : <div className="empty">No cases here yet.</div>}
        </div>
      </div>
    </>
  );
}
