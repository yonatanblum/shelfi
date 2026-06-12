"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartDatum = {
  brand: string;
  percent: number;
};

type BrandShareChartProps = {
  data: ChartDatum[];
};

const BRAND_COLORS = [
  "#2B59FF",
  "#FF6B35",
  "#00A878",
  "#7B2CBF",
  "#F4A261",
  "#E63946",
  "#457B9D",
];

export function BrandShareChart({ data }: BrandShareChartProps) {
  const chartData =
    data.length > 0 ? data : [{ brand: "No data yet", percent: 0 }];

  return (
    <Card className="brutal-card rounded-md ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Share of Shelf by Brand</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 min-h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="percent"
                  nameKey="brand"
                  innerRadius={56}
                  outerRadius={96}
                  paddingAngle={2}
                  stroke="#0A0A0A"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.brand}
                      fill={BRAND_COLORS[index % BRAND_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(1)}%`,
                    "Share",
                  ]}
                  contentStyle={{
                    border: "2px solid #0A0A0A",
                    borderRadius: "6px",
                    boxShadow: "4px 4px 0 0 #0A0A0A",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72 min-h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#0A0A0A" opacity={0.15} />
                <XAxis
                  dataKey="brand"
                  tick={{ fill: "#475569", fontSize: 11 }}
                  axisLine={{ stroke: "#0A0A0A" }}
                  tickLine={{ stroke: "#0A0A0A" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fill: "#475569", fontSize: 12 }}
                  axisLine={{ stroke: "#0A0A0A" }}
                  tickLine={{ stroke: "#0A0A0A" }}
                  unit="%"
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(1)}%`,
                    "Share",
                  ]}
                  contentStyle={{
                    border: "2px solid #0A0A0A",
                    borderRadius: "6px",
                    boxShadow: "4px 4px 0 0 #0A0A0A",
                    backgroundColor: "#FFFFFF",
                  }}
                />
                <Bar
                  dataKey="percent"
                  fill="#2B59FF"
                  radius={[4, 4, 0, 0]}
                  stroke="#0A0A0A"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
