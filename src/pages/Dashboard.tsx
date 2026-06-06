import { useMemo, useState, useRef } from "react";
import { useBatteryStore } from "@/store/batteryStore";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
} from "recharts";
import { CAR_MODELS, STATUS_LABELS, GRADE_LABELS } from "@/data/types";
import { useTheme } from "@/hooks/useTheme";
import html2canvas from "html2canvas";
import Button from "@/components/ui/Button";
import { Download, TrendingUp, Battery, Activity, Award } from "lucide-react";

const GRADE_COLORS = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#ef4444",
};

const CHART_COLORS = ["#0d9488", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const { batteries } = useBatteryStore();
  const { isDark } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    {},
  );

  const stats = useMemo(() => {
    const total = batteries.length;
    const byStatus = {
      pending: batteries.filter((b) => b.status === "pending").length,
      static_done: batteries.filter((b) => b.status === "static_done").length,
      capacity_done: batteries.filter((b) => b.status === "capacity_done")
        .length,
      cycle_done: batteries.filter((b) => b.status === "cycle_done").length,
      evaluated: batteries.filter((b) => b.status === "evaluated").length,
    };

    const evaluated = batteries.filter((b) => b.evaluation);
    const avgSOH =
      evaluated.length > 0
        ? evaluated.reduce((sum, b) => sum + b.evaluation!.finalSOH, 0) /
          evaluated.length
        : 0;
    const gradeACount = evaluated.filter(
      (b) => b.evaluation?.grade === "A",
    ).length;
    const gradeAPercent =
      evaluated.length > 0 ? (gradeACount / evaluated.length) * 100 : 0;

    return { total, byStatus, avgSOH, gradeACount, gradeAPercent };
  }, [batteries]);

  const gradePieData = useMemo(() => {
    const evaluated = batteries.filter((b) => b.evaluation);
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    evaluated.forEach((b) => {
      if (b.evaluation) {
        counts[b.evaluation.grade]++;
      }
    });
    return [
      { name: "A级", value: counts.A, grade: "A" },
      { name: "B级", value: counts.B, grade: "B" },
      { name: "C级", value: counts.C, grade: "C" },
      { name: "D级", value: counts.D, grade: "D" },
    ].filter((d) => d.value > 0);
  }, [batteries]);

  const carModelData = useMemo(() => {
    return CAR_MODELS.map((model, i) => ({
      name: model,
      数量: batteries.filter((b) => b.carModel === model).length,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [batteries]);

  const sohHistogramData = useMemo(() => {
    const evaluated = batteries.filter((b) => b.evaluation);
    const ranges = [
      { name: "0-40%", min: 0, max: 40, count: 0 },
      { name: "40-60%", min: 40, max: 60, count: 0 },
      { name: "60-80%", min: 60, max: 80, count: 0 },
      { name: "80-90%", min: 80, max: 90, count: 0 },
      { name: "90-100%", min: 90, max: 100, count: 0 },
    ];
    evaluated.forEach((b) => {
      const soh = b.evaluation!.finalSOH;
      for (const range of ranges) {
        if (soh >= range.min && soh < range.max) {
          range.count++;
          break;
        }
      }
      if (soh >= 100) ranges[ranges.length - 1].count++;
    });
    return ranges;
  }, [batteries]);

  const resistanceSohData = useMemo(() => {
    return batteries
      .filter((b) => b.evaluation && b.staticTest)
      .map((b) => ({
        x: b.staticTest!.internalResistance,
        y: b.evaluation!.finalSOH,
        z: b.nominalCapacity,
        name: b.id,
      }));
  }, [batteries]);

  const carModelAvgSohData = useMemo(() => {
    return CAR_MODELS.map((model, i) => {
      const modelBatteries = batteries.filter(
        (b) => b.carModel === model && b.evaluation,
      );
      const avg =
        modelBatteries.length > 0
          ? modelBatteries.reduce((sum, b) => sum + b.evaluation!.finalSOH, 0) /
            modelBatteries.length
          : 0;
      return {
        name: model,
        平均SOH: Math.round(avg * 10) / 10,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
  }, [batteries]);

  const monthlyArrivalData = useMemo(() => {
    const monthly: Record<string, number> = {};
    batteries.forEach((b) => {
      const month = b.arrivalDate.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        name: month,
        到货量: count,
      }));
  }, [batteries]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const handleExportCharts = async () => {
    if (!chartContainerRef.current) return;
    try {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "数据分析仪表盘.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("导出失败:", err);
    }
  };

  const textColor = isDark ? "#e5e7eb" : "#374151";
  const axisColor = isDark ? "#4b5563" : "#d1d5db";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";

  const customTooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: "8px",
    color: textColor,
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            数据分析仪表盘
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            电池梯次利用数据统计与分析
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCharts}
          leftIcon={<Download size={16} />}
        >
          导出图表
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="电池总数"
          value={stats.total.toString()}
          icon={<Battery size={24} />}
          color="teal"
        />
        <StatCard
          title="已评估"
          value={stats.byStatus.evaluated.toString()}
          icon={<Activity size={24} />}
          color="blue"
        />
        <StatCard
          title="平均SOH"
          value={`${stats.avgSOH.toFixed(1)}%`}
          icon={<TrendingUp size={24} />}
          color="purple"
        />
        <StatCard
          title="A级占比"
          value={`${stats.gradeAPercent.toFixed(1)}%`}
          icon={<Award size={24} />}
          color="emerald"
        />
      </div>

      <div
        ref={chartContainerRef}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <ChartCard title="分级分布">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={gradePieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: axisColor }}
              >
                {gradePieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS]
                    }
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} />
              <Legend
                onClick={(e) => toggleSeries(e.value)}
                formatter={(value) => (
                  <span style={{ color: textColor }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="车型分布">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={carModelData}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} />
              <XAxis
                type="number"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
                width={100}
              />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="数量" radius={[0, 4, 4, 0]}>
                {carModelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SOH分布">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sohHistogramData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} />
              <XAxis
                dataKey="name"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
              />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar
                dataKey="count"
                name="数量"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="内阻 vs SOH">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ bottom: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} />
              <XAxis
                type="number"
                dataKey="x"
                name="内阻"
                unit="mΩ"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
                label={{
                  value: "内阻(mΩ)",
                  position: "insideBottom",
                  offset: -10,
                  fill: textColor,
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="SOH"
                unit="%"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
                label={{
                  value: "SOH(%)",
                  angle: -90,
                  position: "insideLeft",
                  fill: textColor,
                  fontSize: 12,
                }}
              />
              <ZAxis type="number" dataKey="z" range={[20, 200]} />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Scatter name="电池" data={resistanceSohData} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="各车型平均SOH">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={carModelAvgSohData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} />
              <XAxis
                dataKey="name"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 11 }}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
                unit="%"
              />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="平均SOH" radius={[4, 4, 0, 0]}>
                {carModelAvgSohData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="月度到货趋势">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={monthlyArrivalData}
              margin={{ bottom: 20, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} />
              <XAxis
                dataKey="name"
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 11 }}
              />
              <YAxis
                stroke={axisColor}
                tick={{ fill: textColor, fontSize: 12 }}
              />
              <Tooltip contentStyle={customTooltipStyle} />
              <Line
                type="monotone"
                dataKey="到货量"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ fill: "#0d9488", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    teal: "from-teal-500 to-cyan-500",
    blue: "from-blue-500 to-indigo-500",
    purple: "from-purple-500 to-pink-500",
    emerald: "from-emerald-500 to-green-500",
  };

  const bgClasses: Record<string, string> = {
    teal: "bg-teal-50 dark:bg-teal-900/20",
    blue: "bg-blue-50 dark:bg-blue-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
  };

  const textClasses: Record<string, string> = {
    teal: "text-teal-600 dark:text-teal-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className={`text-2xl font-bold ${textClasses[color]}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-xl ${bgClasses[color]} ${textClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
        {title}
      </h3>
      {children}
    </div>
  );
}
