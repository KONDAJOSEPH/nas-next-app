/*
 * REPORTS PDF: STARTER (your job: finish it, see INSTRUCTIONS.md, part 4)
 * `buildReport(data)` collects the numbers. `downloadReportPdf(report)` must make the PDF file.
 * Install first:  npm install jspdf jspdf-autotable
 */
import { all } from './db';
import { floatNow } from './ledger';
import { round2 } from './utils';

// Numbers for a date range (from/to are timestamps in milliseconds).
export async function buildReport(from, to) {
  const [t, c, k, f] = await Promise.all([all('transfers'), all('customers'), all('cases'), floatNow()]);
  const inRange = ts => ts >= from && ts <= to;
  const sent = t.filter(x => inRange(x.createdAt));
  const paid = t.filter(x => x.paid && inRange(x.paid.at));
  const sum = (l, key) => round2(l.reduce((a, x) => a + (key(x) || 0), 0));
  return {
    from, to, sent, paid,
    totals: { sentCount: sent.length, sentAmount: sum(sent, x => x.amount), fees: sum(sent, x => x.fee), paidCount: paid.length, paidAmount: sum(paid, x => x.paid.amount) },
    customers: c.filter(x => inRange(x.createdAt)).length,
    openCases: k.filter(x => x.status === 'Open').length,
    float: f.float, commission: f.comm,
  };
}

export async function downloadReportPdf(report) {
  // TODO: replace this with the real PDF. INSTRUCTIONS.md, part 4, has the code to paste here.
  throw new Error('PDF export is not finished yet. Follow INSTRUCTIONS.md, part 4.');
}
