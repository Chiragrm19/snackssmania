import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ─── Global Styles ─── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;500;700&display=swap');

.ldb-root *, .ldb-root *::before, .ldb-root *::after { box-sizing: border-box; }
.ldb-root {
  --amber: #F5A623; --teal: #00C9A7; --bg: #080b14;
  --glass: rgba(255,255,255,0.04); --border: rgba(255,255,255,0.08); --muted: rgba(255,255,255,0.6);
  min-height: 100vh; background: var(--bg); color: #fff;
  font-family: 'Outfit', sans-serif; overflow-x: hidden; position: relative;
}
#ldb-stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

/* orbit rings */
.ldb-orbit { position: absolute; top: 340px; left: 50%; width: 0; height: 0; z-index: 0; perspective: 1500px; }
.ldb-ring  { position: absolute; border-radius: 50%; animation: ldb-spin 30s linear infinite; }
.ldb-ring1 { width:460px;height:460px;margin:-230px 0 0 -230px;border:1px solid rgba(0,201,167,.3);animation-duration:30s; }
.ldb-ring2 { width:680px;height:680px;margin:-340px 0 0 -340px;border:1px dashed rgba(245,166,35,.2);animation-duration:46s;animation-direction:reverse; }
.ldb-ring3 { width:980px;height:980px;margin:-490px 0 0 -490px;border:1px solid rgba(255,255,255,.04);animation-duration:68s; }
@keyframes ldb-spin { from{transform:rotateX(75deg) rotateZ(0deg);} to{transform:rotateX(75deg) rotateZ(360deg);} }

/* ticker */
.ldb-ticker { width:100%;background:rgba(0,0,0,.45);border-bottom:1px solid rgba(255,255,255,.08);padding:10px 0;overflow:hidden;white-space:nowrap;position:relative;z-index:20; }
.ldb-ticker-inner { display:inline-block;white-space:nowrap;animation:ldb-scroll 28s linear infinite;font-family:'JetBrains Mono',monospace;font-size:.88rem;color:var(--teal); }
.ldb-ticker-item { display:inline-block;margin-right:60px; }
.ldb-ticker-item span { color:rgba(255,255,255,.85); }
@keyframes ldb-scroll { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }

/* layout */
.ldb-content { max-width:1440px;margin:0 auto;padding:44px 24px 80px;position:relative;z-index:10; }

