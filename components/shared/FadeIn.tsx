"use client";

import React, { useRef, useEffect, useState, ElementType } from "react";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}

export function FadeIn({ children, className, delay = 0, as: Tag = "div" }: FadeInProps) {
  const ref   = useRef<HTMLElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity:    vis ? 1 : 0,
        transform:  vis ? "translateY(0)" : "translateY(-14px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
