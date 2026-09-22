import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutGrid, Users, KanbanSquare, Building2, Search, Plus, Phone,
  MessageCircle, Clock, Flame, Snowflake, ThermometerSun, X, ChevronRight,
  CheckCircle2, Circle, Bell, Filter, MapPin, BedDouble, Banknote,
  CalendarClock, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight,
  StickyNote, History, ListChecks, SlidersHorizontal, Loader2, Send,
  FileText, Zap, ToggleLeft, ToggleRight, UserCheck, LogIn, LogOut,
  Wand2, Copy, Check, Paperclip, ChevronDown, Share2, Upload, Download,
  FileDown, ArrowUpDown, PhoneCall, Users2, RefreshCw, Info,
} from "lucide-react";
import { jsPDF } from "jspdf";

/* ---------------------------------------------------------------
   DIWAN — Real Estate Brokerage CRM (working prototype)
   Palette: Ink navy / warm paper / gold accent / sage / coral
----------------------------------------------------------------*/

const C = {
  ink: "#14213D",
  inkSoft: "#1F2E52",
  paper: "#F7F5F1",
  card: "#FFFFFF",
  gold: "#C9A227",
  goldSoft: "#F1E4B8",
  sage: "#5C8368",
  sageSoft: "#E1EBE2",
  coral: "#D9694F",
  coralSoft: "#F6E2DB",
  slate: "#6B7280",
  line: "#E7E2D6",
  ink10: "#EEF0F6",
};

const STAGES = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "APPOINTMENT", label: "Appointment" },
  { key: "NEGOTIATION", label: "Negotiation" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

const TEMP_STYLE = {
  HOT: { bg: C.coralSoft, fg: C.coral, icon: Flame, label: "Hot" },
  WARM: { bg: C.goldSoft, fg: "#946E0C", icon: ThermometerSun, label: "Warm" },
  COLD: { bg: C.ink10, fg: C.slate, icon: Snowflake, label: "Cold" },
};

const TIMELINE_ICON = {
  created: { icon: Sparkles, bg: "#EEF0F6", fg: "#14213D" },
  assign: { icon: UserCheck, bg: "#EEF0F6", fg: "#14213D" },
  share: { icon: Share2, bg: "#E4ECF7", fg: "#2C4E80" },
  whatsapp: { icon: MessageCircle, bg: "#E1EBE2", fg: "#5C8368" },
  call: { icon: PhoneCall, bg: "#F1E4B8", fg: "#946E0C" },
  status: { icon: RefreshCw, bg: "#EEF0F6", fg: "#14213D" },
  note: { icon: StickyNote, bg: "#F1E4B8", fg: "#946E0C" },
  action: { icon: ListChecks, bg: "#EEF0F6", fg: "#14213D" },
  ai: { icon: Wand2, bg: "#F1E4B8", fg: "#946E0C" },
  default: { icon: Clock, bg: "#EEF0F6", fg: "#6B7280" },
};

const AGENTS = ["Mona Adel", "Youssef Karim", "Hana Fathy", "Omar Reda"];
const PROJECTS = ["Aliva — Mountain View", "Zed East", "Sodic East", "Marassi North Coast", "Il Bosco"];
const SOURCES = ["Facebook", "Instagram", "Google", "Referral", "Walk-in", "Website"];

const now = () => Date.now();
const hoursAgo = (h) => now() - h * 3600 * 1000;
const fmtTime = (ts) => {
  const diffH = Math.round((now() - ts) / 3600000);
  if (diffH < 1) return "less than an hour ago";
  if (diffH < 24) return `${diffH}h ago`;
  const d = Math.round(diffH / 24);
  return `${d}d ago`;
};
const fmtClock = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtMoney = (n) => `EGP ${Number(n).toLocaleString()}`;
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------- real WhatsApp send ----------------
   Builds a wa.me deep link from the lead's stored phone number and opens
   it in a new tab — this is what actually hands the message off to
   WhatsApp (web or the installed app) instead of just logging a fake
   "sent" entry. Works with no backend / no WhatsApp Business API key. */
function toWaDigits(phone) {
  let d = String(phone || "").replace(/[^\d+]/g, "");
  d = d.replace(/^00/, "+");
  if (!d.startsWith("+")) {
    // Egyptian local numbers (01xxxxxxxxx) -> country code 20, drop leading 0
    if (d.startsWith("0")) d = "20" + d.slice(1);
    else if (!d.startsWith("20")) d = "20" + d;
  } else {
    d = d.slice(1);
  }
  return d.replace(/\D/g, "");
}
function openWhatsApp(phone, text) {
  const digits = toWaDigits(phone);
  const url = `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}
function callNow(phone) {
  window.location.href = `tel:${String(phone || "").replace(/\s+/g, "")}`;
}

/* ---------------- tiny CSV helpers (bulk import) ---------------- */
function parseCSV(raw) {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return { headers: [], rows: [] };
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const splitLine = (line) => {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}
function downloadTextFile(filename, content, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------- real PDF generation (unit offer / brochure) ----------------
   Client-side PDF via jsPDF — produces an actual .pdf file for the unit
   being sent to the client, generated automatically the moment an offer
   is built (no manual "design a PDF" step). */
function buildOfferPdf(offer, unit) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const ink = "#14213D", gold = "#C9A227", slate = "#6B7280";

  doc.setFillColor(ink);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DIWAN", 40, 45);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Brokerage CRM — Unit Offer", 40, 64);
  doc.setTextColor(gold);
  doc.setFontSize(9);
  doc.text(new Date(offer.createdAt).toLocaleDateString(), pageW - 40, 64, { align: "right" });

  let y = 130;
  doc.setTextColor(ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Prepared for ${offer.leadName}`, 40, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(slate);
  doc.text(`Prepared by ${offer.agent} · Diwan Brokerage`, 40, y);

  y += 34;
  doc.setDrawColor("#E7E2D6");
  doc.line(40, y, pageW - 40, y);
  y += 30;

  const rows = [
    ["Project", offer.project],
    ["Unit type", `${offer.unitType} · ${offer.bedrooms} BR`],
    unit ? ["Location", unit.location] : null,
    unit ? ["Delivery", unit.delivery] : null,
    ["List price", fmtMoney(offer.price)],
    offer.discount > 0 ? ["Discount", `${offer.discount}%`] : null,
    ["Final price", fmtMoney(Math.round(offer.discounted))],
    ["Down payment", `${fmtMoney(Math.round(offer.down))} (${offer.downPct}%)`],
    ["Installment plan", `${fmtMoney(Math.round(offer.monthly))} / month · ${offer.years * 12} months`],
  ].filter(Boolean);

  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slate);
    doc.text(label, 40, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(ink);
    doc.text(String(value), pageW - 40, y, { align: "right" });
    y += 24;
  });

  if (unit?.aiDescription) {
    y += 14;
    doc.setDrawColor("#E7E2D6");
    doc.line(40, y, pageW - 40, y);
    y += 26;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(ink);
    doc.setFontSize(12);
    doc.text("About the project", 40, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(slate);
    const lines = doc.splitTextToSize(unit.aiDescription, pageW - 80);
    doc.text(lines, 40, y);
    y += lines.length * 14;
  }

  y = Math.max(y + 30, 740);
  doc.setDrawColor("#E7E2D6");
  doc.line(40, y, pageW - 40, y);
  y += 18;
  doc.setFontSize(9);
  doc.setTextColor(slate);
  doc.text("Valid for 7 days from the date above · Diwan Brokerage CRM", 40, y);

  return doc;
}
function offerFileName(offer) {
  return `Diwan-Offer-${offer.leadName.replace(/\s+/g, "-")}-${offer.project.split(" ")[0]}.pdf`;
}

