# Nas Transaction Company: agent app (Next.js)

Offline-first agent banking and case management. Customers, send money with QR receipts, cash-out, float,
cases, sync and alerts all work without internet. Data is kept on the device (IndexedDB).

Finished: Login, Overview, Register, Customers, Send Money, Transfers, Cash Out, My Float, Cases, Sync, Alerts, Offline.
Yours to finish: **QR Print** and **Reports (PDF)**. Read INSTRUCTIONS.md.

Quick start:  `npm install`  then  `npm run dev`  then open http://localhost:3000
Demo logins:  admin / admin123   and   agent / agent123   (replace with real server login later)

Folders
- app/            one folder per page (each has a page.js). app/layout.js is the frame around every page.
- components/     shared pieces: Shell.js (the horizontal header), AppContext.js, Pad.js, Capture.js, Receipt.js
- lib/            config.js (all settings), db.js (device database), ledger.js (float), sync.js (sync), utils.js, reportPdf.js
- public/         manifest, service worker (sw.js), icons
- database/       SQL scripts: SQLite (device) and SQL Server (Juba)
