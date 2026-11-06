'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLACES } from '@/lib/config';
import { all, put } from '@/lib/db';
import { cleanPhone, validPhone, uid } from '@/lib/utils';
import { useApp } from '@/components/AppContext';
import Pad from '@/components/Pad';
import Capture from '@/components/Capture';

export default function Register() {
  const { user, toast, refreshPending } = useApp(), router = useRouter(), pad = useRef();
  const [f, setF] = useState({ name: '', phone: '', village: PLACES[0][0] });
  const [photo, setPhoto] = useState(''), [fp, setFp] = useState(''), [err, setErr] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function save() {
    const phone = cleanPhone(f.phone), name = f.name.trim();
    const msg = !name ? 'Enter the customer’s full name.' : !validPhone(phone) ? 'Enter a valid phone number, 9 to 15 digits.'
      : !photo ? 'Take the customer’s photo.' : !fp ? 'Capture the customer’s fingerprint.' : !pad.current.isSigned() ? 'Ask the customer to sign in the box.' : '';
    if (msg) return setErr(msg);
    const dup = (await all('customers')).find(c => c.phone === phone);
    if (dup) return setErr(`This phone number is already registered to ${dup.fullName}.`);
    const id = uid();
    await put('customers', {
      id, code: 'NC-' + id.replace(/-/g, '').slice(0, 6).toUpperCase(), fullName: name, phone, village: f.village,
      photo, fingerprint: fp, signature: pad.current.toDataURL(), registeredBy: user.name, createdAt: Date.now(), sync: 'pending',
    });
    toast(`${name} registered on this device`); refreshPending(); router.push('/customers/');
  }

  return (
    <>
      <h1 className="pt">Register Customer</h1>
      <p className="sub">Capture details, photo, fingerprint and signature. Works without internet.</p>
      <div className="panel formcard">
        <div className="two">
          <div><label htmlFor="name">Full name</label><input id="name" value={f.name} onChange={set('name')} autoComplete="off" /></div>
          <div><label htmlFor="phone">Phone number</label><input id="phone" value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="off" placeholder="+249…" /></div>
        </div>
        <label htmlFor="vil">Village or town</label>
        <select id="vil" value={f.village} onChange={set('village')}>{PLACES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        <div className="cap">
          <Capture title="Photo" value={photo} onChange={setPhoto} button="Take photo" />
          <Capture title="Fingerprint" value={fp} onChange={setFp} facing="environment" max={400} button="Capture fingerprint" />
        </div>
        <p className="note">No scanner connected: photograph the customer’s thumb print. To use a real scanner, replace the fingerprint <code>Capture</code> box with your scanner’s component.</p>
        <Pad ref={pad} />
        <div className="err" role="alert">{err}</div>
        <button type="button" className="btn" onClick={save}>Register customer</button>
      </div>
    </>
  );
}
