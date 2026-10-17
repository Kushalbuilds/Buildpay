import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Activity, ArrowDownToLine, ArrowUpRight, BarChart3, CalendarDays,
  Check, ChevronDown, ChevronRight, CircleDollarSign, ClipboardList,
  Clock3, Construction, Download, Eye, FileText, Filter, HardHat, LayoutDashboard,
  Menu, Pencil, PieChart as PieIcon, Plus, Search, Settings, Trash2, TrendingUp, Users,
  Wallet, X
} from 'lucide-react';
import './App.css';

/* ── Keys for localStorage ── */
const STORAGE_KEY = 'buildpay-payments-v1';
const NAMES_KEY = 'buildpay-names-v1';
const WORKTYPES_KEY = 'buildpay-worktypes-v1';
const BUDGET_KEY = 'buildpay-budget-v1';

/* ── Date / Time helpers ── */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0));
const formatDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (p) => `${formatDate(p.date)}, ${p.time || '—'}`;

/* ── Defaults ── */
const DEFAULT_NAMES = ['Santosh', 'Kedar', 'Yallappa', 'Shivappa', 'Ramesh'];
const DEFAULT_WORKTYPES = ['BS', 'Sai', 'Labour', 'Carpenter', 'Survey'];
const methods = ['Cash', 'UPI', 'Cheque'];

const initialPayments = [
  { id: 'PAY-0001', name: 'Santosh', amount: 2500, date: '2026-10-15', time: '10:30', workType: 'BS', method: 'Cash', remark: 'Foundation work', status: 'Paid' },
  { id: 'PAY-0002', name: 'Kedar', amount: 8000, date: '2026-10-15', time: '11:45', workType: 'Sai', method: 'UPI', remark: 'Sai work materials', status: 'Paid' },
  { id: 'PAY-0003', name: 'Yallappa', amount: 3000, date: '2026-10-15', time: '14:15', workType: 'Labour', method: 'Cash', remark: 'Daily labour wages', status: 'Pending' },
  { id: 'PAY-0004', name: 'Shivappa', amount: 15000, date: '2026-10-14', time: '16:20', workType: 'Carpenter', method: 'Cheque', remark: 'Door frames (Chq #582910)', status: 'Paid' },
  { id: 'PAY-0005', name: 'Ramesh', amount: 12000, date: '2026-10-13', time: '11:10', workType: 'Survey', method: 'Cheque', remark: 'Site survey charges (Chq #61092)', status: 'Pending' },
];

/* ── Helpers ── */
function readStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function createId(payments) {
  const max = payments.reduce((h, p) => {
    const m = String(p.id).match(/PAY-(\d+)/);
    return Math.max(h, m ? Number(m[1]) : 0);
  }, 0);
  return `PAY-${String(max + 1).padStart(4, '0')}`;
}
function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || '—'; }
const blankForm = (names, workTypes) => ({
  name: names[0] || '', amount: '', date: today(), time: nowTime(),
  workType: workTypes[0] || '', method: 'Cash', remark: '', status: 'Paid'
});

