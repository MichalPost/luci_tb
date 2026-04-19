'use strict';
'require baseclass';

var css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --blue-50:  #eff6ff;
  --blue-100: #dbeafe;
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;
  --blue-900: #1e3a8a;
  --slate-50:  #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,.07), 0 10px 30px rgba(0,0,0,.1);
  --transition: .18s cubic-bezier(.4,0,.2,1);
}

#ts-app * { box-sizing: border-box; font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif; }

/* 突破 LuCI 父容器宽度限制 */
#ts-app {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0 48px;
  color: var(--slate-800);
}

/* ── Hero header ── */
.ts-hero {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #0ea5e9 100%);
  border-radius: var(--radius);
  padding: 36px 40px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.ts-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.ts-hero-left { position: relative; z-index: 1; }
.ts-hero h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -.3px;
}
.ts-hero p {
  margin: 0;
  font-size: 14px;
  color: rgba(255,255,255,.75);
  font-weight: 400;
}
.ts-hero-badge {
  position: relative; z-index: 1;
  background: rgba(255,255,255,.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 50px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 7px;
}
.ts-hero-badge:hover { background: rgba(255,255,255,.25); }
.ts-hero-badge .dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74,222,128,.3);
  flex-shrink: 0;
}
.ts-hero-badge .dot.off { background: var(--slate-400); box-shadow: none; }
.ts-hero-badge .dot.running {
  background: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251,191,36,.3);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

/* ── Grid layout ── */
.ts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.ts-grid.full { grid-template-columns: 1fr; }
@media (max-width: 760px) { .ts-grid { grid-template-columns: 1fr; } }

/* ── Card ── */
.ts-card {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: box-shadow var(--transition);
}
.ts-card:hover { box-shadow: var(--shadow-md); }
.ts-card-head {
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--slate-100);
  display: flex;
  align-items: center;
  gap: 10px;
}
.ts-card-icon {
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  background: var(--blue-50);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.ts-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--slate-700);
  margin: 0;
}
.ts-card-body { padding: 22px 24px; }

/* ── Form fields ── */
.ts-field { margin-bottom: 14px; }
.ts-field:last-child { margin-bottom: 0; }
.ts-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--slate-500);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.ts-input, .ts-select {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid var(--slate-200);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--slate-800);
  background: var(--slate-50);
  transition: border-color var(--transition), box-shadow var(--transition);
  outline: none;
  appearance: none;
}
.ts-input:focus, .ts-select:focus {
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
  background: #fff;
}
.ts-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer; }
.ts-input-row { display: flex; gap: 8px; }
.ts-input-row .ts-select { flex: 1; }

/* ── Toggle switch ── */
.ts-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--slate-100);
}
.ts-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
.ts-toggle-row:first-child { padding-top: 0; }
.ts-toggle-label { font-size: 14px; color: var(--slate-700); font-weight: 500; }
.ts-toggle-desc { font-size: 12px; color: var(--slate-400); margin-top: 2px; }
.ts-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
.ts-switch input { opacity: 0; width: 0; height: 0; }
.ts-switch-track {
  position: absolute; inset: 0;
  background: var(--slate-200);
  border-radius: 11px;
  cursor: pointer;
  transition: background var(--transition);
}
.ts-switch-track::after {
  content: '';
  position: absolute;
  left: 3px; top: 3px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform var(--transition);
}
.ts-switch input:checked + .ts-switch-track { background: var(--blue-500); }
.ts-switch input:checked + .ts-switch-track::after { transform: translateX(18px); }

