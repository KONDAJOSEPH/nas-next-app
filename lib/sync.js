import { all, put } from './db';
import { API_URL } from './config';

// Everything on the device that the server has not received yet.
export async function gather() {
  const [t, c, l, k] = await Promise.all([all('transfers'), all('customers'), all('ledger'), all('cases')]);
  const it = [];
  t.forEach(x => {
    if (x.sync !== 'synced') it.push({ k: 'send', rec: x, amt: x.amount, label: `Send ${x.receiptId}`, store: 'transfers' });
    if (x.paid && !x.paid.synced) it.push({ k: 'pay', rec: x, amt: x.paid.amount, label: `Cash-out ${x.receiptId}`, store: 'transfers' });
  });
  c.forEach(x => { if (x.sync !== 'synced') it.push({ k: 'cust', rec: x, amt: 0, label: `Customer ${x.fullName}`, store: 'customers' }); });
  k.forEach(x => { if (x.sync !== 'synced') it.push({ k: 'case', rec: x, amt: 0, label: `Case #${x.code}`, store: 'cases' }); });
  l.forEach(x => { if (!x.synced) it.push({ k: 'led', rec: x, amt: 0, label: `Float entry ${x.ref || ''}`, store: 'ledger' }); });
  return it;
}

// TODO (backend step): the real call. With NEXT_PUBLIC_API_URL empty it only simulates the Juba server.
async function sendToServer(item) {
  if (!API_URL) return new Promise(r => setTimeout(r, 70));
  const r = await fetch(`${API_URL}/api/sync/${item.k}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.rec) });
  if (!r.ok) throw new Error('Server refused the record');
}

export async function pushItem(item) {
  await sendToServer(item);
  const r = item.rec;
  if (item.k === 'pay') r.paid.synced = true; else if (item.k === 'led') r.synced = true; else r.sync = 'synced';
  await put(item.store, r);
}

// Queued SMS (simulated) are marked sent once the internet is back.
export async function flushSms() {
  const q = (await all('transfers')).filter(t => t.smsStatus === 'queued');
  for (const t of q) { t.smsStatus = 'sent'; await put('transfers', t); }
  return q.length;
}
