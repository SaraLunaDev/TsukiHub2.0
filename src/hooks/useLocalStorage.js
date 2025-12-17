// ============================================
// CUSTOM HOOK: useLocalStorage
// ============================================
// Hook reutilizable para sincronizar estado con localStorage
// Actualiza automaticamente cuando cambia el valor

import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Estado inicial: intenta cargar desde localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error al leer ${key} de localStorage:`, error);
      return initialValue;
    }
  });

  // Funcion para actualizar el valor
  const setValue = (value) => {
    try {
      // Permite que value sea una funcion como setState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Disparar evento personalizado para sincronizar entre componentes
      window.dispatchEvent(new Event('localStorageChange'));
    } catch (error) {
      console.error(`Error al guardar ${key} en localStorage:`, error);
    }
  };

  // Escuchar cambios en localStorage desde otros componentes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error al sincronizar ${key}:`, error);
      }
    };

    // Escuchar eventos de storage (entre pestanas)
    window.addEventListener('storage', handleStorageChange);
    // Escuchar eventos personalizados (misma pestana)
    window.addEventListener('localStorageChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
