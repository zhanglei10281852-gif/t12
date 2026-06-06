import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBatteryStore } from "@/store/batteryStore";
import type { BatteryBatch } from "@/data/types";
import { formatDate } from "@/utils/exportUtils";
import { getGradeColorClass, getGradeBgClass } from "@/utils/sohCalculator";
import {
  Package,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";

export default function BatchManage() {
  const { batteries } = useBatteryStore();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const batches = useMemo((): BatteryBatch[] => {
    const batchMap = new Map<string, typeof batteries>();

    batteries.forEach((battery) => {
      const date = battery.arrivalDate;
      if (!batchMap.has(date)) {
        batchMap.set(date, []);
      }
      batchMap.get(date)!.push(battery);
    });

    const result: BatteryBatch[] = [];
    for (const [date, batchBatteries] of batchMap) {
      const evaluated = batchBatteries.filter((b) => b.evaluation);
      const gradeA = evaluated.filter(
        (b) => b.evaluation?.grade === "A",
      ).length;
      const gradeB = evaluated.filter(
        (b) => b.evaluation?.grade === "B",
      ).length;
      const gradeC = evaluated.filter(
        (b) => b.evaluation?.grade === "C",
      ).length;
      const gradeD = evaluated.filter(
        (b) => b.evaluation?.grade === "D",
      ).length;
      const passRate =
        evaluated.length > 0 ? ((gradeA + gradeB) / evaluated.length) * 100 : 0;

      result.push({
        date,
        count: batchBatteries.length,
        evaluatedCount: evaluated.length,
        gradeA,
        gradeB,
        gradeC,
        gradeD,
        passRate,
      });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [batteries]);

  const getBatteriesByDate = (date: string) => {
    return batteries.filter((b) => b.arrivalDate === date);
  };

  const totalBatteries = batches.reduce((sum, b) => sum + b.count, 0);
  const totalEvaluated = batches.reduce((sum, b) => sum + b.evaluatedCount, 0);
  const overallPassRate =
    totalEvaluated > 0
      ? (batches.reduce((sum, b) => sum + b.gradeA + b.gradeB, 0) /
          totalEvaluated) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          批次管理
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          按到货日期分组的批次管理
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600 dark:text-teal-400">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                总批次数
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {batches.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                已评估电池
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEvaluated} / {totalBatteries}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                整体通过率(A+B)
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {overallPassRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {batches.map((batch) => {
          const isExpanded = expandedDate === batch.date;
          const batchBatteries = getBatteriesByDate(batch.date);

          return (
            <div
              key={batch.date}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedDate(isExpanded ? null : batch.date)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {new Date(batch.date).getDate()}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(batch.date)} 批次
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {batch.count} 个电池模组 · 已评估 {batch.evaluatedCount}{" "}
                      个
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-3">
                    <GradeBadge grade="A" count={batch.gradeA} />
                    <GradeBadge grade="B" count={batch.gradeB} />
                    <GradeBadge grade="C" count={batch.gradeC} />
                    <GradeBadge grade="D" count={batch.gradeD} />
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      通过率
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        batch.passRate >= 60
                          ? "text-emerald-600 dark:text-emerald-400"
                          : batch.passRate >= 30
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {batch.passRate.toFixed(1)}%
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-5 border-t border-gray-100 dark:border-gray-700">
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      批次电池列表
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 px-3 text-left font-medium text-gray-500 dark:text-gray-400">
                              电池编码
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500 dark:text-gray-400">
                              车型
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500 dark:text-gray-400">
                              状态
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500 dark:text-gray-400">
                              SOH
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-gray-500 dark:text-gray-400">
                              分级
                            </th>
                            <th className="py-2 px-3 text-right font-medium text-gray-500 dark:text-gray-400">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {batchBatteries.map((battery) => (
                            <tr
                              key={battery.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                            >
                              <td className="py-2.5 px-3 font-mono text-gray-900 dark:text-white">
                                {battery.id}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                                {battery.carModel}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {battery.status === "pending"
                                    ? "待检测"
                                    : battery.status === "static_done"
                                      ? "静态完成"
                                      : battery.status === "capacity_done"
                                        ? "容量完成"
                                        : battery.status === "cycle_done"
                                          ? "循环完成"
                                          : "已评估"}
                                </span>
                              </td>
                              <td
                                className={`py-2.5 px-3 font-medium ${
                                  battery.evaluation
                                    ? getGradeColorClass(
                                        battery.evaluation.grade,
                                      )
                                    : "text-gray-400 dark:text-gray-500"
                                }`}
                              >
                                {battery.evaluation
                                  ? `${battery.evaluation.finalSOH.toFixed(1)}%`
                                  : "-"}
                              </td>
                              <td className="py-2.5 px-3">
                                {battery.evaluation ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeBgClass(battery.evaluation.grade)} ${getGradeColorClass(battery.evaluation.grade)}`}
                                  >
                                    {battery.evaluation.grade}级
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                                    未评估
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Link
                                  to={`/batteries/${battery.id}`}
                                  className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-xs"
                                >
                                  <Eye size={14} />
                                  详情
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GradeBadge({
  grade,
  count,
}: {
  grade: "A" | "B" | "C" | "D";
  count: number;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${getGradeBgClass(grade)}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          grade === "A"
            ? "bg-emerald-500"
            : grade === "B"
              ? "bg-blue-500"
              : grade === "C"
                ? "bg-amber-500"
                : "bg-red-500"
        }`}
      />
      <span className={`text-xs font-medium ${getGradeColorClass(grade)}`}>
        {grade}: {count}
      </span>
    </div>
  );
}
