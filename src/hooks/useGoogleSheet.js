import { useState, useEffect, useCallback, useRef } from "react";

export function useGoogleSheet(sheetUrl, cacheKey = null) {
  const storageKey = cacheKey || `sheet_${btoa(sheetUrl).slice(0, 20)}`;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDataRef = useRef([]);

  const fetchData = useCallback(async () => {
    if (!sheetUrl) {
      setError("La URL no esta puesta");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(sheetUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const rows = csvText.split("\n").filter((row) => row.trim());
      if (rows.length < 2) throw new Error("Datos insuficientes");

      const headers = rows[0].split(",");
      const parsedData = rows.slice(1).map((row) => {
        const columns = row.split(",");
        const item = {};
        headers.forEach((header, index) => {
          const value = columns[index]?.trim() || "";
          const numValue = parseFloat(value);
          item[header.trim()] =
            /[a-zA-Z]/.test(value) || value !== numValue.toString()
              ? value
              : numValue;
        });
        return item;
      });

      const newDataString = JSON.stringify(parsedData);
      const currentDataString = JSON.stringify(currentDataRef.current);

      if (newDataString !== currentDataString) {
        localStorage.setItem(storageKey, newDataString);
        currentDataRef.current = parsedData;
        setData(parsedData);
      }

      setError(null);
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetUrl, storageKey]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        currentDataRef.current = parsedCache;
        setData(parsedCache);
        setLoading(false);
      } catch (err) {
        console.error("Cache corrupto jejeje wooopsss:", err);
      }
    }

    fetchData();
  }, [fetchData, storageKey]);

  return { data, loading, error, refetch };
}

export default useGoogleSheet;