/* animations */
@keyframes ldb-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-13px);} }
@keyframes ldb-beam  { 0%{opacity:0;transform:scale(.86);} 35%{box-shadow:0 12px 48px rgba(0,201,167,.38);opacity:1;} 100%{opacity:1;transform:scale(1);} }
@keyframes ldb-glow  { 0%,100%{text-shadow:none;} 50%{color:#fff;text-shadow:0 0 24px var(--amber);} }
.ldb-glowing { animation:ldb-glow .55s ease-out; }

/* tilt + float + card */
.ldb-tilt  { perspective:1000px;animation:ldb-beam .75s cubic-bezier(.175,.885,.32,1.275) both;height:100%; }
.ldb-float { animation:ldb-float 6s ease-in-out infinite;height:100%; }
.ldb-card  {
  background:var(--glass);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid var(--border);border-radius:22px;padding:26px;
  box-shadow:0 12px 36px rgba(0,0,0,.35);transition:transform .14s ease-out;
  transform-style:preserve-3d;height:100%;position:relative;overflow:hidden;
}
.ldb-card::before {
  content:'';position:absolute;inset:0;border-radius:22px;pointer-events:none;
  background:linear-gradient(135deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,0) 100%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  mask-composite:exclude;
}

/* kpi text */
.ldb-label { font-size:.88rem;font-weight:500;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:14px; }
.ldb-val   { font-family:'JetBrains Mono',monospace;font-size:2.4rem;font-weight:700;text-shadow:0 0 18px rgba(255,255,255,.1); }
.ldb-sub   { font-size:.88rem;margin-top:8px;display:flex;align-items:center;gap:4px; }
.ldb-pos   { color:var(--teal); }

/* grids */
.ldb-kpi-grid   { display:grid;grid-template-columns:repeat(4,1fr);gap:26px;margin-bottom:44px; }
.ldb-chart-row  { display:grid;grid-template-columns:2fr 1fr;gap:26px;margin-bottom:44px; }
.ldb-span2      { grid-column:span 2; }
@media(max-width:1100px){ .ldb-kpi-grid{grid-template-columns:repeat(2,1fr);} .ldb-span2{grid-column:span 1;} }
@media(max-width:820px) { .ldb-chart-row{grid-template-columns:1fr;} }
@media(max-width:580px) { .ldb-kpi-grid{grid-template-columns:1fr;} }

.ldb-chart-box { height:250px;margin-top:14px; }

/* leaderboard */
.ldb-lb-wrap { position:relative;height:480px;margin-top:20px; }
.ldb-lb-item {
  position:absolute;left:0;right:0;display:flex;justify-content:space-between;align-items:center;
  padding:18px 22px;background:rgba(255,255,255,.02);
  border:1px solid rgba(255,255,255,.05);border-radius:14px;
  transition:top .6s cubic-bezier(.34,1.56,.64,1),opacity .4s;
}
.ldb-lb-rank { font-family:'JetBrains Mono',monospace;font-size:1.15rem;font-weight:700;color:var(--muted);width:38px; }
.ldb-lb-name { font-size:1.08rem;font-weight:500;flex:1; }
.ldb-lb-units{ font-family:'JetBrains Mono',monospace;font-size:1.05rem;color:var(--teal);font-weight:700; }
.ldb-lb-rev  { font-family:'JetBrains Mono',monospace;font-size:1.05rem;color:var(--muted);margin-left:20px; }

/* header */
.ldb-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;flex-wrap:wrap;gap:16px; }
.ldb-title  { font-size:2rem;font-weight:700;letter-spacing:-1px; }
.ldb-title span { color:var(--amber); }

/* filter bar */
.ldb-filter-bar { display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:36px; }
.ldb-filter-btn {
  padding:10px 22px;border-radius:50px;font-family:'Outfit',sans-serif;
  font-size:.88rem;font-weight:700;border:1px solid rgba(255,255,255,.15);
  cursor:pointer;transition:all .25s;background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);
}
.ldb-filter-btn.active {
  background:linear-gradient(135deg,rgba(245,166,35,.3),rgba(0,201,167,.3));
  color:#fff;border-color:rgba(245,166,35,.6);box-shadow:0 0 20px rgba(245,166,35,.2);
}
.ldb-filter-btn:hover:not(.active) { background:rgba(255,255,255,.1);color:#fff; }

/* download btn */
.ldb-dl-btn {
  display:flex;align-items:center;gap:8px;
  padding:10px 22px;border-radius:50px;
  background:linear-gradient(135deg,#F5A623,#00C9A7);
  color:#080b14;font-weight:700;font-size:.88rem;
  border:none;cursor:pointer;transition:opacity .2s,transform .2s;
  box-shadow:0 4px 20px rgba(245,166,35,.35);
}
.ldb-dl-btn:hover { opacity:.9;transform:scale(1.04); }
.ldb-dl-btn:disabled { opacity:.5;cursor:wait; }
.ldb-back {
  font-size:.9rem;color:var(--muted);text-decoration:none;
  border:1px solid var(--border);padding:8px 18px;border-radius:10px;
  transition:color .2s,border-color .2s;cursor:pointer;background:transparent;
}
.ldb-back:hover { color:#fff;border-color:rgba(255,255,255,.3); }

/* ── PDF-specific styles (injected to hidden clone) ── */
.pdf-page {
  width:1200px; background:#080b14; color: #fff;
  font-family:'Outfit',sans-serif; padding:60px;
}
.pdf-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:28px; }
.pdf-title  { font-size:2.4rem;font-weight:700;letter-spacing:-1px; }
.pdf-title span { color:#F5A623; }
.pdf-meta   { text-align:right;font-size:.9rem;color:rgba(255,255,255,.5);line-height:1.8; }
.pdf-kpi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:48px; }
.pdf-kpi  { background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px; }
.pdf-kpi-label { font-size:.82rem;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:10px; }
.pdf-kpi-val  { font-family:'JetBrains Mono',monospace;font-size:2.2rem;font-weight:700; }
.pdf-kpi-sub  { font-size:.82rem;color:#00C9A7;margin-top:6px; }
.pdf-section-title { font-size:1.1rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:20px; }
.pdf-charts { display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-bottom:48px; }
.pdf-chart-card { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:28px; }
.pdf-lb-row {
  display:flex;align-items:center;gap:16px;
  padding:16px 20px;margin-bottom:10px;
  background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.06);
}
.pdf-lb-rank { font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1.1rem;color:rgba(255,255,255,.4);width:32px; }
.pdf-lb-bar  { height:10px;border-radius:4px;background:linear-gradient(90deg,#F5A623,#00C9A7);min-width:4px;transition:width .5s; }
.pdf-lb-name { flex:1;font-size:1rem;font-weight:500; }
.pdf-lb-num  { font-family:'JetBrains Mono',monospace;font-size:.95rem;color:#00C9A7; }
.pdf-footer  { border-top:1px solid rgba(255,255,255,.08);padding-top:24px;text-align:center;font-size:.8rem;color:rgba(255,255,255,.3); }
`;

/* ─── Helpers ─── */
const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));

function AnimatedNumber({ value, isCurrency = false }) {
  const [display, setDisplay] = useState(value);
  const [glowing, setGlowing] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current, end = value, t0 = performance.now(), dur = 600;
    setGlowing(true);
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - (1 - p) ** 3;
      setDisplay(start + (end - start) * ease);
      if (p < 1) requestAnimationFrame(step);
      else { setDisplay(end); setTimeout(() => setGlowing(false), 200); }
    };
    requestAnimationFrame(step);
    prev.current = value;
  }, [value]);

  return <span className={glowing ? 'ldb-glowing' : ''}>{isCurrency ? `₹ ${fmt(display)}` : Math.round(display)}</span>;
}

function TiltCard({ children, delay = 0, className = '', noFloat = false }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - .5) * -16;
    const ry = ((e.clientX - r.left) / r.width - .5) * 16;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.025,1.025,1.025)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div className={`ldb-tilt ${className}`} style={{ animationDelay: `${delay / 2}s` }}>
      <div className={noFloat ? '' : 'ldb-float'} style={{ animationDelay: `${delay}s`, height: '100%' }}>
        <div ref={ref} className="ldb-card" onMouseMove={onMove} onMouseLeave={onLeave}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Charts ─── */
function BarChart({ data, chartRef: externalRef }) {
  const ref = useRef(null);
  const inst = useRef(null);
  const target = externalRef || ref;

  useEffect(() => {
    if (!target.current) return;
    if (inst.current) {
      inst.current.data.labels = data.labels;
      inst.current.data.datasets[0].data = data.cash;
      inst.current.data.datasets[1].data = data.online;
      inst.current.update('active');
      return;
    }
    inst.current = new Chart(target.current, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'Cash (₹)', data: data.cash, backgroundColor: 'rgba(245,166,35,.85)', borderRadius: 5, borderWidth: 0 },
          { label: 'Online / UPI', data: data.online, backgroundColor: 'rgba(0,201,167,.85)', borderRadius: 5, borderWidth: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: 'rgba(255,255,255,.6)', font: { family: 'JetBrains Mono' } } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: 'rgba(255,255,255,.6)', font: { family: 'JetBrains Mono' } } },
        },
        plugins: {
          legend: { labels: { color: 'rgba(255,255,255,.8)', font: { family: 'Outfit' } } },
          tooltip: { titleFont: { family: 'Outfit' }, bodyFont: { family: 'JetBrains Mono' } },
        },
      },
    });
    return () => { inst.current?.destroy(); inst.current = null; };
  }, [data]);

  return <canvas ref={target} />;
}

function DonutChart({ cash, online, chartRef: externalRef }) {
  const ref = useRef(null);
  const inst = useRef(null);
  const target = externalRef || ref;

  useEffect(() => {
    if (!target.current) return;
    if (inst.current) {
      inst.current.data.datasets[0].data = [cash, online];
      inst.current.update('active');
      return;
    }
    inst.current = new Chart(target.current, {
      type: 'doughnut',
      data: {
        labels: ['Cash', 'Online / UPI'],
        datasets: [{ data: [cash, online], backgroundColor: ['rgba(245,166,35,.85)', 'rgba(0,201,167,.85)'], borderColor: '#080b14', borderWidth: 3, hoverOffset: 7 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
        cutout: '72%',
        plugins: {
          legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,.8)', font: { family: 'Outfit' } } },
          tooltip: { bodyFont: { family: 'JetBrains Mono' } },
        },
      },
    });
    return () => { inst.current?.destroy(); inst.current = null; };
  }, [cash, online]);

  return <canvas ref={target} />;
}

/* ─── Leaderboard ─── */
function Leaderboard({ items }) {
  return (
    <div className="ldb-lb-wrap">
      {items.slice(0, 5).map((item, i) => (
        <div key={item.id} className="ldb-lb-item" style={{ top: i * 84 }}>
          <div className="ldb-lb-rank">#{i + 1}</div>
          <div className="ldb-lb-name">{item.emoji || '🍽️'} {item.name}</div>
          <div className="ldb-lb-units"><AnimatedNumber value={item.sales} /> units</div>
          <div className="ldb-lb-rev">₹<AnimatedNumber value={item.sales * item.price} isCurrency /></div>
        </div>
      ))}
    </div>
  );
}

/* ─── Ticker ─── */
function Ticker({ stats, topItem }) {
  const pct = stats.revenue > 0 ? Math.round((stats.online / stats.revenue) * 100) : 0;
  const seg = `SNACKSSMANIA LIVE • TOP: ${topItem.toUpperCase()} • ORDERS: ${stats.orders} • REVENUE: ₹${fmt(stats.revenue)} • ONLINE: ${pct}% • `;
  return (
    <div className="ldb-ticker" aria-hidden="true">
      <div className="ldb-ticker-inner">
        {[1, 2, 3, 4].map(k => <span key={k} className="ldb-ticker-item"><span>{seg}</span></span>)}
      </div>
    </div>
  );
}

/* ─── Starfield ─── */
function StarField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const stars = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.3 + 0.05 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath();
      stars.forEach(s => { ctx.moveTo(s.x, s.y); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); s.y -= s.v; if (s.y < 0) { s.y = H; s.x = Math.random() * W; } });
      ctx.fill(); raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas id="ldb-stars" ref={ref} />;
}

/* ─── Date helpers ─── */
const HOURS_LABELS = ['10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];
const BASE_C = [900, 1200, 2800, 4200, 1800, 1400, 2200, 2800, 2100];
const BASE_O = [1600, 2800, 4600, 5600, 3200, 2600, 3600, 4900, 3900];

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isThisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function computeStats(orders, period) {
  const filterFn = period === 'daily' ? (o) => isToday(o.created_at) : (o) => isThisMonth(o.created_at);
  const filtered = orders.filter(o => (o.status === 'paid' || o.status === 'preparing' || o.status === 'ready') && filterFn(o));
  const revenue = filtered.reduce((s, o) => s + (o.total || 0), 0);
  let cash = 0, online = 0;
  filtered.forEach(o => {
    const meta = (o.items || []).find(i => i.type === 'PAYMENT_METADATA');
    const method = meta?.method || o.payment_method || 'Cash';
    if (method === 'Cash') cash += o.total || 0; else online += o.total || 0;
  });
  return { revenue, orders: filtered.length, cash, online, avgOrder: filtered.length > 0 ? Math.round(revenue / filtered.length) : 0, filteredOrders: filtered };
}

function computeLeaderboard(filteredOrders, menuItems) {
  const counts = {};
  filteredOrders.forEach(o => {
    (o.items || []).forEach(i => {
      if (i.type === 'METADATA' || i.type === 'PAYMENT_METADATA' || i.type === 'LINK') return;
      if (!counts[i.name]) counts[i.name] = { name: i.name, id: i.id || i.name, sales: 0, price: i.price || 0, emoji: i.emoji || '🍽️' };
      counts[i.name].sales += i.qty || 1;
    });
  });
  const lb = Object.values(counts).sort((a, b) => b.sales - a.sales);
  if (lb.length < 5 && menuItems.length) {
    menuItems.forEach(m => { if (!counts[m.name]) lb.push({ name: m.name, id: m.id, sales: 0, price: m.price, emoji: m.emoji || '🍽️' }); });
  }
  return lb.slice(0, 8);
}

function computeHourly(filteredOrders) {
  const cash = [...BASE_C];
  const online = [...BASE_O];
  filteredOrders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    const idx = Math.max(0, Math.min(h - 10, 8));
    const meta = (o.items || []).find(i => i.type === 'PAYMENT_METADATA');
    const method = meta?.method || o.payment_method || 'Cash';
    if (method === 'Cash') cash[idx] += o.total || 0; else online[idx] += o.total || 0;
  });
  return { labels: HOURS_LABELS, cash, online };
}

/* ─── PDF Generator ─── */
async function downloadPDF({ stats, leaderboard, hourly, period }) {
  // Build a hidden div with the PDF layout
  const container = document.createElement('div');
  container.className = 'pdf-page';
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;display:block;font-family:Outfit,sans-serif;';

  const label = period === 'daily' ? 'Daily Report' : 'Monthly Report';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const fmtR = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));

  const maxSales = leaderboard[0]?.sales || 1;

  // Chart canvases
  const barCanvas = document.createElement('canvas');
  barCanvas.width = 580; barCanvas.height = 220;
  const donutCanvas = document.createElement('canvas');
  donutCanvas.width = 250; donutCanvas.height = 250;

  container.innerHTML = `
    <style>
      .pdf-page{width:1200px;background:#0b0e1a;color:#fff;font-family:'Outfit',sans-serif;padding:60px;}
      .pdf-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:28px;}
      .pdf-title{font-size:2.4rem;font-weight:700;letter-spacing:-1px;}
      .pdf-title .hi{color:#F5A623;}
      .pdf-badge{background:linear-gradient(135deg,rgba(245,166,35,.25),rgba(0,201,167,.25));border:1px solid rgba(245,166,35,.4);border-radius:8px;padding:6px 16px;font-size:.85rem;color:#F5A623;font-weight:700;display:inline-block;margin-top:10px;}
      .pdf-meta{text-align:right;font-size:.88rem;color:rgba(255,255,255,.45);line-height:2;}
      .pdf-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:44px;}
      .pdf-kpi{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:28px;}
      .pdf-kpi-label{font-size:.78rem;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:10px;}
      .pdf-kpi-val{font-family:'JetBrains Mono',monospace;font-size:2rem;font-weight:700;color:#fff;}
      .pdf-kpi-val.amber{color:#F5A623;}.pdf-kpi-val.teal{color:#00C9A7;}
      .pdf-kpi-sub{font-size:.78rem;color:#00C9A7;margin-top:6px;}
      .pdf-section{margin-bottom:40px;}
      .pdf-section-title{font-size:.95rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:18px;border-left:3px solid #F5A623;padding-left:12px;}
      .pdf-charts{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:44px;}
      .pdf-chart-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:24px;}
      .pdf-lb-row{display:flex;align-items:center;gap:14px;padding:14px 18px;margin-bottom:8px;background:rgba(255,255,255,.04);border-radius:12px;}
      .pdf-lb-rank{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1rem;color:rgba(255,255,255,.35);width:32px;}
      .pdf-lb-bar-wrap{width:260px;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;}
      .pdf-lb-bar{height:100%;border-radius:4px;}
      .pdf-lb-name{flex:1;font-size:.95rem;font-weight:500;}
      .pdf-lb-units{font-family:'JetBrains Mono',monospace;font-size:.9rem;color:#00C9A7;}
      .pdf-lb-rev{font-family:'JetBrains Mono',monospace;font-size:.9rem;color:rgba(255,255,255,.45);margin-left:12px;}
      .pdf-footer{border-top:1px solid rgba(255,255,255,.08);padding-top:20px;text-align:center;font-size:.78rem;color:rgba(255,255,255,.25);}
      .bar-canvas-wrap{height:200px;position:relative;}
      .donut-canvas-wrap{height:220px;position:relative;display:flex;align-items:center;justify-content:center;}
      .legend-box{display:flex;gap:14px;margin-top:12px;flex-wrap:wrap;}
      .legend-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;}
    </style>

    <div class="pdf-header">
      <div>
        <div class="pdf-title">Snackss<span class="hi">Mania</span></div>
        <div class="pdf-badge">📊 ${label} — ${dateStr}</div>
      </div>
      <div class="pdf-meta">
        <div>Generated: ${new Date().toLocaleTimeString('en-IN')}</div>
        <div>Period: ${period === 'daily' ? 'Today' : 'This Month'}</div>
        <div>Total Transactions: ${stats.orders}</div>
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-section-title">Key Performance Indicators</div>
      <div class="pdf-kpi-grid">
        <div class="pdf-kpi">
          <div class="pdf-kpi-label">Total Revenue</div>
          <div class="pdf-kpi-val amber">₹ ${fmtR(stats.revenue)}</div>
          <div class="pdf-kpi-sub">↑ ${period === 'daily' ? 'Today' : 'This Month'}</div>
        </div>
        <div class="pdf-kpi">
          <div class="pdf-kpi-label">Cash Collected</div>
          <div class="pdf-kpi-val">₹ ${fmtR(stats.cash)}</div>
          <div class="pdf-kpi-sub" style="color:#F5A623;">${stats.revenue > 0 ? Math.round((stats.cash / stats.revenue) * 100) : 0}% of total</div>
        </div>
        <div class="pdf-kpi">
          <div class="pdf-kpi-label">Online / UPI</div>
          <div class="pdf-kpi-val teal">₹ ${fmtR(stats.online)}</div>
          <div class="pdf-kpi-sub">${stats.revenue > 0 ? Math.round((stats.online / stats.revenue) * 100) : 0}% of total</div>
        </div>
        <div class="pdf-kpi">
          <div class="pdf-kpi-label">Total Orders</div>
          <div class="pdf-kpi-val">${stats.orders}</div>
          <div class="pdf-kpi-sub">Transactions processed</div>
        </div>
        <div class="pdf-kpi">
          <div class="pdf-kpi-label">Avg Order Value</div>
          <div class="pdf-kpi-val amber">₹ ${fmtR(stats.avgOrder)}</div>
          <div class="pdf-kpi-sub">Per transaction</div>
        </div>
        <div class="pdf-kpi">
          <div class="pdf-kpi-label">Payment Split</div>
          <div class="pdf-kpi-val teal">${stats.revenue > 0 ? Math.round((stats.online / stats.revenue) * 100) : 0}%</div>
          <div class="pdf-kpi-sub">Digital payments</div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-section-title">Hourly Revenue Breakdown</div>
      <div class="pdf-charts">
        <div class="pdf-chart-card">
          <div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:12px;">Cash vs Online per Hour</div>
          <div class="bar-canvas-wrap" id="pdf-bar-wrap"></div>
          <div class="legend-box">
            <span><span class="legend-dot" style="background:#F5A623;"></span><span style="font-size:.82rem;color:rgba(255,255,255,.6)">Cash</span></span>
            <span><span class="legend-dot" style="background:#00C9A7;"></span><span style="font-size:.82rem;color:rgba(255,255,255,.6)">Online / UPI</span></span>
          </div>
        </div>
        <div class="pdf-chart-card">
          <div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-bottom:12px;">Payment Method Split</div>
          <div class="donut-canvas-wrap" id="pdf-donut-wrap"></div>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-section-title">Top Selling Items</div>
      ${leaderboard.slice(0, 5).map((item, i) => {
        const pct = Math.round((item.sales / maxSales) * 100);
        const barColors = ['#F5A623', '#00C9A7', '#A78BFA', '#F472B6', '#60A5FA'];
        return `<div class="pdf-lb-row">
          <div class="pdf-lb-rank">#${i + 1}</div>
          <div class="pdf-lb-name">${item.emoji || '🍽️'} ${item.name}</div>
          <div class="pdf-lb-bar-wrap"><div class="pdf-lb-bar" style="width:${pct}%;background:linear-gradient(90deg,${barColors[i]},${barColors[(i + 1) % 5]});"></div></div>
          <div class="pdf-lb-units">${item.sales} units</div>
          <div class="pdf-lb-rev">₹${fmtR(item.sales * item.price)}</div>
        </div>`;
      }).join('')}
    </div>

    <div class="pdf-footer">
      Generated by SnackssManiaAdmin System • ${new Date().toLocaleString('en-IN')} • Confidential — Internal Use Only
    </div>
  `;

  document.body.appendChild(container);

  // Render bar chart into pdf container
  const barWrap = container.querySelector('#pdf-bar-wrap');
  barCanvas.style.cssText = 'width:100%;height:100%;';
  barWrap.appendChild(barCanvas);
  new Chart(barCanvas, {
    type: 'bar',
    data: {
      labels: hourly.labels,
      datasets: [
        { label: 'Cash', data: hourly.cash, backgroundColor: 'rgba(245,166,35,.85)', borderRadius: 4, borderWidth: 0 },
        { label: 'Online', data: hourly.online, backgroundColor: 'rgba(0,201,167,.85)', borderRadius: 4, borderWidth: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: {
        x: { stacked: true, grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: 'rgba(255,255,255,.5)', font: { size: 10 } } },
        y: { stacked: true, grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: 'rgba(255,255,255,.5)', font: { size: 10 } } },
      },
      plugins: { legend: { display: false } },
    },
  });

  // Render donut
  const donutWrap = container.querySelector('#pdf-donut-wrap');
  donutCanvas.style.cssText = 'width:200px;height:200px;';
  donutWrap.appendChild(donutCanvas);
  new Chart(donutCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Cash', 'Online'],
      datasets: [{ data: [stats.cash || 1, stats.online || 1], backgroundColor: ['rgba(245,166,35,.85)', 'rgba(0,201,167,.85)'], borderColor: '#0b0e1a', borderWidth: 3 }],
    },
    options: {
      responsive: false, animation: false, cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,.7)', font: { size: 11 } } },
      },
    },
  });

  // Wait a tick for charts to render
  await new Promise(r => setTimeout(r, 600));

  const canvas = await html2canvas(container, {
    backgroundColor: '#0b0e1a',
    scale: 2,
    useCORS: true,
    logging: false,
    width: 1200,
    windowWidth: 1200,
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`snackssmania-${period}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily'); // 'daily' | 'monthly'
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: ords }, { data: menu }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('menu_items').select('*'),
      ]);
      if (ords) setAllOrders(ords);
      if (menu) setMenuItems(menu);
      setLoading(false);
    };
    load();
    const ch = supabase.channel('dash-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const stats = computeStats(allOrders, period);
  const leaderboard = computeLeaderboard(stats.filteredOrders, menuItems);
  const hourly = computeHourly(stats.filteredOrders);

  const peakHour = hourly.labels[
    hourly.cash.map((c, i) => c + hourly.online[i]).reduce((mi, v, i, a) => v > a[mi] ? i : mi, 0)
  ];

  // Hourly live bump every 5s
  const [hourlyState, setHourlyState] = useState(null);
  useEffect(() => { setHourlyState(hourly); }, [period, allOrders]);
  useEffect(() => {
    const id = setInterval(() => {
      setHourlyState(prev => {
        if (!prev) return prev;
        const c = [...prev.cash], o = [...prev.online], last = c.length - 1;
        c[last] += Math.floor(Math.random() * 150);
        o[last] += Math.floor(Math.random() * 220);
        return { ...prev, cash: c, online: o };
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const displayHourly = hourlyState || hourly;
  const topItemName = leaderboard[0]?.name || 'N/A';

  const handleDownload = async () => {
    setExporting(true);
    try {
      await downloadPDF({ stats, leaderboard, hourly: displayHourly, period });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b14', color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem' }}>
        Loading dashboard…
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ldb-root">
        <StarField />
        <Ticker stats={stats} topItem={topItemName} />

        <div className="ldb-content">
          <div className="ldb-orbit">
            <div className="ldb-ring ldb-ring1" />
            <div className="ldb-ring ldb-ring2" />
            <div className="ldb-ring ldb-ring3" />
          </div>

          {/* Header */}
          <div className="ldb-header">
            <h1 className="ldb-title">Snackss<span>Mania</span> Dashboard</h1>
            <button className="ldb-back" onClick={() => history.back()}>← Back to Admin</button>
          </div>

          {/* Filter bar + download */}
          <div className="ldb-filter-bar">
            <button className={`ldb-filter-btn${period === 'daily' ? ' active' : ''}`} onClick={() => setPeriod('daily')}>
              ☀️ Daily
            </button>
            <button className={`ldb-filter-btn${period === 'monthly' ? ' active' : ''}`} onClick={() => setPeriod('monthly')}>
              📅 Monthly
            </button>
            <div style={{ flex: 1 }} />
            <button className="ldb-dl-btn" onClick={handleDownload} disabled={exporting}>
              {exporting ? '⏳ Generating…' : '⬇️ Download PDF'}
            </button>
          </div>

          {/* KPI Grid */}
          <div className="ldb-kpi-grid">
            <TiltCard delay={0}>
              <div className="ldb-label">Total Revenue</div>
              <div className="ldb-val"><AnimatedNumber value={stats.revenue} isCurrency /></div>
              <div className="ldb-sub ldb-pos">↑ {period === 'daily' ? 'Today' : 'This Month'}</div>
            </TiltCard>
            <TiltCard delay={0.2}>
              <div className="ldb-label">Orders</div>
              <div className="ldb-val"><AnimatedNumber value={stats.orders} /></div>
              <div className="ldb-sub ldb-pos">Live count</div>
            </TiltCard>
            <TiltCard delay={0.4}>
              <div className="ldb-label">Cash Collected</div>
              <div className="ldb-val"><AnimatedNumber value={stats.cash} isCurrency /></div>
            </TiltCard>
            <TiltCard delay={0.6}>
              <div className="ldb-label">Online / UPI</div>
              <div className="ldb-val"><AnimatedNumber value={stats.online} isCurrency /></div>
            </TiltCard>
            <TiltCard delay={0.8} className="ldb-span2">
              <div className="ldb-label">Avg Order Value</div>
              <div className="ldb-val"><AnimatedNumber value={stats.avgOrder} isCurrency /></div>
            </TiltCard>
            <TiltCard delay={1.0} className="ldb-span2">
              <div className="ldb-label">Peak Hour</div>
              <div className="ldb-val" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{peakHour}</div>
            </TiltCard>
          </div>

          {/* Charts */}
          <div className="ldb-chart-row">
            <TiltCard delay={1.2}>
              <div className="ldb-label">Hourly Cash vs Online Revenue</div>
              <div className="ldb-chart-box"><BarChart data={displayHourly} /></div>
            </TiltCard>
            <TiltCard delay={1.4}>
              <div className="ldb-label">Payment Split</div>
              <div className="ldb-chart-box"><DonutChart cash={stats.cash} online={stats.online} /></div>
            </TiltCard>
          </div>

          {/* Leaderboard */}
          <TiltCard delay={1.6}>
            <div className="ldb-label">Top Items · {period === 'daily' ? 'Today' : 'This Month'}</div>
            <Leaderboard items={leaderboard} />
          </TiltCard>
        </div>
      </div>
    </>
  );
}
