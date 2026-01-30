import React, { useRef, useEffect, useState, useCallback } from "react";
import { spring } from "svelte/motion";
import "./HoverCard.css";
import HoverCardBack from "./HoverCardBack";
import glitterImage from "./glitter.png";
import grainImage from "./grain.webp";
const springInteractSettings = { stiffness: 0.066, damping: 0.25 };
const springPopoverSettings = { stiffness: 0.033, damping: 0.45 };
const snapSettings = { stiffness: 0.01, damping: 0.06 };
const DEBUG_HOVER_CARD = false;

function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function adjust(v, a1, a2, b1, b2) {
	const t = (v - a1) / (a2 - a1);
	return b1 + t * (b2 - b1);
}

const TIER_OVERLAY_POS = {
	default: {
		3: { top: { x: 50, y: 50 }, bottom: { x: 50, y: 50 } },
		4: { top: { x: 50, y: 50 }, bottom: { x: 50, y: 50 } },
		5: { top: { x: 50, y: 50 }, bottom: { x: 50, y: 50 } },
	},
};

const BANNER_TIER_IMAGE_ADJUST = {};

export default function HoverCard({
	src,
	alt,
	banner,
	tier,
	holo,
	lockToBack = false,
}) {
	const RESET_DELAY = 500;
	const cardRef = useRef(null);
	const rotatorRef = useRef(null);
	const rafRef = useRef(null);
	const leaveTimeoutRef = useRef(null);
	const interactingRef = useRef(false);

	const [displayData, setDisplayData] = useState({
		src,
		alt,
		banner,
		tier,
		holo,
	});

	const [imagesReady, setImagesReady] = useState(false);
	const loadIdRef = useRef(0);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const params = new URLSearchParams(window.location.search || "");
			const enabled =
				params.get("hoverdebug") === "1" ||
				localStorage.getItem("hovercard_debug") === "1" ||
				!!window.__HOVERCARD_DEBUG__;
			if (enabled && !window.__HOVERCARD_DEBUG__) {
				window.__HOVERCARD_DEBUG__ = true;
			}
		} catch (err) {}
	}, []);

	const [backVisible, setBackVisible] = useState(true);
	const [backFading, setBackFading] = useState(false);
	const backFadeTimeoutRef = useRef(null);
	const backFadeDelayRef = useRef(null);
	const backNoTransitionTimeoutRef = useRef(null);
	const backShownAtRef = useRef(0);

	useEffect(() => {
		if (lockToBack) {
			setDisplayData({
				src: undefined,
				alt: undefined,
				banner: undefined,
				tier: undefined,
				holo: undefined,
			});
			setImagesReady(false);
		}

		const _rafId = rafRef.current;
		const _leaveId = leaveTimeoutRef.current;
		return () => {
			if (_rafId) cancelAnimationFrame(_rafId);
			if (_leaveId) {
				clearTimeout(_leaveId);
				if (leaveTimeoutRef.current === _leaveId)
					leaveTimeoutRef.current = null;
			}
		};
	}, [lockToBack]);

	useEffect(() => {
		const el = cardRef.current;
		if (!el) return;
		el.setAttribute("data-no-transition", "");

		requestAnimationFrame(() => {
			setTimeout(() => {
				if (el && el.hasAttribute("data-no-transition")) {
					el.removeAttribute("data-no-transition");
				}
			}, 40);
		});
		return () => {
			if (el && el.hasAttribute("data-no-transition"))
				el.removeAttribute("data-no-transition");
		};
	}, [displayData.src]);

	useEffect(() => {
		const el = cardRef.current;
		if (!el) return;
		const dBanner = displayData.banner;
		const dTier = displayData.tier;
		if (!dBanner || !dTier) {
			el.style.removeProperty("--tier-bg");
			el.style.removeProperty("--banner-image-offset-y");
			el.style.removeProperty("--banner-image-scale");
			return;
		}
		const url = `/static/resources/gacha/${dBanner}/tier${dTier}.jpg`;
		let cancelled = false;
		const img = new Image();
		img.onload = () => {
			if (cancelled) return;
			el.style.setProperty("--tier-bg", `url("${url}")`);

			const adj =
				(BANNER_TIER_IMAGE_ADJUST[dBanner] &&
					BANNER_TIER_IMAGE_ADJUST[dBanner][dTier]) ||
				null;
			if (adj) {
				if (typeof adj.offsetY === "number")
					el.style.setProperty(
						"--banner-image-offset-y",
						`${adj.offsetY}px`,
					);
				if (typeof adj.scale === "number")
					el.style.setProperty(
						"--banner-image-scale",
						`${adj.scale}`,
					);
			} else {
				el.style.removeProperty("--banner-image-offset-y");
				el.style.removeProperty("--banner-image-scale");
			}
		};
		img.onerror = () => {
			if (cancelled) return;
			el.style.removeProperty("--tier-bg");
			el.style.removeProperty("--banner-image-offset-y");
			el.style.removeProperty("--banner-image-scale");
		};
		img.src = url;
		return () => {
			cancelled = true;
			img.onload = null;
			img.onerror = null;
		};
	}, [displayData.banner, displayData.tier]);

	useEffect(() => {
		const el = cardRef.current;

		const incoming = { src, alt, banner, tier, holo };

		if (lockToBack) {
			loadIdRef.current++;
			setDisplayData({
				src: undefined,
				alt: undefined,
				banner: undefined,
				tier: undefined,
				holo: undefined,
			});
			setImagesReady(false);
			return;
		}

		const same =
			incoming.src === displayData.src &&
			incoming.alt === displayData.alt &&
			incoming.banner === displayData.banner &&
			incoming.tier === displayData.tier &&
			incoming.holo === displayData.holo;
		if (same) {
			const MIN_MS = 200;
			const FADE_MS = 1000;

			if (backFadeDelayRef.current) {
				clearTimeout(backFadeDelayRef.current);
				backFadeDelayRef.current = null;
			}
			if (backFadeTimeoutRef.current) {
				clearTimeout(backFadeTimeoutRef.current);
				backFadeTimeoutRef.current = null;
			}

			const backEl = el && el.querySelector(".card__back-overlay");
			if (backEl) {
				backEl.style.transition = "none";
			}
			setBackFading(false);
			setBackVisible(true);
			backShownAtRef.current = Date.now();
			if (backEl) {
				if (backNoTransitionTimeoutRef.current) {
					clearTimeout(backNoTransitionTimeoutRef.current);
					backNoTransitionTimeoutRef.current = null;
				}
				backNoTransitionTimeoutRef.current = setTimeout(() => {
					if (backEl) backEl.style.transition = "";
					backNoTransitionTimeoutRef.current = null;
				}, 40);
			}

			backFadeDelayRef.current = setTimeout(() => {
				backFadeDelayRef.current = null;
				setBackFading(true);
				backFadeTimeoutRef.current = setTimeout(() => {
					setBackFading(false);
					setBackVisible(false);
					backFadeTimeoutRef.current = null;
				}, FADE_MS);
			}, MIN_MS);

			return;
		}

		if (!incoming.src) {
			if (interactingRef.current || pointerDownRef.current) {
				pendingLockRef.current = incoming;
				return;
			}
			setDisplayData(incoming);
			setImagesReady(false);
			return;
		}

		const isInteractingNow =
			interactingRef.current || pointerDownRef.current;
		if (!isInteractingNow) {
			setImagesReady(false);
		}
		const skipBackOverlay =
			interactingRef.current || pointerDownRef.current;
		const backEl = el && el.querySelector(".card__back-overlay");
		if (!skipBackOverlay) {
			setBackVisible(true);

			if (backFadeDelayRef.current) {
				clearTimeout(backFadeDelayRef.current);
				backFadeDelayRef.current = null;
			}
			if (backFadeTimeoutRef.current) {
				clearTimeout(backFadeTimeoutRef.current);
				backFadeTimeoutRef.current = null;
			}

			if (backEl) {
				backEl.style.transition = "none";
			}
			setBackFading(false);
			backShownAtRef.current = Date.now();
			if (backEl) {
				if (backNoTransitionTimeoutRef.current) {
					clearTimeout(backNoTransitionTimeoutRef.current);
					backNoTransitionTimeoutRef.current = null;
				}
				backNoTransitionTimeoutRef.current = setTimeout(() => {
					if (backEl) backEl.style.transition = "";
					backNoTransitionTimeoutRef.current = null;
				}, 40);
			}
		} else {
			if (backEl) {
				backEl.style.transition = "none";
				setBackFading(false);
				if (backNoTransitionTimeoutRef.current) {
					clearTimeout(backNoTransitionTimeoutRef.current);
					backNoTransitionTimeoutRef.current = null;
				}
				backNoTransitionTimeoutRef.current = setTimeout(() => {
					if (backEl) backEl.style.transition = "";
					backNoTransitionTimeoutRef.current = null;
				}, 40);
			}
		}
		const id = ++loadIdRef.current;

		const urls = new Set();
		urls.add(incoming.src);

		if (typeof incoming.tier !== "undefined" && incoming.tier !== null) {
			urls.add(`/static/resources/gacha/tier${incoming.tier}.webp`);
			urls.add(`/static/resources/gacha/tier${incoming.tier}_low.webp`);
			if (incoming.tier === 5) urls.add(`/img/glitter.png`);
			if (incoming.banner)
				urls.add(
					`/static/resources/gacha/${incoming.banner}/tier${incoming.tier}.jpg`,
				);
		}

		const urlsArr = Array.from(urls);
		let remaining = urlsArr.length;
		if (remaining === 0) {
			setDisplayData(incoming);
			setImagesReady(true);
			return;
		}

		let cancelledLoad = false;
		const imgs = [];

		const applyBannerBg = (url) => {
			const el = cardRef.current;
			if (!el) return;
			el.style.setProperty("--tier-bg", `url("${url}")`);

			const adj =
				(BANNER_TIER_IMAGE_ADJUST[incoming.banner] &&
					BANNER_TIER_IMAGE_ADJUST[incoming.banner][incoming.tier]) ||
				null;
			if (adj) {
				if (typeof adj.offsetY === "number")
					el.style.setProperty(
						"--banner-image-offset-y",
						`${adj.offsetY}px`,
					);
				if (typeof adj.scale === "number")
					el.style.setProperty(
						"--banner-image-scale",
						`${adj.scale}`,
					);
			} else {
				el.style.removeProperty("--banner-image-offset-y");
				el.style.removeProperty("--banner-image-scale");
			}
		};

		const applyOverlayTop = (url) => {
			const el = cardRef.current;
			if (!el) return;
			el.style.setProperty("--tier-overlay-top", `url("${url}")`);
		};
		const applyOverlayBottom = (url) => {
			const el = cardRef.current;
			if (!el) return;
			el.style.setProperty("--tier-overlay-bottom", `url("${url}")`);
		};
		const applyIllusion = (kind) => {
			const el = cardRef.current;
			if (!el) return;
			if (kind === "glitter") {
				el.style.setProperty(
					"--tier-illusion",
					`url('/img/glitter.png')`,
				);
				el.style.setProperty("--illusion-size", "cover");
				el.style.setProperty("--illusion-opacity", "0.18");
			} else if (kind === "illusion") {
				el.style.setProperty(
					"--tier-illusion",
					`url('/img/illusion.png')`,
				);
				el.style.setProperty("--illusion-size", "65%");
				el.style.setProperty("--illusion-opacity", "0.03");
			}
		};

		urlsArr.forEach((url) => {
			const img = new Image();
			const done = () => {
				if (cancelledLoad) return;
				remaining -= 1;
				if (remaining <= 0 && loadIdRef.current === id) {
					setDisplayData(incoming);
					setImagesReady(true);
				}
			};

			img.onload = () => {
				if (cancelledLoad) return;

				if (
					incoming.banner &&
					url.endsWith(`/tier${incoming.tier}.jpg`)
				) {
					applyBannerBg(url);
				} else if (url.endsWith(`tier${incoming.tier}.webp`)) {
					applyOverlayTop(url);
				} else if (url.endsWith(`tier${incoming.tier}_low.webp`)) {
					applyOverlayBottom(url);
				} else if (url.endsWith("glitter.png")) {
					applyIllusion("glitter");
				} else if (url.endsWith("illusion.png")) {
					applyIllusion("illusion");
				}
				done();
			};
			img.onerror = () => {
				done();
			};
			img.src = url;
			imgs.push(img);
		});

		return () => {
			cancelledLoad = true;
			imgs.forEach((i) => {
				i.onload = null;
				i.onerror = null;
			});
		};
	}, [
		src,
		alt,
		banner,
		tier,
		holo,
		lockToBack,
		displayData.src,
		displayData.alt,
		displayData.banner,
		displayData.tier,
		displayData.holo,
	]);

	useEffect(() => {
		const el = cardRef.current;
		if (!el) return;

		const dBanner = displayData.banner;
		const dTier = displayData.tier;
		if (!dTier) {
			el.style.removeProperty("--tier-overlay-top");
			el.style.removeProperty("--tier-overlay-bottom");
			el.style.removeProperty("--tier-overlay-pos-x");
			el.style.removeProperty("--tier-overlay-pos-y");
			el.style.removeProperty("--tier-overlay-bottom-pos-x");
			el.style.removeProperty("--tier-overlay-bottom-pos-y");
			el.style.removeProperty("--tier-illusion");
			el.style.removeProperty("--illusion-size");
			el.style.removeProperty("--illusion-opacity");
			return;
		}

		const topUrl = `/static/resources/gacha/tier${dTier}.webp`;
		const bottomUrl = `/static/resources/gacha/tier${dTier}_low.webp`;

		let topDone = false;
		let bottomDone = false;
		let cancelled = false;

		const setPos = () => {
			const pos = (TIER_OVERLAY_POS[dBanner] &&
				TIER_OVERLAY_POS[dBanner][dTier]) ||
				TIER_OVERLAY_POS.default[dTier] || {
					top: { x: 50, y: 50 },
					bottom: { x: 50, y: 50 },
				};
			el.style.setProperty("--tier-overlay-pos-x", `${pos.top.x}%`);
			el.style.setProperty("--tier-overlay-pos-y", `${pos.top.y}%`);
			el.style.setProperty(
				"--tier-overlay-bottom-pos-x",
				`${pos.bottom.x}%`,
			);
			el.style.setProperty(
				"--tier-overlay-bottom-pos-y",
				`${pos.bottom.y}%`,
			);
		};

		setPos();

		const imgTop = new Image();
		imgTop.onload = () => {
			if (cancelled) return;
			topDone = true;
			el.style.setProperty("--tier-overlay-top", `url("${topUrl}")`);
			maybeFinish();
		};
		imgTop.onerror = () => {
			if (cancelled) return;
			topDone = true;
			el.style.removeProperty("--tier-overlay-top");
			maybeFinish();
		};
		imgTop.src = topUrl;

		const imgBottom = new Image();
		imgBottom.onload = () => {
			if (cancelled) return;
			bottomDone = true;
			el.style.setProperty(
				"--tier-overlay-bottom",
				`url("${bottomUrl}")`,
			);
			maybeFinish();
		};
		imgBottom.onerror = () => {
			if (cancelled) return;
			bottomDone = true;
			el.style.removeProperty("--tier-overlay-bottom");
			maybeFinish();
		};
		imgBottom.src = bottomUrl;

		function maybeFinish() {
			if (topDone && bottomDone) {
				if (dTier === 5) {
					el.style.setProperty(
						"--tier-illusion",
						`url('/img/glitter.png')`,
					);
					el.style.setProperty("--illusion-size", "cover");

					el.style.setProperty("--illusion-opacity", "0.18");
				} else if (dTier === 4) {
					el.style.removeProperty("--foil");
					el.style.removeProperty("--imgsize");
					el.style.removeProperty("--mask");
					el.style.removeProperty("--tier-illusion");
					el.style.removeProperty("--illusion-size");
					el.style.removeProperty("--illusion-opacity");
				} else if (dTier === 3) {
					el.style.removeProperty("--foil");
					el.style.removeProperty("--imgsize");
					el.style.removeProperty("--mask");

					el.style.removeProperty("--tier-illusion");
					el.style.removeProperty("--illusion-size");
					el.style.removeProperty("--illusion-opacity");
				} else {
					el.style.removeProperty("--foil");
					el.style.removeProperty("--imgsize");
					el.style.removeProperty("--mask");
					el.style.removeProperty("--tier-illusion");
					el.style.removeProperty("--illusion-size");
					el.style.removeProperty("--illusion-opacity");
				}
			}
		}

		return () => {
			cancelled = true;
			imgTop.onload = null;
			imgTop.onerror = null;
			imgBottom.onload = null;
			imgBottom.onerror = null;
		};
	}, [displayData, displayData.banner, displayData.tier]);

	useEffect(() => {
		const FADE_MS = 200;
		const MIN_BACK_MS = 250;
		const el = cardRef.current;
		if (imagesReady) {
			if (backFadeDelayRef.current) {
				clearTimeout(backFadeDelayRef.current);
				backFadeDelayRef.current = null;
			}
			if (backFadeTimeoutRef.current) {
				clearTimeout(backFadeTimeoutRef.current);
				backFadeTimeoutRef.current = null;
			}

			const elapsed = Date.now() - (backShownAtRef.current || 0);
			const wait = Math.max(0, MIN_BACK_MS - elapsed);

			backFadeDelayRef.current = setTimeout(() => {
				backFadeDelayRef.current = null;
				setBackFading(true);
				backFadeTimeoutRef.current = setTimeout(() => {
					setBackFading(false);
					setBackVisible(false);
					backFadeTimeoutRef.current = null;
				}, FADE_MS);
			}, wait);
		} else {
			if (backFadeDelayRef.current) {
				clearTimeout(backFadeDelayRef.current);
				backFadeDelayRef.current = null;
			}
			if (backFadeTimeoutRef.current) {
				clearTimeout(backFadeTimeoutRef.current);
				backFadeTimeoutRef.current = null;
			}

			if (backNoTransitionTimeoutRef.current) {
				clearTimeout(backNoTransitionTimeoutRef.current);
				backNoTransitionTimeoutRef.current = null;
			}
			const backEl = el && el.querySelector(".card__back-overlay");
			if (backEl) backEl.style.transition = "";
			setBackFading(false);
			setBackVisible(true);
			backShownAtRef.current = Date.now();
		}
		return () => {
			if (backFadeDelayRef.current) {
				clearTimeout(backFadeDelayRef.current);
				backFadeDelayRef.current = null;
			}
			if (backFadeTimeoutRef.current) {
				clearTimeout(backFadeTimeoutRef.current);
				backFadeTimeoutRef.current = null;
			}
			if (backNoTransitionTimeoutRef.current) {
				clearTimeout(backNoTransitionTimeoutRef.current);
				backNoTransitionTimeoutRef.current = null;
			}
			const backEl = el && el.querySelector(".card__back-overlay");
			if (backEl) backEl.style.transition = "";
		};
	}, [imagesReady]);

	const rotateSpringRef = useRef(null);
	const glareSpringRef = useRef(null);
	const backgroundSpringRef = useRef(null);
	const scaleSpringRef = useRef(null);
	const unsubRotateRef = useRef(null);
	const unsubGlareRef = useRef(null);
	const unsubBackgroundRef = useRef(null);
	const unsubScaleRef = useRef(null);
	const springsInitializedRef = useRef(false);

	function initSprings() {
		if (springsInitializedRef.current) return;

		rotateSpringRef.current = spring(
			{ x: 0, y: 0 },
			springInteractSettings,
		);
		glareSpringRef.current = spring(
			{ x: 50, y: 50, o: 0 },
			springInteractSettings,
		);
		backgroundSpringRef.current = spring(
			{ x: 50, y: 50 },
			springInteractSettings,
		);
		scaleSpringRef.current = spring(
			{ scale: 1, translateY: 0 },
			springPopoverSettings,
		);

		unsubRotateRef.current = rotateSpringRef.current.subscribe((r) => {
			const el = rotatorRef.current;
			if (!el) return;
			el.style.setProperty("--rotate-x", `${r.x.toFixed(2)}deg`);
			el.style.setProperty("--rotate-y", `${r.y.toFixed(2)}deg`);
		});

		unsubGlareRef.current = glareSpringRef.current.subscribe((g) => {
			const el = cardRef.current;
			if (!el) return;
			el.style.setProperty("--pointer-x", `${g.x.toFixed(2)}%`);
			el.style.setProperty("--pointer-y", `${g.y.toFixed(2)}%`);
			el.style.setProperty("--card-opacity", `${(g.o || 0).toFixed(3)}`);
			const dist = Math.sqrt((g.x - 50) ** 2 + (g.y - 50) ** 2) / 50;
			el.style.setProperty(
				"--pointer-from-center",
				`${clamp(dist, 0, 1)}`,
			);
			el.style.setProperty(
				"--pointer-from-top",
				`${(g.y / 100).toFixed(3)}`,
			);
			el.style.setProperty(
				"--pointer-from-left",
				`${(g.x / 100).toFixed(3)}`,
			);
		});

		unsubBackgroundRef.current = backgroundSpringRef.current.subscribe(
			(b) => {
				const el = cardRef.current;
				if (!el) return;
				el.style.setProperty("--background-x", `${b.x.toFixed(2)}%`);
				el.style.setProperty("--background-y", `${b.y.toFixed(2)}%`);
			},
		);

		unsubScaleRef.current = scaleSpringRef.current.subscribe((s) => {
			const el = cardRef.current;
			if (!el) return;
			const scaleValue = typeof s === "number" ? s : s.scale;
			el.style.setProperty("--card-scale", `${scaleValue.toFixed(3)}`);
			if (s.translateY !== undefined)
				el.style.setProperty(
					"--translate-y",
					`${Math.round(s.translateY)}px`,
				);
		});

		springsInitializedRef.current = true;
	}

	useEffect(() => {
		let idleHandle = null;
		if (typeof window !== "undefined" && "requestIdleCallback" in window) {
			idleHandle = window.requestIdleCallback(() => initSprings(), {
				timeout: 200,
			});
		} else {
			idleHandle = setTimeout(() => initSprings(), 200);
		}

		return () => {
			if (idleHandle != null) {
				if (
					typeof window !== "undefined" &&
					"cancelIdleCallback" in window
				) {
					window.cancelIdleCallback(idleHandle);
				} else {
					clearTimeout(idleHandle);
				}
			}

			if (unsubRotateRef.current) {
				unsubRotateRef.current();
				unsubRotateRef.current = null;
			}
			if (unsubGlareRef.current) {
				unsubGlareRef.current();
				unsubGlareRef.current = null;
			}
			if (unsubBackgroundRef.current) {
				unsubBackgroundRef.current();
				unsubBackgroundRef.current = null;
			}
			if (unsubScaleRef.current) {
				unsubScaleRef.current();
				unsubScaleRef.current = null;
			}

			rotateSpringRef.current = null;
			glareSpringRef.current = null;
			backgroundSpringRef.current = null;
			scaleSpringRef.current = null;
			springsInitializedRef.current = false;
		};
	}, []);

	const displayTier = displayData ? displayData.tier : undefined;

	const ensureIllusion = useCallback(() => {
		const el = cardRef.current;
		if (!el) return;
		if (displayTier === 5) {
			el.style.setProperty("--tier-illusion", `url('/img/glitter.png')`);
			el.style.setProperty("--illusion-size", "cover");
			el.style.setProperty("--illusion-opacity", "0.18");
		}
	}, [displayTier]);

	const onPointerEnter = (e) => {
		if (e && e.preventDefault) e.preventDefault();
		const el = cardRef.current;
		if (!el) return;
		if (leaveTimeoutRef.current) {
			clearTimeout(leaveTimeoutRef.current);
			leaveTimeoutRef.current = null;
		}
		el.classList.add("is-hovered");
		if (!springsInitializedRef.current) initSprings();

		if (scaleSpringRef.current) {
			scaleSpringRef.current.stiffness = springPopoverSettings.stiffness;
			scaleSpringRef.current.damping = springPopoverSettings.damping;
			scaleSpringRef.current.set({ scale: 1.06, translateY: -10 });
		}
		if (glareSpringRef.current) {
			glareSpringRef.current.set({ x: 50, y: 50, o: 1 });
		}

		ensureIllusion();

		if (typeof window !== "undefined" && window.__HOVERCARD_DEBUG__) {
			window.__HOVERCARD_UPDATE_STATUS__ &&
				window.__HOVERCARD_UPDATE_STATUS__();
		}
	};

	const onPointerMove = (e) => {
		if (e && e.preventDefault) e.preventDefault();
		const rectEl = rotatorRef.current || cardRef.current;
		const containerEl = cardRef.current;
		if (!rectEl || !containerEl) return;
		if (leaveTimeoutRef.current) {
			clearTimeout(leaveTimeoutRef.current);
			leaveTimeoutRef.current = null;
		}
		containerEl.classList.add("is-hovered");
		if (!springsInitializedRef.current) initSprings();

		interactingRef.current = true;
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;
		lastPointerRef.current.x = clientX;
		lastPointerRef.current.y = clientY;
		const rect = rectEl.getBoundingClientRect();
		const absolute = { x: clientX - rect.left, y: clientY - rect.top };
		const percent = {
			x: clamp(Math.round((100 / rect.width) * absolute.x), 0, 100),
			y: clamp(Math.round((100 / rect.height) * absolute.y), 0, 100),
		};
		const center = { x: percent.x - 50, y: percent.y - 50 };

		const rotateTargetX = Math.round(-(center.x / 3.5));
		const rotateTargetY = Math.round(center.y / 3.5);

		const debugEnabled =
			(typeof window !== "undefined" && window.__HOVERCARD_DEBUG__) ||
			DEBUG_HOVER_CARD;

		if (debugEnabled) {
			const elDebug = cardRef.current;
			if (elDebug) {
				let overlay = elDebug.querySelector(".hover-debug-overlay");
				if (!overlay) {
					overlay = document.createElement("div");
					overlay.className = "hover-debug-overlay is-visible";
					const dot = document.createElement("div");
					dot.className = "hover-debug-point";
					const info = document.createElement("div");
					info.className = "hover-debug-info";
					overlay.appendChild(dot);
					overlay.appendChild(info);
					elDebug.appendChild(overlay);
				} else {
					overlay.classList.add("is-visible");
				}

				const dotEl = overlay.querySelector(".hover-debug-point");
				const infoEl = overlay.querySelector(".hover-debug-info");

				if (dotEl) {
					dotEl.style.left = `${percent.x}%`;
					dotEl.style.top = `${percent.y}%`;
				}
				if (infoEl) {
					infoEl.textContent = `p:${percent.x},${percent.y} c:${center.x},${center.y} rx:${rotateTargetX} ry:${rotateTargetY}`;
				}
			}
		}

		if (rotateSpringRef.current) {
			rotateSpringRef.current.stiffness =
				springInteractSettings.stiffness;
			rotateSpringRef.current.damping = springInteractSettings.damping;
			rotateSpringRef.current.set({ x: rotateTargetX, y: rotateTargetY });
		}
		if (glareSpringRef.current) {
			glareSpringRef.current.stiffness = springInteractSettings.stiffness;
			glareSpringRef.current.damping = springInteractSettings.damping;
			glareSpringRef.current.set({
				x: Math.round(percent.x),
				y: Math.round(percent.y),
				o: 1,
			});
		}
		if (backgroundSpringRef.current) {
			backgroundSpringRef.current.stiffness =
				springInteractSettings.stiffness;
			backgroundSpringRef.current.damping =
				springInteractSettings.damping;
			backgroundSpringRef.current.set({
				x: adjust(percent.x, 0, 100, 37, 63),
				y: adjust(percent.y, 0, 100, 33, 67),
			});
		}

		if (typeof window !== "undefined" && window.__HOVERCARD_DEBUG__) {
			window.__HOVERCARD_UPDATE_STATUS__ &&
				window.__HOVERCARD_UPDATE_STATUS__();
		}
	};

	const onPointerEnd = (immediate = false, reason = "unknown") => {
		if (typeof window !== "undefined" && window.__HOVERCARD_DEBUG__) {
			window.__HOVERCARD_UPDATE_STATUS__ &&
				window.__HOVERCARD_UPDATE_STATUS__();
		}

		if (leaveTimeoutRef.current) {
			clearTimeout(leaveTimeoutRef.current);
			leaveTimeoutRef.current = null;
		}

		if (immediate && pointerDownRef.current) {
			return;
		}

		const el = cardRef.current;
		if (el && typeof el.matches === "function" && el.matches(":hover")) {
			return;
		}

		if (typeof document !== "undefined" && lastPointerRef.current) {
			try {
				const p = lastPointerRef.current;
				if (typeof document.elementFromPoint === "function") {
					const at = document.elementFromPoint(p.x, p.y);
					if (at && el.contains(at)) {
						return;
					}
				}
			} catch (err) {}
		}

		const doReset = () => {
			interactingRef.current = false;
			const el = cardRef.current;
			if (el) {
				el.classList.remove("is-hovered");
			}

			if (rotateSpringRef.current) {
				rotateSpringRef.current.stiffness = snapSettings.stiffness;
				rotateSpringRef.current.damping = snapSettings.damping;
				rotateSpringRef.current.set({ x: 0, y: 0 });
			}
			if (glareSpringRef.current) {
				glareSpringRef.current.stiffness = snapSettings.stiffness;
				glareSpringRef.current.damping = snapSettings.damping;
				glareSpringRef.current.set({ x: 50, y: 50, o: 0 });
			}
			if (backgroundSpringRef.current) {
				backgroundSpringRef.current.stiffness = snapSettings.stiffness;
				backgroundSpringRef.current.damping = snapSettings.damping;
				backgroundSpringRef.current.set({ x: 50, y: 50 });
			}
			if (scaleSpringRef.current) {
				scaleSpringRef.current.set({ scale: 1, translateY: 0 });
			}

			const overlay = el && el.querySelector(".hover-debug-overlay");
			if (overlay && overlay.parentNode)
				overlay.parentNode.removeChild(overlay);

			if (pendingLockRef.current) {
				setDisplayData(pendingLockRef.current);
				setImagesReady(false);
				pendingLockRef.current = null;
			}
		};

		if (immediate) {
			doReset();
			return;
		}

		leaveTimeoutRef.current = setTimeout(() => {
			doReset();
			leaveTimeoutRef.current = null;
		}, RESET_DELAY);
	};

	const handlePointerLeave = (e) => {
		if (typeof window !== "undefined" && window.__HOVERCARD_DEBUG__) {
			window.__HOVERCARD_UPDATE_STATUS__ &&
				window.__HOVERCARD_UPDATE_STATUS__();
		}
		pointerEndRef.current && pointerEndRef.current(true, "pointerleave");
	};

	const onFocus = () => {
		const el = cardRef.current;
		if (!el) return;
		if (scaleSpringRef.current)
			scaleSpringRef.current.set({ scale: 1.03, translateY: -8 });
		if (glareSpringRef.current) glareSpringRef.current.set({ o: 0.6 });
	};

	const onBlur = (e) => {
		const el = cardRef.current;
		if (!el) return onPointerEnd(true);

		const related =
			e &&
			(e.relatedTarget || (e.nativeEvent && e.nativeEvent.relatedTarget));
		if (related) {
			if (el.contains(related)) {
				return;
			}
			onPointerEnd(true, "blur-related");
			return;
		}

		setTimeout(() => {
			const active = document.activeElement;
			if (active && el.contains(active)) {
				return;
			}
			onPointerEnd(true, "blur-delayed");
		}, 0);
	};

	const pointerEnterRef = useRef(onPointerEnter);
	const pointerMoveRef = useRef(onPointerMove);
	const pointerEndRef = useRef(onPointerEnd);
	const pointerDownRef = useRef(false);
	const lastPointerRef = useRef({ x: 0, y: 0 });
	const pendingLockRef = useRef(null);

	useEffect(() => {
		pointerEnterRef.current = onPointerEnter;
		pointerMoveRef.current = onPointerMove;
		pointerEndRef.current = onPointerEnd;
	});

	useEffect(() => {
		const el = rotatorRef.current || cardRef.current;
		if (!el) return;

		const ensureDebugOverlay = () => {
			if (typeof window === "undefined" || !window.__HOVERCARD_DEBUG__)
				return null;
			let s = el.querySelector(".hover-debug-status");
			if (!s) {
				s = document.createElement("div");
				s.className = "hover-debug-status";
				s.style.position = "absolute";
				s.style.left = "6px";
				s.style.bottom = "6px";
				s.style.background = "rgba(0,0,0,0.6)";
				s.style.color = "white";
				s.style.font = "11px/1 monospace";
				s.style.padding = "4px 6px";
				s.style.borderRadius = "4px";
				s.style.zIndex = 10005;
				s.style.pointerEvents = "none";
				el.appendChild(s);
			}
			return s;
		};

		const updateDebugStatus = () => {
			if (typeof window === "undefined" || !window.__HOVERCARD_DEBUG__)
				return;
			const s = ensureDebugOverlay();
			if (!s) return;
			const parts = [];
			parts.push(`hover:${el.matches(":hover")}`);
			parts.push(`pointerDown:${pointerDownRef.current}`);
			parts.push(`focused:${document.activeElement === el}`);
			parts.push(`isHoveredClass:${el.classList.contains("is-hovered")}`);
			s.textContent = parts.join(" | ");
		};

		window.__HOVERCARD_UPDATE_STATUS__ = updateDebugStatus;

		const handleTouchStart = (e) => {
			if (e && e.preventDefault) e.preventDefault();
			pointerEnterRef.current && pointerEnterRef.current(e);
		};
		const handleTouchMove = (e) => {
			if (e && e.preventDefault) e.preventDefault();
			pointerMoveRef.current && pointerMoveRef.current(e);
		};
		const handleTouchEnd = (e) => {
			if (e && e.preventDefault) e.preventDefault();
			pointerEndRef.current && pointerEndRef.current(true);
		};

		el.addEventListener("touchstart", handleTouchStart, { passive: false });
		el.addEventListener("touchmove", handleTouchMove, { passive: false });
		el.addEventListener("touchend", handleTouchEnd, { passive: false });
		el.addEventListener("touchcancel", handleTouchEnd, { passive: false });

		const handlePointerDown = (e) => {
			pointerDownRef.current = true;
		};
		const handlePointerUp = (e) => {
			pointerDownRef.current = false;
			ensureIllusion();
			pointerEndRef.current && pointerEndRef.current(false, "pointerup");
		};

		el.addEventListener("pointerdown", handlePointerDown);
		el.addEventListener("pointerup", handlePointerUp);
		el.addEventListener("pointerleave", handlePointerLeave);

		return () => {
			el.removeEventListener("touchstart", handleTouchStart);
			el.removeEventListener("touchmove", handleTouchMove);
			el.removeEventListener("touchend", handleTouchEnd);
			el.removeEventListener("touchcancel", handleTouchEnd);
			el.removeEventListener("pointerdown", handlePointerDown);
			el.removeEventListener("pointerup", handlePointerUp);
			el.removeEventListener("pointerleave", handlePointerLeave);
		};
	}, [ensureIllusion]);

	return (
		<div
			ref={cardRef}
			className="card simple-card"
			data-banner={displayData.banner}
			data-tier={displayData.tier}
			data-holo={
				displayData.tier === 3
					? "trainer-gallery"
					: displayData.tier === 4
						? "trainer-gallery-holo"
						: displayData.tier === 5
							? "v-regular"
							: undefined
			}
			role="img"
			aria-label={displayData.alt || "card"}
			tabIndex="0"
			onFocus={onFocus}
			onBlur={onBlur}
			style={{
				"--glitter": `url(${glitterImage})`,
				"--grain": `url(${grainImage})`,
			}}
		>
			<div className="card__translater">
				<div
					className="card__rotator"
					ref={rotatorRef}
					onPointerEnter={onPointerEnter}
					onPointerMove={onPointerMove}
					onPointerLeave={() => onPointerEnd(true)}
				>
					{imagesReady && displayData.src ? (
						<div className="card__front">
							<img src={displayData.src} alt={displayData.alt} />
							<div className="card__shine" />
							<div className="card__glare" />
						</div>
					) : null}

					{imagesReady && displayData.src ? (
						<>
							<div className="card__overlay" aria-hidden="true" />
							<div className="card__name" aria-hidden={false}>
								{displayData.alt}
							</div>
						</>
					) : null}

					{backVisible ? (
						<HoverCardBack
							src="/static/resources/gacha/back.webp"
							className={backFading ? "is-fading" : ""}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
