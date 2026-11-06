'use client';
import { useEffect, useState } from 'react';
import { buildReport, downloadReportPdf } from '@/lib/reportPdf';
import { money, sspm } from '@/lib/utils';
import { useApp } from '@/components/AppContext';

const day = d => d.toISOString().slice(0, 10);

/* REPORTS: STARTER PAGE. The numbers work. The PDF button needs you to finish lib/reportPdf.js (INSTRUCTIONS.md, part 4). */
export default function Reports() {
  const { toast } = useApp();
  const [from, setFrom] = useState(day(new Date())), [to, setTo] = useState(day(new Date())), [r, setR] = useState(null);
  useEffect(() => {
    buildReport(new Date(from + 'T00:00:00').getTime(), new Date(to + 'T23:59:59').getTime()).then(setR);
  }, [from, to]);
  async function pdf() { try { await downloadReportPdf(r); } catch (e) { toast(e.message); } }
  return (
    <>
      <h1 className="pt">Reports</h1>
      <p className="sub">Totals for a date range, with a PDF download</p>
      <div className="panel formcard">
        <div className="two"><div><label htmlFor="f">From</label><input id="f" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div><div><label htmlFor="t">To</label><input id="t" type="date" value={to} onChange={e => setTo(e.target.value)} /></div></div>
        {r && (
          <div className="calc">
            <div><span>Transfers sent</span><span>{r.totals.sentCount}</span></div>
            <div><span>Amount sent</span><span>{money(r.totals.sentAmount)}</span></div>
            <div><span>Fees collected</span><span>{money(r.totals.fees)}</span></div>
            <div><span>Cash-outs paid</span><span>{r.totals.paidCount} • {money(r.totals.paidAmount)}</span></div>
            <div><span>New customers</span><span>{r.customers}</span></div>
            <div><span>Open cases now</span><span>{r.openCases}</span></div>
            <div className="tot"><span>Float now</span><span>{sspm(r.float)}</span></div>
            <div><span>Commission now</span><span>{sspm(r.commission)}</span></div>
          </div>
        )}
        <div className="btns"><button type="button" className="btn" disabled={!r} onClick={pdf}>Download PDF</button></div>
      </div>
    </>
  );
}
