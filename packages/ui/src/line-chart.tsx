"use client";

import React, { useRef, useEffect } from "react";
import { useMemo, useState, useCallback } from "react";
import { LinePath } from "@visx/shape";
import { curveNatural } from "@visx/curve";
import { scaleTime, scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { localPoint } from "@visx/event";
import { motion, useSpring, useTransform } from "motion/react";
// @ts-expect-error - d3-array types not installed
import { bisector } from "d3-array";

interface DataPoint {
  date: Date;
  uniqueUsers: number;
  pageviews: number;
}

// Generate mock data for last 30 days
function generateData(): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const baseUsers = 1200 + Math.sin(i * 0.4) * 300;
    const basePageviews = 4500 + Math.sin(i * 0.35) * 800;
    const userNoise = Math.random() * 200 - 100;
    const pageviewNoise = Math.random() * 500 - 250;

    data.push({
      date,
      uniqueUsers: Math.round(Math.max(0, baseUsers + userNoise + i * 8)),
      pageviews: Math.round(
        Math.max(0, basePageviews + pageviewNoise + i * 25)
      ),
    });
  }

  return data;
}

const getDate = (d: DataPoint) => d.date;
const bisectDate = bisector<DataPoint, Date>((d: DataPoint) => d.date).left;

// Theme colors
const colors = {
  light: {
    foreground: "#18181b",
    background: "#ffffff",
    mutedForeground: "#71717a",
  },
  dark: {
    foreground: "#fafafa",
    background: "#09090b",
    mutedForeground: "#a1a1aa",
  },
};

// Spring config for tooltip animations
const tooltipSpringConfig = { stiffness: 400, damping: 35 };

interface ChartProps {
  width: number;
  height: number;
  data: DataPoint[];
  isDark?: boolean;
}

