require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sheetsLib = require('./lib/sheets');

const app = express();
const PORT = process.env.PORT || 3002;
const SHEET_ID = process.env.SHEET_ID || '1p5Rg2aYi0BI84224T1TL9XYsExzEBR-Qkm1tAK5lU08';

// In-memory sessions: token -> { staffId, name, login }
const sessions = new Map();
function createToken() {
  return 'tk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

async function initSheets() {
  const creds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'villa-checklist-key.json');
  try {
    await sheetsLib.init(creds || keyPath);
    console.log('✅ Google Sheets API ready');
  } catch (e) {
    console.error('❌ Sheets init failed:', e.message);
  }
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim() || (req.body && req.body.token);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Session expired' });
  req.staff = session;
  next();
}

// --- Auth ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body || {};
    if (!login || password === undefined) return res.status(400).json({ error: 'login and password required' });
    const rows = await sheetsLib.readSheet(SHEET_ID, 'Staff');
    const staffRows = sheetsLib.rowsToObjects(rows);
    const staff = staffRows.find(r => String(r.login || '').trim().toLowerCase() === String(login).trim().toLowerCase());
    if (!staff) return res.status(401).json({ error: 'Invalid login or password' });
    const stored = String(staff.password != null ? staff.password : '').trim();
    if (stored !== String(password).trim()) return res.status(401).json({ error: 'Invalid login or password' });
    const token = createToken();
    const staffId = String(staff.staff_id != null ? staff.staff_id : '').trim();
    const name = String(staff.name != null ? staff.name : '').trim();
    sessions.set(token, { staffId, name, login: String(login).trim() });
    res.json({ ok: true, token, staffId, name, login: String(login).trim() });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.body?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// --- Villas ---
