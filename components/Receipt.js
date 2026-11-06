'use client';
import { QRCodeSVG } from 'qrcode.react';
import { money, smsTexts } from '@/lib/utils';

const Rl = ({ a, b }) => <div className="rl"><span>{a}</span><span>{b}</span></div>;

// The transfer receipt with its QR code. `t` is a record from the 'transfers' store.
export default function Receipt({ t, children }) {
  const s = smsTexts(t);
  return (
    <div className="rcpt">
      <div className="qr"><QRCodeSVG value={t.payload} size={180} level="M" includeMargin /></div>
      <div className="rid">{t.receiptId}</div>
      <Rl a="Date" b={new Date(t.createdAt).toLocaleString()} />
      <Rl a="Sender" b={`${t.fromName ? t.fromName + ' ' : ''}${t.from}`} />
      <Rl a="Receiver" b={t.to} />
      <Rl a="Amount" b={money(t.amount)} />
      <Rl a="Fee (5%)" b={money(t.fee)} />
      <Rl a="Total paid" b={money(t.total)} />
      <div className="smsh">SMS simulation • {t.smsStatus === 'queued' ? 'Offline, queued to send when back online' : 'Sent'}</div>
      <div className="sms"><b>To {t.from}</b><br />{s[0]}</div>
      <div className="sms"><b>To {t.to}</b><br />{s[1]}</div>
      {children}
    </div>
  );
}