function seedLeads() {
  const names = [
    "Ahmed Hassan", "Sara Ibrahim", "Karim Nabil", "Laila Mostafa", "Tarek Aziz",
    "Nour El Din", "Dina Samir", "Mohamed Adel", "Rania Fouad", "Youssef Amin",
    "Salma Kamal", "Hassan Fathy", "Mariam Khaled", "Amr Wagdy", "Farida Sami",
  ];
  return names.map((name, i) => {
    const stage = STAGES[i % STAGES.length].key;
    const temp = i % 5 === 0 ? "HOT" : i % 3 === 0 ? "WARM" : "COLD";
    const created = hoursAgo(24 * (i + 1));
    return {
      id: uid(),
      name,
      phone: `+2010${(10000000 + i * 137).toString().slice(0, 8)}`,
      project: PROJECTS[i % PROJECTS.length],
      source: SOURCES[i % SOURCES.length],
      budgetMin: 4000000 + i * 250000,
      budgetMax: 6000000 + i * 300000,
      agent: AGENTS[i % AGENTS.length],
      status: stage,
      temperature: temp,
      score: temp === "HOT" ? 78 + (i % 20) : temp === "WARM" ? 45 + (i % 20) : 12 + (i % 20),
      createdAt: created,
      nextFollowUp: hoursAgo(-((i % 4) + 1) * 6),
      notes: i % 2 === 0 ? [{ id: uid(), text: "Client prefers sea view, flexible on delivery date.", time: hoursAgo(20) }] : [],
      aiInsight: null,
      sharedWith: i % 4 === 0 ? [AGENTS[(i + 1) % AGENTS.length]] : [],
      timeline: [
        { id: uid(), type: "created", text: "Lead created from " + SOURCES[i % SOURCES.length], time: created },
        { id: uid(), type: "assign", text: `Assigned to ${AGENTS[i % AGENTS.length]}`, time: created + 1000 * 60 * 10 },
        ...(i % 4 === 0 ? [{ id: uid(), type: "share", text: `Shared with ${AGENTS[(i + 1) % AGENTS.length]} for backup follow-up`, time: hoursAgo(15) }] : []),
        ...(i % 2 === 0 ? [{ id: uid(), type: "whatsapp", text: "WhatsApp message sent — intro & brochure", time: hoursAgo(18) }] : []),
        ...(i % 3 === 0 ? [{ id: uid(), type: "call", text: "Call made — discussed budget & timeline", time: hoursAgo(10) }] : []),
      ],
      actions: [
        { id: uid(), text: "Call now to confirm budget", done: i % 4 === 0, due: hoursAgo(-3) },
        { id: uid(), text: "Send updated payment plan", done: false, due: hoursAgo(-20) },
      ],
    };
  });
}

function seedInventory() {
  const rows = [
    { project: "Aliva — Mountain View", developer: "Mountain View", location: "New Cairo", type: "Apartment", bedrooms: 3, price: 8600000, down: 10, years: 8, delivery: "2028", status: "AVAILABLE" },
    { project: "Zed East", developer: "Ora Developers", location: "New Cairo", type: "Duplex", bedrooms: 4, price: 12400000, down: 15, years: 7, delivery: "2027", status: "AVAILABLE" },
    { project: "Sodic East", developer: "SODIC", location: "New Heliopolis", type: "Townhouse", bedrooms: 4, price: 15800000, down: 10, years: 8, delivery: "2029", status: "RESERVED" },
    { project: "Marassi North Coast", developer: "Emaar", location: "North Coast", type: "Chalet", bedrooms: 2, price: 6200000, down: 20, years: 6, delivery: "2026", status: "AVAILABLE" },
    { project: "Il Bosco", developer: "Misr Italia", location: "New Capital", type: "Apartment", bedrooms: 2, price: 4900000, down: 10, years: 9, delivery: "2027", status: "AVAILABLE" },
    { project: "Zed East", developer: "Ora Developers", location: "New Cairo", type: "Apartment", bedrooms: 2, price: 7100000, down: 10, years: 8, delivery: "2027", status: "SOLD" },
    { project: "Aliva — Mountain View", developer: "Mountain View", location: "New Cairo", type: "Villa", bedrooms: 5, price: 22000000, down: 15, years: 6, delivery: "2028", status: "ON_HOLD" },
    { project: "Il Bosco", developer: "Misr Italia", location: "New Capital", type: "Duplex", bedrooms: 3, price: 9300000, down: 12, years: 8, delivery: "2027", status: "AVAILABLE" },
  ];
  return rows.map((r) => ({ id: uid(), aiDescription: null, ...r }));
}

function seedConversations(leads) {
  const pick = leads.slice(0, 8);
  return pick.map((l, i) => {
    const base = hoursAgo(30 - i * 2);
    const inbound = i % 2 === 0;
    const messages = [
      { id: uid(), from: "agent", text: `Hi ${l.name.split(" ")[0]}, thanks for your interest in ${l.project}! Sending you the brochure now.`, time: base, status: "READ" },
      { id: uid(), from: "lead", text: "Thank you! What's the payment plan like?", time: base + 1000 * 60 * 40, status: "READ" },
      ...(inbound ? [{ id: uid(), from: "lead", text: "Also, is a site visit possible this weekend?", time: base + 1000 * 60 * 90, status: "DELIVERED" }] : []),
    ];
    return {
      id: uid(),
      leadId: l.id,
      name: l.name,
      phone: l.phone,
      lastMessage: messages[messages.length - 1].text,
      lastTime: messages[messages.length - 1].time,
      unread: inbound ? 1 : 0,
      messages,
    };
  });
}

function seedAutomationRules() {
  return [
    { id: uid(), name: "Assign new Facebook leads", trigger: "Lead Created", condition: "Source = Facebook", action: "Assign to next available agent", enabled: true },
    { id: uid(), name: "Escalate hot leads", trigger: "Lead Becomes Hot", condition: "Score ≥ 70", action: "Notify Sales Manager + Create urgent task", enabled: true },
    { id: uid(), name: "No response follow-up", trigger: "No Response 48h", condition: "Status = Contacted", action: "Send WhatsApp reminder template", enabled: true },
    { id: uid(), name: "Appointment reminder", trigger: "Appointment Tomorrow", condition: "—", action: "Send WhatsApp + notify agent", enabled: false },
    { id: uid(), name: "Big budget priority", trigger: "Lead Created", condition: "Budget > 10,000,000 EGP", action: "Assign to senior agent + set HOT", enabled: true },
  ];
}

function seedAttendance() {
  return AGENTS.map((name, i) => ({
    id: uid(), name,
    signIn: hoursAgo(9 - i * 0.3) - (now() % (3600 * 1000)),
    signOut: i === 1 ? null : hoursAgo(0.5),
    leadsHandled: 12 + i * 4,
    dealsWon: 2 + (i % 3),
    conversion: (18 + i * 5),
  }));
}

/* ---------------- storage helpers ----------------
   Standalone build: persists to the browser's localStorage instead of
   the Claude-artifact window.storage API. Swap this out for a real
   backend (Postgres/Prisma API route) when you're ready for multi-user data. */
async function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ---------------- AI helper ----------------
   Standalone build: calls your own backend endpoint (see /api/analyze-lead
   in the README) instead of the Anthropic API directly, so your API key
   is never exposed in the browser. Returns the raw model text. */
async function callAI(prompt) {
  const response = await fetch("/api/analyze-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  return data.text || "";
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

/* ---------------- small UI atoms ---------------- */
function Badge({ children, bg, fg }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: fg }}
    >
      {children}
    </span>
  );
}

function StageBadge({ status }) {
  const map = {
    NEW: [C.ink10, C.ink], CONTACTED: [C.goldSoft, "#946E0C"], QUALIFIED: [C.sageSoft, C.sage],
    APPOINTMENT: ["#E4ECF7", "#2C4E80"], NEGOTIATION: [C.coralSoft, C.coral],
    WON: [C.sageSoft, C.sage], LOST: ["#F1F1F1", "#8A8A8A"],
  };
  const [bg, fg] = map[status] || [C.ink10, C.ink];
  return <Badge bg={bg} fg={fg}>{STAGES.find((s) => s.key === status)?.label || status}</Badge>;
}

function TempBadge({ temp }) {
  const t = TEMP_STYLE[temp];
  const Icon = t.icon;
  return <Badge bg={t.bg} fg={t.fg}><Icon size={12} />{t.label}</Badge>;
}

function KpiCard({ label, value, sub, trend, icon: Icon }) {
  const up = trend >= 0;
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 border" style={{ background: C.card, borderColor: C.line }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: C.slate }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.ink10 }}>
          <Icon size={16} style={{ color: C.ink }} />
        </div>
      </div>
      <div className="text-2xl font-semibold font-display" style={{ color: C.ink }}>{value}</div>
      {sub && (
        <div className="flex items-center gap-1 text-xs" style={{ color: up ? C.sage : C.coral }}>
          {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {sub}
        </div>
      )}
    </div>
  );
}

/* ---------------- Notifications ---------------- */
function useNotifications(leads) {
  return useMemo(() => {
    const items = [];
    leads.forEach((l) => {
      l.actions.filter((a) => !a.done && a.due < now()).forEach((a) => {
        items.push({ id: a.id, text: `${a.text} — ${l.name}`, time: a.due, kind: "overdue" });
      });
      if (l.temperature === "HOT") {
        items.push({ id: l.id + "-hot", text: `${l.name} is a hot lead — respond fast`, time: l.createdAt, kind: "hot" });
      }
    });
    return items.sort((a, b) => b.time - a.time).slice(0, 12);
  }, [leads]);
}

