"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Props {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatter?: (v: number) => string;
  horizontal?: boolean;
}

export function BarChart({
  data,
  height = 220,
  color = "#5b8cff",
  formatter,
  horizontal = false,
}: Props) {
  const option = React.useMemo(() => {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.value);
    return {
      grid: { left: horizontal ? 80 : 8, right: 8, top: 8, bottom: 28 },
      xAxis: horizontal
        ? {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
            axisLabel: { color: "rgba(180,188,210,0.6)", fontSize: 10 },
          }
        : {
            type: "category",
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "rgba(180,188,210,0.6)", fontSize: 10 },
          },
      yAxis: horizontal
        ? {
            type: "category",
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "rgba(180,188,210,0.7)", fontSize: 11 },
          }
        : {
            type: "value",
            splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
            axisLabel: { color: "rgba(180,188,210,0.6)", fontSize: 10 },
          },
      tooltip: {
        backgroundColor: "rgba(13,16,30,0.92)",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#fff", fontSize: 11 },
        valueFormatter: (v: number) => (formatter ? formatter(v) : String(v)),
      },
      series: [
        {
          type: "bar",
          data: values,
          barWidth: horizontal ? 14 : 22,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color },
                { offset: 1, color: `${color}40` },
              ],
            },
            borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
          },
        },
      ],
    };
  }, [data, color, formatter, horizontal]);

  return <ReactECharts option={option} style={{ height, width: "100%" }} />;
}