/* ══════════════════════════════════════════════ */
/*                    APP                          */
/* ══════════════════════════════════════════════ */
function App() {
  /* ── State ── */
  const [payments, setPayments] = useState(() => readStorage(STORAGE_KEY, initialPayments));
  const [names, setNames] = useState(() => readStorage(NAMES_KEY, DEFAULT_NAMES));
  const [workTypes, setWorkTypes] = useState(() => readStorage(WORKTYPES_KEY, DEFAULT_WORKTYPES));
  const [projectBudget, setProjectBudget] = useState(() => readStorage(BUDGET_KEY, 500000));

  const [activePage, setActivePage] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All methods');
  const [workTypeFilter, setWorkTypeFilter] = useState('All types');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('This month');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => blankForm(names, workTypes));
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWorkType, setNewWorkType] = useState('');
  const [editingBudgetInline, setEditingBudgetInline] = useState(false);
  const [inlineBudgetVal, setInlineBudgetVal] = useState(String(projectBudget));
  const [budgetInput, setBudgetInput] = useState(String(projectBudget));

  /* ── Persist ── */
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payments)); } catch {} }, [payments]);
  useEffect(() => { try { localStorage.setItem(NAMES_KEY, JSON.stringify(names)); } catch {} }, [names]);
  useEffect(() => { try { localStorage.setItem(WORKTYPES_KEY, JSON.stringify(workTypes)); } catch {} }, [workTypes]);
  useEffect(() => { try { localStorage.setItem(BUDGET_KEY, JSON.stringify(projectBudget)); } catch {} }, [projectBudget]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);

  /* ── Status Checkbox Toggle ── */
  function togglePaymentStatus(id) {
    setPayments(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Paid' ? 'Pending' : 'Paid';
        setToast(`${p.id} (${p.name}) marked as ${nextStatus}.`);
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  }

  /* ── Filtering ── */
  const filteredByDate = useMemo(() => payments.filter(p => {
    if (dateFilter === 'All time') return true;
    const d = new Date(`${p.date}T00:00:00`);
    const now = new Date();
    if (dateFilter === 'Today') return p.date === today();
    if (dateFilter === 'This month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (dateFilter === 'This year') return d.getFullYear() === now.getFullYear();
    return true;
  }).filter(p => workTypeFilter === 'All types' || p.workType === workTypeFilter)
    .filter(p => statusFilter === 'All' || p.status === statusFilter), [payments, dateFilter, workTypeFilter, statusFilter]);

  const visiblePayments = useMemo(() => filteredByDate.filter(p => {
    const hay = [p.id, p.name, p.workType, p.method, p.remark].join(' ').toLowerCase();
    const methodMatch = methodFilter === 'All methods' || p.method === methodFilter ||
      (methodFilter === 'Cheque' && (p.method === 'Cheque' || p.method === 'Check'));
    return hay.includes(query.toLowerCase()) && methodMatch;
  }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)), [filteredByDate, query, methodFilter]);

  /* ── Computed stats ── */
  const totalPaid = filteredByDate.filter(p => p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = filteredByDate.filter(p => p.status === 'Pending').reduce((s, p) => s + Number(p.amount || 0), 0);
  const todayPaid = payments.filter(p => p.date === today() && p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const todayCount = payments.filter(p => p.date === today()).length;
  const uniquePeople = new Set(payments.map(p => p.name.trim().toLowerCase())).size;
  const remaining = projectBudget - totalPaid;

  const workTypeTotals = useMemo(() => {
    const totals = {};
    filteredByDate.forEach(p => {
      const key = p.workType || 'Other';
      totals[key] = (totals[key] || 0) + Number(p.amount || 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [filteredByDate]);

  const methodTotals = useMemo(() => methods.map(method => ({
    method,
    total: filteredByDate.filter(p => {
      if (method === 'Cheque') return p.method === 'Cheque' || p.method === 'Check';
      return p.method === method;
    }).reduce((s, p) => s + Number(p.amount || 0), 0)
  })), [filteredByDate]);

  /* ── Person-wise totals ── */
  const personTotals = useMemo(() => {
    const map = {};
    payments.forEach(p => {
      const key = p.name.trim();
      if (!map[key]) map[key] = { name: key, paid: 0, pending: 0, count: 0 };
      map[key].count += 1;
      if (p.status === 'Paid') map[key].paid += Number(p.amount || 0);
      else map[key].pending += Number(p.amount || 0);
    });
    return Object.values(map).sort((a, b) => (b.paid + b.pending) - (a.paid + a.pending));
  }, [payments]);

  /* ── Chart Mode State & Data ── */
  const [barMode, setBarMode] = useState('workType'); // 'workType' | 'person'
  const [pieMode, setPieMode] = useState('mode'); // 'mode' (Cash/UPI/Cheque) | 'status' (Paid/Pending)

  const pieModeData = useMemo(() => [
    { label: 'Cash', value: filteredByDate.filter(p => p.method === 'Cash').reduce((s, p) => s + Number(p.amount || 0), 0), color: '#2563eb' }, // Blue
    { label: 'UPI', value: filteredByDate.filter(p => p.method === 'UPI').reduce((s, p) => s + Number(p.amount || 0), 0), color: '#f97316' }, // Orange
    { label: 'Cheque', value: filteredByDate.filter(p => p.method === 'Cheque' || p.method === 'Check').reduce((s, p) => s + Number(p.amount || 0), 0), color: '#ef4444' } // Red
  ], [filteredByDate]);

  const pieStatusData = useMemo(() => [
    { label: 'Paid', value: totalPaid, color: '#2563eb' }, // Blue
    { label: 'Pending', value: totalPending, color: '#f97316' } // Orange
  ], [totalPaid, totalPending]);

  const barWorkTypeData = useMemo(() => {
    const colors = ['#2563eb', '#f97316', '#ef4444', '#3b82f6', '#fb923c', '#f87171', '#60a5fa'];
    return workTypeTotals.map(([name, val], i) => ({
      label: name,
      value: val,
      color: colors[i % colors.length]
    }));
  }, [workTypeTotals]);

  const barPersonData = useMemo(() => {
    const colors = ['#2563eb', '#f97316', '#ef4444', '#3b82f6', '#fb923c', '#f87171'];
    return personTotals.slice(0, 6).map((p, i) => ({
      label: p.name,
      value: p.paid + p.pending,
      color: colors[i % colors.length]
    }));
  }, [personTotals]);

  /* ── CRUD ── */
  function openAdd() {
    setEditingId(null); setForm(blankForm(names, workTypes)); setFormError(''); setModalOpen(true);
  }
  function openEdit(payment) {
    setEditingId(payment.id);
    setForm({ ...payment, amount: String(payment.amount) });
    setFormError(''); setModalOpen(true);
  }
  function updateForm(key, value) { setForm(prev => ({ ...prev, [key]: value })); }
  function savePayment(e) {
    e.preventDefault();
    if (!form.name.trim()) return setFormError("Select or enter the person's name.");
    if (!form.amount || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) return setFormError('Enter an amount greater than zero.');
    if (!form.date) return setFormError('Choose a payment date.');
    if (!form.workType.trim()) return setFormError('Select a work type.');
    const clean = { ...form, name: form.name.trim(), amount: Number(form.amount), remark: form.remark.trim(), workType: form.workType.trim() };
    if (editingId) {
      setPayments(prev => prev.map(p => p.id === editingId ? { ...clean, id: editingId } : p));
      setToast('Payment updated successfully.');
    } else {
      setPayments(prev => [{ ...clean, id: createId(prev) }, ...prev]);
      setToast('Payment saved successfully.');
    }
    setModalOpen(false);
  }
  function confirmDelete() {
    setPayments(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null); setToast('Payment deleted.');
  }

  /* ── Excel Export (Single Export Button) ── */
  function exportExcel() {
    try {
      // ----- Payments sheet -----
      const paymentRows = visiblePayments.map(p => ({
        'Payment ID': p.id,
        'Date': p.date,
        'Time': p.time,
        'Name': p.name,
        'Work Type': p.workType,
        'Amount (₹)': p.amount,
        'Payment Mode': p.method,
        'Status': p.status,
        'Remark': p.remark,
      }));
      const wsPayments = XLSX.utils.json_to_sheet(paymentRows);

      // ----- Summary sheet -----
      const summaryData = [
        { 'Metric': 'Total Paid', 'Amount (₹)': totalPaid },
        { 'Metric': 'Total Pending', 'Amount (₹)': totalPending },
        { 'Metric': 'Project Budget (PR)', 'Amount (₹)': projectBudget },
        { 'Metric': 'Remaining Balance (PR - Paid)', 'Amount (₹)': remaining },
        { 'Metric': 'Total Transactions', 'Amount (₹)': visiblePayments.length },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      // ----- Person‑wise summary sheet -----
      const personRows = personTotals.map(p => ({
        'Name': p.name,
        'Total Paid (₹)': p.paid,
        'Total Pending (₹)': p.pending,
        'Grand Total (₹)': p.paid + p.pending,
        'Transactions': p.count,
      }));
      const wsPerson = XLSX.utils.json_to_sheet(personRows);

      // ----- Work‑type summary sheet -----
      const workTypeRows = workTypeTotals.map(([wt, amt]) => ({
        'Work Type': wt,
        'Total (₹)': amt,
      }));
      const wsWorkType = XLSX.utils.json_to_sheet(workTypeRows);

      // Assemble workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsPerson, 'Person‑wise Summary');
      XLSX.utils.book_append_sheet(wb, wsWorkType, 'Work‑Type Summary');

      // Generate workbook file and trigger download using SheetJS helper
      const filename = `BuildPay_Report_${today()}.xlsx`;
      XLSX.writeFile(wb, filename);

      setToast(`Downloaded ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      setToast('Export failed. Please try again.');
    }
  }

  /* ── Settings: add / remove names & work types ── */
  function addName(customName) {
    const n = (customName || newName).trim();
    if (!n) return;
    if (names.includes(n)) { setToast('Name already exists.'); return; }
    setNames(prev => [...prev, n]);
    setNewName('');
    setToast(`"${n}" added to names list.`);
    return n;
  }
  function removeName(n) { setNames(prev => prev.filter(x => x !== n)); setToast(`"${n}" removed.`); }
  
  function addWorkType(customType) {
    const w = (customType || newWorkType).trim();
    if (!w) return;
    if (workTypes.includes(w)) { setToast('Work type already exists.'); return; }
    setWorkTypes(prev => [...prev, w]);
    setNewWorkType('');
    setToast(`"${w}" added to work types.`);
    return w;
  }
  function removeWorkType(w) { setWorkTypes(prev => prev.filter(x => x !== w)); setToast(`"${w}" removed.`); }
  
  function saveBudget(val) {
    const v = Number(val !== undefined ? val : budgetInput);
    if (!Number.isFinite(v) || v < 0) { setToast('Enter a valid budget amount.'); return; }
    setProjectBudget(v);
    setBudgetInput(String(v));
    setInlineBudgetVal(String(v));
    setEditingBudgetInline(false);
    setToast('Project budget updated successfully.');
  }

  /* ── Navigation ── */
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Add Payment', icon: Plus },
    { label: 'Payment Register', icon: ClipboardList },
    { label: 'People', icon: Users },
    { label: 'Reports', icon: FileText },
    { label: 'Settings', icon: Settings }
  ];
  function selectNav(label) {
    if (label === 'Add Payment') { openAdd(); }
    else if (label === 'Settings') { setSettingsOpen(true); setMobileNavOpen(false); }
    else { setActivePage(label); setMobileNavOpen(false); }
  }

  /* ══════════════════════════════════════════════ */
  /*                   RENDER                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Construction size={24} strokeWidth={2.5} /></div>
          <div><div className="brand-name">BuildPay</div><div className="brand-tagline">Manage · Track · Grow</div></div>
          <button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18}/></button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => selectNav(label)}>
              <Icon size={18}/><span>{label}</span>
              {label === 'Add Payment' && <span className="nav-plus"><Plus size={14}/></span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help-icon"><HardHat size={25}/></div>
          <div><strong>Build better.</strong><span>Manage smarter.</span></div>
        </div>
        <div className="sidebar-footnote">BuildPay v2.0 · Local workspace</div>
      </aside>

      {/* ── Main ── */}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21}/></button>
          <div className="global-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, work type, remark or payment ID..." aria-label="Search payments"/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15}/></button>}</div>
          <div className="topbar-right">
            <button className="settings-quick-btn" title="Open Settings" onClick={() => setSettingsOpen(true)}><Settings size={16}/><span>Settings</span></button>
            <span className="local-badge"><span className="status-dot"></span> Local data</span>
            <div className="topbar-divider"></div>
            <div className="avatar">BP</div>
            <div className="profile-copy"><strong>Builder Admin</strong><span>Administrator</span></div>
          </div>
        </header>

        <div className="content">
          {/* ── Page heading & filters ── */}
          <div className="page-heading">
            <div>
              <div className="eyebrow">CONSTRUCTION FINANCE</div>
              <h1>{activePage}</h1>
              <p>{activePage === 'Dashboard' ? 'Overview of your construction payments, status & balance (user-editable).' : activePage === 'Payment Register' ? 'Search, review, edit, delete, and toggle status directly with checkboxes.' : activePage === 'People' ? 'Person-wise payment summary (Santosh, Kedar, Yallappa, etc).' : activePage === 'Reports' ? 'Review summaries and export all data directly to Excel.' : 'Overview'}</p>
            </div>
            <div className="heading-actions">
              <label className="date-select"><CalendarDays size={16}/><select value={dateFilter} onChange={e => setDateFilter(e.target.value)} aria-label="Date range"><option>This month</option><option>Today</option><option>This year</option><option>All time</option></select><ChevronDown size={15}/></label>
              <label className="worktype-select"><Filter size={15}/><select value={workTypeFilter} onChange={e => setWorkTypeFilter(e.target.value)} aria-label="Work type filter"><option>All types</option>{workTypes.map(w => <option key={w}>{w}</option>)}</select><ChevronDown size={15}/></label>
              <label className="status-select"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Status filter"><option value="All">All Status</option><option>Paid</option><option>Pending</option></select><ChevronDown size={15}/></label>
              <button className="btn btn-primary" onClick={exportExcel} title="Export single multi-sheet Excel spreadsheet"><Download size={16}/> Export Excel</button>
            </div>
          </div>

          {/* ── User-Editable Stats Grid ── */}
          <section className="stats-grid">
            <StatCard
              title="Total Paid"
              value={money(totalPaid)}
              hint={`${dateFilter.toLowerCase()} · Click to filter Paid`}
              icon={Wallet}
              color="green"
              clickable
              isActive={statusFilter === 'Paid'}
              onClick={() => {
                setStatusFilter(statusFilter === 'Paid' ? 'All' : 'Paid');
                setToast(statusFilter === 'Paid' ? 'Showing all status' : 'Filtered: Paid only');
              }}
            />
            <StatCard
              title="Today's Paid"
              value={money(todayPaid)}
              hint={`${todayCount} record${todayCount === 1 ? '' : 's'} · Click to view today`}
              icon={CircleDollarSign}
              color="blue"
              clickable
              isActive={dateFilter === 'Today'}
              onClick={() => {
                setDateFilter(dateFilter === 'Today' ? 'This month' : 'Today');
                setToast(dateFilter === 'Today' ? 'Reset date filter to This month' : 'Filtered: Today only');
              }}
            />
            <StatCard
              title="Pending"
              value={money(totalPending)}
              hint="Unpaid · Click to filter Pending"
              icon={Clock3}
              color="orange"
              clickable
              isActive={statusFilter === 'Pending'}
              onClick={() => {
                setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending');
                setToast(statusFilter === 'Pending' ? 'Showing all status' : 'Filtered: Pending only');
              }}
            />
            <div className="stat-card budget-card">
              <div className={`stat-icon ${remaining >= 0 ? 'purple' : 'red'}`}><TrendingUp size={21}/></div>
              <div className="stat-content" style={{ width: '100%' }}>
                <div className="stat-head-row">
                  <span className="stat-title">Balance (PR - Paid)</span>
                  <button className="budget-edit-btn" title="Edit PR Project Budget" onClick={() => { setEditingBudgetInline(!editingBudgetInline); setInlineBudgetVal(String(projectBudget)); }}>
                    <Pencil size={12}/> Edit PR
                  </button>
                </div>
                <strong className={`stat-value ${remaining < 0 ? 'text-red' : ''}`}>{money(remaining)}</strong>
                
                {editingBudgetInline ? (
                  <div className="inline-budget-editor">
                    <span className="inline-budget-label">PR Budget: ₹</span>
                    <input
                      type="number"
                      value={inlineBudgetVal}
                      onChange={e => setInlineBudgetVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveBudget(inlineBudgetVal); }}
                      autoFocus
                    />
                    <button className="btn-save-mini" onClick={() => saveBudget(inlineBudgetVal)} title="Save PR Budget"><Check size={13}/></button>
                    <button className="btn-cancel-mini" onClick={() => setEditingBudgetInline(false)} title="Cancel"><X size={13}/></button>
                  </div>
                ) : (
                  <span className="stat-hint" onClick={() => setEditingBudgetInline(true)} style={{ cursor: 'pointer' }} title="Click to edit PR Budget">
                    PR Budget: <strong>{money(projectBudget)}</strong> · <u>change</u>
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* ── Page content ── */}
          {activePage === 'People' ? (
            <PeoplePage personTotals={personTotals} query={query} onSearch={setQuery} />
          ) : activePage === 'Reports' ? (
            <section className="reports-grid">
              <div className="panel report-panel">
                <div className="panel-heading"><div><h2>Payment summary</h2><p>Based on the selected date range</p></div><FileText size={20}/></div>
                <div className="report-total">{money(totalPaid)}</div>
                <div className="report-label">Total paid till date</div>
                <div className="report-stat-row"><span>Pending</span><strong>{money(totalPending)}</strong></div>
                <div className="report-stat-row"><span>Transactions</span><strong>{filteredByDate.length}</strong></div>
                <div className="report-stat-row"><span>Project Budget (PR)</span><strong>{money(projectBudget)}</strong></div>
                <div className="report-stat-row"><span>Remaining Balance</span><strong className={remaining < 0 ? 'text-red' : ''}>{money(remaining)}</strong></div>
                <button className="btn btn-primary full-width" onClick={exportExcel}><Download size={16}/> Export Excel Spreadsheet</button>
              </div>

              {/* Pie Chart Panel in Reports */}
              <div className="panel report-panel chart-report-panel">
                <div className="panel-heading">
                  <div><h2>Payment Distribution (Pie)</h2><p>{pieMode === 'mode' ? 'Cash vs UPI vs Cheque breakdown' : 'Paid vs Pending proportion'}</p></div>
                  <div className="chart-mode-toggle">
                    <button className={pieMode === 'mode' ? 'active' : ''} onClick={() => setPieMode('mode')}>Mode</button>
                    <button className={pieMode === 'status' ? 'active' : ''} onClick={() => setPieMode('status')}>Status</button>
                  </div>
                </div>
                <DonutPieChart
                  data={pieMode === 'mode' ? pieModeData : pieStatusData}
                  centerLabel={pieMode === 'mode' ? 'Recorded' : 'Total'}
                  centerValue={money(totalPaid + totalPending)}
                />
              </div>

              {/* Bar Graph Panel in Reports */}
              <div className="panel report-panel chart-report-panel">
                <div className="panel-heading">
                  <div><h2>Spending Bar Graph</h2><p>{barMode === 'workType' ? 'Spending by Work Category' : 'Top Contractors Spending'}</p></div>
                  <div className="chart-mode-toggle">
                    <button className={barMode === 'workType' ? 'active' : ''} onClick={() => setBarMode('workType')}>Work Type</button>
                    <button className={barMode === 'person' ? 'active' : ''} onClick={() => setBarMode('person')}>People</button>
                  </div>
                </div>
                <VerticalBarGraph data={barMode === 'workType' ? barWorkTypeData : barPersonData} />
              </div>

              <div className="panel report-panel">
                <div className="panel-heading"><div><h2>Person-wise summary</h2><p>Total paid to each person till now</p></div><Users size={20}/></div>
                <div className="person-report-list">{personTotals.map(p => <div className="report-stat-row" key={p.name}><span>{p.name}</span><div><strong className="paid-text" style={{ marginRight: '8px' }}>Paid: {money(p.paid)}</strong><small style={{ color: '#c47a1a' }}>(Pending: {money(p.pending)})</small></div></div>)}</div>
              </div>
            </section>
          ) : (
            <>
              {activePage === 'Dashboard' && <section className="insights-grid">
                {/* ── Vertical Bar Graph Panel ── */}
                <div className="panel bar-graph-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Spending Bar Graph</h2>
                      <p>{barMode === 'workType' ? 'Spending by Category' : 'Spending by Contractor'} · {dateFilter.toLowerCase()}</p>
                    </div>
                    <div className="panel-header-actions">
                      <div className="chart-mode-toggle">
                        <button className={barMode === 'workType' ? 'active' : ''} onClick={() => setBarMode('workType')}>Work Type</button>
                        <button className={barMode === 'person' ? 'active' : ''} onClick={() => setBarMode('person')}>People</button>
                      </div>
                      <span className="heading-icon"><BarChart3 size={17}/></span>
                    </div>
                  </div>
                  <VerticalBarGraph data={barMode === 'workType' ? barWorkTypeData : barPersonData} />
                </div>

                {/* ── Donut Pie Chart Panel ── */}
                <div className="panel pie-chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Distribution (Pie Chart)</h2>
                      <p>{pieMode === 'mode' ? 'Cash vs UPI vs Cheque' : 'Paid vs Pending Ratio'}</p>
                    </div>
                    <div className="panel-header-actions">
                      <div className="chart-mode-toggle">
                        <button className={pieMode === 'mode' ? 'active' : ''} onClick={() => setPieMode('mode')}>Mode</button>
                        <button className={pieMode === 'status' ? 'active' : ''} onClick={() => setPieMode('status')}>Status</button>
                      </div>
                      <span className="heading-icon"><PieIcon size={17}/></span>
                    </div>
                  </div>
                  <DonutPieChart
                    data={pieMode === 'mode' ? pieModeData : pieStatusData}
                    centerLabel={pieMode === 'mode' ? 'Recorded' : 'Total'}
                    centerValue={money(totalPaid + totalPending)}
                  />
                </div>

                {/* ── Recent Payments ── */}
                <div className="panel recent-panel">
                  <div className="panel-heading"><div><h2>Recent payments</h2><p>Check status or edit directly</p></div><button className="text-link" onClick={() => setActivePage('Payment Register')}>View all <ChevronRight size={15}/></button></div>
                  {visiblePayments.slice(0, 4).length ? (
                    <div className="recent-list">
                      {visiblePayments.slice(0, 4).map(p => (
                        <div className="recent-item" key={p.id}>
                          <div className="person-avatar">{initials(p.name)}</div>
                          <div className="recent-info">
                            <strong>{p.name}</strong>
                            <span>{p.workType} · {p.remark || '—'}</span>
                            <small>{formatDateTime(p)}</small>
                          </div>
                          <div className="recent-amount">
                            <strong>{money(p.amount)}</strong>
                            <label className="status-toggle-wrap mini" title={`Click checkbox to toggle: currently ${p.status}`}>
                              <input
                                type="checkbox"
                                className="status-check"
                                checked={p.status === 'Paid'}
                                onChange={() => togglePaymentStatus(p.id)}
                              />
                              <span className={`status-badge-mini interactive ${p.status.toLowerCase()}`}>
                                {p.status === 'Paid' ? <Check size={10} strokeWidth={2.8}/> : <Clock3 size={10}/>}
                                {p.status}
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState text="No matching payments found."/>}
                </div>
              </section>}

              {/* ── Payment Register Table ── */}
              <section className="panel register-panel">
                <div className="register-heading">
                  <div>
                    <h2>Payment Register</h2>
                    <p>Click checkboxes to toggle Paid/Pending. All records user-editable.</p>
                  </div>
                  <div className="register-actions">
                    <label className="filter-select"><Filter size={15}/><select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} aria-label="Filter by method"><option>All methods</option>{methods.map(m => <option key={m}>{m}</option>)}</select><ChevronDown size={14}/></label>
                    <button className="btn btn-outline" onClick={exportExcel}><ArrowDownToLine size={16}/> Export Excel</button>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Payment</button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date & time</th>
                        <th>Name</th>
                        <th>Work Type</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th style={{ minWidth: '120px' }}>Status (Checkbox)</th>
                        <th>Remark</th>
                        <th className="actions-heading">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePayments.map(p => (
                        <tr key={p.id}>
                          <td><span className="payment-id">{p.id}</span></td>
                          <td><span className="date-cell">{formatDate(p.date)}</span><small className="time-cell">{p.time}</small></td>
                          <td><div className="table-person"><div className="person-avatar small">{initials(p.name)}</div><strong>{p.name}</strong></div></td>
                          <td><span className="worktype-badge">{p.workType}</span></td>
                          <td><strong className="amount-cell">{money(p.amount)}</strong></td>
                          <td><MethodBadge method={p.method}/></td>
                          <td>
                            <label className="status-toggle-wrap" title={`Click to mark as ${p.status === 'Paid' ? 'Pending' : 'Paid'}`}>
                              <input
                                type="checkbox"
                                className="status-check"
                                checked={p.status === 'Paid'}
                                onChange={() => togglePaymentStatus(p.id)}
                              />
                              <span className={`status-badge interactive ${p.status.toLowerCase()}`}>
                                {p.status === 'Paid' ? <Check size={11} strokeWidth={3}/> : <Clock3 size={11}/>}
                                {p.status}
                              </span>
                            </label>
                          </td>
                          <td><span className="purpose-cell">{p.remark || '—'}</span></td>
                          <td>
                            <div className="row-actions">
                              <button className="mini-icon" title="View details" onClick={() => setViewPayment(p)}><Eye size={15}/></button>
                              <button className="mini-icon" title="Edit payment" onClick={() => openEdit(p)}><Pencil size={15}/></button>
                              <button className="mini-icon danger" title="Delete payment" onClick={() => setDeleteTarget(p)}><Trash2 size={15}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!visiblePayments.length && <tr><td colSpan="9"><EmptyState text="No payments match your search or filters." actionLabel="Add a payment" onAction={openAdd}/></td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer"><span>Showing <strong>{visiblePayments.length}</strong> of <strong>{payments.length}</strong> payment records</span><span className="footer-note"><span className="status-dot"></span> Saved locally in this browser</span></div>
              </section>
              <div className="content-foot">© {new Date().getFullYear()} BuildPay · Construction Payment & Register Management.</div>
            </>
          )}
        </div>
      </main>

      {/* ── Overlays ── */}
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)}></button>}
      {modalOpen && (
        <PaymentModal
          form={form}
          updateForm={updateForm}
          onSubmit={savePayment}
          onClose={() => setModalOpen(false)}
          editing={Boolean(editingId)}
          error={formError}
          names={names}
          workTypes={workTypes}
          onAddNewName={(n) => {
            const added = addName(n);
            if (added) updateForm('name', added);
          }}
          onAddNewWorkType={(w) => {
            const added = addWorkType(w);
            if (added) updateForm('workType', added);
          }}
        />
      )}
      {viewPayment && <ViewModal payment={viewPayment} onClose={() => setViewPayment(null)} onEdit={() => { setViewPayment(null); openEdit(viewPayment); }}/>}
      {deleteTarget && <ConfirmModal payment={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete}/>}
      {settingsOpen && <SettingsModal names={names} workTypes={workTypes} newName={newName} setNewName={setNewName} addName={addName} removeName={removeName} newWorkType={newWorkType} setNewWorkType={setNewWorkType} addWorkType={addWorkType} removeWorkType={removeWorkType} budgetInput={budgetInput} setBudgetInput={setBudgetInput} saveBudget={saveBudget} onClose={() => setSettingsOpen(false)} />}
      {toast && <div className="toast"><span className="toast-check"><Check size={16}/></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*             SUB-COMPONENTS                     */
/* ══════════════════════════════════════════════ */

function StatCard({ title, value, hint, icon: Icon, color, clickable, onClick, isActive }) {
  return (
    <div
      className={`stat-card ${clickable ? 'clickable' : ''} ${isActive ? 'active-filter' : ''}`}
      onClick={clickable ? onClick : undefined}
      title={clickable ? 'Click to toggle filter' : undefined}
    >
      <div className={`stat-icon ${color}`}><Icon size={21}/></div>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-hint">{hint}</span>
      </div>
    </div>
  );
}

function MethodBadge({ method }) {
  const m = (method || '').toLowerCase();
  let badgeClass = 'cash';
  if (m.includes('upi')) badgeClass = 'upi';
  else if (m.includes('cheque') || m.includes('check')) badgeClass = 'cheque';
  else if (m.includes('bank')) badgeClass = 'bank-transfer';
  return <span className={`method-badge ${badgeClass}`}>{method}</span>;
}

/* ── Vertical Bar Graph Component ── */
function VerticalBarGraph({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const maxValue = Math.max(...data.map(d => Number(d.value || 0)), 1);

  if (!data || data.length === 0 || maxValue === 1) {
    return (
      <div className="chart-empty-state">
        <BarChart3 size={24}/>
        <p>No payments recorded in this category yet</p>
      </div>
    );
  }

  return (
    <div className="bar-graph-wrapper">
      <div className="bar-graph-plot">
        {/* Y Axis Gridlines */}
        <div className="bar-graph-grid">
          <div className="grid-line"><span>{money(maxValue)}</span></div>
          <div className="grid-line"><span>{money(Math.round(maxValue / 2))}</span></div>
          <div className="grid-line baseline"><span>₹0</span></div>
        </div>

        {/* Bars Container */}
        <div className="bar-columns-area">
          {data.map((item, idx) => {
            const heightPercent = Math.max(6, Math.min(100, Math.round((item.value / maxValue) * 100)));
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={item.label}
                className={`bar-column-group ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                <div className={`bar-tooltip ${isHovered ? 'visible' : ''}`}>
                  <strong>{money(item.value)}</strong>
                  <span>{item.label}</span>
                </div>

                <div className="bar-val-pill">{item.value >= 1000 ? `₹${Math.round(item.value / 1000)}k` : `₹${item.value}`}</div>

                <div className="bar-track-vertical">
                  <div
                    className="bar-fill-vertical"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: item.color || '#2674f5'
                    }}
                  >
                    <span className="bar-fill-glow" />
                  </div>
                </div>

                <div className="bar-column-label" title={item.label}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── SVG Donut / Pie Chart Component ── */
function DonutPieChart({ data, centerLabel = "Total", centerValue }) {
  const total = data.reduce((s, d) => s + Number(d.value || 0), 0);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!total || total <= 0) {
    return (
      <div className="chart-empty-state">
        <PieIcon size={24}/>
        <p>No payment breakdown available</p>
      </div>
    );
  }

  // Pre-calculate segments
  let currentAngle = 0;
  const radius = 56;
  const strokeWidth = 22;
  const center = 75;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="donut-chart-container">
      <div className="donut-svg-wrap">
        <svg viewBox="0 0 150 150" className="donut-svg">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f0f4fa"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            if (!item.value || item.value <= 0) return null;
            const fraction = item.value / total;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const strokeDashoffset = -(currentAngle / 360) * circumference;
            currentAngle += fraction * 360;
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="donut-segment"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${center}px ${center}px`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              />
            );
          })}
        </svg>

        <div className="donut-center-info">
          <span className="donut-center-lbl">{hoveredIdx !== null ? data[hoveredIdx].label : centerLabel}</span>
          <strong className="donut-center-val">{hoveredIdx !== null ? money(data[hoveredIdx].value) : centerValue || money(total)}</strong>
          {hoveredIdx !== null && (
            <small className="donut-center-pct">{Math.round((data[hoveredIdx].value / total) * 100)}%</small>
          )}
        </div>
      </div>

      <div className="donut-legend">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100) || 0;
          return (
            <div
              key={item.label}
              className={`donut-legend-item ${hoveredIdx === idx ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span className="legend-color-dot" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.label}</span>
              <strong className="legend-value">{money(item.value)}</strong>
              <span className="legend-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ text, actionLabel, onAction }) {
  return <div className="empty-state"><div className="empty-icon"><ClipboardList size={21}/></div><p>{text}</p>{actionLabel && <button className="text-link" onClick={onAction}>{actionLabel}</button>}</div>;
}

/* ── Payment Modal with On-the-fly Name/WorkType additions and Checkbox Status ── */
function PaymentModal({ form, updateForm, onSubmit, onClose, editing, error, names, workTypes, onAddNewName, onAddNewWorkType }) {
  const [addingName, setAddingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [addingWorkType, setAddingWorkType] = useState(false);
  const [customWorkTypeInput, setCustomWorkTypeInput] = useState('');

  function handleCreateName() {
    const trimmed = customNameInput.trim();
    if (trimmed) {
      onAddNewName(trimmed);
      setCustomNameInput('');
      setAddingName(false);
    }
  }

  function handleCreateWorkType() {
    const trimmed = customWorkTypeInput.trim();
    if (trimmed) {
      onAddNewWorkType(trimmed);
      setCustomWorkTypeInput('');
      setAddingWorkType(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <div className="modal-header">
          <div>
            <div className="modal-kicker">{editing ? 'UPDATE RECORD' : 'NEW TRANSACTION'}</div>
            <h2 id="payment-modal-title">{editing ? 'Edit payment' : 'Add a payment'}</h2>
            <p>Auto-timestamped date & time with auto-balance calculation.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close form"><X size={19}/></button>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            {/* Name with inline add */}
            <div className="field">
              <div className="field-header">
                <span>Name <b>*</b></span>
                {!addingName ? (
                  <button type="button" className="field-action-btn" onClick={() => setAddingName(true)}>+ New name</button>
                ) : (
                  <button type="button" className="field-action-btn cancel" onClick={() => setAddingName(false)}>Choose existing</button>
                )}
              </div>
              {!addingName ? (
                <select value={form.name} onChange={e => updateForm('name', e.target.value)} required>
                  <option value="">— Select Contractor / Person —</option>
                  {names.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              ) : (
                <div className="inline-add-row">
                  <input
                    value={customNameInput}
                    onChange={e => setCustomNameInput(e.target.value)}
                    placeholder="Enter new name..."
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateName(); } }}
                  />
                  <button type="button" className="btn btn-primary btn-xs" onClick={handleCreateName}>Add</button>
                </div>
              )}
            </div>

            {/* Work Type with inline add */}
            <div className="field">
              <div className="field-header">
                <span>Work Type <b>*</b></span>
                {!addingWorkType ? (
                  <button type="button" className="field-action-btn" onClick={() => setAddingWorkType(true)}>+ New type</button>
                ) : (
                  <button type="button" className="field-action-btn cancel" onClick={() => setAddingWorkType(false)}>Choose existing</button>
                )}
              </div>
              {!addingWorkType ? (
                <select value={form.workType} onChange={e => updateForm('workType', e.target.value)} required>
                  <option value="">— Select Work Type —</option>
                  {workTypes.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              ) : (
                <div className="inline-add-row">
                  <input
                    value={customWorkTypeInput}
                    onChange={e => setCustomWorkTypeInput(e.target.value)}
                    placeholder="e.g. Plumbing, Electrician..."
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateWorkType(); } }}
                  />
                  <button type="button" className="btn btn-primary btn-xs" onClick={handleCreateWorkType}>Add</button>
                </div>
              )}
            </div>

            <label className="field">
              <span>Amount (₹) <b>*</b></span>
              <div className="amount-input">
                <span>₹</span>
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => updateForm('amount', e.target.value)} placeholder="0.00" required/>
              </div>
            </label>

            <label className="field">
              <span>Payment Mode <b>*</b></span>
              <select value={form.method} onChange={e => updateForm('method', e.target.value)}>
                {methods.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Payment Date <b>*</b></span>
              <input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)} required/>
            </label>

            <label className="field">
              <span>Payment Time (Auto)</span>
              <input type="time" value={form.time} onChange={e => updateForm('time', e.target.value)}/>
            </label>

            <label className="field full">
              <span>Remark</span>
              <textarea value={form.remark} onChange={e => updateForm('remark', e.target.value)} placeholder="e.g. Foundation material, site survey charges..." rows="2" maxLength="500"/>
            </label>

            {/* Payment Status Checkbox */}
            <div className="field full status-field">
              <span>Payment Status (Checkbox) <b>*</b></span>
              <label className="checkbox-status-card">
                <input
                  type="checkbox"
                  checked={form.status === 'Paid'}
                  onChange={e => updateForm('status', e.target.checked ? 'Paid' : 'Pending')}
                />
                <span className={`status-checkbox-indicator ${form.status === 'Paid' ? 'paid' : 'pending'}`}>
                  {form.status === 'Paid' ? <Check size={16} strokeWidth={3}/> : <Clock3 size={16}/>}
                  <strong>{form.status === 'Paid' ? 'Paid' : 'Pending'}</strong>
                </span>
                <span className="checkbox-status-help">
                  {form.status === 'Paid' ? '✓ Marked as fully paid' : '⏳ Marked as pending / due payment (uncheck/check to toggle)'}
                </span>
              </label>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}
          
          <div className="modal-footer">
            <span className="required-note"><b>*</b> Required fields · Stored locally</span>
            <div>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Check size={16}/>{editing ? 'Save changes' : 'Save payment'}</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ── View Modal ── */
function ViewModal({ payment: p, onClose, onEdit }) {
  const items = [['Payment ID', p.id], ['Name', p.name], ['Work Type', p.workType], ['Amount', money(p.amount)], ['Date & time', formatDateTime(p)], ['Payment Mode', p.method], ['Status', p.status], ['Remark', p.remark || 'No remark']];
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="modal-header">
          <div><div className="modal-kicker">PAYMENT DETAILS</div><h2 id="detail-title">Transaction record</h2><p>{p.id}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close details"><X size={19}/></button>
        </div>
        <div className="detail-amount">
          <span>Amount</span>
          <strong>{money(p.amount)}</strong>
          <span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span>
          <MethodBadge method={p.method}/>
        </div>
        <div className="detail-list">{items.map(([label, value]) => <div className="detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <div className="modal-footer"><span className="required-note">Saved locally</span><div><button className="btn btn-outline" onClick={onClose}>Close</button><button className="btn btn-primary" onClick={onEdit}><Pencil size={15}/> Edit payment</button></div></div>
      </section>
    </div>
  );
}

/* ── Confirm Delete Modal ── */
function ConfirmModal({ payment, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <section className="modal-card confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="confirm-icon"><Trash2 size={23}/></div>
        <h2 id="delete-title">Delete this payment?</h2>
        <p>This will permanently remove <strong>{payment.id}</strong> for <strong>{payment.name}</strong> from this browser's saved records.</p>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onCancel}>Keep payment</button>
          <button className="btn btn-danger" onClick={onConfirm}><Trash2 size={15}/> Delete payment</button>
        </div>
      </section>
    </div>
  );
}

/* ── Settings Modal ── */
function SettingsModal({ names, workTypes, newName, setNewName, addName, removeName, newWorkType, setNewWorkType, addWorkType, removeWorkType, budgetInput, setBudgetInput, saveBudget, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-header">
          <div><div className="modal-kicker">CONFIGURATION</div><h2 id="settings-title">Settings</h2><p>Manage contractor names, work types, and project budget.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings"><X size={19}/></button>
        </div>
        <div className="settings-body">
          {/* Project Budget */}
          <div className="settings-section">
            <h3>Project Budget (PR)</h3>
            <p>Set total project budget (PR). Balance = PR - Total Paid.</p>
            <div className="settings-row">
              <div className="amount-input" style={{ flex: 1 }}><span>₹</span><input type="number" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} placeholder="Enter budget..." /></div>
              <button className="btn btn-primary" onClick={() => saveBudget()}><Check size={14}/> Save</button>
            </div>
          </div>

          {/* Names */}
          <div className="settings-section">
            <h3>Contractor / Worker Names</h3>
            <p>Add new names or remove existing ones (Santosh, Kedar, Yallappa, etc).</p>
            <div className="settings-row">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter new name..." onKeyDown={e => e.key === 'Enter' && addName()} />
              <button className="btn btn-primary" onClick={() => addName()}><Plus size={14}/> Add Name</button>
            </div>
            <div className="tag-list">{names.map(n => <span key={n} className="tag">{n}<button onClick={() => removeName(n)} title={`Remove ${n}`}><X size={12}/></button></span>)}</div>
          </div>

          {/* Work Types */}
          <div className="settings-section">
            <h3>Work Types</h3>
            <p>Add work types (BS, Sai, Labour, Carpenter, Survey, etc).</p>
            <div className="settings-row">
              <input value={newWorkType} onChange={e => setNewWorkType(e.target.value)} placeholder="Enter new work type..." onKeyDown={e => e.key === 'Enter' && addWorkType()} />
              <button className="btn btn-primary" onClick={() => addWorkType()}><Plus size={14}/> Add Work Type</button>
            </div>
            <div className="tag-list">{workTypes.map(w => <span key={w} className="tag">{w}<button onClick={() => removeWorkType(w)} title={`Remove ${w}`}><X size={12}/></button></span>)}</div>
          </div>
        </div>
        <div className="modal-footer"><span className="required-note">Changes saved automatically in localStorage</span><div><button className="btn btn-outline" onClick={onClose}>Close</button></div></div>
      </section>
    </div>
  );
}

/* ── People Page ── */
function PeoplePage({ personTotals, query, onSearch }) {
  const filtered = personTotals.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="panel register-panel people-panel">
      <div className="register-heading">
        <div><h2>People & Contractors Summary</h2><p>Person-wise report: "How much paid to Shivappa / Santosh till now?"</p></div>
        <div className="register-actions">
          <div className="inline-search"><Search size={16}/><input value={query} onChange={e => onSearch(e.target.value)} placeholder="Search people..."/></div>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Person Name</th>
              <th>Total Paid Till Date</th>
              <th>Pending Amount</th>
              <th>Grand Total</th>
              <th>Total Transactions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.name}>
                <td><div className="table-person"><div className="person-avatar small">{initials(p.name)}</div><strong>{p.name}</strong></div></td>
                <td><strong className="amount-cell paid-text">{money(p.paid)}</strong></td>
                <td><strong className="amount-cell pending-text">{money(p.pending)}</strong></td>
                <td><strong className="amount-cell">{money(p.paid + p.pending)}</strong></td>
                <td><span className="badge-count">{p.count} record{p.count === 1 ? '' : 's'}</span></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan="5"><EmptyState text="No people found matching your query."/></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer"><span><strong>{filtered.length}</strong> unique contractors / people recorded</span></div>
    </section>
  );
}

export default App;