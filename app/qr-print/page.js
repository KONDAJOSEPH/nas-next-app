'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { all } from '@/lib/db';
import { useData } from '@/lib/hooks';
import { money, placeName } from '@/lib/utils';

/*
 * QR PRINT: STARTER PAGE (your job: finish it, see INSTRUCTIONS.md, part 3)
 * Works now: pick a transfer, see its label, press Print.
 * TODO 1: print only the label (the CSS for this is already in globals.css: .noprint is hidden when printing).
 * TODO 2: label sizes (58 mm thermal paper, A6, A4 sheet of 8 labels).
 * TODO 3: print many receipts at once (tick several rows, then print).
 * TODO 4: add a "Reprint" counter and save it with the transfer.
 */
export default function QrPrint() {
  const [list] = useData(() => all('transfers'));
  const [sel, setSel] = useState(null);
  const rows = [...(list || [])].sort((a, b) => b.createdAt - a.createdAt);
  const t = rows.find(x => x.id === sel) || rows[0];
  return (
    <>
      <div className="noprint"><h1 className="pt">QR Print</h1><p className="sub">Print the receipt QR for a transfer</p></div>
      <div className="g2">
        <div className="panel noprint"><h3>Transfers</h3>
          {rows.length ? rows.map(x => (
            <div key={x.id} className="row" style={{ cursor: 'pointer', fontWeight: x.id === t?.id ? 800 : 400 }} onClick={() => setSel(x.id)}>
              <div className="rt">{x.receiptId}<small>{x.from} → {x.to} • {money(x.amount)}</small></div>
            </div>
          )) : <div className="empty">No transfers yet. Send money first.</div>}
        </div>
        <div>
          {t && (
            <div className="rcpt" style={{ margin: '0 auto' }}>
              <b>Nas Transaction Company</b>
              <div className="qr" style={{ marginTop: 8 }}><QRCodeSVG value={t.payload} size={180} level="M" includeMargin /></div>
              <div className="rid">{t.receiptId}</div>
              <div className="rl"><span>Receiver</span><span>{t.to}</span></div>
              <div className="rl"><span>Amount</span><span>{money(t.amount)}</span></div>
              <div className="rl"><span>Place</span><span>{placeName(t.place)}</span></div>
              <button type="button" className="btn full noprint" onClick={() => window.print()}>Print</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
