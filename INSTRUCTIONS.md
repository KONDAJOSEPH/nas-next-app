# How to finish the project in VS Code

## 1. Set up (once)
1. Install **Node.js 20 LTS** (https://nodejs.org) and **VS Code** (https://code.visualstudio.com).
2. Unzip `nas-next-app.zip`. In VS Code choose **File > Open Folder** and pick the `nas-next-app` folder.
   Accept the pop-up to install the recommended extensions.
3. Open the terminal in VS Code: **Terminal > New Terminal**. Run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 in Chrome. Sign in with `admin / admin123`.
   Every time you save a file, the page updates by itself.

Tip: press F12 in Chrome, open **Application**, and you can look at the data under IndexedDB > nas_db,
and switch to **Network > Offline** to test without internet.

## 2. How the project is organised
- To change what a page shows, edit `app/<page name>/page.js`.
- To add a page: make a folder in `app/`, add `page.js`, then add one line to `NAV` in `lib/config.js`
  so it appears in the horizontal header.
- Settings (fee 5%, commission share, low-float level, places, currency) are all in `lib/config.js`.
- Colours and layout are in `app/globals.css`.

## 3. Finish QR Print  (`app/qr-print/page.js`)
It already shows a transfer's QR label and has a Print button. Finish these:

**a) Print only the label.** The CSS already hides the header and anything with the class `noprint`.
The list on the left and the heading have `noprint`. Test it: choose a transfer, press Print, and the
print preview should show only the label. If something else still prints, add `className="noprint"` to it.

**b) Label sizes.** Add this to the bottom of `app/globals.css`, then wrap the label in
`<div className="label58">` (for a 58 mm thermal printer):
```css
@media print {
  @page { size: 58mm auto; margin: 2mm; }
  .label58 .rcpt { box-shadow: none; max-width: none; padding: 0; }
  .label58 .qr svg { width: 40mm !important; height: 40mm !important; }
}
```
For A4 sheets, use `@page { size: A4; margin: 10mm; }` and show a grid of labels (`display:grid; grid-template-columns: repeat(2, 1fr)`).

**c) Print several at once.** Add `const [picked, setPicked] = useState([])`, a checkbox on every row,
and render one label per picked transfer inside a `.label58` wrapper. Each label needs
`style={{ pageBreakAfter: 'always' }}`. Then `window.print()` prints them all.

**d) Reprints.** When Print is pressed, save `reprints: (t.reprints || 0) + 1` with
`put('transfers', {...t, reprints})` (import `put` from `@/lib/db`).

## 4. Finish Reports PDF  (`lib/reportPdf.js`)
The page `app/reports/page.js` already calculates the totals. Only the PDF is missing.

1. Stop the server (Ctrl+C) and run: `npm install jspdf jspdf-autotable`
2. In `lib/reportPdf.js`, add this import at the top:
   ```js
   import { jsPDF } from 'jspdf';
   import autoTable from 'jspdf-autotable';
   import { money, placeName } from './utils';
   ```
3. Replace the whole `downloadReportPdf` function with:
   ```js
   export async function downloadReportPdf(r) {
     const doc = new jsPDF();
     doc.setFontSize(16); doc.text('Nas Transaction Company', 14, 16);
     doc.setFontSize(11);
     doc.text(`Agent report: ${new Date(r.from).toLocaleDateString()} to ${new Date(r.to).toLocaleDateString()}`, 14, 24);
     autoTable(doc, {
       startY: 30, head: [['Item', 'Value']],
       body: [
         ['Transfers sent', r.totals.sentCount], ['Amount sent', money(r.totals.sentAmount)], ['Fees collected', money(r.totals.fees)],
         ['Cash-outs paid', `${r.totals.paidCount} (${money(r.totals.paidAmount)})`], ['New customers', r.customers],
         ['Open cases', r.openCases], ['Float now', money(r.float)], ['Commission now', money(r.commission)],
       ],
     });
     autoTable(doc, {
       startY: doc.lastAutoTable.finalY + 10, head: [['Receipt', 'Place', 'From', 'To', 'Amount', 'Fee']],
       body: r.sent.map(t => [t.receiptId, placeName(t.place), t.from, t.to, money(t.amount), money(t.fee)]),
     });
     doc.save(`nas-report-${new Date(r.from).toISOString().slice(0, 10)}.pdf`);
   }
   ```
4. Run `npm run dev` again, open **Reports**, choose dates, press **Download PDF**.

Ideas to add after: a logo (`doc.addImage`), page numbers, a signature line, a per-place summary,
and a "Cash-outs" table from `r.paid`.

## 5. Build and host (so phones can use it offline)
1. `npm run build` creates the folder `out/`.
2. Copy everything inside `out/` to your IIS site (the same server as ASP.NET MVC5, in its own folder or site root).
   The site must use **HTTPS**. In IIS add the MIME type `.webmanifest` = `application/manifest+json`.
3. On each phone: open the site in Chrome **once with internet**, wait 10 seconds, then reload.
   Open **Offline** in the app: "App saved for offline" should say Ready. Install the app (Chrome menu) and tap "Protect my data".
4. When you publish a new version, change `V` in `public/sw.js` (for example `nas-next-v2`) so phones fetch the update.

## 6. Connect the real server (after QR Print and Reports)
- Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to your server address.
- `lib/sync.js` then posts each record to `/api/sync/<type>` (send, pay, cust, case, led).
  Build those endpoints in ASP.NET MVC5 (Web API 2) using database/nas_server_sqlserver.sql.
  Rules the server must keep: ignore a record it already has (same `id`), and refuse a second cash-out of the same receipt.
- Replace the demo `USERS` in `lib/config.js` with a login call to the server.
- Server-sent alerts (head office tops up float while the phone is closed) need Web Push; `public/sw.js` already has the receiving handler.

## If something goes wrong
- Red error page: read the first line, it names the file and line to fix.
- `npm install` fails: check internet, delete the `node_modules` folder, run it again.
- The app looks old after changes in production: change `V` in `public/sw.js`.
- Data seems gone: the browser data was cleared. Restore from a backup file on the **Offline** page.
