import { useState, useEffect, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";

export function useGoogleSheet(sheetUrl, tabName = "default") {
  const cacheKey = `gsheet_cache_${sheetUrl}_${tabName}`;
  const [localData, setLocalData] = useLocalStorage(cacheKey, []);
  const [data, setData] = useState(localData || []);
  const [loading, setLoading] = useState(!localData || localData.length === 0);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!sheetUrl) {
      setError("La URL no esta puesta");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const rows = csvText.split("\n").filter((row) => row.trim());
      if (rows.length < 2) throw new Error("Datos insuficientes");

      const headers = rows[0].split(",").map((h) => h.trim());
      const parsedData = rows.slice(1).map((row) => {
        const columns = row.split(",");
        return headers.reduce((item, header, index) => {
          const value = columns[index]?.trim() || "";
          const numValue = parseFloat(value);
          item[header] =
            /[a-zA-Z]/.test(value) || value !== numValue.toString()
              ? value
              : numValue;
          return item;
        }, {});
      });

      setData(parsedData);
      setLocalData(parsedData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sheetUrl, setLocalData]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setData(localData || []);
    setLoading(!localData || localData.length === 0);
  }, [localData]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetUrl]);

  return { data, loading, error, refetch };
}

export default useGoogleSheet;
