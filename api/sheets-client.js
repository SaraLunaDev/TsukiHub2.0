/**
 * NewWeb/api/sheets-client.js
 *
 * Lightweight Google Sheets client for serverless functions.
 * - Uses service account credentials via env vars:
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY  (with \n represented as `\n`)
 * - Creates a signed JWT (RS256) using Node's native `crypto`,
 *   exchanges it for an access token, and calls Sheets REST API via `fetch`.
 *
 * Exports:
 * - getValues(sheetId, range)
 * - appendValues(sheetId, range, values)
 * - updateValues(sheetId, range, values)
 * - clearCache() (utility)
 *
 * Notes:
 * - No external dependencies (avoids bundling `googleapis`).
 * - Throws on HTTP/auth errors so callers can handle or forward them.
 */

import crypto from "crypto";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
let cachedAccessToken = null;
let cachedTokenExpiryMs = 0;

/** base64url encode Buffer or string */
function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getPrivateKey() {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  return raw ? raw.replace(/\\n/g, "\n") : null;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    const err = new Error(`Invalid JSON response from ${url}: ${text}`);
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const msg = data.error_description || data.error || text || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.response = data;
    throw err;
  }
  return data;
}

async function getAccessToken() {
  // Reuse cached token if still valid (1 minute safety margin)
  if (cachedAccessToken && Date.now() < cachedTokenExpiryMs - 60 * 1000) {
    return cachedAccessToken;
  }

  const privateKey = getPrivateKey();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!privateKey || !email) {
    throw new Error("Google credentials missing (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY)");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: SCOPES.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey);
  const encodedSignature = base64UrlEncode(signature);

  const jwt = `${signingInput}.${encodedSignature}`;

  const params = new URLSearchParams();
  params.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  params.set("assertion", jwt);

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const tokenData = await fetchJson(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!tokenData.access_token || !tokenData.expires_in) {
    throw new Error("Failed to obtain Google access token");
  }

  cachedAccessToken = tokenData.access_token;
  cachedTokenExpiryMs = Date.now() + tokenData.expires_in * 1000;
  return cachedAccessToken;
}

/**
 * Get values for a range.
 * Returns the JSON returned by Sheets API (contains `.values`).
 */
async function getValues(sheetId, range) {
  if (!sheetId) throw new Error("sheetId is required");
  if (!range) throw new Error("range is required");

  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  return await fetchJson(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Append rows to a range (valueInputOption=USER_ENTERED).
 * `values` must be an array of rows (each row is an array of cell values).
 */
async function appendValues(sheetId, range, values) {
  if (!sheetId) throw new Error("sheetId is required");
  if (!range) throw new Error("range is required");
  if (!Array.isArray(values)) throw new Error("values must be an array of rows (arrays)");

  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  return await fetchJson(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

/**
 * Update an exact range (valueInputOption=USER_ENTERED).
 * `values` is an array of rows (arrays).
 */
async function updateValues(sheetId, range, values) {
  if (!sheetId) throw new Error("sheetId is required");
  if (!range) throw new Error("range is required");
  if (!Array.isArray(values)) throw new Error("values must be an array of rows (arrays)");

  const token = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  return await fetchJson(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

/** Utility to clear cached token (useful for tests) */
function clearCache() {
  cachedAccessToken = null;
  cachedTokenExpiryMs = 0;
}

export { getValues, appendValues, updateValues, clearCache };
