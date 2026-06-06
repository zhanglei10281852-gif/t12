import type { BatteryModule, Grade, EvaluationResult } from "@/data/types";

export function calculateSOH(battery: BatteryModule): EvaluationResult | null {
  if (!battery.capacityTest || !battery.cycleTest || !battery.staticTest) {
    return null;
  }

  let baseSOH =
    (battery.capacityTest.actualCapacity / battery.nominalCapacity) * 100;
  let finalSOH = baseSOH;
  let resistanceDiscount = false;
  let decayDiscount = false;
  let appearanceCap = false;

  if (battery.cycleTest.resistanceGrowthRate > 100) {
    finalSOH = finalSOH * 0.8;
    resistanceDiscount = true;
  }

  if (battery.cycleTest.capacityDecayRate > 1) {
    finalSOH = finalSOH * 0.9;
    decayDiscount = true;
  }

  if (battery.staticTest.appearance === "swollen") {
    finalSOH = Math.min(finalSOH, 60);
    appearanceCap = true;
  }

  finalSOH = Math.min(100, Math.max(0, finalSOH));

  const grade = getGrade(finalSOH);

  return {
    finalSOH: Math.round(finalSOH * 100) / 100,
    grade,
    baseSOH: Math.round(baseSOH * 100) / 100,
    resistanceDiscount,
    decayDiscount,
    appearanceCap,
    evaluateDate: new Date().toISOString().split("T")[0],
  };
}

export function getGrade(soh: number): Grade {
  if (soh >= 80) return "A";
  if (soh >= 60) return "B";
  if (soh >= 40) return "C";
  return "D";
}

export function getGradeColorClass(grade: Grade | undefined): string {
  switch (grade) {
    case "A":
      return "text-emerald-600 dark:text-emerald-400";
    case "B":
      return "text-blue-600 dark:text-blue-400";
    case "C":
      return "text-amber-600 dark:text-amber-400";
    case "D":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-500 dark:text-gray-400";
  }
}

export function getGradeBgClass(grade: Grade | undefined): string {
  switch (grade) {
    case "A":
      return "bg-emerald-100 dark:bg-emerald-900/40";
    case "B":
      return "bg-blue-100 dark:bg-blue-900/40";
    case "C":
      return "bg-amber-100 dark:bg-amber-900/40";
    case "D":
      return "bg-red-100 dark:bg-red-900/40";
    default:
      return "bg-gray-100 dark:bg-gray-800";
  }
}
