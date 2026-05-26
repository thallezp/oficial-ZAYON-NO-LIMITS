"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Props {
  value: number; // 0–100
  label?: string;
  color?: string;
  height?: number;
}

export function GaugeChart({
  value,
  label,
  color = "#3b82f6",
  height = 220,
}: Props) {
  const option = React.useMemo(
    () => ({
      series: [
        {
          type: "gauge",
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max: 100,
          progress: {
            show: true,
            width: 14,
            roundCap: true,
            itemStyle: { color },
          },
          axisLine: {
            lineStyle: {
              width: 14,
              color: [[1, "rgba(255,255,255,0.06)"]],
            },
          },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 28,
            fontWeight: 600,
            color: "#f5f7fa",
            offsetCenter: [0, "10%"],
            formatter: (v: number) => `${v.toFixed(0)}`,
          },
          data: [{ value, name: label ?? "" }],
        },
      ],
    }),
    [value, label, color],
  );

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}

interface RadialProps {
  items: { name: string; value: number; color?: string }[];
  height?: number;
}

export function RadialBars({ items, height = 240 }: RadialProps) {
  const option = React.useMemo(
    () => ({
      polar: {
        radius: ["28%", "80%"],
      },
      angleAxis: {
        max: 100,
        startAngle: 90,
        show: false,
      },
      radiusAxis: {
        type: "category",
        data: items.map((i) => i.name),
        axisLabel: {
          color: "rgba(180,188,210,0.7)",
          fontSize: 10,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      tooltip: {
        backgroundColor: "rgba(13,16,30,0.92)",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#fff", fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          coordinateSystem: "polar",
          data: items.map((i, idx) => ({
            value: i.value,
            itemStyle: {
              color:
                i.color ??
                ["#3b82f6", "#a855f7", "#22c55e", "#f97369", "#facc15", "#06b6d4"][
                  idx % 6
                ],
              borderRadius: 6,
            },
          })),
          showBackground: true,
          backgroundStyle: { color: "rgba(255,255,255,0.04)" },
        },
      ],
    }),
    [items],
  );

  return <ReactECharts option={option} style={{ height, width: "100%" }} />;
}
