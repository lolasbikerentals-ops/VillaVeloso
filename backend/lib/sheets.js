/**
 * Google Sheets helpers for Villa Checklist.
 * Expects sheets: Villas, Inventory, Check_Log, Check_Runs, Staff
 * Column names as per plan (competed_at, checked_by, login, password).
 */

const { google } = require('googleapis');
const path = require('path');

let sheets = null;
let auth = null;

function quoteSheetName(name) {
  if (!name) return name;
  const stripped = String(name).replace(/^'|'$/g, '');
  if (/[^A-Za-z0-9_]/.test(stripped)) return `'${stripped}'`;
  return stripped;
}

async function init(credentialsPathOrJson) {
  let authOptions = {};
  if (typeof credentialsPathOrJson === 'string' && credentialsPathOrJson.startsWith('{')) {
    try {
      const credentials = JSON.parse(credentialsPathOrJson);
      authOptions = { credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
    } catch (e) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: ' + e.message);
    }
  } else {
    const keyPath = credentialsPathOrJson || path.join(__dirname, '..', 'villa-checklist-key.json');
    authOptions = { keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
  }
  auth = new google.auth.GoogleAuth(authOptions);
  const client = await auth.getClient();
  sheets = google.sheets({ version: 'v4', auth: client });
  return true;
}

function getSheets() {
  if (!sheets) throw new Error('Sheets API not initialized');
  return sheets;
}

function isReady() {
  return !!sheets;
}

async function readSheet(spreadsheetId, sheetName, rangeA1 = 'A:Z') {
  const s = getSheets();
  const quoted = quoteSheetName(sheetName);
  const range = `${quoted}!${rangeA1}`;
  const res = await s.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values || [];
  return rows;
}

function rowsToObjects(rows, headerRowIndex = 0) {
  if (rows.length <= headerRowIndex) return [];
  const headers = rows[headerRowIndex].map(h => String(h || '').trim().toLowerCase().replace(/\s+/g, '_'));
  const out = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    headers.forEach((h, j) => {
      const v = row[j];
      obj[h] = v === undefined || v === null ? '' : (typeof v === 'string' ? v.trim() : v);
    });
    out.push(obj);
  }
  return out;
}

async function appendRow(spreadsheetId, sheetName, values) {
  const s = getSheets();
  const quoted = quoteSheetName(sheetName);
  const range = `${quoted}!A:Z`;
  const res = await s.spreadsheets.values.get({ spreadsheetId, range: `${quoted}!A:A` });
  const existing = res.data.values || [];
  const nextRow = Math.max(2, existing.length + 1);
  const writeRange = `${quoted}!A${nextRow}:${columnLetter(values.length)}${nextRow}`;
  await s.spreadsheets.values.update({
    spreadsheetId,
    range: writeRange,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  });
  return nextRow;
}

async function appendRows(spreadsheetId, sheetName, rowsOfValues) {
  const s = getSheets();
  const quoted = quoteSheetName(sheetName);
  const res = await s.spreadsheets.values.get({ spreadsheetId, range: `${quoted}!A:A` });
  const existing = res.data.values || [];
  let startRow = Math.max(2, existing.length + 1);
  const numRows = rowsOfValues.length;
  const numCols = Math.max(...rowsOfValues.map(r => r.length));
  const endRow = startRow + numRows - 1;
  const endCol = columnLetter(numCols);
  const range = `${quoted}!A${startRow}:${endCol}${endRow}`;
  await s.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rowsOfValues },
  });
  return startRow;
}

function columnLetter(n) {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s || 'A';
}

module.exports = { init, getSheets, isReady, readSheet, rowsToObjects, appendRow, appendRows, quoteSheetName };
