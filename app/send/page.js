'use client';
import { useState } from 'react';
import { PLACES, FEE_RATE, COMM_RATE } from '@/lib/config';
import { all, put } from '@/lib/db';
import { floatNow, addLedger } from '@/lib/ledger';
import { useData } from '@/lib/hooks';
import { cleanPhone, validPhone, uid, round2, money, sspm, makeReceiptId } from '@/lib/utils';
import { useApp } from '@/components/AppContext';
import Receipt from '@/components/Receipt';

export default function Send() {
  const { user, online, notify, toast, refreshPending } = useApp();
  const [f, setF] = useState({ from: '', to: '', amt: '', place: PLACES[0][0] }), [err, setErr] = useState(''), [receipt, setReceipt] = useState(null);
  const [customers] = useData(() => all('customers'));
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const amt = round2(parseFloat(f.amt.replace(/,/g, '')) || 0), fee = round2(amt * FEE_RATE);
  const from = cleanPhone(f.from), to = cleanPhone(f.to);
  const sender = from.length >= 9 ? (customers || []).find(c => c.phone === from) : null;

  async function save() {
    const msg = !validPhone(from) ? 'Enter a valid sender phone, 9 to 15 digits.' : !validPhone(to) ? 'Enter a valid receiver phone, 9 to 15 digits.'
      : from === to ? 'Sender and receiver must be different numbers.' : amt <= 0 ? 'Enter an amount greater than zero.' : amt > 10000000 ? 'Amount is too large for one transfer.' : '';
    if (msg) return setErr(msg);
    const [transfers, fl] = await Promise.all([all('transfers'), floatNow()]);
    if (fl.float < amt) return setErr(`Not enough float. You have ${sspm(fl.float)} and need ${sspm(amt)}. Top up in My Float.`);
    setErr('');
    const yr = new Date().getFullYear(), seq = transfers.filter(x => x.place === f.place && x.year === yr).length + 1;
    const rid = makeReceiptId(seq, f.place, yr), id = uid(), ts = Date.now(), total = round2(amt + fee);
    const t = {
      id, receiptId: rid, from, to, fromName: sender ? sender.fullName : '', amount: amt, fee, total, place: f.place, year: yr, createdAt: ts,
      by: user.name, sync: 'pending', smsStatus: online ? 'sent' : 'queued',
      payload: ['NAS', rid, from, to, amt.toFixed(2), fee.toFixed(2), total.toFixed(2), ts, id.slice(0, 8)].join('|'),
    };
    const comm = round2(fee * COMM_RATE);
    await put('transfers', t);
    await addLedger({ id: 'L' + id, type: 'send', ref: rid, float: -amt, comm, at: ts });
    toast(`Receipt ${rid} created`);
    notify('Money received from sender', `Collected ${money(total)} from ${from} to send to ${to}. Receipt ${rid}. Commission +${sspm(comm)}.`, 'in');
    refreshPending(); setReceipt(t);
  }

  if (receipt) return (
    <>
      <h1 className="pt">Send Money</h1><p className="sub">Receipt created. Give the QR to the sender.</p>
      <Receipt t={receipt}><button type="button" className="btn full" onClick={() => { setReceipt(null); setF({ ...f, from: '', to: '', amt: '' }); }}>New transfer</button></Receipt>
    </>
  );
  return (
    <>
      <h1 className="pt">Send Money</h1>
      <p className="sub">Send to any phone number. A QR receipt is made even offline.</p>
      <div className="panel formcard">
        <div className="two">
          <div><label htmlFor="from">Sender phone</label><input id="from" value={f.from} onChange={set('from')} inputMode="tel" autoComplete="off" /><div className="hint">{sender ? `Registered: ${sender.fullName}` : from.length >= 9 ? 'Not registered yet. You can still send.' : ''}</div></div>
          <div><label htmlFor="to">Receiver phone</label><input id="to" value={f.to} onChange={set('to')} inputMode="tel" autoComplete="off" /></div>
        </div>
        <div className="two">
          <div><label htmlFor="amt">Amount (SSP)</label><input id="amt" value={f.amt} onChange={set('amt')} inputMode="decimal" autoComplete="off" /></div>
          <div><label htmlFor="place">Agent location</label><select id="place" value={f.place} onChange={set('place')}>{PLACES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
        </div>
        <div className="calc">
          <div><span>Amount</span><span>{money(amt)}</span></div>
          <div><span>Fee ({FEE_RATE * 100}%)</span><span>{money(fee)}</span></div>
          <div className="tot"><span>Collect from sender</span><span>{money(amt + fee)}</span></div>
        </div>
        <div className="err" role="alert">{err}</div>
        <button type="button" className="btn" onClick={save}>Send money</button>
        <p className="note">The fee is added on top. The sender pays the total, the receiver gets the full amount.</p>
      </div>
    </>
  );
}
