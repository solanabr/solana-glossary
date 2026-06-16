"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  "a,button,[role='button'],select,summary,label[for],.category-pill,.game-card,.neon-btn,.glow-card,.personality-card";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hide on touch devices
    if ("ontouchstart" in window) {
      el.style.display = "none";
      return;
    }

    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest(INTERACTIVE)) {
        if (!active.current) {
          active.current = true;
          el.style.opacity = "1";
          el.style.width = "36px";
          el.style.height = "36px";
          el.classList.add("cursor-glow-active");
        }
      } else if (active.current) {
        active.current = false;
        el.style.opacity = "0";
        el.style.width = "28px";
        el.style.height = "28px";
        el.classList.remove("cursor-glow-active");
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="cursor-glow-dot"
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 99999,
        width: 28,
        height: 28,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0,
        transition:
          "opacity 0.15s ease, box-shadow 0.15s ease, width 0.2s ease, height 0.2s ease",
      }}
    />
  );
}
