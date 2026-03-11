import crypto from "crypto";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
let cachedAccessToken = null;
let cachedTokenExpiryMs = 0;

function base64UrlEncode(input) {
	const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
	return buf
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
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
		const msg =
			data.error_description ||
			data.error ||
			text ||
			`HTTP ${res.status}`;
		const err = new Error(msg);
		err.status = res.status;
		err.response = data;
		throw err;
	}
	return data;
}

async function getAccessToken() {
	if (cachedAccessToken && Date.now() < cachedTokenExpiryMs - 60 * 1000) {
		return cachedAccessToken;
	}

	const privateKey = getPrivateKey();
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	if (!privateKey || !email) {
		throw new Error(
			"Google credentials missing (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY)",
		);
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

async function getValues(sheetId, range) {
	if (!sheetId) throw new Error("sheetId is required");
	if (!range) throw new Error("range is required");

	const token = await getAccessToken();
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
	return await fetchJson(url, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

async function appendValues(sheetId, range, values) {
	if (!sheetId) throw new Error("sheetId is required");
	if (!range) throw new Error("range is required");
	if (!Array.isArray(values))
		throw new Error("values must be an array of rows (arrays)");

	const token = await getAccessToken();
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
	return await fetchJson(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ values }),
	});
}

async function updateValues(sheetId, range, values) {
	if (!sheetId) throw new Error("sheetId is required");
	if (!range) throw new Error("range is required");
	if (!Array.isArray(values))
		throw new Error("values must be an array of rows (arrays)");

	const token = await getAccessToken();
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
	return await fetchJson(url, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ values }),
	});
}

async function deleteRows(sheetId, sheetName, startRowIndex, endRowIndex) {
	if (!sheetId) throw new Error("sheetId is required");
	if (!sheetName) throw new Error("sheetName is required");
	if (typeof startRowIndex !== "number")
		throw new Error("startRowIndex must be a number");
	if (typeof endRowIndex !== "number")
		throw new Error("endRowIndex must be a number");

	const token = await getAccessToken();

	const sheetMetadata = await fetchJson(
		`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);

	const sheet = sheetMetadata.sheets.find(
		(s) => s.properties.title === sheetName,
	);
	if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

	const sheetIdInt = sheet.properties.sheetId;

	const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}:batchUpdate`;
	return await fetchJson(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			requests: [
				{
					deleteDimension: {
						range: {
							sheetId: sheetIdInt,
							dimension: "ROWS",
							startIndex: startRowIndex,
							endIndex: endRowIndex,
						},
					},
				},
			],
		}),
	});
}

function clearCache() {
	cachedAccessToken = null;
	cachedTokenExpiryMs = 0;
}

export { getValues, appendValues, updateValues, deleteRows, clearCache };
