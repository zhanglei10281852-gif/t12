import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useBatteryStore } from "@/store/batteryStore";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { GRADE_LABELS, APPEARANCE_LABELS, STATUS_LABELS } from "@/data/types";
import { getGradeColorClass } from "@/utils/sohCalculator";
import { useTheme } from "@/hooks/useTheme";
import { formatDate } from "@/utils/exportUtils";
import { ArrowLeft, AlertTriangle, Trophy } from "lucide-react";

const COLORS = ["#0d9488", "#3b82f6", "#8b5cf6", "#f59e0b"];

export default function Compare() {
  const [searchParams] = useSearchParams();
  const { batteries, getBatteryById } = useBatteryStore();
  const { isDark } = useTheme();

  const ids = searchParams.get("ids")?.split(",") || [];
  const compareBatteries = ids
    .map((id) => getBatteryById(id))
    .filter(Boolean) as typeof batteries;

  const textColor = isDark ? "#e5e7eb" : "#374151";
  const axisColor = isDark ? "#4b5563" : "#d1d5db";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";

  const radarData = useMemo(() => {
    const evaluatedBatteries = compareBatteries.filter(
      (b) => b.evaluation && b.cycleTest,
    );

    if (evaluatedBatteries.length === 0) return [];

    const maxCapacity = Math.max(
      ...evaluatedBatteries.map((b) => b.nominalCapacity),
    );
    const maxResistance = Math.max(
      ...evaluatedBatteries.map((b) => b.staticTest?.internalResistance || 1),
    );
    const maxCycles = Math.max(
      ...evaluatedBatteries.map((b) => b.cycleTest?.cycleCount || 1),
    );
    const maxDecay = Math.max(
      ...evaluatedBatteries.map((b) => b.cycleTest?.capacityDecayRate || 1),
    );

    return [
      {
        subject: "SOH",
        ...Object.fromEntries(
          evaluatedBatteries.map((b) => [b.id, b.evaluation?.finalSOH || 0]),
        ),
        fullMark: 100,
      },
      {
        subject: "容量",
        ...Object.fromEntries(
          evaluatedBatteries.map((b) => [
            b.id,
            (b.nominalCapacity / maxCapacity) * 100,
          ]),
        ),
        fullMark: 100,
      },
      {
        subject: "内阻(低优)",
        ...Object.fromEntries(
          evaluatedBatteries.map((b) => [
            b.id,
            ((maxResistance - (b.staticTest?.internalResistance || 0)) /
              maxResistance) *
              100,
          ]),
        ),
        fullMark: 100,
      },
      {
        subject: "循环寿命",
        ...Object.fromEntries(
          evaluatedBatteries.map((b) => [
            b.id,
            ((b.cycleTest?.cycleCount || 0) / maxCycles) * 100,
          ]),
        ),
        fullMark: 100,
      },
      {
        subject: "衰减率(低优)",
        ...Object.fromEntries(
          evaluatedBatteries.map((b) => [
            b.id,
            ((maxDecay - (b.cycleTest?.capacityDecayRate || 0)) / maxDecay) *
              100,
          ]),
        ),
        fullMark: 100,
      },
    ];
  }, [compareBatteries]);

  const comparisonResult = useMemo(() => {
    const evaluatedBatteries = compareBatteries.filter((b) => b.evaluation);
    if (evaluatedBatteries.length < 2) return null;

    const scores: Record<
      string,
      {
        soh: number;
        resistance: number;
        decay: number;
        capacity: number;
        cycles: number;
        total: number;
      }
    > = {};

    const maxCapacity = Math.max(
      ...evaluatedBatteries.map((b) => b.nominalCapacity),
    );
    const maxResistance = Math.max(
      ...evaluatedBatteries.map((b) => b.staticTest?.internalResistance || 1),
    );
    const maxDecay = Math.max(
      ...evaluatedBatteries.map((b) => b.cycleTest?.capacityDecayRate || 1),
    );
    const maxCycles = Math.max(
      ...evaluatedBatteries.map((b) => b.cycleTest?.cycleCount || 1),
    );

    for (const battery of evaluatedBatteries) {
      const sohScore = battery.evaluation?.finalSOH || 0;
      const resistanceScore =
        ((maxResistance - (battery.staticTest?.internalResistance || 0)) /
          maxResistance) *
        100;
      const decayScore =
        ((maxDecay - (battery.cycleTest?.capacityDecayRate || 0)) / maxDecay) *
        100;
      const capacityScore = (battery.nominalCapacity / maxCapacity) * 100;
      const cycleScore =
        ((battery.cycleTest?.cycleCount || 0) / maxCycles) * 100;
      const total =
        sohScore + resistanceScore + decayScore + capacityScore + cycleScore;

      scores[battery.id] = {
        soh: sohScore,
        resistance: resistanceScore,
        decay: decayScore,
        capacity: capacityScore,
        cycles: cycleScore,
        total,
      };
    }

    const sorted = Object.entries(scores).sort(
      (a, b) => b[1].total - a[1].total,
    );
    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];

    const advantages: string[] = [];
    if (winner[1].soh > loser[1].soh * 1.1) {
      advantages.push("SOH更高");
    }
    if (winner[1].resistance > loser[1].resistance * 1.1) {
      advantages.push("内阻更低");
    }
    if (winner[1].decay > loser[1].decay * 1.1) {
      advantages.push("衰减率更低");
    }
    if (winner[1].capacity > loser[1].capacity * 1.1) {
      advantages.push("容量更大");
    }
    if (winner[1].cycles > loser[1].cycles * 1.1) {
      advantages.push("循环寿命更长");
    }

    return {
      winner: winner[0],
      loser: loser[0],
      advantages: advantages.slice(0, 3),
      scores,
    };
  }, [compareBatteries]);

  const hasSignificantDiff = (
    values: (number | string | undefined)[],
  ): boolean => {
    const numValues = values.filter((v) => typeof v === "number") as number[];
    if (numValues.length < 2) return false;
    const min = Math.min(...numValues);
    const max = Math.max(...numValues);
    if (min === 0) return max > 0;
    return (max - min) / min > 0.15;
  };

  if (compareBatteries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          请从电池清单选择 2-4 个电池进行对比
        </p>
        <Link
          to="/batteries"
          className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          返回电池清单
        </Link>
      </div>
    );
  }

  if (compareBatteries.length < 2 || compareBatteries.length > 4) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          请选择 2-4 个电池进行对比（当前选择了 {compareBatteries.length} 个）
        </p>
        <Link
          to="/batteries"
          className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          返回电池清单
        </Link>
      </div>
    );
  }

  const customTooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: "8px",
    color: textColor,
    fontSize: "12px",
  };

  const paramRows = [
    {
      label: "来源车型",
      getValue: (b: (typeof compareBatteries)[0]) => b.carModel,
      isString: true,
    },
    {
      label: "标称容量",
      getValue: (b: (typeof compareBatteries)[0]) => `${b.nominalCapacity} Ah`,
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) => b.nominalCapacity,
    },
    {
      label: "标称电压",
      getValue: (b: (typeof compareBatteries)[0]) => `${b.nominalVoltage} V`,
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) => b.nominalVoltage,
    },
    {
      label: "出厂日期",
      getValue: (b: (typeof compareBatteries)[0]) =>
        formatDate(b.manufactureDate),
      isString: true,
    },
    {
      label: "到货日期",
      getValue: (b: (typeof compareBatteries)[0]) => formatDate(b.arrivalDate),
      isString: true,
    },
    {
      label: "检测状态",
      getValue: (b: (typeof compareBatteries)[0]) => STATUS_LABELS[b.status],
      isString: true,
    },
    {
      label: "开路电压",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.staticTest ? `${b.staticTest.openCircuitVoltage} V` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) =>
        b.staticTest?.openCircuitVoltage,
    },
    {
      label: "内阻",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.staticTest ? `${b.staticTest.internalResistance} mΩ` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) =>
        b.staticTest?.internalResistance,
      lowerBetter: true,
    },
    {
      label: "外观状态",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.staticTest ? APPEARANCE_LABELS[b.staticTest.appearance] : "-",
      isString: true,
    },
    {
      label: "实测容量",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.capacityTest ? `${b.capacityTest.actualCapacity} Ah` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) =>
        b.capacityTest?.actualCapacity,
    },
    {
      label: "标定SOH",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.capacityTest ? `${b.capacityTest.calibratedSOH}%` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) =>
        b.capacityTest?.calibratedSOH,
    },
    {
      label: "循环次数",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.cycleTest ? `${b.cycleTest.cycleCount} 次` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) => b.cycleTest?.cycleCount,
    },
    {
      label: "容量衰减率",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.cycleTest ? `${b.cycleTest.capacityDecayRate}%/100次` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) =>
        b.cycleTest?.capacityDecayRate,
      lowerBetter: true,
    },
    {
      label: "内阻增长率",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.cycleTest ? `${b.cycleTest.resistanceGrowthRate}%` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) =>
        b.cycleTest?.resistanceGrowthRate,
      lowerBetter: true,
    },
    {
      label: "最终SOH",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.evaluation ? `${b.evaluation.finalSOH}%` : "-",
      numeric: true,
      getNum: (b: (typeof compareBatteries)[0]) => b.evaluation?.finalSOH,
    },
    {
      label: "梯次分级",
      getValue: (b: (typeof compareBatteries)[0]) =>
        b.evaluation
          ? `${b.evaluation.grade}级 - ${GRADE_LABELS[b.evaluation.grade]}`
          : "未评估",
      isString: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/batteries"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            电池对比
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            对比 {compareBatteries.length} 个电池模组
          </p>
        </div>
      </div>

      {comparisonResult && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-teal-100 dark:border-teal-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-800/50 rounded-xl text-teal-600 dark:text-teal-300">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-teal-800 dark:text-teal-200 mb-1">
                对比结论
              </h3>
              <p className="text-teal-700 dark:text-teal-300">
                <span className="font-bold">{comparisonResult.winner}</span>{" "}
                整体优于{" "}
                <span className="font-medium">{comparisonResult.loser}</span>
                {comparisonResult.advantages.length > 0 && (
                  <>，主要体现在{comparisonResult.advantages.join("、")}</>
                )}
              </p>
              <p className="text-sm text-teal-600/80 dark:text-teal-400/80 mt-2">
                综合评分：
                {Object.entries(comparisonResult.scores)
                  .map(([id, s]) => `${id}: ${s.total.toFixed(1)}分`)
                  .join(" / ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
            雷达图对比
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={axisColor} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: textColor, fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: textColor, fontSize: 10 }}
              />
              {compareBatteries
                .filter((b) => b.evaluation)
                .map((battery, index) => (
                  <Radar
                    key={battery.id}
                    name={battery.id}
                    dataKey={battery.id}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
              <Legend
                formatter={(value) => (
                  <span style={{ color: textColor, fontSize: "12px" }}>
                    {value}
                  </span>
                )}
              />
              <Tooltip contentStyle={customTooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
            参数对比
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    参数
                  </th>
                  {compareBatteries.map((b, i) => (
                    <th
                      key={b.id}
                      className="py-3 px-4 text-center font-medium whitespace-nowrap"
                      style={{ color: COLORS[i % COLORS.length] }}
                    >
                      {b.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paramRows.map((row, rowIndex) => {
                  const values = compareBatteries.map((b) => row.getValue(b));
                  const numValues = row.numeric
                    ? compareBatteries.map((b) => row.getNum?.(b))
                    : [];
                  const hasDiff = row.numeric && hasSignificantDiff(numValues);

                  const bestIndex =
                    row.numeric && numValues.every((v) => v !== undefined)
                      ? row.lowerBetter
                        ? numValues.indexOf(
                            Math.min(...(numValues as number[])),
                          )
                        : numValues.indexOf(
                            Math.max(...(numValues as number[])),
                          )
                      : -1;

                  return (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="py-2.5 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {row.label}
                      </td>
                      {compareBatteries.map((b, i) => {
                        const isBest = i === bestIndex && hasDiff;
                        return (
                          <td
                            key={b.id}
                            className={`py-2.5 px-4 text-center font-medium whitespace-nowrap ${
                              isBest
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                                : hasDiff && row.numeric
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-700 dark:text-gray-300"
                            } ${getGradeColorClass(b.evaluation?.grade)}`}
                            style={!b.evaluation ? {} : undefined}
                          >
                            {values[i]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            注：标红为差异较大项，绿色为该参数最优
          </p>
        </div>
      </div>
    </div>
  );
}
