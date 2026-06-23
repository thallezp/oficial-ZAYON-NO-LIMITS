"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Props {
  data: { label: string; value: number }[];
  /** Quantos anos iniciais destacar (área sombreada "efeito dos primeiros anos"). */
  highlightYears?: number;
  height?: number;
  color?: string;
  formatter?: (v: number) => string;
}

/**
 * Linha/área da projeção de patrimônio com uma janela inicial realçada via
 * markArea — mostra visualmente o peso dos primeiros anos. Usa ECharts (mesma
 * lib dos outros gráficos), sem dependência nova.
 */
export function ProjectionChart({
  data,
  highlightYears = 5,
  height = 280,
  color = "#22c55e",
  formatter,
}: Props) {
  const option = React.useMemo(() => {
    const labels = data.map((d) => d.label);
    const endLabel = labels[Math.min(highlightYears, labels.length - 1)] ?? labels[0];
    return {
      grid: { left: 8, right: 12, top: 20, bottom: 24 },
      xAxis: {
        type: "category",
        data: labels,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "rgba(180,188,210,0.6)", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
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
          lineStyle: { color, width: 2.5 },
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
          markArea: {
            silent: true,
            itemStyle: { color: "rgba(245,158,11,0.12)" },
            label: {
              show: true,
              position: "insideTop",
              color: "rgba(245,158,11,0.9)",
              fontSize: 10,
              fontWeight: 600,
              formatter: `1ºs ${highlightYears} anos`,
            },
            data: [[{ xAxis: labels[0] }, { xAxis: endLabel }]],
          },
        },
      ],
    };
  }, [data, highlightYears, color, formatter]);

  return <ReactECharts option={option} style={{ height, width: "100%" }} />;
}
