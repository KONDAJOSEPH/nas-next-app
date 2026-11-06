'use client';
import { useEffect, useRef, useState } from 'react';
import { all, put } from '@/lib/db';
import { addLedger } from '@/lib/ledger';
import { useData } from '@/lib/hooks';
import { money, normPhone } from '@/lib/utils';
import { useApp } from '@/components/AppContext';
import Pad from '@/components/Pad';

// QR text looks like: NAS|receiptId|from|to|amount|fee|total|time|shortId
function parseCode(s) {
  if (s.includes('|')) {
    const p = s.split('|'); if (p[0] !== 'NAS' || p.length < 9) return null;
    const r = p[1].split('-');
    return { receiptId: p[1], from: p[2], to: p[3], amount: +p[4], fee: +p[5], total: +p[6], createdAt: +p[7], short: p[8], place: r[2], year: +r[3], payload: s };
  }
  return { receiptId: s, short: '' };
}

export default function CashOut() {
  const { user, notify, toast, refreshPending } = useApp(), pad = useRef(), video = useRef(), stream = useRef();
  const [code, setCode] = useState(''), [cur, setCur] = useState(null), [phone, setPhone] = useState(''), [ok, setOk] = useState(false);
  const [err, setErr] = useState(''), [perr, setPerr] = useState(''), [done, setDone] = useState(null), [scanning, setScanning] = useState(false);
  const [list, reload] = useData(() => all('transfers'));
  const recent = (list || []).filter(t => t.paid).sort((a, b) => b.paid.at - a.paid.at).slice(0, 5);

  function stopScan() { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setScanning(false); }
  useEffect(() => {
    if (!scanning) return;
    const det = new window.BarcodeDetector({ formats: ['qr_code'] }); let timer;
    video.current.srcObject = stream.current; video.current.play();
    timer = setInterval(() => det.detect(video.current).then(r => { if (r.length) { setCode(r[0].rawValue); stopScan(); find(r[0].rawValue); } }).catch(() => {}), 400);
    return () => clearInterval(timer);
  }, [scanning]); // eslint-disable-line
  useEffect(() => stopScan, []);

  async function scan() {
    if (scanning) return stopScan();
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices) return setErr('This browser cannot scan QR codes. Use a scanner app and paste the code.');
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setScanning(true); }
    catch { setErr('Camera is blocked. Allow camera access or paste the code.'); }
  }

  async function find(raw = code) {
    raw = raw.trim(); setErr('');
    if (!raw) return setErr('Scan the QR or enter the receipt ID.');
    const pc = parseCode(raw);
    if (!pc || !/^NAS-[0-9]{3}-[A-Za-z]+-[0-9]{4}$/.test(pc.receiptId)) return setErr('This is not a Nas receipt code. Check the QR and try again.');
    const l = await all('transfers');
    let t = l.find(x => x.receiptId.toLowerCase() === pc.receiptId.toLowerCase() && (!pc.short || x.id.slice(0, 8) === pc.short || x.id === `qr-${pc.receiptId}-${pc.short}`));
    if (!t) {
      if (!pc.payload) return setErr('This receipt is not on this device. Scan its QR code so the details can be read.');
      if (!isFinite(pc.amount) || pc.amount <= 0 || !pc.to) return setErr('The QR code is damaged. Ask the sender for a new receipt.');
      // Receipt made on another device: build the record from the QR itself. The server checks it at sync.
      t = { id: `qr-${pc.receiptId}-${pc.short}`, receiptId: pc.receiptId, from: pc.from, to: pc.to, fromName: '', amount: pc.amount, fee: pc.fee, total: pc.total, place: pc.place, year: pc.year, createdAt: pc.createdAt, by: '', sync: 'pending', smsStatus: 'sent', payload: pc.payload, fromQr: true };
    }
    if (t.paid) return setErr(`Already paid out on ${new Date(t.paid.at).toLocaleString()}. Do not pay again.`);
    setCur(t);
  }

  async function pay() {
    const msg = normPhone(phone) !== normPhone(cur.to) ? 'This phone number does not match the transfer. Do not pay.' : !pad.current.isSigned() ? 'Ask the receiver to sign in the box.' : !ok ? 'Tick the box after you hand over the cash.' : '';
    if (msg) return setPerr(msg);
    const t = { ...cur, paid: { at: Date.now(), by: user.name, sig: pad.current.toDataURL(), amount: cur.amount } };
    await put('transfers', t);
    await addLedger({ id: 'P' + t.id, type: 'cashout', ref: t.receiptId, float: t.amount, comm: 0, at: t.paid.at });
    toast(`Paid ${money(t.amount)} for ${t.receiptId}`);
    notify('Float credited', `${money(t.amount)} added to your float after paying ${t.to}. Receipt ${t.receiptId}.`, 'in');
    refreshPending(); reload(); setDone(t); setCur(null);
  }
  const reset = () => { setDone(null); setCur(null); setCode(''); setPhone(''); setOk(false); setErr(''); setPerr(''); };

  return (
    <>
      <h1 className="pt">Cash Out</h1>
      <p className="sub">Receiver collects money: scan the QR, pay cash, take their signature.</p>
      {done ? (
        <div className="rcpt">
          <div className="ic ok" style={{ margin: '0 auto 10px', width: 44, height: 44, fontSize: 22 }}>✓</div>
          <div className="rid">Cash-out complete</div>
          {[['Receipt', done.receiptId], ['Paid to', done.to], ['Cash paid', money(done.amount)], ['Time', new Date(done.paid.at).toLocaleString()], ['Paid by', done.paid.by]].map(([a, b]) => <div className="rl" key={a}><span>{a}</span><span>{b}</span></div>)}
          <div className="smsh">Receiver signature</div>
          <img alt="Receiver signature" src={done.paid.sig} style={{ width: '100%', background: '#fff', borderRadius: 8, border: '1px solid var(--line)', marginTop: 6 }} />
          <button type="button" className="btn full" onClick={reset}>Next cash-out</button>
        </div>
      ) : cur ? (
        <div className="panel formcard">
          <div className="found">
            <div style={{ color: 'var(--mute)', fontWeight: 600 }}>Pay the receiver</div><div className="big">{money(cur.amount)}</div>
            {[['Receipt', cur.receiptId], ['From', `${cur.fromName ? cur.fromName + ' ' : ''}${cur.from}`], ['Receiver', cur.to], ['Checked against', cur.fromQr ? 'QR code only (server checks at sync)' : 'This device']].map(([a, b]) => <div className="rl" key={a}><span>{a}</span><span>{b}</span></div>)}
          </div>
          <label htmlFor="ph">Receiver’s phone number (ask them to say it)</label><input id="ph" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="off" />
          <Pad ref={pad} label="Receiver’s signature" />
          <label className="chk"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /><span>I counted and handed over {money(cur.amount)} in cash.</span></label>
          <div className="err" role="alert">{perr}</div>
          <div className="btns"><button type="button" className="btn" onClick={pay}>Pay cash and complete</button><button type="button" className="btn ghost" onClick={reset}>Cancel</button></div>
        </div>
      ) : (
        <div className="panel formcard">
          <label htmlFor="code" style={{ marginTop: 0 }}>QR code or receipt ID</label>
          <input id="code" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" placeholder="NAS-001-Kauda-2026" />
          <p className="note">Scan the receipt QR with the camera, or paste what a scanner app reads.</p>
          <video ref={video} className="video" playsInline muted hidden={!scanning} />
          <div className="err" role="alert">{err}</div>
          <div className="btns"><button type="button" className="btn" onClick={() => find()}>Find transfer</button><button type="button" className="btn ghost" onClick={scan}>{scanning ? 'Stop scanning' : 'Scan QR'}</button></div>
        </div>
      )}
      <div className="panel formcard" style={{ marginTop: 14 }}>
        <h3>Recent cash-outs</h3>
        {recent.length ? recent.map(t => (
          <div className="row" key={t.id}><span className="ic ok">✓</span>
            <div className="rt">{t.receiptId}<small>To {t.to} • {new Date(t.paid.at).toLocaleString()}</small></div>
            <div className="amt">{money(t.paid.amount)}<br /><img alt="Signature" src={t.paid.sig} style={{ height: 26, background: '#fff', borderRadius: 4 }} /></div></div>
        )) : <div className="empty">No cash-outs yet on this device.</div>}
      </div>
    </>
  );
}
