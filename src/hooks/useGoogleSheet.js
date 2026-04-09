import { useState, useEffect, useCallback, useRef } from "react";
import useLocalStorage from "./useLocalStorage";

const memoryCache = new Map();
const fetchPromises = new Map();

function parseCSVRow(row) {
	const result = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < row.length; i++) {
		const char = row[i];
		if (char === '"') {
			if (inQuotes && row[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			result.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	result.push(current);
	return result;
}

function parseCSV(csvText) {
	const rows = csvText.split("\n").filter((row) => row.trim());
	if (rows.length < 2) throw new Error("Datos insuficientes");
	const headers = parseCSVRow(rows[0]).map((h) => h.trim());
	return rows.slice(1).map((row) => {
		const columns = parseCSVRow(row);
		return headers.reduce((item, header, index) => {
			let value = columns[index]?.trim() || "";
			if (value.startsWith('"') && value.endsWith('"')) {
				value = value.slice(1, -1).replace(/""/g, '"');
			}
			const numValue = parseFloat(value);
			item[header] =
				/[a-zA-Z]/.test(value) || value !== numValue.toString()
					? value
					: numValue;
			return item;
		}, {});
	});
}

export function useGoogleSheet(sheetUrl, tabName = "default") {
	const cacheKey = `gsheet_cache_${sheetUrl}_${tabName}`;
	const [localData, setLocalData] = useLocalStorage(cacheKey, []);
	const [data, setData] = useState(
		() => memoryCache.get(cacheKey) ?? localData ?? [],
	);
	const [loading, setLoading] = useState(
		() =>
			!memoryCache.has(cacheKey) &&
			(!localData || localData.length === 0),
	);
	const [error, setError] = useState(null);

	const fetchData = useCallback(async () => {
		if (!sheetUrl) {
			setLoading(false);
			return;
		}

		if (memoryCache.has(cacheKey)) {
			setData(memoryCache.get(cacheKey));
			setLoading(false);
			return;
		}

		if (!fetchPromises.has(cacheKey)) {
			fetchPromises.set(
				cacheKey,
				fetch(sheetUrl)
					.then((res) => {
						if (!res.ok) throw new Error(`HTTP ${res.status}`);
						return res.text();
					})
					.then((csvText) => parseCSV(csvText))
					.finally(() => fetchPromises.delete(cacheKey)),
			);
		}

		try {
			const parsedData = await fetchPromises.get(cacheKey);
			memoryCache.set(cacheKey, parsedData);
			setData(parsedData);
			setLocalData(parsedData);
			setError(null);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [sheetUrl, cacheKey, setLocalData]);

	const refetch = useCallback(() => {
		memoryCache.delete(cacheKey);
		setLoading(true);
		fetchData();
	}, [cacheKey, fetchData]);

	const silentRefetch = useCallback(async () => {
		if (!sheetUrl) return;
		memoryCache.delete(cacheKey);
		if (!fetchPromises.has(cacheKey)) {
			fetchPromises.set(
				cacheKey,
				fetch(sheetUrl)
					.then((res) => {
						if (!res.ok) throw new Error(`HTTP ${res.status}`);
						return res.text();
					})
					.then((csvText) => parseCSV(csvText))
					.finally(() => fetchPromises.delete(cacheKey)),
			);
		}
		try {
			const parsedData = await fetchPromises.get(cacheKey);
			memoryCache.set(cacheKey, parsedData);
			setData(parsedData);
			setLocalData(parsedData);
		} catch {}
	}, [sheetUrl, cacheKey, setLocalData]);

	useEffect(() => {
		if (!memoryCache.has(cacheKey)) {
			setData(localData || []);
			setLoading(!localData || localData.length === 0);
		}
	}, [localData, cacheKey]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const silentRefetchRef = useRef(silentRefetch);
	useEffect(() => {
		silentRefetchRef.current = silentRefetch;
	}, [silentRefetch]);

	useEffect(() => {
		if (!sheetUrl) return;
		const id = setInterval(() => silentRefetchRef.current(), 60000);
		return () => clearInterval(id);
	}, [sheetUrl]);

	return { data, loading, error, refetch };
}

export default useGoogleSheet;