function NotificationBell({ leads }) {
  const [open, setOpen] = useState(false);
  const items = useNotifications(leads);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative w-9 h-9 rounded-lg flex items-center justify-center border" style={{ borderColor: C.line, background: C.card }}>
        <Bell size={16} style={{ color: C.ink }} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-medium text-white" style={{ background: C.coral }}>
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border shadow-lg z-30 max-h-96 overflow-y-auto" style={{ background: C.card, borderColor: C.line }}>
          <div className="px-4 py-3 border-b text-sm font-medium" style={{ borderColor: C.line, color: C.ink }}>Notifications</div>
          {items.length === 0 && <div className="p-4 text-sm" style={{ color: C.slate }}>You're all caught up.</div>}
          {items.map((n) => (
            <div key={n.id} className="px-4 py-2.5 border-b text-sm flex gap-2 items-start" style={{ borderColor: C.line }}>
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: n.kind === "overdue" ? C.coral : C.gold }} />
              <div>
                <div style={{ color: C.ink }}>{n.text}</div>
                <div className="text-xs mt-0.5" style={{ color: C.slate }}>{fmtTime(n.time)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ view, setView }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "leads", label: "Leads", icon: Users },
    { key: "pipeline", label: "Pipeline", icon: KanbanSquare },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "inventory", label: "Inventory", icon: Building2 },
    { key: "offers", label: "Offers", icon: FileText },
    { key: "efficiency", label: "Efficiency", icon: UserCheck },
    { key: "automation", label: "Automation", icon: Zap },
  ];
  return (
    <div className="w-56 shrink-0 h-full flex flex-col py-5 px-3 overflow-y-auto" style={{ background: C.ink }}>
      <div className="flex items-center gap-2 px-3 pb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold" style={{ background: C.gold, color: C.ink }}>D</div>
        <div>
          <div className="text-white font-display font-semibold leading-tight">Diwan</div>
          <div className="text-[10px] leading-tight" style={{ color: "#93A0BF" }}>Brokerage CRM</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = view === it.key;
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: active ? "rgba(201,162,39,0.14)" : "transparent",
                color: active ? C.gold : "#C7CEDF",
              }}
            >
              <Icon size={17} />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pt-4 text-[11px]" style={{ color: "#6E7A9B" }}>
        Demo data · stored on this device
      </div>
    </div>
  );
}

