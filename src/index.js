import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";

const STORAGE_VERSION = "1.0.0";
const currentVersion = localStorage.getItem("storageVersion");
if (currentVersion !== STORAGE_VERSION) {
	const keysToKeep = ["twitchUser", "twitchToken", "rolesToken"];
	const preserved = {};
	keysToKeep.forEach((key) => {
		const val = localStorage.getItem(key);
		if (val !== null) preserved[key] = val;
	});
	localStorage.clear();
	Object.entries(preserved).forEach(([key, val]) =>
		localStorage.setItem(key, val),
	);
	localStorage.setItem("storageVersion", STORAGE_VERSION);
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
