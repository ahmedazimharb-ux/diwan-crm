# Diwan — Real Estate Brokerage CRM (prototype)

A working front-end prototype of a real estate brokerage CRM (leads, pipeline,
inventory, WhatsApp inbox, offer generator, efficiency/attendance,
automation rules, AI lead insights). Data is stored in the browser's
`localStorage`, so each visitor gets their own local demo data — this is a
prototype, not a multi-user production backend (see "Going to production"
below).

## What's new in this update

Six gaps compared to competitor CRMs (spotted from a SaleMate ad) have been closed:

1. **AI lead prioritization + AI project descriptions** — a "Prioritize with AI"
   button on the Leads page scores and re-sorts every active lead in one AI call;
   a "Generate description with AI" button on each Inventory unit writes an
   Arabic marketing paragraph for that project.
2. **Real WhatsApp sending** — every WhatsApp button (lead quick action, AI
   draft, offer PDF) now opens `wa.me` with the lead's actual stored phone
   number and a prefilled message, instead of just logging a fake "sent" entry.
3. **Automatic PDF for the unit sent to a client** — generating an offer in the
   Offers tab automatically builds and downloads a branded PDF (via jsPDF) with
   pricing, payment plan and the AI-written project description; every past
   offer has "Download PDF" / "Send via WhatsApp" buttons.
4. **Bulk CSV import** — a shared import dialog (with downloadable template)
   works identically for Leads and Inventory.
5. **Lead sharing / activity timeline between reps** — a "Share lead" button in
   the lead drawer logs who a lead was shared with and why, visible in the
   Activity Timeline with an icon per event type.
6. **Working "Call now" reminders** — every reminder/action and quick-call
   button uses a real `tel:` link to the lead's stored number instead of static
   text.

## Run locally

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Deploy on GitHub + Vercel (free)

**1. Push to GitHub**

```bash
cd diwan-crm
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repository on [github.com/new](https://github.com/new)
(don't add a README there), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

**2. Import into Vercel**

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Click **Import** next to your repository.
3. Vercel auto-detects Vite — leave the defaults (Build Command:
   `npm run build`, Output Directory: `dist`).
4. Click **Deploy**. You'll get a live URL like `diwan-crm.vercel.app`
   in about a minute.

Every push to `main` after that redeploys automatically.

**3. Enable the AI features (lead prioritization, AI descriptions, AI insights)**

The "Analyze with AI", "Prioritize with AI" and "Generate description with AI"
buttons all call `/api/analyze-lead`, a serverless function already included
in `api/analyze-lead.js`. To make them work:

1. In Vercel → your project → **Settings → Environment Variables**, add
   `ANTHROPIC_API_KEY` with a key from [console.anthropic.com](https://console.anthropic.com).
2. Redeploy.

Without this, every other part of the app works fine — the AI features will
just show a friendly "couldn't reach the AI service" message.

## Going to production (multi-user, real database)

This prototype is intentionally self-contained (no backend, no auth) so you
can see and deploy it in minutes. For a real multi-tenant brokerage CRM
you'll want to swap `localStorage` for a real API + database — ask for the
full Prisma/Postgres/Next.js version of this project when you're ready, it
follows the same data shapes used here (leads, units, conversations, offers,
automation rules).

## Tech

- React 18 + Vite
- Tailwind CSS
- Recharts (charts)
- lucide-react (icons)
- jsPDF (client-side PDF generation for offers)