function TopBar({ title, subtitle, leads }) {
  return (
    <div className="flex items-center justify-between px-6 pt-6">
      <div>
        <h1 className="text-xl font-display font-semibold" style={{ color: C.ink }}>{title}</h1>
        {subtitle && <p className="text-sm" style={{ color: C.slate }}>{subtitle}</p>}
      </div>
      <NotificationBell leads={leads} />
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ leads }) {
  const total = leads.length;
  const hot = leads.filter((l) => l.temperature === "HOT").length;
  const won = leads.filter((l) => l.status === "WON").length;
  const active = leads.filter((l) => !["WON", "LOST"].includes(l.status)).length;
  const pipelineValue = leads.filter((l) => !["WON", "LOST"].includes(l.status))
    .reduce((s, l) => s + (l.budgetMax || 0), 0);

  const bySource = useMemo(() => {
    const m = {};
    leads.forEach((l) => { m[l.source] = (m[l.source] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const byStage = useMemo(() => STAGES.map((s) => ({
    name: s.label, value: leads.filter((l) => l.status === s.key).length,
  })), [leads]);

  const pieColors = [C.gold, C.sage, C.coral, C.ink, "#8A8FBF", "#B7C7D9"];

  return (
    <div className="flex flex-col gap-6">
      <TopBar title="Good morning 👋" subtitle="Here's how the brokerage is performing today." leads={leads} />
      <div className="px-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Leads" value={total} sub="+12% vs last week" trend={1} icon={Users} />
          <KpiCard label="Hot Leads" value={hot} sub="Needs immediate action" trend={1} icon={Flame} />
          <KpiCard label="Active Deals" value={active} sub="In pipeline" trend={1} icon={KanbanSquare} />
          <KpiCard label="Pipeline Value" value={fmtMoney(pipelineValue).replace("EGP ", "") + " EGP"} sub={`${won} won this month`} trend={1} icon={Banknote} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
            <div className="text-sm font-medium mb-3" style={{ color: C.ink }}>Leads by source</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySource}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill={C.gold} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
            <div className="text-sm font-medium mb-3" style={{ color: C.ink }}>Pipeline by stage</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStage} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {byStage.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Lead Drawer ---------------- */
function LeadDrawer({ lead, onClose, onUpdate, onShare }) {
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => { setTab("overview"); setAiError(null); }, [lead?.id]);

  if (!lead) return null;

  const addTimeline = (type, text) => {
    onUpdate(lead.id, (l) => ({
      ...l,
      timeline: [{ id: uid(), type, text, time: now() }, ...l.timeline],
    }));
  };

  const toggleAction = (actionId) => {
    onUpdate(lead.id, (l) => ({
      ...l,
      actions: l.actions.map((a) => a.id === actionId ? { ...a, done: !a.done } : a),
    }));
    addTimeline("action", "Action updated");
  };

  const submitNote = () => {
    if (!noteText.trim()) return;
    onUpdate(lead.id, (l) => ({
      ...l,
      notes: [{ id: uid(), text: noteText.trim(), time: now() }, ...l.notes],
    }));
    addTimeline("note", "Note added");
    setNoteText("");
  };

  // Real actions: these actually call/message the number stored on the lead,
  // instead of only writing a fake "sent" line to the timeline.
  const logCall = () => { callNow(lead.phone); addTimeline("call", `Call started to ${lead.phone}`); };
  const logWhatsapp = () => {
    openWhatsApp(lead.phone, `مرحباً ${lead.name.split(" ")[0]}! معك فريق ديوان بخصوص ${lead.project}. تحت أمرك لو محتاج أي تفاصيل.`);
    addTimeline("whatsapp", "WhatsApp opened with intro message");
  };
  const callAction = (a) => { callNow(lead.phone); addTimeline("call", `Called re: "${a.text}"`); };

  const runAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const daysOld = Math.round((now() - lead.createdAt) / 86400000);
      const notesText = lead.notes.map((n) => n.text).join("; ") || "none";
      const prompt = `You are an AI sales assistant for an Egyptian real estate brokerage CRM. Analyze this lead and respond with ONLY valid JSON, no prose, no markdown fences. Fields required:
{"score": number 0-100, "temperature": "HOT"|"WARM"|"COLD", "recommendedAction": "short imperative sentence in English", "reasoning": "one sentence explaining the score", "whatsappDraft": "a short, warm, professional Arabic WhatsApp follow-up message, max 40 words, written for an Egyptian client"}

Lead data:
name: ${lead.name}
budget: ${lead.budgetMin} to ${lead.budgetMax} EGP
project interest: ${lead.project}
source: ${lead.source}
current pipeline stage: ${lead.status}
current temperature label: ${lead.temperature}
days since lead created: ${daysOld}
agent notes: ${notesText}`;
      const text = await callAI(prompt);
      const parsed = parseJsonLoose(text);
      onUpdate(lead.id, (l) => ({ ...l, aiInsight: { ...parsed, generatedAt: now() } }));
    } catch (e) {
      setAiError("Couldn't reach the AI service right now. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyDraft = () => {
    if (!lead.aiInsight?.whatsappDraft) return;
    navigator.clipboard?.writeText(lead.aiInsight.whatsappDraft).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const useDraft = () => {
    if (!lead.aiInsight?.whatsappDraft) return;
    openWhatsApp(lead.phone, lead.aiInsight.whatsappDraft);
    addTimeline("whatsapp", "AI-drafted WhatsApp follow-up sent");
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "ai", label: "AI Insights", icon: Wand2 },
    { key: "timeline", label: "Timeline", icon: History },
    { key: "actions", label: "Actions", icon: ListChecks },
    { key: "notes", label: "Notes", icon: StickyNote },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ background: "rgba(20,33,61,0.35)" }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: C.paper }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ background: C.ink, borderColor: C.line }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-white font-display text-lg font-semibold">{lead.name}</div>
              <div className="text-xs mt-1" style={{ color: "#AEB8D4" }}>{lead.phone} · {lead.project}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShareOpen(true)} title="Share lead" className="text-white/70 hover:text-white"><Share2 size={18} /></button>
              <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <TempBadge temp={lead.temperature} />
            <StageBadge status={lead.status} />
            <Badge bg="rgba(255,255,255,0.1)" fg="#fff">Score {lead.score}</Badge>
            {lead.sharedWith?.length > 0 && (
              <Badge bg="rgba(255,255,255,0.1)" fg="#fff"><Users2 size={11} /> Shared with {lead.sharedWith.join(", ")}</Badge>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={logCall} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium" style={{ background: C.gold, color: C.ink }}>
              <Phone size={14} /> Call now
            </button>
            <button onClick={logWhatsapp} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
              <MessageCircle size={14} /> WhatsApp
            </button>
          </div>
        </div>
        <ShareLeadModal open={shareOpen} onClose={() => setShareOpen(false)} lead={lead} onShare={onShare} />

        <div className="flex border-b px-2 overflow-x-auto" style={{ borderColor: C.line, background: C.card }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap"
                style={{ borderColor: active ? C.gold : "transparent", color: active ? C.ink : C.slate }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              <InfoRow label="Assigned agent" value={lead.agent} />
              {lead.sharedWith?.length > 0 && <InfoRow label="Also shared with" value={lead.sharedWith.join(", ")} />}
              <InfoRow label="Source" value={lead.source} />
              <InfoRow label="Budget" value={`${fmtMoney(lead.budgetMin)} – ${fmtMoney(lead.budgetMax)}`} />
              <InfoRow label="Next follow-up" value={new Date(lead.nextFollowUp).toLocaleString()} />
              <InfoRow label="Created" value={fmtTime(lead.createdAt)} />
              <div className="pt-2">
                <div className="text-xs font-medium mb-2" style={{ color: C.slate }}>Client needs</div>
                <div className="text-sm p-3 rounded-lg border" style={{ background: C.card, borderColor: C.line, color: C.ink }}>
                  Looking for {lead.project.split(" — ")[0]} within budget range, prefers flexible payment plan.
                </div>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div className="flex flex-col gap-4">
              {!lead.aiInsight && !aiLoading && (
                <div className="text-center py-6">
                  <Wand2 size={28} style={{ color: C.gold }} className="mx-auto mb-3" />
                  <p className="text-sm mb-4" style={{ color: C.slate }}>Let AI analyze this lead's likelihood to close and draft a follow-up.</p>
                  <button onClick={runAI} className="px-4 py-2 rounded-lg text-sm font-medium mx-auto" style={{ background: C.ink, color: "#fff" }}>
                    Analyze with AI
                  </button>
                  {aiError && <p className="text-xs mt-3" style={{ color: C.coral }}>{aiError}</p>}
                </div>
              )}
              {aiLoading && (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Loader2 className="animate-spin" size={22} style={{ color: C.gold }} />
                  <span className="text-sm" style={{ color: C.slate }}>Analyzing lead…</span>
                </div>
              )}
              {lead.aiInsight && !aiLoading && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge bg={C.goldSoft} fg="#946E0C">AI Score {lead.aiInsight.score}/100</Badge>
                    <TempBadge temp={lead.aiInsight.temperature} />
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: C.slate }}>Recommended action</div>
                    <div className="text-sm p-3 rounded-lg border font-medium" style={{ background: C.sageSoft, borderColor: C.line, color: C.sage }}>
                      {lead.aiInsight.recommendedAction}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: C.slate }}>Why</div>
                    <div className="text-sm" style={{ color: C.ink }}>{lead.aiInsight.reasoning}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1 flex items-center justify-between" style={{ color: C.slate }}>
                      <span>WhatsApp follow-up draft (Arabic)</span>
                    </div>
                    <div dir="rtl" className="text-sm p-3 rounded-lg border" style={{ background: C.card, borderColor: C.line, color: C.ink }}>
                      {lead.aiInsight.whatsappDraft}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={copyDraft} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: C.line, color: C.ink }}>
                        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                      </button>
                      <button onClick={useDraft} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium" style={{ background: C.ink, color: "#fff" }}>
                        <Send size={13} /> Send via WhatsApp
                      </button>
                    </div>
                  </div>
                  <button onClick={runAI} className="text-xs font-medium self-start" style={{ color: C.gold }}>Re-analyze</button>
                </div>
              )}
            </div>
          )}

          {tab === "timeline" && (
            <div className="flex flex-col gap-3">
              {lead.timeline.map((t) => {
                const meta = TIMELINE_ICON[t.type] || TIMELINE_ICON.default;
                const Icon = meta.icon;
                return (
                  <div key={t.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0" style={{ background: meta.bg }}>
                      <Icon size={12} style={{ color: meta.fg }} />
                    </div>
                    <div className="flex-1 pb-3 border-b" style={{ borderColor: C.line }}>
                      <div className="text-sm" style={{ color: C.ink }}>{t.text}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.slate }}>{fmtTime(t.time)}</div>
                    </div>
                  </div>
                );
              })}
              {lead.timeline.length === 0 && <div className="text-sm" style={{ color: C.slate }}>No activity yet.</div>}
            </div>
          )}

          {tab === "actions" && (
            <div className="flex flex-col gap-2">
              {lead.actions.map((a) => {
                const overdue = !a.done && a.due < now();
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: C.card, borderColor: overdue ? C.coral : C.line }}>
                    <button onClick={() => toggleAction(a.id)} className="shrink-0">
                      {a.done ? <CheckCircle2 size={18} style={{ color: C.sage }} /> : <Circle size={18} style={{ color: overdue ? C.coral : C.slate }} />}
                    </button>
                    <div className="flex-1 min-w-0" onClick={() => toggleAction(a.id)} style={{ cursor: "pointer" }}>
                      <div className="text-sm" style={{ color: a.done ? C.slate : C.ink, textDecoration: a.done ? "line-through" : "none" }}>{a.text}</div>
                      <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: overdue ? C.coral : C.slate }}>
                        <CalendarClock size={11} /> {overdue ? "Overdue — " : ""}{new Date(a.due).toLocaleString()}
                      </div>
                    </div>
                    {!a.done && (
                      <button onClick={() => callAction(a)} title={`Call ${lead.phone}`}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: C.gold, color: C.ink }}>
                        <PhoneCall size={12} /> Call now
                      </button>
                    )}
                  </div>
                );
              })}
              {lead.actions.length === 0 && <div className="text-sm" style={{ color: C.slate }}>No reminders yet.</div>}
            </div>
          )}

          {tab === "notes" && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Client needs?"
                  className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: C.line, background: C.card }}
                />
                <button onClick={submitNote} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: C.ink, color: "#fff" }}>
                  Submit
                </button>
              </div>
              {lead.notes.map((n) => (
                <div key={n.id} className="p-3 rounded-lg border text-sm" style={{ background: C.card, borderColor: C.line, color: C.ink }}>
                  {n.text}
                  <div className="text-xs mt-1" style={{ color: C.slate }}>{fmtTime(n.time)}</div>
                </div>
              ))}
              {lead.notes.length === 0 && <div className="text-sm" style={{ color: C.slate }}>No notes yet.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: C.slate }}>{label}</span>
      <span style={{ color: C.ink }} className="font-medium">{value}</span>
    </div>
  );
}

/* ---------------- Add Lead Modal ---------------- */
function AddLeadModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", project: PROJECTS[0], budgetMin: "", budgetMax: "", agent: AGENTS[0], source: SOURCES[0] });
  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    onAdd({
      id: uid(), name: form.name, phone: form.phone, project: form.project,
      budgetMin: Number(form.budgetMin) || 3000000, budgetMax: Number(form.budgetMax) || 5000000,
      agent: form.agent, source: form.source, status: "NEW", temperature: "WARM", score: 40,
      createdAt: now(), nextFollowUp: hoursAgo(-24), notes: [], actions: [], aiInsight: null,
      timeline: [{ id: uid(), type: "created", text: `Lead created from ${form.source}`, time: now() }],
    });
    setForm({ name: "", phone: "", project: PROJECTS[0], budgetMin: "", budgetMax: "", agent: AGENTS[0], source: SOURCES[0] });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,33,61,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold" style={{ color: C.ink }}>New lead</h3>
          <button onClick={onClose}><X size={18} style={{ color: C.slate }} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Full name"><input value={form.name} onChange={set("name")} className="in" /></Field>
          <Field label="Phone"><input value={form.phone} onChange={set("phone")} className="in" placeholder="+2010..." /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget min"><input value={form.budgetMin} onChange={set("budgetMin")} className="in" placeholder="4000000" /></Field>
            <Field label="Budget max"><input value={form.budgetMax} onChange={set("budgetMax")} className="in" placeholder="6000000" /></Field>
          </div>
          <Field label="Project">
            <select value={form.project} onChange={set("project")} className="in">
              {PROJECTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Agent">
              <select value={form.agent} onChange={set("agent")} className="in">
                {AGENTS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Source">
              <select value={form.source} onChange={set("source")} className="in">
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium" style={{ background: C.ink, color: "#fff" }}>
          Create lead
        </button>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: C.slate }}>
      {label}
      {children}
    </label>
  );
}

