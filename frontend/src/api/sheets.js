import { apiBaseUrl } from '../config/api';

function getToken() {
  return localStorage.getItem('villa_checklist_token') || '';
}

export async function getVillas() {
  const res = await fetch(apiBaseUrl + '/api/villas');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load villas');
  return data;
}

export async function getInventory(villaId) {
  const res = await fetch(apiBaseUrl + '/api/inventory?villaId=' + encodeURIComponent(villaId));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load inventory');
  return data;
}

function clearStoredAuth() {
  localStorage.removeItem('villa_checklist_token');
  localStorage.removeItem('villa_checklist_user');
}

export async function submitCheckRun(villaId, items) {
  const res = await fetch(apiBaseUrl + '/api/check-runs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken(),
    },
    body: JSON.stringify({ villaId, items }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearStoredAuth();
    throw new Error(data.error || 'Session expired');
  }
  if (!res.ok) throw new Error(data.error || 'Failed to submit check');
  return data;
}
