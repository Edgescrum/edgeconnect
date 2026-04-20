"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginRequired } from "@/components/LoginRequired";

interface Service {
  id: number;
  name: string;
  caption: string | null;
  duration_min: number;
  price: number;
}

export function ServiceMenuList({
  services,
  slug,
  isLoggedIn,
}: {
  services: Service[];
  slug: string;
  isLoggedIn: boolean;
}) {
  const [showLogin, setShowLogin] = useState(false);

  function handleGuestClick(serviceId: number) {
    const path = `/p/${slug}/book/${serviceId}`;
    sessionStorage.setItem("login_redirect", path);
    localStorage.setItem("login_redirect", path);
    setShowLogin(true);
  }

  const menuContent = (service: Service) => (
    <>
      <div className="flex-1">
        <p className="font-semibold">{service.name}</p>
        {service.caption && (
          <p className="mt-1 text-xs text-muted line-clamp-1 sm:line-clamp-2 sm:text-sm">{service.caption}</p>
        )}
      </div>
      <div className="ml-4 flex items-center gap-2 sm:ml-0 sm:mt-4 sm:justify-start sm:gap-3">
        <div className="text-right sm:text-left">
          <p className="text-lg font-bold">¥{service.price.toLocaleString()}</p>
          <p className="text-xs text-muted">{service.duration_min}分</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted sm:hidden">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </>
  );

  return (
    <>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted sm:mb-4 sm:text-sm">
          メニュー
        </h2>

        {/* モバイル: リスト */}
        <ul className="space-y-2.5 sm:hidden">
          {services.map((service) => (
            <li key={service.id}>
              {isLoggedIn ? (
                <Link
                  href={`/p/${slug}/book/${service.id}`}
                  className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
                >
                  {menuContent(service)}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGuestClick(service.id)}
                  className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border active:scale-[0.99]"
                >
                  {menuContent(service)}
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* PC: カードグリッド */}
        <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const card = (
              <>
                <div>
                  <p className="text-lg font-bold">{service.name}</p>
                  {service.caption && (
                    <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">{service.caption}</p>
                  )}
                </div>
                <div className="mt-auto pt-5">
                  <div className="flex items-end justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-2xl font-bold">¥{service.price.toLocaleString()}</p>
                      <p className="mt-0.5 text-xs text-muted">{service.duration_min}分</p>
                    </div>
                    <span className="rounded-xl bg-accent/8 px-4 py-2 text-sm font-semibold text-accent">
                      予約する →
                    </span>
                  </div>
                </div>
              </>
            );
            const cls = "flex flex-col rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:shadow-lg hover:ring-accent/40 hover:-translate-y-0.5";
            return isLoggedIn ? (
              <Link key={service.id} href={`/p/${slug}/book/${service.id}`} className={cls}>
                {card}
              </Link>
            ) : (
              <button key={service.id} type="button" onClick={() => handleGuestClick(service.id)} className={`${cls} text-left`}>
                {card}
              </button>
            );
          })}
        </div>
      </section>

      {showLogin && (
        <LoginRequired
          message="予約にはログインが必要です"
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  );
}
