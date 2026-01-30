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

      setLoading(false);
      return;
    }
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const rows = csvText.split("\n").filter((row) => row.trim());
      if (rows.length < 2) throw new Error("Datos insuficientes");

      
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

      const headers = parseCSVRow(rows[0]).map((h) => h.trim());
      const parsedData = rows.slice(1).map((row) => {
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
    
  }, [fetchData]);

  return { data, loading, error, refetch };
}

export default useGoogleSheet;
