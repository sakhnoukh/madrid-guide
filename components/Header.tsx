"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // tweak this number to match hero height / when you want the switch
      setScrolled(window.scrollY > 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div
        className={[
          "transition-colors duration-300",
          // Glass surface
          scrolled
            ? "bg-[#F6EFE7]/80 backdrop-blur-xl"
            : "bg-white/10 backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className={[
              "font-serif text-sm tracking-wide transition-colors duration-300",
              scrolled ? "text-[#2B2623]" : "text-white/90",
            ].join(" ")}
          >
            Sami&apos;s Guide
          </Link>

          <nav
            className={[
              "flex items-center gap-6 text-sm transition-colors duration-300",
              scrolled ? "text-[#2B2623]/80" : "text-white/80",
            ].join(" ")}
          >
            <Link className={scrolled ? "hover:text-[#2B2623]" : "hover:text-white"} href="/places">
              Places
            </Link>
            <Link className={scrolled ? "hover:text-[#2B2623]" : "hover:text-white"} href="/collections">
              Collections
            </Link>
            <Link className={scrolled ? "hover:text-[#2B2623]" : "hover:text-white"} href="/#about">
              About
            </Link>
          </nav>
        </div>
      </div>

      {/* Soft fade under header */}
      <div
        className={[
          "h-6 transition-colors duration-300",
          scrolled
            ? "bg-gradient-to-b from-[#F6EFE7]/80 to-transparent"
            : "bg-gradient-to-b from-white/10 to-transparent",
        ].join(" ")}
      />
    </header>
  );
}
