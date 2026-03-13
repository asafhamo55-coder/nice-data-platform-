"use client";

import { ResponsiveRadar } from "@nivo/radar";

interface RadarChartProps {
  data: Record<string, unknown>[];
  keys: string[];
  indexBy: string;
  height?: number;
}

export function RadarChart({
  data,
  keys,
  indexBy,
  height = 400,
}: RadarChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveRadar
        data={data}
        keys={keys}
        indexBy={indexBy}
        maxValue={100}
        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
        borderColor={{ from: "color" }}
        gridLabelOffset={20}
        dotSize={8}
        dotColor={{ theme: "background" }}
        dotBorderWidth={2}
        colors={["#2E75B6", "#00B4D8", "#1B2A4A"]}
        fillOpacity={0.25}
        blendMode="multiply"
        animate={true}
      />
    </div>
  );
}
