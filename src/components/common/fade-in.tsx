"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    up: "animate-slide-up",
    down: "animate-slide-down",
    none: "animate-fade-in",
  };

  return (
    <div
      className={cn(
        "opacity-0",
        isVisible && directionClasses[direction],
        className
      )}
    >
      {children}
    </div>
  );
}
