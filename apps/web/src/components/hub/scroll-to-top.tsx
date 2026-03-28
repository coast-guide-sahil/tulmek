"use client";

import { useState, useEffect } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollHandler = () => setVisible(window.scrollY > 300);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Home" && !e.ctrlKey && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={[
        "fixed bottom-6 right-6 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-card shadow-lg",
        "transition-all duration-300 ease-in-out hover:bg-primary hover:text-primary-foreground",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      ].join(" ")}
      aria-label="Scroll to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}