app.get('/api/villas', async (req, res) => {
  try {
    const rows = await sheetsLib.readSheet(SHEET_ID, 'Villas');
    const list = sheetsLib.rowsToObjects(rows);
    const out = list.map(r => ({
      villa_id: r.villa_id,
      villa_name: r.villa_name,
      notes: r.notes,
    })).filter(r => r.villa_id);
    res.json(out);
  } catch (e) {
    console.error('Villas error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// --- Inventory (filter by villa) ---
app.get('/api/inventory', async (req, res) => {
  try {
    const villaId = req.query.villaId || req.query.villa_id;
    if (!villaId) return res.status(400).json({ error: 'villaId required' });
    const rows = await sheetsLib.readSheet(SHEET_ID, 'Inventory');
    const list = sheetsLib.rowsToObjects(rows);
    const filtered = list.filter(r => String(r.villa_id || '').trim().toLowerCase() === String(villaId).trim().toLowerCase());
    const active = filtered.filter(r => r.is_active !== 'FALSE' && r.is_active !== '0');
    const sorted = active.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || (a.category || '').localeCompare(b.category || '') || (a.item_name || '').localeCompare(b.item_name || ''));
    res.json(sorted);
  } catch (e) {
    console.error('Inventory error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// --- Check runs: create run + log entries ---
// Short IDs: RUN-YYMMDD-HHMM, check_id = RUN-YYMMDD-HHMM-N, checked_at = YYYY-MM-DD HH:mm
function shortRunId(villaId) {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return `RUN-${yy}${mm}${dd}-${hh}${mn}`;
}
function shortCheckedAt() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

// --- Check-ins: read and create ---
// Check_Ins columns: check_in_id, villa_id, check_in, check_out, name, number_of_nights, booking_platform
function shortCheckInId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const prefix = `CI-${yy}${mm}${dd}`;
  return prefix;
}

app.get('/api/check-ins', async (req, res) => {
  try {
    const villaId = req.query.villaId || req.query.villa_id;
    const from = req.query.from;
    const to = req.query.to;
    const rows = await sheetsLib.readSheet(SHEET_ID, 'Check_Ins');
    const list = sheetsLib.rowsToObjects(rows);
    let filtered = list.filter(r => r.check_in_id);
    if (villaId) {
      filtered = filtered.filter(r => String(r.villa_id || '').trim().toLowerCase() === String(villaId).trim().toLowerCase());
    }
    if (from) {
      filtered = filtered.filter(r => {
        const d = String(r.check_in || '').trim();
        return d && d >= from;
      });
    }
    if (to) {
      filtered = filtered.filter(r => {
        const d = String(r.check_out || '').trim();
        return d && d <= to;
      });
    }
    const sorted = filtered.sort((a, b) => {
      const da = String(a.check_in || '').trim();
      const db = String(b.check_in || '').trim();
      return db.localeCompare(da);
    });
    res.json(sorted);
  } catch (e) {
    console.error('Check-ins GET error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.post('/api/check-ins', requireAuth, async (req, res) => {
  try {
    const { villaId, checkIn, checkOut, name, numberOfNights, bookingPlatform } = req.body || {};
    if (!villaId || !checkIn || !checkOut || !name) {
      return res.status(400).json({ error: 'villaId, checkIn, checkOut and name required' });
    }
    const prefix = shortCheckInId();
    const rows = await sheetsLib.readSheet(SHEET_ID, 'Check_Ins');
    const list = sheetsLib.rowsToObjects(rows);
    const todayIds = list.filter(r => String(r.check_in_id || '').startsWith(prefix)).map(r => r.check_in_id);
    let seq = 1;
    for (const id of todayIds) {
      const m = /-(\d+)$/.exec(id);
      if (m) seq = Math.max(seq, parseInt(m[1], 10) + 1);
    }
    const checkInId = `${prefix}-${String(seq).padStart(3, '0')}`;
    const numNights = numberOfNights != null ? String(numberOfNights).trim() : '';
    const platform = String(bookingPlatform ?? '').trim();
    const row = [
      checkInId,
      String(villaId).trim(),
      String(checkIn).trim(),
      String(checkOut).trim(),
      String(name).trim(),
      numNights,
      platform,
    ];
    await sheetsLib.appendRow(SHEET_ID, 'Check_Ins', row);
    res.json({ ok: true, checkInId });
  } catch (e) {
    console.error('Check-ins POST error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

// --- Check runs: create run + log entries ---
app.post('/api/check-runs', requireAuth, async (req, res) => {
  try {
    const { villaId, items } = req.body || {};
    const staff = req.staff;
    if (!villaId || !Array.isArray(items)) return res.status(400).json({ error: 'villaId and items array required' });

    const now = new Date();
    const checkRunId = shortRunId(villaId);
    const checkedAt = shortCheckedAt();

    const runRow = [
      checkRunId,
      String(villaId).trim(),
      checkedAt,
      checkedAt,
      staff.name || staff.staffId || staff.login,
    ];
    await sheetsLib.appendRow(SHEET_ID, 'Check_Runs', runRow);

    // Check_Log columns (order must match sheet): check_id, villa_id, item_id, check_run_id, checked_at, item_name, status, quantity_ok, notes, checked_by
    const logRowsToAppend = items.map((item, i) => {
      const checkId = `${checkRunId}-${i}`;
      const itemName = String(item.item_name ?? item.itemName ?? '').trim();
      const status = String(item.status || 'OK').trim();
      const qtyOk = item.quantityOk != null ? String(item.quantityOk) : (item.quantity_ok != null ? String(item.quantity_ok) : '');
      const notes = String(item.notes ?? '').trim();
      const checkedBy = staff.name || staff.staffId || staff.login;
      return [
        checkId,                    // 1. check_id
        String(villaId).trim(),     // 2. villa_id
        String(item.itemId ?? item.item_id ?? '').trim(), // 3. item_id
        checkRunId,                // 4. check_run_id
        checkedAt,                 // 5. checked_at
        itemName,                  // 6. item_name
        status,                    // 7. status
        qtyOk,                     // 8. quantity_ok
        notes,                     // 9. notes
        checkedBy,                 // 10. checked_by
      ];
    });
    await sheetsLib.appendRows(SHEET_ID, 'Check_Log', logRowsToAppend);

    res.json({ ok: true, checkRunId });
  } catch (e) {
    console.error('Check-runs error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', sheets: sheetsLib.isReady(), timestamp: new Date().toISOString() });
});

initSheets().then(() => {
  app.listen(PORT, () => {
    console.log('Villa Checklist backend on http://localhost:' + PORT);
    console.log('Health: http://localhost:' + PORT + '/health');
  });
}).catch(() => {
  app.listen(PORT, () => {
    console.log('Villa Checklist backend on http://localhost:' + PORT + ' (Sheets not connected)');
  });
});
