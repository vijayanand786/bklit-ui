"use client";

import type { ReactNode } from "react";
import { legendCssVars, useLegend, useLegendItem } from "./legend-context";

export interface LegendItemProps {
  /** Container class name */
  className?: string;
  /** Children components (LegendMarker, LegendLabel, LegendValue, LegendProgress) */
  children: ReactNode;
}

export function LegendItem({ className = "", children }: LegendItemProps) {
  const { setHoveredIndex } = useLegend();
  const { index, isHovered } = useLegendItem();

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Legend item hover interaction
    // biome-ignore lint/a11y/noStaticElementInteractions: Legend item hover interaction
    <div
      className={`cursor-pointer rounded-lg px-2 py-1.5 transition-all duration-150 ease-out ${className}`}
      data-hovered={isHovered ? "" : undefined}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{
        backgroundColor: isHovered ? legendCssVars.muted : "transparent",
      }}
    >
      {children}
    </div>
  );
}

LegendItem.displayName = "LegendItem";
