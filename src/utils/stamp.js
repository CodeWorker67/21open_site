export const STAMP_STORAGE_KEY = 'open21_stamp';
export const STAMP_QUERY_PARAM = 'stamp';
export const PARTNER_STORAGE_KEY = 'open21_partner';
export const START_QUERY_PARAM = 'start';

const STAMP_RE = /^[a-z0-9_-]{1,100}$/;
const PARTNER_START_RE = /^partner_(\d+)$/i;

function normalizeStamp(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  if (!s || s === 'email' || !STAMP_RE.test(s)) return null;
  return s;
}

function normalizePartnerId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.trim().match(PARTNER_START_RE);
  if (!m || m[1] === '0') return null;
  return m[1];
}

function stripQueryParams(params, keys) {
  let changed = false;
  for (const key of keys) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
}

/**
 * Сохраняет метку из ?stamp=... (first-touch) и убирает параметр из URL.
 */
export function captureStampFromUrl() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get(STAMP_QUERY_PARAM);
  const stamp = normalizeStamp(raw);

  if (stamp && !localStorage.getItem(STAMP_STORAGE_KEY)) {
    localStorage.setItem(STAMP_STORAGE_KEY, stamp);
  }

  if (raw !== null) {
    stripQueryParams(params, [STAMP_QUERY_PARAM]);
  }
}

/**
 * Сохраняет партнёра из ?start=partner_{tg_id} (first-touch) и убирает параметр из URL.
 */
export function capturePartnerFromUrl() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get(START_QUERY_PARAM);
  const partnerId = normalizePartnerId(raw);

  if (partnerId && !localStorage.getItem(PARTNER_STORAGE_KEY)) {
    localStorage.setItem(PARTNER_STORAGE_KEY, partnerId);
  }

  if (raw !== null) {
    stripQueryParams(params, [START_QUERY_PARAM]);
  }
}

export function getStoredStamp() {
  if (typeof window === 'undefined') return null;
  return normalizeStamp(localStorage.getItem(STAMP_STORAGE_KEY));
}

export function clearStoredStamp() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STAMP_STORAGE_KEY);
}

export function getStoredPartner() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PARTNER_STORAGE_KEY);
  return normalizePartnerId(raw ? `partner_${raw}` : null);
}

export function clearStoredPartner() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PARTNER_STORAGE_KEY);
}

/** Метки first-touch для регистрации / первого входа через сайт. */
export function getAttributionPayload() {
  const stamp = getStoredStamp();
  const partner = getStoredPartner();
  return {
    ...(stamp && { stamp }),
    ...(partner && { partner }),
  };
}

export function clearStoredAttribution() {
  clearStoredStamp();
  clearStoredPartner();
}