/* ---------------- Share Lead modal (activity timeline between reps) ---------------- */
function ShareLeadModal({ open, onClose, lead, onShare }) {
  const [agent, setAgent] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { if (open && lead) setAgent(AGENTS.find((a) => a !== lead.agent) || AGENTS[0]); }, [open, lead]);
  if (!open || !lead) return null;
  const submit = () => {
    if (!agent) return;
    onShare(lead.id, agent, note.trim());
    setNote("");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,33,61,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-semibold flex items-center gap-2" style={{ color: C.ink }}><Share2 size={16} /> Share lead</h3>
          <button onClick={onClose}><X size={18} style={{ color: C.slate }} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.slate }}>Give another agent visibility on <b>{lead.name}</b>. This is logged in the lead's Activity Timeline so everyone can see who handed off what, and when.</p>
        <div className="flex flex-col gap-3">
          <Field label="Share with agent">
            <select value={agent} onChange={(e) => setAgent(e.target.value)} className="in">
              {AGENTS.filter((a) => a !== lead.agent).map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className="in" placeholder="e.g. cover while I'm on-site" />
          </Field>
          {lead.sharedWith?.length > 0 && (
            <div className="text-xs" style={{ color: C.slate }}>
              Currently shared with: <span style={{ color: C.ink }} className="font-medium">{lead.sharedWith.join(", ")}</span>
            </div>
          )}
        </div>
        <button onClick={submit} className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ background: C.ink, color: "#fff" }}>
          <Share2 size={14} /> Share &amp; log to timeline
        </button>
      </div>
    </div>
  );
}

/* ---------------- Bulk CSV import (used identically for Leads and Inventory) ---------------- */
function ImportCsvModal({ open, onClose, title, templateHeaders, templateSample, mapRow, onImport }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null); // { headers, rows }
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  if (!open) return null;

  const reset = () => { setFileName(""); setParsed(null); setError(null); };
  const close = () => { reset(); onClose(); };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { headers, rows } = parseCSV(String(reader.result));
        if (rows.length === 0) throw new Error("No rows found in file.");
        setParsed({ headers, rows });
      } catch (e) {
        setError("Couldn't read that file. Make sure it's a comma-separated .csv exported from Excel/Sheets.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = [templateHeaders.join(","), templateSample.join(",")].join("\n");
    downloadTextFile(`diwan-${title.toLowerCase().replace(/\s+/g, "-")}-template.csv`, csv);
  };

  const doImport = () => {
    if (!parsed) return;
    const mapped = parsed.rows.map(mapRow).filter(Boolean);
    onImport(mapped);
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,33,61,0.45)" }} onClick={close}>
      <div className="w-full max-w-md rounded-2xl p-5" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display font-semibold flex items-center gap-2" style={{ color: C.ink }}><Upload size={16} /> Bulk import — {title}</h3>
          <button onClick={close}><X size={18} style={{ color: C.slate }} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.slate }}>Upload a CSV exported from Excel or Google Sheets. Same format for leads and inventory.</p>

        <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs font-medium mb-4" style={{ color: C.gold }}>
          <FileDown size={13} /> Download CSV template
        </button>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 cursor-pointer text-center"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <Upload size={22} style={{ color: C.slate }} />
          <div className="text-sm" style={{ color: C.ink }}>{fileName || "Click to choose a .csv file, or drag it here"}</div>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>

        {error && <div className="text-xs mt-3" style={{ color: C.coral }}>{error}</div>}

        {parsed && !error && (
          <div className="mt-4 rounded-lg border p-3 text-sm flex items-center gap-2" style={{ borderColor: C.line, background: C.sageSoft, color: C.sage }}>
            <CheckCircle2 size={15} /> Found {parsed.rows.length} row{parsed.rows.length !== 1 ? "s" : ""} — columns: {parsed.headers.join(", ")}
          </div>
        )}

        <button
          onClick={doImport}
          disabled={!parsed}
          className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: C.ink, color: "#fff" }}
        >
          <Upload size={14} /> Import {parsed ? `${parsed.rows.length} row${parsed.rows.length !== 1 ? "s" : ""}` : ""}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Leads table ---------------- */
function LeadsView({ leads, onOpen, onAddClick, onImportLeads, onPrioritize, prioritizing, prioritizeError, sortByScore }) {
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [importOpen, setImportOpen] = useState(false);
  const filtered = leads
    .filter((l) =>
      (stageFilter === "ALL" || l.status === stageFilter) &&
      (l.name.toLowerCase().includes(q.toLowerCase()) || l.phone.includes(q))
    )
    .sort((a, b) => (sortByScore ? b.score - a.score : 0));

  const mapImportRow = (row) => {
    const name = row.name || row["full name"] || row["lead name"];
    const phone = row.phone || row["phone number"] || row.mobile;
    if (!name || !phone) return null;
    return {
      id: uid(), name, phone,
      project: row.project || PROJECTS[0],
      source: row.source || "Website",
      budgetMin: Number(row["budget min"] || row.budgetmin) || 3000000,
      budgetMax: Number(row["budget max"] || row.budgetmax) || 5000000,
      agent: row.agent && AGENTS.includes(row.agent) ? row.agent : AGENTS[0],
      status: "NEW", temperature: "WARM", score: 40,
      createdAt: now(), nextFollowUp: hoursAgo(-24), notes: [], actions: [], aiInsight: null, sharedWith: [],
      timeline: [{ id: uid(), type: "created", text: `Lead imported in bulk from ${row.source || "CSV"}`, time: now() }],
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <TopBar title="Leads" leads={leads} />
      <div className="px-6 flex flex-col gap-4">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button onClick={onPrioritize} disabled={prioritizing || leads.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
            style={{ borderColor: C.line, color: C.ink, background: C.card }}>
            {prioritizing ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpDown size={15} />}
            {prioritizing ? "Prioritizing…" : "Prioritize with AI"}
          </button>
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: C.line, color: C.ink, background: C.card }}>
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={onAddClick} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: C.ink, color: "#fff" }}>
            <Plus size={15} /> New lead
          </button>
        </div>
        {prioritizeError && <div className="text-xs text-right" style={{ color: C.coral }}>{prioritizeError}</div>}
        {sortByScore && !prioritizing && (
          <div className="flex items-center gap-1.5 text-xs -mt-2" style={{ color: C.sage }}>
            <Sparkles size={12} /> Sorted by AI priority score — highest first.
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[200px]" style={{ background: C.card, borderColor: C.line }}>
            <Search size={15} style={{ color: C.slate }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads..." className="outline-none text-sm flex-1 bg-transparent" style={{ color: C.ink }} />
          </div>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.line, background: C.card, color: C.ink }}>
            <option value="ALL">All stages</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        <div className="rounded-2xl border overflow-hidden overflow-x-auto" style={{ borderColor: C.line, background: C.card }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: C.ink10 }}>
                {["Lead", "Project", "Agent", "Temp", "Stage", "Score", "Next follow-up", "Quick actions"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-2.5 text-xs uppercase tracking-wide whitespace-nowrap" style={{ color: C.slate }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => onOpen(l)} className="cursor-pointer border-t hover:bg-black/[0.02]" style={{ borderColor: C.line }}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: C.ink }}>{l.name}</div>
                    <div className="text-xs" style={{ color: C.slate }}>{l.phone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.ink }}>{l.project}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.ink }}>{l.agent}</td>
                  <td className="px-4 py-3"><TempBadge temp={l.temperature} /></td>
                  <td className="px-4 py-3"><StageBadge status={l.status} /></td>
                  <td className="px-4 py-3" style={{ color: C.ink }}>{l.score}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.slate }}>{new Date(l.nextFollowUp).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => callNow(l.phone)} title="Call now" className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ borderColor: C.line }}>
                        <PhoneCall size={13} style={{ color: C.ink }} />
                      </button>
                      <button onClick={() => openWhatsApp(l.phone, `مرحباً ${l.name.split(" ")[0]}! معك فريق ديوان بخصوص ${l.project}.`)} title="WhatsApp" className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ borderColor: C.line }}>
                        <MessageCircle size={13} style={{ color: C.sage }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-sm" style={{ color: C.slate }}>No leads match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Leads"
        templateHeaders={["name", "phone", "project", "source", "budget min", "budget max", "agent"]}
        templateSample={["Ahmed Hassan", "01012345678", "Aliva — Mountain View", "Facebook", "4000000", "6000000", "Mona Adel"]}
        mapRow={mapImportRow}
        onImport={onImportLeads}
      />
    </div>
  );
}

