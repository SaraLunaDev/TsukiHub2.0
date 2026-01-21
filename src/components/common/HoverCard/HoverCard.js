import React, { useRef, useEffect, useState } from "react";
import "./HoverCard.css";
import HoverCardBack from "./HoverCardBack";

// Todo pillado de aqui https://github.com/simeydotme/pokemon-cards-css

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

const BANNER_TIER_IMAGE_ADJUST = {
  mh: {
    3: { offsetY: -40, scale: 1 },
  },
  fs: {
    3: { offsetY: -20, scale: 1 },
  },
  db: {
    3: { offsetY: -30, scale: 1 },
  },
  gs: {
    3: { offsetY: -30, scale: 1 },
  },
  op: {
    3: { offsetY: -30, scale: 1 },
  },
};

export default function HoverCard({
  src,
  alt,
  banner,
  tier,
  holo,
  lockToBack = false,
}) {
  const RESET_DELAY = 1000;
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const current = useRef({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareO: 0,
    bgX: 50,
    bgY: 50,
    scale: 1,
    translateY: 0,
  });
  const target = useRef({ ...current.current });
  const interactingRef = useRef(false);

  const [displayData, setDisplayData] = useState({
    src,
    alt,
    banner,
    tier,
    holo,
  });

  // Mostrar dorso hasta que todas las imagenes carguen
  const [imagesReady, setImagesReady] = useState(false);
  const loadIdRef = useRef(0);

  // Control de fade out del dorso
  const [backVisible, setBackVisible] = useState(true);
  const [backFading, setBackFading] = useState(false);
  const backFadeTimeoutRef = useRef(null);
  const backFadeDelayRef = useRef(null);
  const backNoTransitionTimeoutRef = useRef(null);
  const backShownAtRef = useRef(0); // timestamp cuando se mostro el dorso

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

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
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
          el.style.setProperty("--banner-image-offset-y", `${adj.offsetY}px`);
        if (typeof adj.scale === "number")
          el.style.setProperty("--banner-image-scale", `${adj.scale}`);
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
    // Pre-cargar la carta entrante antes de aplicarla. Esto evita que, al cambiar
    // de carta dentro del mismo banner, se muestren partes incompletas.
    const incoming = { src, alt, banner, tier, holo };

    if (lockToBack) {
      // cancelar cualquier pre-carga en curso y enseñar dorso
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
      // Si la misma carta es clicada de nuevo, forzamos que el dorso se muestre
      // al menos MIN_MS y luego hacemos el fade de FADE_MS (sin cambiar displayData).
      const MIN_MS = 200; // minimo 200ms de dorso visible
      const FADE_MS = 1000; // fade-out de 1s

      // limpiar timers previos para evitar interferencias
      if (backFadeDelayRef.current) {
        clearTimeout(backFadeDelayRef.current);
        backFadeDelayRef.current = null;
      }
      if (backFadeTimeoutRef.current) {
        clearTimeout(backFadeTimeoutRef.current);
        backFadeTimeoutRef.current = null;
      }

      // cancelar fade en curso y mostrar dorso al completo sin transicion
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

      // programar inicio del fade una vez transcurrido el minimo
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

    // Si no hay src, aplicar inmediatamente (mostrara dorso)
    if (!incoming.src) {
      setDisplayData(incoming);
      setImagesReady(false);
      return;
    }

    // Mostrar dorso mientras pre-cargamos la nueva carta
    setImagesReady(false);
    // cancelar cualquier animacion previa y forzar dorso visible al completo
    setBackVisible(true);
    // limpiar timers previos para evitar que un fade anterior afecte
    if (backFadeDelayRef.current) {
      clearTimeout(backFadeDelayRef.current);
      backFadeDelayRef.current = null;
    }
    if (backFadeTimeoutRef.current) {
      clearTimeout(backFadeTimeoutRef.current);
      backFadeTimeoutRef.current = null;
    }
    // quitar transicion temporalmente para que vuelva a opacidad completa sin animacion
    const backEl = el && el.querySelector(".card__back-overlay");
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
    const id = ++loadIdRef.current;

    const urls = new Set();
    urls.add(incoming.src);

    if (typeof incoming.tier !== "undefined" && incoming.tier !== null) {
      urls.add(`/static/resources/gacha/tier${incoming.tier}.webp`);
      urls.add(`/static/resources/gacha/tier${incoming.tier}_low.webp`);
      if (incoming.tier === 5) urls.add(`/img/glitter.png`);
      if (incoming.tier === 4) urls.add(`/img/illusion.png`);
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

    // utilidades para aplicar CSS cuando cargan las imagenes (para que
    // la carta quede totalmente preparada antes de mostrarla)
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
          el.style.setProperty("--banner-image-offset-y", `${adj.offsetY}px`);
        if (typeof adj.scale === "number")
          el.style.setProperty("--banner-image-scale", `${adj.scale}`);
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
        el.style.setProperty("--tier-illusion", `url('/img/glitter.png')`);
        el.style.setProperty("--illusion-size", "cover");
        el.style.setProperty("--illusion-opacity", "0.03");
      } else if (kind === "illusion") {
        el.style.setProperty("--tier-illusion", `url('/img/illusion.png')`);
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
          // todas listas: aplicar la nueva carta y mostrar frente
          setDisplayData(incoming);
          setImagesReady(true);
        }
      };

      img.onload = () => {
        if (cancelledLoad) return;
        // aplicar variables CSS relevantes segun la url cargada
        if (incoming.banner && url.endsWith(`/tier${incoming.tier}.jpg`)) {
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
        // tratar error como 'done' para no bloquear la transicion
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

    // Pre-cargar overlays y aplicar al cargarse
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
      el.style.setProperty("--tier-overlay-bottom-pos-x", `${pos.bottom.x}%`);
      el.style.setProperty("--tier-overlay-bottom-pos-y", `${pos.bottom.y}%`);
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
      el.style.setProperty("--tier-overlay-bottom", `url("${bottomUrl}")`);
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
          el.style.setProperty("--tier-illusion", `url('/img/glitter.png')`);
          el.style.setProperty("--illusion-size", "cover");
          el.style.setProperty("--illusion-opacity", "0.03");
        } else if (dTier === 4) {
          el.style.removeProperty("--foil");
          el.style.removeProperty("--imgsize");
          el.style.removeProperty("--mask");
          el.style.setProperty("--tier-illusion", `url('/img/illusion.png')`);
          el.style.setProperty("--illusion-size", "65%");
          el.style.setProperty("--illusion-opacity", "0.03");
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

  // Cuando imagesReady cambia, gestionar el fade del dorso (min 200ms de visibilidad tras click)
  // Cuando imagesReady cambia, gestionar el fade del dorso (min 200ms de visibilidad tras click)
  useEffect(() => {
    const FADE_MS = 200; // 1s duracion del fade-out
    const MIN_BACK_MS = 250; // minimo 200ms de dorso visible desde el momento de mostrarlo
    const el = cardRef.current;
    if (imagesReady) {
      // cancelar timers previos
      if (backFadeDelayRef.current) {
        clearTimeout(backFadeDelayRef.current);
        backFadeDelayRef.current = null;
      }
      if (backFadeTimeoutRef.current) {
        clearTimeout(backFadeTimeoutRef.current);
        backFadeTimeoutRef.current = null;
      }
      // determinar cuanto falta para cubrir MIN_BACK_MS desde que se mostro el dorso
      const elapsed = Date.now() - (backShownAtRef.current || 0);
      const wait = Math.max(0, MIN_BACK_MS - elapsed);
      // iniciar fade cuando se cumpla el minimo (si wait==0, inicia ya)
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
      // cancelar cualquier timer y mostrar dorso de inmediato
      if (backFadeDelayRef.current) {
        clearTimeout(backFadeDelayRef.current);
        backFadeDelayRef.current = null;
      }
      if (backFadeTimeoutRef.current) {
        clearTimeout(backFadeTimeoutRef.current);
        backFadeTimeoutRef.current = null;
      }
      // limpiar no-transicion si existe y restaurar transicion
      if (backNoTransitionTimeoutRef.current) {
        clearTimeout(backNoTransitionTimeoutRef.current);
        backNoTransitionTimeoutRef.current = null;
      }
      const backEl = el && el.querySelector(".card__back-overlay");
      if (backEl) backEl.style.transition = "";
      setBackFading(false);
      setBackVisible(true);
      backShownAtRef.current = Date.now(); // re-marcar inicio de visibilidad
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

  // Pre-carga trasladada al efecto que maneja la llegada de la carta entrante.
  // Esto evita duplicar logica y controla mejor el cambio de carta dentro del mismo banner.

  const scheduleRAF = () => {
    if (rafRef.current) return;
    const step = () => {
      const el = cardRef.current;
      if (!el) return;
      const c = current.current;
      const t = target.current;
      const f = interactingRef.current ? 0.18 : 0.12;

      c.rotateX += (t.rotateX - c.rotateX) * f;
      c.rotateY += (t.rotateY - c.rotateY) * f;
      c.glareX += (t.glareX - c.glareX) * f;
      c.glareY += (t.glareY - c.glareY) * f;
      c.glareO += (t.glareO - c.glareO) * f;
      c.bgX += (t.bgX - c.bgX) * f;
      c.bgY += (t.bgY - c.bgY) * f;
      c.scale += (t.scale - c.scale) * f;
      c.translateY += (t.translateY - c.translateY) * f;

      const dist = Math.sqrt((c.glareX - 50) ** 2 + (c.glareY - 50) ** 2) / 50;
      const pointerFromCenter = clamp(dist, 0, 1);

      el.style.setProperty("--rotate-x", `${c.rotateX.toFixed(2)}deg`);
      el.style.setProperty("--rotate-y", `${c.rotateY.toFixed(2)}deg`);
      el.style.setProperty("--pointer-x", `${c.glareX.toFixed(2)}%`);
      el.style.setProperty("--pointer-y", `${c.glareY.toFixed(2)}%`);
      el.style.setProperty("--pointer-from-center", `${pointerFromCenter}`);
      el.style.setProperty(
        "--pointer-from-top",
        `${(c.glareY / 100).toFixed(3)}`,
      );
      el.style.setProperty(
        "--pointer-from-left",
        `${(c.glareX / 100).toFixed(3)}`,
      );
      el.style.setProperty("--card-opacity", `${c.glareO.toFixed(3)}`);
      el.style.setProperty("--card-scale", `${c.scale.toFixed(3)}`);
      el.style.setProperty("--translate-y", `${Math.round(c.translateY)}px`);
      el.style.setProperty("--background-x", `${c.bgX.toFixed(2)}%`);
      el.style.setProperty("--background-y", `${c.bgY.toFixed(2)}%`);

      const delta =
        Math.abs(t.rotateX - c.rotateX) +
        Math.abs(t.rotateY - c.rotateY) +
        Math.abs(t.glareO - c.glareO);
      if (delta > 0.01) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const hoverAllowTiltRef = useRef(false);
  const hoverAllowTimeoutRef = useRef(null);

  const onPointerEnter = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const el = cardRef.current;
    if (!el) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    el.classList.add("is-hovered");

    hoverAllowTiltRef.current = false;
    if (hoverAllowTimeoutRef.current) {
      clearTimeout(hoverAllowTimeoutRef.current);
      hoverAllowTimeoutRef.current = null;
    }

    target.current.scale = 1.08;
    target.current.translateY = -10;
    target.current.glareO = 0.6;
    scheduleRAF();

    hoverAllowTimeoutRef.current = setTimeout(() => {
      hoverAllowTiltRef.current = true;
      hoverAllowTimeoutRef.current = null;
    }, 120);
  };

  const onPointerMove = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const el = cardRef.current;
    if (!el) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    el.classList.add("is-hovered");

    if (!hoverAllowTiltRef.current) return;

    interactingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = el.getBoundingClientRect();
    const absolute = { x: clientX - rect.left, y: clientY - rect.top };
    const percent = {
      x: clamp(Math.round((100 / rect.width) * absolute.x), 0, 100),
      y: clamp(Math.round((100 / rect.height) * absolute.y), 0, 100),
    };
    const center = { x: percent.x - 50, y: percent.y - 50 };

    const factor = 3.5;
    const rotateX = Math.round(center.y / factor);
    const rotateY = Math.round(-center.x / factor);

    target.current = {
      rotateX: rotateX,
      rotateY: rotateY,
      glareX: percent.x,
      glareY: percent.y,
      glareO: 0.9,
      bgX: adjust(percent.x, 0, 100, 37, 63),
      bgY: adjust(percent.y, 0, 100, 33, 67),

      scale: 1.08,
      translateY: -8,
    };

    scheduleRAF();
  };

  const onPointerEnd = (immediate = false) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (hoverAllowTimeoutRef.current) {
      clearTimeout(hoverAllowTimeoutRef.current);
      hoverAllowTimeoutRef.current = null;
    }
    hoverAllowTiltRef.current = false;

    const doReset = () => {
      interactingRef.current = false;
      const el = cardRef.current;
      if (el) el.classList.remove("is-hovered");
      target.current = {
        rotateX: 0,
        rotateY: 0,
        glareX: 50,
        glareY: 50,
        glareO: 0,
        bgX: 50,
        bgY: 50,

        scale: 1,
        translateY: 0,
      };
      scheduleRAF();
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

  const onFocus = () => {
    const el = cardRef.current;
    if (!el) return;
    target.current.scale = 1.03;
    target.current.translateY = -8;
    target.current.glareO = 0.6;
    scheduleRAF();
  };

  const onBlur = () => onPointerEnd(true);

  const pointerEnterRef = useRef(onPointerEnter);
  const pointerMoveRef = useRef(onPointerMove);
  const pointerEndRef = useRef(onPointerEnd);

  useEffect(() => {
    pointerEnterRef.current = onPointerEnter;
    pointerMoveRef.current = onPointerMove;
    pointerEndRef.current = onPointerEnd;
  });

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

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

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="card simple-card"
      data-banner={displayData.banner}
      data-tier={displayData.tier}
      data-holo={
        displayData.tier === 3
          ? "trainer-gallery"
          : displayData.tier === 5
            ? "v-full-art"
            : undefined
      }
      role="img"
      aria-label={displayData.alt || "card"}
      tabIndex="0"
      onMouseEnter={onPointerEnter}
      onMouseMove={onPointerMove}
      onMouseLeave={() => onPointerEnd(true)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="card__translater">
        <div className="card__rotator">
          {/* Front: solo cuando las imagenes estan listas */}
          {imagesReady && displayData.src ? (
            <>
              <img
                src={displayData.src}
                alt={displayData.alt}
                className="card__front"
              />
              <div className="card__overlay" aria-hidden="true" />
              <div className="card__shine" />
              <div className="card__glare" />
              <div className="card__name" aria-hidden={false}>
                {displayData.alt}
              </div>
            </>
          ) : null}

          {/* Dorso: siempre visible al click y durante al menos 200ms. Si la imagen necesita
              cargarse, mantener el dorso hasta que termine; una vez lista, iniciar fade-out de 1s para mostrar la carta. */}
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
