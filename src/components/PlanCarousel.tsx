"use client";

import { useState, useRef, useEffect } from "react";

interface PlanCarouselProps {
  children: React.ReactNode[];
  initialIndex?: number;
  className?: string;
  /** Breakpoint above which carousel is hidden. Default: "lg" */
  hideAbove?: "sm" | "lg";
}

/**
 * Shared horizontal snap-scroll carousel for plan cards.
 * Used by both LandingPage and BillingClient.
 */
export function PlanCarousel({
  children,
  initialIndex = 0,
  className = "",
  hideAbove = "lg",
}: PlanCarouselProps) {
  const [active, setActive] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current || !scrollRef.current) return;
    didInit.current = true;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / children.length;
    el.scrollTo({ left: cardWidth * initialIndex, behavior: "instant" });
  }, [initialIndex, children.length]);

  function handleScroll() {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / children.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActive(idx);
  }

  function scrollTo(idx: number) {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.scrollWidth / children.length;
    scrollRef.current.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
    setActive(idx);
  }

  const hideClass = hideAbove === "sm" ? "sm:hidden" : "lg:hidden";

  return (
    <div className={`mt-6 ${hideClass} ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[10%] pb-2 pt-5 scrollbar-hide"
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="w-[80vw] max-w-[360px] shrink-0 snap-center"
            onClick={() => scrollTo(i)}
          >
            {child}
          </div>
        ))}
      </div>
      {/* Pagination dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {children.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-accent" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
