import { useState, useEffect } from "react";
import { getConfig } from "../constants/config";

let initialConfig = null;
try {
  const stored = localStorage.getItem('sheets_config_cache');
  if (stored) {
    initialConfig = JSON.parse(stored);
  }
} catch (e) {
  
}

export function useSheetConfig() {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(!initialConfig);

  useEffect(() => {
    getConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  return { config, loading };
}

export default useSheetConfig;
