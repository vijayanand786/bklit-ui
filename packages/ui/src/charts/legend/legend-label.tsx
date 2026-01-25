"use client";

import { legendCssVars, useLegendItem } from "./legend-context";

export interface LegendLabelProps {
  /** Label class name. Default: "text-sm font-medium" */
  className?: string;
}

export function LegendLabel({
  className = "text-sm font-medium",
}: LegendLabelProps) {
  const { item } = useLegendItem();

  return (
    <span className={className} style={{ color: legendCssVars.foreground }}>
      {item.label}
    </span>
  );
}

LegendLabel.displayName = "LegendLabel";
