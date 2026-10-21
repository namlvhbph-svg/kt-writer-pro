import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthBucket, TopicBucket } from "@/hooks/useStats";

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

const SLICE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary-glow))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--muted-foreground))",
];

export function DocumentsTrendChart({ data }: { data: MonthBucket[] }) {
  const hasData = data.some((bucket) => bucket.count > 0);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`${value} văn bản`, "Số lượng"]}
            labelFormatter={(label) => `Tháng ${label}`}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
            maxBarSize={38}
            isAnimationActive={hasData}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopicDistributionChart({ data }: { data: TopicBucket[] }) {
  const filtered = data.filter((bucket) => bucket.count > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Chưa có văn bản nào được gắn nhóm chủ đề.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="name"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={2}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {filtered.map((bucket, index) => (
              <Cell key={bucket.id} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`${value} văn bản`, "Số lượng"]}
          />
          <Legend
            verticalAlign="bottom"
            height={48}
            formatter={(value) => (
              <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
