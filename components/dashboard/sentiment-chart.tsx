"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SentimentLabel } from "@/lib/types";

const COLORS: Record<SentimentLabel, string> = {
  positive: "hsl(152 69% 45%)",
  neutral: "hsl(215 20% 55%)",
  negative: "hsl(0 72% 51%)",
};

export function SentimentChart({
  split,
}: {
  split: Record<SentimentLabel, number>;
}) {
  const data = (["positive", "neutral", "negative"] as const).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    value: split[key],
  }));

  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={3}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number, _n, item) => [
              `${value} (${total ? Math.round((value / total) * 100) : 0}%)`,
              (item?.payload as { name?: string })?.name ?? "Calls",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS[d.key] }}
            />
            {d.name}: {d.value}
          </div>
        ))}
      </div>
    </div>
  );
}