function Chart({ width, height, data, isDark = false }: ChartProps) {
  const theme = isDark ? colors.dark : colors.light;

  const [tooltipData, setTooltipData] = useState<{
    point: DataPoint;
    index: number;
    x: number;
    yUsers: number;
    yPageviews: number;
  } | null>(null);

  // Path refs for measuring and dash calculations
  const usersPathRef = useRef<SVGPathElement>(null);
  const pageviewsPathRef = useRef<SVGPathElement>(null);
  const [pathLengths, setPathLengths] = useState({ users: 0, pageviews: 0 });
  const [isAnimated, setIsAnimated] = useState(false);

  // Animated tooltip position
  const tooltipX = useSpring(0, tooltipSpringConfig);
  const tooltipYUsers = useSpring(0, tooltipSpringConfig);
  const tooltipYPageviews = useSpring(0, tooltipSpringConfig);

  // Tooltip position transforms
  const datePillTranslate = useTransform(tooltipX, (x) => x + 40);
  const tooltipBoxTranslate = useTransform(tooltipX, (x) =>
    x + 40 > width - 150 ? x + 40 - 140 : x + 40 + 14
  );

  const margin = { top: 40, right: 40, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: [
          Math.min(...data.map((d) => getDate(d).getTime())),
          Math.max(...data.map((d) => getDate(d).getTime())),
        ],
      }),
    [innerWidth, data]
  );

  const yScaleUsers = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [0, Math.max(...data.map((d) => d.uniqueUsers)) * 1.1],
        nice: true,
      }),
    [innerHeight, data]
  );

  const yScalePageviews = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [0, Math.max(...data.map((d) => d.pageviews)) * 1.1],
        nice: true,
      }),
    [innerHeight, data]
  );

  // Measure path lengths after render and trigger animation
  useEffect(() => {
    if (usersPathRef.current && pageviewsPathRef.current) {
      const usersLen = usersPathRef.current.getTotalLength();
      const pageviewsLen = pageviewsPathRef.current.getTotalLength();
      setPathLengths({
        users: usersLen,
        pageviews: pageviewsLen,
      });

      // Trigger draw animation after path lengths are measured
      if (!isAnimated && usersLen > 0) {
        // Small delay to ensure initial state is set
        requestAnimationFrame(() => {
          setIsAnimated(true);
        });
      }
    }
  }, [width, height, data, isAnimated]);

  // Update animated tooltip position when tooltip data changes
  useEffect(() => {
    if (tooltipData) {
      tooltipX.set(tooltipData.x);
      tooltipYUsers.set(tooltipData.yUsers);
      tooltipYPageviews.set(tooltipData.yPageviews);
    }
  }, [tooltipData, tooltipX, tooltipYUsers, tooltipYPageviews]);

  // Calculate dash offset/array for highlighting a segment using binary search
  const getDashProps = useCallback(
    (pathRef: React.RefObject<SVGPathElement | null>, totalLength: number) => {
      if (!tooltipData || !pathRef.current || totalLength === 0) {
        return { strokeDasharray: "none", strokeDashoffset: 0 };
      }

      const idx = tooltipData.index;
      const startIdx = Math.max(0, idx - 1);
      const endIdx = Math.min(data.length - 1, idx + 1);

      const path = pathRef.current;

      // Binary search to find the length along the path at a specific X coordinate
      const findLengthAtX = (targetX: number): number => {
        let low = 0;
        let high = totalLength;
        const tolerance = 0.5;

        while (high - low > tolerance) {
          const mid = (low + high) / 2;
          const point = path.getPointAtLength(mid);
          if (point.x < targetX) {
            low = mid;
          } else {
            high = mid;
          }
        }
        return (low + high) / 2;
      };

      const startPoint = data[startIdx];
      const endPoint = data[endIdx];
      if (!startPoint || !endPoint)
        return { strokeDasharray: "none", strokeDashoffset: 0 };

      const startX = xScale(getDate(startPoint)) ?? 0;
      const endX = xScale(getDate(endPoint)) ?? 0;

      const startLength = findLengthAtX(startX);
      const endLength = findLengthAtX(endX);
      const segmentLength = endLength - startLength;

      return {
        strokeDasharray: `${segmentLength} ${totalLength}`,
        strokeDashoffset: -startLength,
      };
    },
    [tooltipData, data, xScale]
  );

  const usersDashProps = getDashProps(usersPathRef, pathLengths.users);
  const pageviewsDashProps = getDashProps(
    pageviewsPathRef,
    pathLengths.pageviews
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);
      if (!point) return;

      const x0 = xScale.invert(point.x - margin.left);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];

      if (!d0) return;

      let d: DataPoint = d0;
      let finalIndex = index - 1;
      if (d1 && getDate(d1)) {
        if (
          x0.getTime() - getDate(d0).getTime() >
          getDate(d1).getTime() - x0.getTime()
        ) {
          d = d1;
          finalIndex = index;
        }
      }

      setTooltipData({
        point: d,
        index: finalIndex,
        x: xScale(getDate(d)) ?? 0,
        yUsers: yScaleUsers(d.uniqueUsers) ?? 0,
        yPageviews: yScalePageviews(d.pageviews) ?? 0,
      });
    },
    [xScale, yScaleUsers, yScalePageviews, data, margin.left]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  const isHovering = tooltipData !== null;

  if (width < 10) return null;

  // CSS spring animation for draw effect (using linear() easing from Motion MCP)
  const drawAnimationStyle = {
    transition: isAnimated
      ? "stroke-dashoffset 1100ms linear(0, 0.4519, 1.2082, 1.5266, 1.2911, 0.8924, 0.7227, 0.8454, 1.0556, 1.146, 1.0821, 0.9713, 0.9231, 0.9564, 1.0148, 1.0405, 1.0231, 0.9923, 0.9787, 0.9877, 1.0039, 1.0112, 1.0065, 0.998, 0.9941, 0.9965, 1.001, 1.0031, 1.0018, 0.9995, 1, 0.999, 1.0003, 1, 1.0005, 0.9999, 1)"
      : "none",
  };

  return (
    <svg width={width} height={height}>
      <defs>
        {/* Users line gradient - fades at edges */}
        <linearGradient
          id="users-line-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="15%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="85%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>

        {/* Pageviews line gradient - fades at edges */}
        <linearGradient
          id="pageviews-line-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0" />
          <stop offset="15%" stopColor="#a1a1aa" stopOpacity="1" />
          <stop offset="85%" stopColor="#a1a1aa" stopOpacity="1" />
          <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0" />
        </linearGradient>

        {/* Dimmed gradients for hover state */}
        <linearGradient
          id="users-line-gradient-dim"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="15%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id="pageviews-line-gradient-dim"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0" />
          <stop offset="15%" stopColor="#a1a1aa" stopOpacity="0.3" />
          <stop offset="85%" stopColor="#a1a1aa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={width} height={height} fill="transparent" />

      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Pageviews base line with draw animation */}
        <LinePath
          innerRef={pageviewsPathRef}
          data={data}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScalePageviews(d.pageviews) ?? 0}
          stroke={
            isHovering
              ? "url(#pageviews-line-gradient-dim)"
              : "url(#pageviews-line-gradient)"
          }
          strokeWidth={2.5}
          strokeLinecap="round"
          curve={curveNatural}
          strokeDasharray={pathLengths.pageviews || undefined}
          strokeDashoffset={isAnimated ? 0 : pathLengths.pageviews}
          style={{
            ...drawAnimationStyle,
          }}
        />

        {/* Users base line with draw animation */}
        <LinePath
          innerRef={usersPathRef}
          data={data}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScaleUsers(d.uniqueUsers) ?? 0}
          stroke={
            isHovering
              ? "url(#users-line-gradient-dim)"
              : "url(#users-line-gradient)"
          }
          strokeWidth={2.5}
          strokeLinecap="round"
          curve={curveNatural}
          strokeDasharray={pathLengths.users || undefined}
          strokeDashoffset={isAnimated ? 0 : pathLengths.users}
          style={{
            ...drawAnimationStyle,
          }}
        />

        {/* Highlighted segment using stroke-dasharray */}
        {isHovering && (
          <>
            <LinePath
              data={data}
              x={(d) => xScale(getDate(d)) ?? 0}
              y={(d) => yScalePageviews(d.pageviews) ?? 0}
              stroke="#a1a1aa"
              strokeWidth={2.5}
              strokeLinecap="round"
              curve={curveNatural}
              strokeDasharray={pageviewsDashProps.strokeDasharray}
              strokeDashoffset={pageviewsDashProps.strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
            />
            <LinePath
              data={data}
              x={(d) => xScale(getDate(d)) ?? 0}
              y={(d) => yScaleUsers(d.uniqueUsers) ?? 0}
              stroke="#3b82f6"
              strokeWidth={2.5}
              strokeLinecap="round"
              curve={curveNatural}
              strokeDasharray={usersDashProps.strokeDasharray}
              strokeDashoffset={usersDashProps.strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
            />
          </>
        )}

        {/* Animated hover vertical line and dots */}
        {tooltipData && (
          <>
            <motion.line
              x1={tooltipX}
              y1={0}
              x2={tooltipX}
              y2={innerHeight}
              stroke={theme.foreground}
              strokeWidth={1}
            />
            {/* Users dot */}
            <motion.circle
              cx={tooltipX}
              cy={tooltipYUsers}
              r={5}
              fill="#3b82f6"
              stroke={theme.background}
              strokeWidth={2}
            />
            {/* Pageviews dot */}
            <motion.circle
              cx={tooltipX}
              cy={tooltipYPageviews}
              r={5}
              fill="#a1a1aa"
              stroke={theme.background}
              strokeWidth={2}
            />
          </>
        )}

        {/* Invisible overlay for mouse events */}
        <rect
          x={0}
          y={0}
          width={innerWidth}
          height={innerHeight}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </g>

      {/* Animated date pill at bottom */}
      {tooltipData && (
        <motion.g
          style={{ translateX: datePillTranslate, translateY: height - 12 }}
        >
          <rect
            x={-32}
            y={-10}
            width={64}
            height={20}
            rx={10}
            fill={theme.foreground}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={500}
            fill={theme.background}
          >
            {tooltipData.point.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </text>
        </motion.g>
      )}

      {/* Animated tooltip */}
      {tooltipData && (
        <motion.g
          style={{ translateX: tooltipBoxTranslate, translateY: margin.top }}
        >
          <motion.rect
            x={0}
            y={0}
            width={126}
            height={72}
            rx={8}
            fill={theme.foreground}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          />
          <text
            x={12}
            y={22}
            fontSize={12}
            fontWeight={500}
            fill={theme.mutedForeground}
          >
            {tooltipData.point.date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </text>
          <g transform="translate(12, 40)">
            <circle cx={5} cy={0} r={5} fill="#3b82f6" />
            <text x={16} y={4} fontSize={13} fill={theme.background}>
              People
            </text>
            <text
              x={114}
              y={4}
              fontSize={13}
              fill={theme.background}
              textAnchor="end"
            >
              {tooltipData.point.uniqueUsers.toLocaleString()}
            </text>
          </g>
          <g transform="translate(12, 58)">
            <circle cx={5} cy={0} r={5} fill="#a1a1aa" />
            <text x={16} y={4} fontSize={13} fill={theme.background}>
              Views
            </text>
            <text
              x={114}
              y={4}
              fontSize={13}
              fill={theme.background}
              textAnchor="end"
            >
              {tooltipData.point.pageviews.toLocaleString()}
            </text>
          </g>
        </motion.g>
      )}
    </svg>
  );
}

export default function CurvedLineChart() {
  const data = useMemo(() => generateData(), []);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode from document
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
      style={{ height: 400 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Last 30 Days
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Traffic overview
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-zinc-500 dark:text-zinc-400">People</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-400" />
            <span className="text-zinc-500 dark:text-zinc-400">Views</span>
          </div>
        </div>
      </div>
      <div style={{ height: 320 }}>
        <ParentSize>
          {({ width, height }) => (
            <Chart width={width} height={height} data={data} isDark={isDark} />
          )}
        </ParentSize>
      </div>
    </div>
  );
}
