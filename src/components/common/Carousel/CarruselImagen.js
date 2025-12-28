import React, { useState } from "react";
import "./Carousel.css";
import ItemImagen from "../ItemImagen/ItemImagen";
import { MdiChevronLeft } from "../../icons/MdiChevronLeft";
import { MdiChevronRight } from "../../icons/MdiChevronRight";

export function CarruselImagen({ items }) {
  const [index, setIndex] = useState(() => {
    if (items && items.length > 1) {
      return Math.floor(Math.random() * items.length);
    }
    return 0;
  });
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

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setIndex((i) => (i === items.length - 1 ? 0 : i + 1));
      }, 10000);
    }
  };
  const handleTouchStart = (e) => {
    dragging.current = true;
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    resetTimer();
  };
  const handleTouchMove = (e) => {
    if (dragging.current) {
      resetTimer();
    }
  };
  const handleTouchEnd = (e) => {
    if (!dragging.current) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const delta = endX - startX.current;
    if (Math.abs(delta) > 30) {
      if (delta < 0 && index < items.length - 1) {
        setIndex(index + 1);
      } else if (delta > 0 && index > 0) {
        setIndex(index - 1);
      }
    }
    dragging.current = false;
    startX.current = null;
    resetTimer();
  };
  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const endX = e.clientX;
    const delta = endX - startX.current;
    if (Math.abs(delta) > 30) {
      if (delta < 0 && index < items.length - 1) {
        setIndex(index + 1);
      } else if (delta > 0 && index > 0) {
        setIndex(index - 1);
      }
      dragging.current = false;
      startX.current = null;
    }
    resetTimer();
  };
  const handleMouseLeave = () => {
    dragging.current = false;
    startX.current = null;
    resetTimer();
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
        className={dragging.current ? "carousel-dragging" : "carousel-idle"}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          padding: 8,
          width: "100%",
          userSelect: dragging.current ? "none" : undefined,
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="carousel-anim">
          <ItemImagen {...items[index]} />
        </div>
      </div>
      <div className="carousel-controls-row">
        <button
          className="carousel-arrow-btn carousel-arrow-left"
          onClick={() => {
            setIndex(index === 0 ? items.length - 1 : index - 1);
            resetTimer();
          }}
          aria-label="Anterior"
        >
          <MdiChevronLeft style={{ fontSize: 24, color: "var(--text)" }} />
        </button>
        <div className="carousel-dots">
          {items.map((_, i) => {
            return (
              <button
                key={i}
                onClick={() => {
                  setIndex(i);
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = setInterval(() => {
                      setIndex((idx) =>
                        idx === items.length - 1 ? 0 : idx + 1
                      );
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
        <button
          className="carousel-arrow-btn carousel-arrow-right"
          onClick={() => {
            setIndex(index === items.length - 1 ? 0 : index + 1);
            resetTimer();
          }}
          aria-label="Siguiente"
        >
          <MdiChevronRight style={{ fontSize: 24, color: "var(--text)" }} />
        </button>
      </div>
    </div>
  );
}
