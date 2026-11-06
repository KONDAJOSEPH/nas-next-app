import { PLACES, CURRENCY } from './config';
export const money = n => `${CURRENCY} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const sspm = n => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${CURRENCY}`;
export const round2 = n => Math.round(n * 100) / 100;
export const cleanPhone = s => (s || '').replace(/[ -]/g, '');
export const normPhone = s => cleanPhone(s).replace(/^\+/, '');
export const validPhone = s => /^\+?[0-9]{9,15}$/.test(s);
export const placeName = v => (PLACES.find(p => p[0] === v) || [v, v])[1];
export const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `x${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
// Receipt ID format. Change it here if you want NAS-TRAN-001 instead.
export const makeReceiptId = (seq, place, year) => `NAS-${String(seq).padStart(3, '0')}-${place}-${year}`;
export const fmtMB = n => (n > 1073741824 ? `${(n / 1073741824).toFixed(1)} GB` : `${Math.round(n / 1048576)} MB`);
export const smsTexts = t => [
  `NAS ${t.receiptId}: You sent ${money(t.amount)} to ${t.to}. Fee ${money(t.fee)}. Total ${money(t.total)}.`,
  `NAS: You received ${money(t.amount)} from ${t.from}. Ref ${t.receiptId}. Show this ref to a Nas agent to collect.`,
];
// Shrinks a photo so it is light enough to store and sync.
export function shrink(file, max) {
  return new Promise(res => {
    const im = new Image(), u = URL.createObjectURL(file);
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', 0.8));
    };
    im.onerror = () => { URL.revokeObjectURL(u); res(''); };
    im.src = u;
  });
}
