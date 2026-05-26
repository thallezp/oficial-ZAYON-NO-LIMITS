"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Props {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatter?: (v: number) => string;
}

export function AreaChart({
  data,
  height = 220,
  color = "#5b8cff",
  formatter,
}: Props) {
  const option = React.useMemo(
    () => ({
      grid: { left: 0, right: 0, top: 16, bottom: 24 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(180, 188, 210, 0.6)",
          fontSize: 10,
        },
      },
      yAxis: {
        type: "value",
        splitLine: {
          lineStyle: { color: "rgba(255,255,255,0.05)" },
        },
        axisLabel: { show: false },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(13,16,30,0.92)",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#fff", fontSize: 11 },
        valueFormatter: (v: number) => (formatter ? formatter(v) : String(v)),
      },
      series: [
        {
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color, width: 2 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${color}55` },
                { offset: 1, color: `${color}00` },
              ],
            },
          },
          data: data.map((d) => d.value),
        },
      ],
    }),
    [data, color, formatter],
  );

  return <ReactECharts option={option} style={{ height, width: "100%" }} />;
}
