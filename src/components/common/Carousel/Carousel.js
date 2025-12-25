import React, { useState } from "react";
import ItemCaratula from "../ItemCaratula/ItemCaratula";

export function Carousel({ items }) {
  const [index, setIndex] = useState(0);
  const timerRef = React.useRef();
  React.useEffect(() => {
    if (!items || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i === items.length - 1 ? 0 : i + 1));
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [items]);

  const touchRef = React.useRef();
  const startX = React.useRef(null);
  const dragging = React.useRef(false);

  if (!items || items.length === 0) return null;

  const handleTouchStart = (e) => {
    dragging.current = true;
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };
  const handleTouchEnd = (e) => {
    if (!dragging.current) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const delta = endX - startX.current;
    if (Math.abs(delta) > 30) {
      if (delta < 0 && index < items.length - 1) setIndex(index + 1);
      else if (delta > 0 && index > 0) setIndex(index - 1);
    }
    dragging.current = false;
    startX.current = null;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        ref={touchRef}
        style={{ padding: 8, width: "100%" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <ItemCaratula {...items[index]} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 0, minHeight: 20 }}>
        {items.map((_, i) => {
          return (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = setInterval(() => {
                    setIndex((idx) => (idx === items.length - 1 ? 0 : idx + 1));
                  }, 10000);
                }
              }}
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                border: "none",
                background: i === index ? "var(--text)" : "var(--text-2)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                transform: i === index ? "scale(1.4)" : "scale(1)",
              }}
              aria-label={`Ir al elemento ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
