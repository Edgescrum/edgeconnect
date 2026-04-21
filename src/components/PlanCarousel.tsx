"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { LineIcon } from "@/components/icons";

interface Plan {
  name: string;
  price: number;
  desc: string;
  recommended?: boolean;
  trial?: boolean;
  features: string[];
  comingSoon: boolean;
}

export function PlanCarousel({
  plans,
  isLoggedIn,
  role,
}: {
  plans: Plan[];
  isLoggedIn: boolean;
  role?: "customer" | "provider";
}) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / plans.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActive(idx);
  }

  function scrollTo(idx: number) {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.scrollWidth / plans.length;
    scrollRef.current.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
    setActive(idx);
  }

  return (
    <div className="mt-6 sm:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[10%] pb-2 pt-5 scrollbar-hide"
      >
        {plans.map((plan, i) => {
          const isCurrentPlan = role === "provider" && plan.name === "ベーシック";
          return (
            <div
              key={plan.name}
              className="w-[80vw] max-w-[360px] shrink-0 snap-center"
              onClick={() => scrollTo(i)}
            >
              <div
                className={`relative h-full rounded-2xl bg-card p-5 ${
                  isCurrentPlan
                    ? "ring-2 ring-accent shadow-md"
                    : plan.recommended && role !== "provider"
                      ? "ring-2 ring-accent shadow-md"
                      : "ring-1 ring-border"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                    ご利用中
                  </div>
                )}
                {!isCurrentPlan && plan.recommended && role !== "provider" && (
                  <div className="absolute -top-3 left-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                    おすすめ
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isCurrentPlan || plan.recommended ? "text-accent" : "text-muted"}`}>
                    {plan.name}
                  </p>
                  {plan.trial && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      1ヶ月無料
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">¥{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-muted">/月</span>
                </div>
                <p className="mt-1 text-xs text-muted">{plan.desc}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((item, fi) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`mt-0.5 shrink-0 ${plan.comingSoon && fi > 0 ? "text-muted/40" : "text-accent"}`}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className={plan.comingSoon && fi > 0 ? "text-muted" : ""}>{item}</span>
                    </li>
                  ))}
                </ul>
                {plan.comingSoon ? (
                  <button disabled className="mt-5 flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold text-muted opacity-50">
                    近日公開予定
                  </button>
                ) : isCurrentPlan ? (
                  <Link href="/provider" className="mt-5 flex w-full items-center justify-center rounded-xl border border-accent py-3 text-sm font-semibold text-accent active:scale-[0.98]">
                    管理画面へ
                  </Link>
                ) : !isLoggedIn ? (
                  <a href="/?action=login" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]">
                    <LineIcon size={18} />
                    無料トライアルを始める
                  </a>
                ) : role !== "provider" ? (
                  <Link href="/provider/register" className="mt-5 flex w-full items-center justify-center rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]">
                    事業主として始める
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {/* ページネーション */}
      <div className="mt-3 flex justify-center gap-1.5">
        {plans.map((_, i) => (
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
