// ============================================
// CUSTOM HOOK: useLocalStorage
// ============================================

import { useState, useEffect } from "react";

function useLocalStorage(key, initialValue) {
	const [storedValue, setStoredValue] = useState(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			return initialValue;
		}
	});

	const setValue = (value) => {
		try {
			const valueToStore =
				value instanceof Function ? value(storedValue) : value;

			const isSame =
				typeof valueToStore === "object"
					? JSON.stringify(valueToStore) ===
						JSON.stringify(storedValue)
					: valueToStore === storedValue;

			if (isSame) {
				return;
			}

			setStoredValue(valueToStore);

			window.localStorage.setItem(key, JSON.stringify(valueToStore));

			window.dispatchEvent(new Event("localStorageChange"));
		} catch (error) {}
	};

	useEffect(() => {
		const handleStorageChange = () => {
			try {
				const item = window.localStorage.getItem(key);
				if (item) {
					setStoredValue(JSON.parse(item));
				}
			} catch (error) {}
		};

		window.addEventListener("storage", handleStorageChange);

		window.addEventListener("localStorageChange", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener(
				"localStorageChange",
				handleStorageChange,
			);
		};
	}, [key]);

	return [storedValue, setValue];
}

export default useLocalStorage;
