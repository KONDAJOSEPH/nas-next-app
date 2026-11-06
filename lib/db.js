// On-device database (IndexedDB). Same tables as database/nas_local_sqlite.sql.
const NAME = 'nas_db', VERSION = 1, STORES = ['customers', 'transfers', 'ledger', 'cases'];
let opened;
function open() {
  if (!opened) opened = new Promise((res, rej) => {
    const r = indexedDB.open(NAME, VERSION);
    r.onupgradeneeded = () => STORES.forEach(s => { if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: 'id' }); });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return opened;
}
export async function all(store) {
  const d = await open();
  return new Promise((res, rej) => { const q = d.transaction(store).objectStore(store).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); });
}
export async function put(store, obj) {
  const d = await open();
  return new Promise((res, rej) => { const t = d.transaction(store, 'readwrite'); t.objectStore(store).put(obj); t.oncomplete = () => res(obj); t.onerror = () => rej(t.error); });
}
export const putMany = (store, list) => Promise.all(list.map(o => put(store, o)));
