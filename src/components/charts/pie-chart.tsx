"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface Props {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  donut?: boolean;
}

export function PieChart({ data, height = 220, donut = true }: Props) {
  const option = React.useMemo(
    () => ({
      tooltip: {
        backgroundColor: "rgba(13,16,30,0.92)",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#fff", fontSize: 11 },
      },
      legend: {
        bottom: 0,
        textStyle: { color: "rgba(180,188,210,0.8)", fontSize: 10 },
        icon: "circle",
        itemHeight: 8,
        itemWidth: 8,
      },
      series: [
        {
          type: "pie",
          radius: donut ? ["55%", "78%"] : "78%",
          center: ["50%", "44%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: "rgba(10,13,26,1)",
            borderWidth: 2,
          },
          label: { show: false },
          data: data.map((d, i) => ({
            ...d,
            itemStyle: {
              color:
                d.color ??
                ["#5b8cff", "#9b8cff", "#36b3ff", "#c08a3d", "#f97369", "#22c55e"][i % 6],
            },
          })),
        },
      ],
    }),
    [data, donut],
  );

  return <ReactECharts option={option} style={{ height, width: "100%" }} />;
}
