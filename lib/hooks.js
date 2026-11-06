import { useEffect, useState } from 'react';
// Loads data once, and again whenever you call reload().
export function useData(loader, deps = []) {
  const [data, setData] = useState(null), [n, setN] = useState(0);
  useEffect(() => { let ok = true; loader().then(v => ok && setData(v)).catch(() => ok && setData(undefined)); return () => { ok = false; }; }, [...deps, n]); // eslint-disable-line
  return [data, () => setN(x => x + 1)];
}
