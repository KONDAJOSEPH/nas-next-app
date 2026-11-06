import { all, put } from './db';
import { OPEN_FLOAT, OPEN_COMM } from './config';
import { round2 } from './utils';
// Float and commission = opening balance + every ledger entry.
export async function floatNow() {
  const list = await all('ledger'); let f = OPEN_FLOAT, c = OPEN_COMM;
  list.forEach(e => { f += e.float; c += e.comm; });
  return { float: round2(f), comm: round2(c), list };
}
export const addLedger = e => put('ledger', e);
