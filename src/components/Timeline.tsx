import type { BatteryModule } from "@/data/types";
import { STATUS_LABELS, APPEARANCE_LABELS } from "@/data/types";
import { formatDate } from "@/utils/exportUtils";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { getGradeColorClass } from "@/utils/sohCalculator";

interface TimelineProps {
  battery: BatteryModule;
}

const stages = [
  { key: "arrival", label: "到货入库", status: "pending" as const },
  { key: "static", label: "静态检测", status: "static_done" as const },
  { key: "capacity", label: "容量标定", status: "capacity_done" as const },
  { key: "cycle", label: "循环测试", status: "cycle_done" as const },
  { key: "evaluation", label: "评估完成", status: "evaluated" as const },
];

export default function Timeline({ battery }: TimelineProps) {
  const statusOrder = [
    "pending",
    "static_done",
    "capacity_done",
    "cycle_done",
    "evaluated",
  ];
  const currentIndex = statusOrder.indexOf(battery.status);

  const getStageDate = (index: number): string | null => {
    switch (index) {
      case 0:
        return battery.arrivalDate;
      case 1:
        return battery.staticTest?.testDate || null;
      case 2:
        return battery.capacityTest?.testDate || null;
      case 3:
        return battery.cycleTest?.testDate || null;
      case 4:
        return battery.evaluation?.evaluateDate || null;
      default:
        return null;
    }
  };

  const getStageDetail = (index: number): string | null => {
    switch (index) {
      case 0:
        return `到货: ${battery.arrivalDate ? formatDate(battery.arrivalDate) : "-"}`;
      case 1:
        if (!battery.staticTest) return null;
        return `电压: ${battery.staticTest.openCircuitVoltage}V · 内阻: ${battery.staticTest.internalResistance}mΩ · ${APPEARANCE_LABELS[battery.staticTest.appearance]}`;
      case 2:
        if (!battery.capacityTest) return null;
        return `实测容量: ${battery.capacityTest.actualCapacity}Ah · SOH: ${battery.capacityTest.calibratedSOH}%`;
      case 3:
        if (!battery.cycleTest) return null;
        return `循环: ${battery.cycleTest.cycleCount}次 · 衰减: ${battery.cycleTest.capacityDecayRate}%`;
      case 4:
        if (!battery.evaluation) return null;
        return `最终SOH: ${battery.evaluation.finalSOH}% · ${battery.evaluation.grade}级`;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {stages.map((stage, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const date = getStageDate(index);
          const detail = getStageDetail(index);
          const grade = battery.evaluation?.grade;

          return (
            <div
              key={stage.key}
              className="relative flex items-start gap-4 pl-12"
            >
              <div className="absolute left-0 flex items-center justify-center w-10 h-10">
                {isCompleted ? (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 4 && grade
                        ? `bg-${grade === "A" ? "emerald" : grade === "B" ? "blue" : grade === "C" ? "amber" : "red"}-100 dark:bg-${grade === "A" ? "emerald" : grade === "B" ? "blue" : grade === "C" ? "amber" : "red"}-900/30`
                        : "bg-teal-100 dark:bg-teal-900/30"
                    }`}
                  >
                    <CheckCircle2
                      size={20}
                      className={
                        index === 4 && grade
                          ? getGradeColorClass(grade)
                          : "text-teal-600 dark:text-teal-400"
                      }
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Circle
                      size={20}
                      className="text-gray-300 dark:text-gray-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-1.5">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-medium ${
                      isCompleted
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {stage.label}
                  </h4>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <Clock size={10} />
                      进行中
                    </span>
                  )}
                </div>

                {date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(date)}
                  </p>
                )}

                {detail && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                    {detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