/* ── Account cards ── */
.ts-account-list { display: flex; flex-direction: column; gap: 10px; }
.ts-account-item {
  border: 1.5px solid var(--slate-200);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  background: var(--slate-50);
  transition: border-color var(--transition);
  position: relative;
}
.ts-account-item.enabled { border-color: var(--blue-200, #bfdbfe); background: var(--blue-50); }
.ts-account-item-head {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.ts-account-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: var(--blue-500);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ts-account-name { font-size: 14px; font-weight: 600; color: var(--slate-700); flex: 1; }
.ts-account-del {
  width: 28px; height: 28px;
  border: none; background: none; cursor: pointer;
  border-radius: 6px;
  color: var(--slate-400);
  font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition), color var(--transition);
}
.ts-account-del:hover { background: #fee2e2; color: #ef4444; }
.ts-account-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 500px) { .ts-account-fields { grid-template-columns: 1fr; } }
.ts-account-fields .ts-field.full { grid-column: 1/-1; }

/* ── Add account button ── */
.ts-add-btn {
  width: 100%;
  padding: 11px;
  border: 1.5px dashed var(--slate-300);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--slate-500);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color var(--transition), color var(--transition), background var(--transition);
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.ts-add-btn:hover { border-color: var(--blue-400); color: var(--blue-600); background: var(--blue-50); }

/* ── Blacklist tags ── */
.ts-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.ts-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--blue-50); border: 1px solid var(--blue-100);
  color: var(--blue-700); border-radius: 20px;
  padding: 3px 10px 3px 12px; font-size: 12px; font-weight: 500;
}
.ts-tag-del {
  background: none; border: none; cursor: pointer;
  color: var(--blue-400); font-size: 14px; line-height: 1;
  padding: 0; display: flex; align-items: center;
}
.ts-tag-del:hover { color: #ef4444; }
.ts-tag-input-row { display: flex; gap: 6px; margin-top: 8px; }
.ts-tag-input-row .ts-input { flex: 1; }
.ts-tag-add {
  padding: 9px 14px;
  background: var(--blue-500); color: #fff;
  border: none; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background var(--transition);
  white-space: nowrap;
}
.ts-tag-add:hover { background: var(--blue-600); }

/* ── Action buttons ── */
.ts-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ts-btn {
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600;
  border: none; cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px;
  transition: all var(--transition);
  letter-spacing: .1px;
}
.ts-btn-primary {
  background: linear-gradient(135deg, var(--blue-500), var(--blue-600));
  color: #fff;
  box-shadow: 0 2px 8px rgba(37,99,235,.35);
}
.ts-btn-primary:hover { background: linear-gradient(135deg, var(--blue-600), var(--blue-700)); box-shadow: 0 4px 14px rgba(37,99,235,.45); transform: translateY(-1px); }
.ts-btn-primary:active { transform: translateY(0); }
.ts-btn-secondary {
  background: var(--slate-100);
  color: var(--slate-700);
  border: 1.5px solid var(--slate-200);
}
.ts-btn-secondary:hover { background: var(--slate-200); }
.ts-btn-run {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16,185,129,.35);
}
.ts-btn-run:hover { background: linear-gradient(135deg, #047857, #059669); box-shadow: 0 4px 14px rgba(16,185,129,.45); transform: translateY(-1px); }
.ts-btn:disabled { opacity: .55; cursor: not-allowed; transform: none !important; }

/* ── Status panel ── */
.ts-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px,1fr)); gap: 10px; margin-bottom: 16px; }
.ts-stat-box {
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  text-align: center;
}
.ts-stat-num { font-size: 26px; font-weight: 700; color: var(--blue-600); line-height: 1; margin-bottom: 4px; }
.ts-stat-label { font-size: 11px; color: var(--slate-400); font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }
.ts-stat-box.success .ts-stat-num { color: #059669; }
.ts-stat-box.warn    .ts-stat-num { color: #d97706; }
.ts-stat-box.danger  .ts-stat-num { color: #dc2626; }

.ts-acc-results { display: flex; flex-direction: column; gap: 8px; }
.ts-acc-result {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.ts-acc-result .name { font-weight: 600; color: var(--slate-700); min-width: 80px; }
.ts-acc-result .msg  { color: var(--slate-500); flex: 1; font-size: 12px; }
.ts-state-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.ts-state-pill.success { background: #dcfce7; color: #15803d; }
.ts-state-pill.partial { background: #fef3c7; color: #92400e; }
.ts-state-pill.failed  { background: #fee2e2; color: #991b1b; }
.ts-state-pill.running { background: #dbeafe; color: #1d4ed8; }
.ts-state-pill.idle    { background: var(--slate-100); color: var(--slate-500); }

.ts-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.ts-meta-item { font-size: 13px; color: var(--slate-500); display: flex; align-items: center; gap: 5px; }
.ts-meta-item strong { color: var(--slate-700); }
.ts-summary-strip {
  display:flex; flex-wrap:wrap; gap:10px;
  margin-bottom:14px;
}
.ts-summary-chip {
  padding:8px 12px;
  border-radius:999px;
  background:var(--slate-50);
  border:1px solid var(--slate-200);
  font-size:12px;
  color:var(--slate-600);
}
.ts-summary-chip strong { color:var(--slate-800); margin-left:4px; }
.ts-log-details {
  border:1px solid var(--slate-200);
  border-radius:var(--radius-sm);
  background:var(--slate-50);
  overflow:hidden;
}
.ts-log-details summary {
  list-style:none;
  cursor:pointer;
  padding:12px 14px;
  font-size:13px;
  font-weight:600;
  color:var(--slate-700);
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.ts-log-details summary::-webkit-details-marker { display:none; }
.ts-log-tools {
  display:flex; align-items:center; justify-content:space-between;
  gap:8px; flex-wrap:wrap; padding:0 14px 10px;
}

/* ── Log box ── */
.ts-log {
  background: #0f172a;
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #94a3b8;
  max-height: 340px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.ts-log .log-ok    { color: #4ade80; }
.ts-log .log-warn  { color: #fbbf24; }
.ts-log .log-error { color: #f87171; }
.ts-log .log-info  { color: #7dd3fc; }

/* ── Save bar ── */
.ts-save-bar {
  position: sticky; bottom: 0;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--slate-200);
  padding: 14px 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border-radius: 0 0 var(--radius) var(--radius);
  margin-top: 20px;
}
.ts-save-hint { font-size: 13px; color: var(--slate-500); }
.ts-save-hint.dirty { color: var(--blue-600); font-weight: 500; }

/* ── Spinner ── */
@keyframes spin { to { transform: rotate(360deg); } }
.ts-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}
.ts-spinner.dark {
  border-color: rgba(37,99,235,.2);
  border-top-color: var(--blue-500);
}

/* ── Toast ── */
.ts-toast-wrap {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
}
.ts-toast {
  background: var(--slate-800);
  color: #fff;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 500;
  box-shadow: var(--shadow-md);
  display: flex; align-items: center; gap: 8px;
  animation: slideIn .25s ease;
  pointer-events: auto;
  max-width: 320px;
}
.ts-toast.ok    { background: #065f46; }
.ts-toast.error { background: #7f1d1d; }
.ts-toast.warn  { background: #78350f; }
@keyframes slideIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: none; } }
@keyframes fadeOut { to { opacity:0; transform: translateX(20px); } }

/* ── QR Login Modal ── */
.ts-qr-modal {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(15,23,42,.6);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeInBg .2s ease;
}
@keyframes fadeInBg { from{opacity:0} to{opacity:1} }
.ts-qr-box {
  background: #fff;
  border-radius: 16px;
  padding: 32px 36px;
  width: 320px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  text-align: center;
  animation: popIn .25s cubic-bezier(.34,1.56,.64,1);
}
@keyframes popIn { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:none} }
.ts-qr-title {
  font-size: 17px; font-weight: 700;
  color: var(--slate-800); margin: 0 0 4px;
}
.ts-qr-sub {
  font-size: 12px; color: var(--slate-400); margin: 0 0 20px;
}
.ts-qr-img-wrap {
  width: 200px; height: 200px;
  margin: 0 auto 16px;
  border: 2px solid var(--slate-200);
  border-radius: 12px;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--slate-50);
  position: relative;
}
.ts-qr-img-wrap img { width: 100%; height: 100%; object-fit: contain; }
.ts-qr-img-wrap .ts-qr-overlay {
  position: absolute; inset: 0;
  background: rgba(255,255,255,.92);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; font-size: 13px; color: var(--slate-600);
  border-radius: 10px;
}
.ts-qr-status {
  font-size: 13px; font-weight: 500;
  color: var(--slate-600); margin-bottom: 16px;
  min-height: 20px;
}
.ts-qr-status.ok    { color: #059669; }
.ts-qr-status.scan  { color: var(--blue-600); }
.ts-qr-status.error { color: #dc2626; }
.ts-qr-actions { display: flex; gap: 8px; justify-content: center; }
.ts-qr-close {
  padding: 9px 20px;
  border: 1.5px solid var(--slate-200);
  border-radius: var(--radius-sm);
  background: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--slate-600);
  transition: background var(--transition);
}
.ts-qr-close:hover { background: var(--slate-100); }
.ts-qr-refresh {
  padding: 9px 20px;
  border: none; border-radius: var(--radius-sm);
  background: var(--blue-500); color: #fff;
  cursor: pointer; font-size: 13px; font-weight: 500;
  transition: background var(--transition);
}
.ts-qr-refresh:hover { background: var(--blue-600); }
/* Corner scan decoration */
.ts-qr-img-wrap::before, .ts-qr-img-wrap::after {
  content: ''; position: absolute;
  width: 20px; height: 20px;
  border-color: var(--blue-500); border-style: solid;
  z-index: 1;
}
.ts-qr-img-wrap::before { top: 6px; left: 6px; border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
.ts-qr-img-wrap::after  { bottom: 6px; right: 6px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

/* ── Forums section ── */
.ts-forums-section { margin-top: 16px; }
.ts-forums-head {
  display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
  margin-bottom: 14px;
}
.ts-forums-head .meta { font-size:12px; color:var(--slate-400); margin-top:4px; }
.ts-forums-account-tabs {
  display:flex; gap:4px; flex-wrap:wrap; margin:0 0 14px;
}
.ts-forums-account-tab {
  padding:8px 14px; border-radius:10px; border:1.5px solid var(--slate-200);
  background:var(--slate-50); color:var(--slate-500); cursor:pointer;
  font-size:13px; font-weight:600; transition:var(--transition);
}
.ts-forums-account-tab.active {
  background:#fff; color:var(--blue-600); border-color:var(--blue-500);
  box-shadow:0 1px 2px rgba(37,99,235,.08);
}
.ts-forums-stats {
  display:flex; gap:12px; flex-wrap:wrap; padding:16px 20px; border-bottom:1px solid var(--slate-100);
}
.ts-forums-stat { text-align:center; min-width:80px; }
.ts-forums-stat-num { font-size:22px; font-weight:700; line-height:1; color:var(--blue-600); }
.ts-forums-stat-num.green { color:#059669; }
.ts-forums-stat-num.gray { color:var(--slate-400); }
.ts-forums-stat-num.red { color:#dc2626; }
.ts-forums-stat-label { font-size:11px; color:var(--slate-400); text-transform:uppercase; letter-spacing:.4px; margin-top:3px; }
.ts-forums-updated { margin-left:auto; font-size:12px; color:var(--slate-400); align-self:center; }
.ts-forums-toolbar {
  padding:12px 20px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  border-bottom:1px solid var(--slate-100);
}
.ts-forums-search {
  flex:1; min-width:180px; padding:8px 12px;
  border:1.5px solid var(--slate-200); border-radius:8px; font-size:13px; outline:none;
  transition:border-color var(--transition), box-shadow var(--transition);
}
.ts-forums-search:focus { border-color:var(--blue-500); box-shadow:0 0 0 3px rgba(59,130,246,.12); }
.ts-forums-filter {
  padding:7px 14px; border-radius:20px; border:1.5px solid var(--slate-200);
  background:none; font-size:12px; font-weight:600; color:var(--slate-500); cursor:pointer; transition:var(--transition);
}
.ts-forums-filter.active { background:var(--blue-500); color:#fff; border-color:var(--blue-500); }
.ts-forums-wrap { overflow-x:auto; }
.ts-forums-empty { padding:42px 20px; text-align:center; color:var(--slate-400); font-size:14px; }
.ts-forums-table { width:100%; border-collapse:collapse; }
.ts-forums-table th {
  padding:10px 16px; text-align:left; font-size:11px; font-weight:600;
  color:var(--slate-400); text-transform:uppercase; letter-spacing:.4px;
  background:var(--slate-50); border-bottom:1px solid var(--slate-200);
}
.ts-forums-table td {
  padding:10px 16px; font-size:13px; color:var(--slate-700);
  border-bottom:1px solid var(--slate-100); vertical-align:middle;
}
.ts-forums-table tr:hover td { background:var(--slate-50); }
.ts-forums-name { font-weight:600; }
.ts-forums-badge {
  display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600;
}
.ts-forums-badge.signed { background:#dcfce7; color:#15803d; }
.ts-forums-badge.already { background:#dbeafe; color:#1d4ed8; }
.ts-forums-badge.unsigned { background:#f1f5f9; color:#64748b; }
.ts-forums-badge.banned { background:#fee2e2; color:#991b1b; }
.ts-forums-badge.blacklist { background:#fef3c7; color:#92400e; }
.ts-forums-actions { display:flex; gap:8px; flex-wrap:wrap; }
.ts-forums-console {
  margin-top:14px;
  border:1px solid var(--slate-200);
  border-radius:var(--radius-sm);
  background:#0f172a;
  overflow:hidden;
}
.ts-forums-console-head {
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:10px 14px;
  background:#111827;
  border-bottom:1px solid rgba(148,163,184,.18);
}
.ts-forums-console-title {
  font-size:12px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; color:#cbd5e1;
}
.ts-forums-console-status {
  font-size:11px; color:#93c5fd;
}
.ts-forums-console-actions { display:flex; gap:6px; }
.ts-forums-console-btn {
  padding:4px 10px;
  border-radius:999px;
  border:1px solid rgba(148,163,184,.25);
  background:none;
  color:#cbd5e1;
  font-size:11px;
  cursor:pointer;
}
.ts-forums-console-btn:hover { background:rgba(148,163,184,.12); }
.ts-forums-console-body {
  min-height:120px;
  max-height:260px;
  overflow:auto;
  padding:12px 14px;
  font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;
  font-size:12px;
  line-height:1.7;
  color:#94a3b8;
  white-space:pre-wrap;
  word-break:break-all;
}
.ts-forums-console-body .log-ok { color:#4ade80; }
.ts-forums-console-body .log-warn { color:#fbbf24; }
.ts-forums-console-body .log-error { color:#f87171; }
.ts-forums-console-body .log-info { color:#7dd3fc; }

/* ── Stats tab (10-day history) ── */
.ts-stats-toolbar { display:flex; justify-content:flex-end; margin-bottom:12px; }
.ts-stats-hint { font-size:13px; color:var(--slate-500); margin:0; line-height:1.5; }
.ts-stats-empty { font-size:14px; color:var(--slate-500); padding:12px 0; line-height:1.6; }
.ts-stats-empty code { font-size:12px; color:var(--slate-700); }
.ts-stats-scroll { overflow-x:auto; border:1px solid var(--slate-200); border-radius:var(--radius-sm); background:#fff; }
.ts-stats-table { width:100%; border-collapse:collapse; font-size:13px; }
.ts-stats-table th, .ts-stats-table td {
  padding:10px 12px; text-align:left; border-bottom:1px solid var(--slate-200); vertical-align:top;
}
.ts-stats-table th { background:var(--slate-50); font-weight:600; color:var(--slate-600); white-space:nowrap; }
.ts-stats-table tr:last-child td { border-bottom:none; }
.ts-stats-table .ts-stats-num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
.ts-stats-ts { white-space:nowrap; color:var(--slate-600); font-size:12px; }
.ts-stats-accounts { font-size:12px; color:var(--slate-600); line-height:1.45; max-width:min(420px, 40vw); word-break:break-word; }
.ts-stats-code { font-size:12px; }
`;

return baseclass.extend({ css: css });
