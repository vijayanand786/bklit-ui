"use client";

import { Progress } from "@base-ui/react/progress";
import { legendCssVars, useLegendItem } from "./legend-context";

export interface LegendProgressProps {
  /** Track class name */
  trackClassName?: string;
  /** Indicator class name */
  indicatorClassName?: string;
  /** Track height. Default: "h-1.5" */
  height?: string;
}

export function LegendProgress({
  trackClassName = "",
  indicatorClassName = "",
  height = "h-1.5",
}: LegendProgressProps) {
  const { item } = useLegendItem();

  if (!item.maxValue) {
    return null;
  }

  return (
    <Progress.Root max={item.maxValue} value={item.value}>
      <Progress.Track
        className={`w-full overflow-hidden rounded-full ${height} ${trackClassName}`}
        style={{ backgroundColor: legendCssVars.track }}
      >
        <Progress.Indicator
          className={`h-full rounded-full transition-all duration-500 ${indicatorClassName}`}
          style={{ backgroundColor: item.color }}
        />
      </Progress.Track>
    </Progress.Root>
  );
}

LegendProgress.displayName = "LegendProgress";
