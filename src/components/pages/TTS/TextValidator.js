import React, {
	useEffect,
	useRef,
	useState,
	useImperativeHandle,
	forwardRef,
} from "react";

const escapeHtml = (s) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const getHighlightedHtml = (input) => {
	if (!input) return "";
	let out = escapeHtml(input);
	out = out.replace(/(\(\d+:\))|(\(\d+\))/g, (match, g1) =>
		g1
			? `<span class="token-voice" style="color: var(--color-voice);">${match}</span>`
			: `<span class="token-sound" style="color: var(--color-sound);">${match}</span>`,
	);
	out = out.replace(/\n/g, "<br/>");
	return out;
};

export default forwardRef(function TextValidator({ maxChars = 500 }, ref) {
	const [text, setText] = useState("");
	const [copied, setCopied] = useState(false);
	const textareaRef = useRef(null);
	const highlightRef = useRef(null);

	useImperativeHandle(ref, () => ({
		insertToken(type, id) {
			const ta = textareaRef.current;
			if (!ta) return;
			const token = type === "voice" ? `(${id}:)` : `(${id})`;
			const start =
				typeof ta.selectionStart === "number" ? ta.selectionStart : 0;
			const end =
				typeof ta.selectionEnd === "number" ? ta.selectionEnd : 0;
			const before = ta.value.slice(0, start);
			const after = ta.value.slice(end);
			const allowed = Math.max(
				0,
				maxChars - (before.length + after.length),
			);
			const toInsert = token.slice(0, allowed);
			const newValue = (before + toInsert + after).slice(0, maxChars);
			ta.value = newValue;
			const caretPos = Math.min(
				before.length + toInsert.length,
				newValue.length,
			);
			ta.selectionStart = ta.selectionEnd = caretPos;
			setText(newValue);
			if (highlightRef.current)
				highlightRef.current.innerHTML = getHighlightedHtml(newValue);
			autoResize(ta);
			ta.focus();
		},
	}));

	useEffect(() => {
		if (highlightRef.current) {
			highlightRef.current.innerHTML = getHighlightedHtml(text);
		}
	}, [text]);

	useEffect(() => {
		if (textareaRef.current) {
			const ta = textareaRef.current;
			ta.style.height = "auto";
			ta.style.height = `${Math.max(ta.scrollHeight + 14, 100)}px`;
		}
	}, []);

	const autoResize = (ta) => {
		if (!ta) return;
		ta.style.height = "auto";
		ta.style.height = `${Math.max(ta.scrollHeight + 14, 100)}px`;
	};

	const handleInput = (e) => {
		const ta = e.target;
		let val = ta.value || "";
		if (val.length > maxChars) {
			const selStart = ta.selectionStart;
			const trimmed = val.slice(0, maxChars);
			ta.value = trimmed;
			const newPos = Math.min(selStart, trimmed.length);
			ta.selectionStart = ta.selectionEnd = newPos;
			val = trimmed;
		}
		setText(val);
		if (highlightRef.current)
			highlightRef.current.innerHTML = getHighlightedHtml(val);
		autoResize(ta);
	};

	const handlePaste = (e) => {
		e.preventDefault();
		const ta = textareaRef.current;
		if (!ta) return;
		const paste = (e.clipboardData || window.clipboardData).getData("text");
		const start = ta.selectionStart;
		const end = ta.selectionEnd;
		const before = ta.value.slice(0, start);
		const after = ta.value.slice(end);
		const allowed = Math.max(0, maxChars - (before.length + after.length));
		const toInsert = paste.slice(0, allowed);
		const newValue = before + toInsert + after;
		ta.value = newValue;
		const caretPos = before.length + toInsert.length;
		ta.selectionStart = ta.selectionEnd = caretPos;
		setText(newValue);
		if (highlightRef.current)
			highlightRef.current.innerHTML = getHighlightedHtml(newValue);
		autoResize(ta);
	};

	const handleScroll = () => {
		const ta = textareaRef.current;
		const hl = highlightRef.current;
		if (!ta || !hl) return;
		hl.scrollTop = ta.scrollTop;
		hl.scrollLeft = ta.scrollLeft;
	};

	const handleKeyDown = (e) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const ta = textareaRef.current;
			if (!ta) return;
			const start = ta.selectionStart;
			const end = ta.selectionEnd;
			const before = ta.value.slice(0, start);
			const after = ta.value.slice(end);
			const tab = "  ";
			const newValue = (before + tab + after).slice(0, maxChars);
			ta.value = newValue;
			const pos = Math.min(before.length + tab.length, newValue.length);
			ta.selectionStart = ta.selectionEnd = pos;
			setText(newValue);
			if (highlightRef.current)
				highlightRef.current.innerHTML = getHighlightedHtml(newValue);
			autoResize(ta);
		}
	};

	const handleCopy = async () => {
		const toCopy = (text || "").replace(/\r?\n/g, " ").trim();
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(toCopy);
			} else {
				const ta = textareaRef.current;
				if (!ta) return;
				ta.select();
				document.execCommand("copy");
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 1400);
		} catch (e) {}
	};

	return (
		<div
			className="text-validator"
			role="region"
			aria-label="Text validator"
		>
			<div ref={highlightRef} className="highlight" aria-hidden="true" />
			<textarea
				ref={textareaRef}
				className="textarea"
				defaultValue={text}
				placeholder="Valida tu mensaje..."
				onInput={handleInput}
				onPaste={handlePaste}
				onScroll={handleScroll}
				onKeyDown={handleKeyDown}
				spellCheck={false}
			/>
			<div
				className="progress-bar"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={maxChars}
				aria-valuenow={text.length}
				aria-label="Character usage"
			>
				<div
					className={`progress-fill ${text.length >= maxChars ? "limit" : ""}`}
					style={{
						width: `${Math.round((text.length / maxChars) * 100)}%`,
					}}
				/>
			</div>
			<button
				type="button"
				className={`copy-btn ${copied ? "copied" : ""}`}
				onClick={handleCopy}
				aria-label="Copiar sin saltos de línea"
				title="Copiar sin saltos de línea"
			>
				Copiar
			</button>
		</div>
	);
});
