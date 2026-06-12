"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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

type PremiumPlacementChartProps = {
  data: ChartDatum[];
};

export function PremiumPlacementChart({ data }: PremiumPlacementChartProps) {
  const chartData =
    data.length > 0 ? data : [{ brand: "No data yet", percent: 0 }];

  return (
    <Card className="brutal-card rounded-md ring-0">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Premium Placement Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#0A0A0A" opacity={0.15} />
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                tick={{ fill: "#475569", fontSize: 12 }}
                axisLine={{ stroke: "#0A0A0A" }}
                tickLine={{ stroke: "#0A0A0A" }}
              />
              <YAxis
                type="category"
                dataKey="brand"
                width={90}
                tick={{ fill: "#475569", fontSize: 12 }}
                axisLine={{ stroke: "#0A0A0A" }}
                tickLine={{ stroke: "#0A0A0A" }}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value ?? 0).toFixed(1)}%`,
                  "Utilization",
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
                fill="#00A878"
                radius={[0, 4, 4, 0]}
                stroke="#0A0A0A"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