/* ---------------- Pipeline (Kanban) ---------------- */
function Pipeline({ leads, onOpen, onMove }) {
  const [dragId, setDragId] = useState(null);
  return (
    <div className="flex flex-col gap-4 h-full">
      <TopBar title="Pipeline" leads={leads} />
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 px-6">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.status === stage.key);
          return (
            <div key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) onMove(dragId, stage.key); setDragId(null); }}
              className="w-64 shrink-0 rounded-2xl p-3 flex flex-col gap-2" style={{ background: C.ink10 }}>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.ink }}>{stage.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: C.card, color: C.slate }}>{items.length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[40px]">
                {items.map((l) => (
                  <div key={l.id} draggable onDragStart={() => setDragId(l.id)} onClick={() => onOpen(l)}
                    className="rounded-xl p-3 cursor-grab active:cursor-grabbing border" style={{ background: C.card, borderColor: C.line }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: C.ink }}>{l.name}</span>
                      <TempBadge temp={l.temperature} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: C.slate }}>{l.project}</div>
                    <div className="text-xs mt-1.5" style={{ color: C.gold }}>{fmtMoney(l.budgetMax)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- WhatsApp Inbox ---------------- */
function WhatsAppView({ conversations, onSend, leads }) {
  const [activeId, setActiveId] = useState(conversations[0]?.id || null);
  const [text, setText] = useState("");
  const active = conversations.find((c) => c.id === activeId) || conversations[0];
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [active?.messages?.length, activeId]);

  const send = () => {
    if (!text.trim() || !active) return;
    onSend(active.id, text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="WhatsApp Inbox" leads={leads} />
      <div className="flex flex-1 min-h-0 mt-4 px-6 pb-6 gap-4">
        <div className="w-72 shrink-0 rounded-2xl border overflow-y-auto" style={{ borderColor: C.line, background: C.card }}>
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className="w-full text-left px-4 py-3 border-b flex items-start gap-3"
              style={{ borderColor: C.line, background: c.id === active?.id ? C.ink10 : "transparent" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: C.sageSoft, color: C.sage }}>
                {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate" style={{ color: C.ink }}>{c.name}</span>
                  <span className="text-[10px]" style={{ color: C.slate }}>{fmtClock(c.lastTime)}</span>
                </div>
                <div className="text-xs truncate" style={{ color: C.slate }}>{c.lastMessage}</div>
              </div>
              {c.unread > 0 && <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white shrink-0" style={{ background: C.sage }}>{c.unread}</span>}
            </button>
          ))}
        </div>

        {active ? (
          <div className="flex-1 rounded-2xl border flex flex-col min-h-0" style={{ borderColor: C.line, background: C.card }}>
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: C.line, background: C.sageSoft }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: C.sage, color: "#fff" }}>
                {active.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: C.ink }}>{active.name}</div>
                <div className="text-xs" style={{ color: C.slate }}>{active.phone}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {active.messages.map((m) => (
                <div key={m.id} className={`max-w-[75%] ${m.from === "agent" ? "self-end" : "self-start"}`}>
                  <div className="px-3 py-2 rounded-2xl text-sm" style={{
                    background: m.from === "agent" ? C.goldSoft : C.ink10,
                    color: C.ink,
                    borderBottomRightRadius: m.from === "agent" ? 4 : 16,
                    borderBottomLeftRadius: m.from === "agent" ? 16 : 4,
                  }}>
                    {m.text}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${m.from === "agent" ? "text-right" : ""}`} style={{ color: C.slate }}>
                    {fmtClock(m.time)} {m.from === "agent" && `· ${m.status}`}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t flex gap-2" style={{ borderColor: C.line }}>
              <button className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
                <Paperclip size={15} style={{ color: C.slate }} />
              </button>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message..." className="flex-1 text-sm px-3 rounded-lg border outline-none" style={{ borderColor: C.line }} />
              <button onClick={send} className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.sage }}>
                <Send size={15} color="#fff" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.slate }}>No conversations yet.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Offers / Proposal Generator ---------------- */
function OffersView({ leads, units, offers, onGenerate, leadsForBar }) {
  const [leadId, setLeadId] = useState(leads[0]?.id || "");
  const [unitId, setUnitId] = useState(units[0]?.id || "");
  const [downPct, setDownPct] = useState(10);
  const [years, setYears] = useState(8);
  const [discount, setDiscount] = useState(0);
  const [justGenerated, setJustGenerated] = useState(null);

  const lead = leads.find((l) => l.id === leadId);
  const unit = units.find((u) => u.id === unitId);

  const calc = useMemo(() => {
    if (!unit) return null;
    const discounted = unit.price * (1 - discount / 100);
    const down = discounted * (downPct / 100);
    const remaining = discounted - down;
    const months = years * 12;
    const monthly = remaining / months;
    return { discounted, down, remaining, monthly, months };
  }, [unit, downPct, years, discount]);

  const downloadPdf = (offer) => {
    const unitForOffer = units.find((u) => u.project === offer.project) || unit;
    const doc = buildOfferPdf(offer, unitForOffer);
    doc.save(offerFileName(offer));
  };

  const sendPdfViaWhatsapp = (offer) => {
    const l = leads.find((x) => x.name === offer.leadName) || lead;
    downloadPdf(offer);
    openWhatsApp(
      l?.phone,
      `مرحباً ${offer.leadName.split(" ")[0]}! مرفق عرض السعر لوحدة ${offer.project} (${fmtMoney(Math.round(offer.discounted))}, مقدم ${offer.downPct}%). لقد نزّلنا ملف الـ PDF على جهازك — تقدر ترفقه هنا في المحادثة.`
    );
  };

  const generate = () => {
    if (!lead || !unit || !calc) return;
    const offer = {
      id: uid(), leadName: lead.name, project: unit.project, unitType: unit.type,
      bedrooms: unit.bedrooms, price: unit.price, discount, discounted: calc.discounted,
      down: calc.down, downPct, monthly: calc.monthly, years, createdAt: now(), agent: lead.agent,
    };
    onGenerate(offer);
    // The PDF for the unit is generated automatically the moment the offer
    // is built — no separate manual "make a PDF" step.
    const doc = buildOfferPdf(offer, unit);
    doc.save(offerFileName(offer));
    setJustGenerated(offer);
  };

  return (
    <div className="flex flex-col gap-4">
      <TopBar title="Offers & Proposals" leads={leadsForBar} />
      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ background: C.card, borderColor: C.line }}>
          <div className="text-sm font-medium" style={{ color: C.ink }}>Build offer</div>
          <Field label="Lead">
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="in">
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Unit">
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="in">
              {units.map((u) => <option key={u.id} value={u.id}>{u.project} · {u.type} · {u.bedrooms}BR</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Discount %"><input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="in" /></Field>
            <Field label="Down payment %"><input type="number" value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="in" /></Field>
            <Field label="Years"><input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="in" /></Field>
          </div>
          <button onClick={generate} className="mt-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ background: C.ink, color: "#fff" }}>
            <FileText size={15} /> Generate offer + PDF
          </button>
          {justGenerated && (
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg border" style={{ borderColor: C.line, background: C.sageSoft, color: C.sage }}>
              <CheckCircle2 size={14} /> PDF downloaded for {justGenerated.leadName}.
              <button onClick={() => sendPdfViaWhatsapp(justGenerated)} className="ml-auto flex items-center gap-1 font-medium underline">
                <MessageCircle size={12} /> Send via WhatsApp
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ background: C.ink, borderColor: C.line }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold text-white">Diwan Brokerage</div>
            <Badge bg="rgba(255,255,255,0.1)" fg="#fff">Proposal preview</Badge>
          </div>
          {unit && calc ? (
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Client" value={lead?.name} light />
              <Row label="Project" value={unit.project} light />
              <Row label="Unit type" value={`${unit.type} · ${unit.bedrooms} BR`} light />
              <Row label="List price" value={fmtMoney(unit.price)} light />
              {discount > 0 && <Row label="Discount" value={`${discount}%`} light />}
              <Row label="Final price" value={fmtMoney(Math.round(calc.discounted))} light strong />
              <Row label="Down payment" value={`${fmtMoney(Math.round(calc.down))} (${downPct}%)`} light />
              <Row label="Installment plan" value={`${fmtMoney(Math.round(calc.monthly))} / month · ${calc.months} months`} light />
              <Row label="Delivery" value={unit.delivery} light />
              <div className="text-[11px] mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#93A0BF" }}>
                Valid for 7 days from generation · Prepared by {lead?.agent}
              </div>
            </div>
          ) : <div className="text-sm" style={{ color: "#93A0BF" }}>Select a lead and unit to preview.</div>}
        </div>
      </div>

      <div className="px-6 mt-2">
        <div className="text-sm font-medium mb-2" style={{ color: C.ink }}>Generated offers</div>
        <div className="rounded-2xl border overflow-hidden overflow-x-auto" style={{ borderColor: C.line, background: C.card }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: C.ink10 }}>
              {["Client", "Project", "Final price", "Down payment", "Monthly", "Date", "PDF"].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-2.5 text-xs uppercase tracking-wide whitespace-nowrap" style={{ color: C.slate }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-4 py-2.5" style={{ color: C.ink }}>{o.leadName}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.ink }}>{o.project}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.ink }}>{fmtMoney(Math.round(o.discounted))}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.ink }}>{fmtMoney(Math.round(o.down))}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.ink }}>{fmtMoney(Math.round(o.monthly))}</td>
                  <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: C.slate }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => downloadPdf(o)} title="Download PDF" className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ borderColor: C.line }}>
                        <FileDown size={13} style={{ color: C.ink }} />
                      </button>
                      <button onClick={() => sendPdfViaWhatsapp(o)} title="Send via WhatsApp" className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ borderColor: C.line }}>
                        <MessageCircle size={13} style={{ color: C.sage }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-sm" style={{ color: C.slate }}>No offers generated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Row({ label, value, light, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: light ? "#93A0BF" : C.slate }}>{label}</span>
      <span style={{ color: light ? "#fff" : C.ink, fontWeight: strong ? 700 : 500 }}>{value}</span>
    </div>
  );
}

/* ---------------- Efficiency (attendance & performance) ---------------- */
function EfficiencyView({ attendance, leads }) {
  const chartData = attendance.map((a) => ({ name: a.name.split(" ")[0], leads: a.leadsHandled, deals: a.dealsWon }));
  return (
    <div className="flex flex-col gap-4">
      <TopBar title="Efficiency" subtitle="Team attendance & performance" leads={leads} />
      <div className="px-6 flex flex-col gap-4">
        <div className="rounded-2xl border overflow-hidden overflow-x-auto" style={{ borderColor: C.line, background: C.card }}>
          <table className="w-full text-sm">
            <thead><tr style={{ background: C.ink10 }}>
              {["Agent", "Signed in", "Signed out", "Leads handled", "Deals won", "Conversion"].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-2.5 text-xs uppercase tracking-wide whitespace-nowrap" style={{ color: C.slate }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-4 py-3 font-medium" style={{ color: C.ink }}>{a.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="flex items-center gap-1.5" style={{ color: C.sage }}><LogIn size={13} />{fmtClock(a.signIn)}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {a.signOut
                      ? <span className="flex items-center gap-1.5" style={{ color: C.slate }}><LogOut size={13} />{fmtClock(a.signOut)}</span>
                      : <Badge bg={C.sageSoft} fg={C.sage}>Active now</Badge>}
                  </td>
                  <td className="px-4 py-3" style={{ color: C.ink }}>{a.leadsHandled}</td>
                  <td className="px-4 py-3" style={{ color: C.ink }}>{a.dealsWon}</td>
                  <td className="px-4 py-3" style={{ color: C.ink }}>{a.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: C.card, borderColor: C.line }}>
          <div className="text-sm font-medium mb-3" style={{ color: C.ink }}>Leads handled vs deals won</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
              <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="leads" name="Leads handled" fill={C.ink10} stroke={C.ink} radius={[6, 6, 0, 0]} />
              <Bar dataKey="deals" name="Deals won" fill={C.gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Automation ---------------- */
function AutomationView({ rules, onToggle, leads }) {
  return (
    <div className="flex flex-col gap-4">
      <TopBar title="Automation" subtitle="Rules that run automatically across your pipeline" leads={leads} />
      <div className="px-6 flex flex-col gap-3">
        {rules.map((r) => (
          <div key={r.id} className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: C.card, borderColor: C.line }}>
            <button onClick={() => onToggle(r.id)}>
              {r.enabled ? <ToggleRight size={30} style={{ color: C.sage }} /> : <ToggleLeft size={30} style={{ color: C.slate }} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: C.ink }}>{r.name}</div>
              <div className="text-xs mt-1 flex flex-wrap items-center gap-1.5" style={{ color: C.slate }}>
                <Badge bg={C.ink10} fg={C.ink}>{r.trigger}</Badge>
                <ChevronRight size={12} />
                <span>{r.condition}</span>
                <ChevronRight size={12} />
                <Badge bg={C.goldSoft} fg="#946E0C">{r.action}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Inventory ---------------- */
const STATUS_STYLE = {
  AVAILABLE: [C.sageSoft, C.sage], RESERVED: [C.goldSoft, "#946E0C"],
  SOLD: ["#F1F1F1", "#8A8A8A"], ON_HOLD: [C.coralSoft, C.coral],
};
function InventoryView({ units, leads, onImportUnits, onSetDescription }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [importOpen, setImportOpen] = useState(false);
  const [descFor, setDescFor] = useState(null); // unit id currently generating/viewing description
  const [descLoading, setDescLoading] = useState(null);
  const [descError, setDescError] = useState(null);
  const filtered = units.filter((u) =>
    (type === "ALL" || u.type === type) &&
    (u.project.toLowerCase().includes(q.toLowerCase()) || u.location.toLowerCase().includes(q.toLowerCase()))
  );
  const types = ["ALL", ...Array.from(new Set(units.map((u) => u.type)))];

  const mapImportRow = (row) => {
    const project = row.project;
    const price = Number(row.price);
    if (!project || !price) return null;
    return {
      id: uid(), aiDescription: null,
      project, developer: row.developer || "—", location: row.location || "New Cairo",
      type: row.type || "Apartment", bedrooms: Number(row.bedrooms) || 2, price,
      down: Number(row.down) || 10, years: Number(row.years) || 8,
      delivery: row.delivery || "2028", status: (row.status || "AVAILABLE").toUpperCase(),
    };
  };

  const generateDescription = async (unit) => {
    setDescFor(unit.id);
    setDescLoading(unit.id);
    setDescError(null);
    try {
      const prompt = `You are a real estate copywriter for an Egyptian brokerage called Diwan. Write ONLY the description text, no headings, no quotes, no markdown — one persuasive marketing paragraph (55-80 words, Arabic) for this unit, suitable for sending to a client alongside a price offer:
Project: ${unit.project}
Developer: ${unit.developer}
Location: ${unit.location}
Unit type: ${unit.type}, ${unit.bedrooms} bedrooms
Starting price: ${fmtMoney(unit.price)}
Down payment: ${unit.down}% · ${unit.years} years installments
Delivery: ${unit.delivery}`;
      const text = await callAI(prompt);
      onSetDescription(unit.id, text.trim());
    } catch (e) {
      setDescError("Couldn't reach the AI service right now. Please try again.");
    } finally {
      setDescLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TopBar title="Inventory" leads={leads} />
      <div className="px-6 flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: C.line, color: C.ink, background: C.card }}>
            <Upload size={15} /> Import CSV
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[200px]" style={{ background: C.card, borderColor: C.line }}>
            <Search size={15} style={{ color: C.slate }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search project or area..." className="outline-none text-sm flex-1 bg-transparent" style={{ color: C.ink }} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: C.line, background: C.card, color: C.ink }}>
            {types.map((t) => <option key={t} value={t}>{t === "ALL" ? "All types" : t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => {
            const [bg, fg] = STATUS_STYLE[u.status];
            return (
              <div key={u.id} className="rounded-2xl border p-4 flex flex-col gap-2" style={{ background: C.card, borderColor: C.line }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium" style={{ color: C.ink }}>{u.project}</div>
                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: C.slate }}><MapPin size={11} />{u.location}</div>
                  </div>
                  <Badge bg={bg} fg={fg}>{u.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs mt-1" style={{ color: C.slate }}>
                  <span className="flex items-center gap-1"><BedDouble size={12} />{u.bedrooms} BR</span>
                  <span>{u.type}</span>
                  <span>Delivery {u.delivery}</span>
                </div>
                <div className="flex items-end justify-between pt-2 border-t mt-1" style={{ borderColor: C.line }}>
                  <div>
                    <div className="text-xs" style={{ color: C.slate }}>Starting price</div>
                    <div className="font-semibold" style={{ color: C.ink }}>{fmtMoney(u.price)}</div>
                  </div>
                  <div className="text-right text-xs" style={{ color: C.slate }}>
                    {u.down}% DP · {u.years} yrs
                  </div>
                </div>

                {u.aiDescription && descFor === u.id && (
                  <div dir="rtl" className="text-xs p-2.5 rounded-lg border mt-1" style={{ background: C.paper, borderColor: C.line, color: C.ink }}>
                    {u.aiDescription}
                  </div>
                )}
                {descError && descFor === u.id && <div className="text-xs" style={{ color: C.coral }}>{descError}</div>}
                <button
                  onClick={() => (u.aiDescription ? setDescFor(descFor === u.id ? null : u.id) : generateDescription(u))}
                  disabled={descLoading === u.id}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border mt-1 disabled:opacity-50"
                  style={{ borderColor: C.line, color: C.ink }}
                >
                  {descLoading === u.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {descLoading === u.id ? "Writing description…" : u.aiDescription ? (descFor === u.id ? "Hide description" : "Show AI description") : "Generate description with AI"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Inventory"
        templateHeaders={["project", "developer", "location", "type", "bedrooms", "price", "down", "years", "delivery", "status"]}
        templateSample={["Aliva — Mountain View", "Mountain View", "New Cairo", "Apartment", "3", "8600000", "10", "8", "2028", "AVAILABLE"]}
        mapRow={mapImportRow}
        onImport={onImportUnits}
      />
    </div>
  );
}

/* ---------------- App shell ---------------- */
export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [units, setUnits] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [rules, setRules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [prioritizeError, setPrioritizeError] = useState(null);
  const [sortByScore, setSortByScore] = useState(false);

  useEffect(() => {
    (async () => {
      const l = await loadKey("diwan-leads", null);
      const initialLeads = l || seedLeads();
      const [u, conv, off, rul, att] = await Promise.all([
        loadKey("diwan-units", null),
        loadKey("diwan-conversations", null),
        loadKey("diwan-offers", null),
        loadKey("diwan-rules", null),
        loadKey("diwan-attendance", null),
      ]);
      setLeads(initialLeads);
      const initialUnits = u || seedInventory();
      setUnits(initialUnits);
      setConversations(conv || seedConversations(initialLeads));
      setOffers(off || []);
      setRules(rul || seedAutomationRules());
      setAttendance(att || seedAttendance());
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) saveKey("diwan-leads", leads); }, [leads, ready]);
  useEffect(() => { if (ready) saveKey("diwan-units", units); }, [units, ready]);
  useEffect(() => { if (ready) saveKey("diwan-conversations", conversations); }, [conversations, ready]);
  useEffect(() => { if (ready) saveKey("diwan-offers", offers); }, [offers, ready]);
  useEffect(() => { if (ready) saveKey("diwan-rules", rules); }, [rules, ready]);

  const updateLead = useCallback((id, fn) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));
    setSelected((s) => (s && s.id === id ? fn(s) : s));
  }, []);

  const moveLead = useCallback((id, status) => {
    setLeads((prev) => prev.map((l) => l.id === id ? {
      ...l, status,
      timeline: [{ id: uid(), type: "status", text: `Status changed to ${STAGES.find(s => s.key === status)?.label}`, time: now() }, ...l.timeline],
    } : l));
  }, []);

  const addLead = useCallback((lead) => setLeads((prev) => [lead, ...prev]), []);
  const addLeadsBulk = useCallback((newLeads) => setLeads((prev) => [...newLeads, ...prev]), []);
  const addUnitsBulk = useCallback((newUnits) => setUnits((prev) => [...newUnits, ...prev]), []);
  const setUnitDescription = useCallback((unitId, text) => {
    setUnits((prev) => prev.map((u) => u.id === unitId ? { ...u, aiDescription: text } : u));
  }, []);

  const shareLead = useCallback((leadId, agent, note) => {
    updateLead(leadId, (l) => ({
      ...l,
      sharedWith: Array.from(new Set([...(l.sharedWith || []), agent])),
      timeline: [{
        id: uid(), type: "share",
        text: `Shared with ${agent}${note ? ` — "${note}"` : ""}`,
        time: now(),
      }, ...l.timeline],
    }));
  }, [updateLead]);

  // AI-powered lead prioritization: one AI call scores every active lead at
  // once and the list is re-sorted by that score, instead of agents guessing
  // who to call next.
  const prioritizeLeads = useCallback(async () => {
    setPrioritizing(true);
    setPrioritizeError(null);
    try {
      const active = leads.filter((l) => !["WON", "LOST"].includes(l.status));
      const summary = active.map((l) => ({
        id: l.id, name: l.name, budgetMax: l.budgetMax, project: l.project,
        source: l.source, stage: l.status, daysOld: Math.round((now() - l.createdAt) / 86400000),
        notes: l.notes.map((n) => n.text).join("; ") || "none",
      }));
      const prompt = `You are an AI sales-ops assistant for an Egyptian real estate brokerage CRM. Rank these leads by how urgently an agent should contact them next (closer to closing, bigger budget, going cold, etc). Respond with ONLY valid JSON, no prose, no markdown fences:
{"ranking": [{"id": "<lead id>", "score": <0-100>, "temperature": "HOT"|"WARM"|"COLD"}]}
Include every lead id exactly once. Leads:
${JSON.stringify(summary)}`;
      const text = await callAI(prompt);
      const parsed = parseJsonLoose(text);
      const byId = {};
      (parsed.ranking || []).forEach((r) => { byId[r.id] = r; });
      setLeads((prev) => prev.map((l) => {
        const r = byId[l.id];
        if (!r) return l;
        return {
          ...l, score: r.score, temperature: r.temperature,
          timeline: [{ id: uid(), type: "ai", text: `AI re-prioritized this lead — score ${r.score}`, time: now() }, ...l.timeline],
        };
      }));
      setSortByScore(true);
    } catch (e) {
      setPrioritizeError("Couldn't reach the AI service right now. Please try again.");
    } finally {
      setPrioritizing(false);
    }
  }, [leads]);

  const sendMessage = useCallback((convId, text) => {
    setConversations((prev) => prev.map((c) => c.id === convId ? {
      ...c,
      lastMessage: text, lastTime: now(), unread: 0,
      messages: [...c.messages, { id: uid(), from: "agent", text, time: now(), status: "SENT" }],
    } : c));
  }, []);

  const generateOffer = useCallback((offer) => setOffers((prev) => [offer, ...prev]), []);
  const toggleRule = useCallback((id) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)), []);

  const selectedLive = selected ? leads.find((l) => l.id === selected.id) : null;

  if (!ready) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: C.paper }}>
        <Loader2 className="animate-spin" style={{ color: C.ink }} size={28} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex" style={{ background: C.paper, fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui; }
        .in { border: 1px solid ${C.line}; border-radius: 8px; padding: 8px 10px; font-size: 14px; background: ${C.paper}; color: ${C.ink}; outline: none; }
      `}</style>
      <Sidebar view={view} setView={setView} />
      <div className="flex-1 overflow-y-auto pb-6">
        {view === "dashboard" && <Dashboard leads={leads} />}
        {view === "leads" && (
          <LeadsView
            leads={leads} onOpen={setSelected} onAddClick={() => setAddOpen(true)}
            onImportLeads={addLeadsBulk} onPrioritize={prioritizeLeads}
            prioritizing={prioritizing} prioritizeError={prioritizeError} sortByScore={sortByScore}
          />
        )}
        {view === "pipeline" && <Pipeline leads={leads} onOpen={setSelected} onMove={moveLead} />}
        {view === "whatsapp" && <WhatsAppView conversations={conversations} onSend={sendMessage} leads={leads} />}
        {view === "inventory" && <InventoryView units={units} leads={leads} onImportUnits={addUnitsBulk} onSetDescription={setUnitDescription} />}
        {view === "offers" && <OffersView leads={leads} units={units} offers={offers} onGenerate={generateOffer} leadsForBar={leads} />}
        {view === "efficiency" && <EfficiencyView attendance={attendance} leads={leads} />}
        {view === "automation" && <AutomationView rules={rules} onToggle={toggleRule} leads={leads} />}
      </div>
      <LeadDrawer lead={selectedLive} onClose={() => setSelected(null)} onUpdate={updateLead} onShare={shareLead} />
      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addLead} />
    </div>
  );
}
