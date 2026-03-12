import { useState, useEffect, useCallback } from "react";

function useLocalStorage(key, initialValue) {
	const [storedValue, setStoredValue] = useState(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		} catch (error) {
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value) => {
			try {
				setStoredValue((prevStoredValue) => {
					const valueToStore =
						value instanceof Function
							? value(prevStoredValue)
							: value;

					const isSame =
						typeof valueToStore === "object"
							? JSON.stringify(valueToStore) ===
								JSON.stringify(prevStoredValue)
							: valueToStore === prevStoredValue;

					if (isSame) {
						return prevStoredValue;
					}

					try {
						window.localStorage.setItem(
							key,
							JSON.stringify(valueToStore),
						);
					} catch (e) {}

					setTimeout(() => {
						window.dispatchEvent(new Event("localStorageChange"));
					}, 0);

					return valueToStore;
				});
			} catch (error) {}
		},
		[key],
	);

	useEffect(() => {
		const handleStorageChange = () => {
			try {
				const item = window.localStorage.getItem(key);
				if (item) {
					const parsed = JSON.parse(item);
					setStoredValue((prev) => {
						const same =
							typeof parsed === "object"
								? JSON.stringify(parsed) ===
									JSON.stringify(prev)
								: parsed === prev;
						return same ? prev : parsed;
					});
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
