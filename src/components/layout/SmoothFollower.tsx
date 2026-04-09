"use client";

import { useState, useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR =
  "a, button, img, input, textarea, select, label, summary, [role='button'], [tabindex]:not([tabindex='-1'])";

/**
 * Custom cursor: filled dot + lagging ring. `pointer-events-none` so it never blocks clicks.
 * Hover size uses elementFromPoint so it works for SPA-added links without manual listeners.
 */
export function SmoothFollower() {
  const mousePosition = useRef({ x: 0, y: 0 });
  const dotPosition = useRef({ x: 0, y: 0 });
  const borderDotPosition = useRef({ x: 0, y: 0 });

  const [renderPos, setRenderPos] = useState({
    dot: { x: 0, y: 0 },
    border: { x: 0, y: 0 },
  });
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  const DOT_SMOOTHNESS = 0.2;
  const BORDER_DOT_SMOOTHNESS = 0.1;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = prevCursor;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setIsHovering(!!el?.closest(INTERACTIVE_SELECTOR));
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let rafId = 0;
    let cancelled = false;

    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      if (cancelled) return;

      dotPosition.current.x = lerp(
        dotPosition.current.x,
        mousePosition.current.x,
        DOT_SMOOTHNESS
      );
      dotPosition.current.y = lerp(
        dotPosition.current.y,
        mousePosition.current.y,
        DOT_SMOOTHNESS
      );

      borderDotPosition.current.x = lerp(
        borderDotPosition.current.x,
        mousePosition.current.x,
        BORDER_DOT_SMOOTHNESS
      );
      borderDotPosition.current.y = lerp(
        borderDotPosition.current.y,
        mousePosition.current.y,
        BORDER_DOT_SMOOTHNESS
      );

      setRenderPos({
        dot: { x: dotPosition.current.x, y: dotPosition.current.y },
        border: { x: borderDotPosition.current.x, y: borderDotPosition.current.y },
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    >
      <div
        className="absolute rounded-full bg-foreground"
        style={{
          width: 8,
          height: 8,
          transform: "translate(-50%, -50%)",
          left: renderPos.dot.x,
          top: renderPos.dot.y,
        }}
      />
      <div
        className="absolute rounded-full border-2 border-foreground"
        style={{
          width: isHovering ? 44 : 28,
          height: isHovering ? 44 : 28,
          transform: "translate(-50%, -50%)",
          left: renderPos.border.x,
          top: renderPos.border.y,
          transition: "width 0.2s ease, height 0.2s ease",
        }}
      />
    </div>
  );
}
