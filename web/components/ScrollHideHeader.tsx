"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type ScrollHideHeaderProps = {
  className?: string;
  children: ReactNode;
};

export function ScrollHideHeader({ className = "", children }: ScrollHideHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= 16) {
        setHidden(false);
        lastScrollYRef.current = currentY;
        return;
      }

      if (Math.abs(delta) < 6) {
        return;
      }

      setHidden(delta > 0);
      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 overflow-hidden rounded-xl border border-slate-700 bg-panel/95 backdrop-blur transition-transform duration-200 ${hidden ? "-translate-y-[120%]" : "translate-y-0"} ${className}`}
    >
      {children}
    </header>
  );
}
