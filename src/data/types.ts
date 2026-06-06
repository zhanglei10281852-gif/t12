export type DetectionStatus =
  | "pending"
  | "static_done"
  | "capacity_done"
  | "cycle_done"
  | "evaluated";

export type Grade = "A" | "B" | "C" | "D";

export type AppearanceStatus = "normal" | "swollen" | "deformed";

export type CarModel =
  | "比亚迪汉"
  | "特斯拉Model3"
  | "蔚来ES6"
  | "小鹏P7"
  | "理想L7";

export interface StaticTestData {
  openCircuitVoltage: number;
  internalResistance: number;
  appearance: AppearanceStatus;
  testDate: string;
}

export interface CapacityTestData {
  actualCapacity: number;
  calibratedSOH: number;
  testDate: string;
}

export interface CycleTestData {
  cycleCount: number;
  capacityDecayRate: number;
  resistanceGrowthRate: number;
  testDate: string;
}

export interface EvaluationResult {
  finalSOH: number;
  grade: Grade;
  baseSOH: number;
  resistanceDiscount: boolean;
  decayDiscount: boolean;
  appearanceCap: boolean;
  evaluateDate: string;
}

export interface BatteryModule {
  id: string;
  carModel: CarModel;
  nominalCapacity: number;
  nominalVoltage: number;
  manufactureDate: string;
  arrivalDate: string;
  status: DetectionStatus;
  staticTest?: StaticTestData;
  capacityTest?: CapacityTestData;
  cycleTest?: CycleTestData;
  evaluation?: EvaluationResult;
}

export interface BatteryBatch {
  date: string;
  count: number;
  evaluatedCount: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
  passRate: number;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  searchText: string;
  status: DetectionStatus | "";
  grade: Grade | "";
  sohMin: number;
  sohMax: number;
  dateFrom: string;
  dateTo: string;
}

export const STATUS_LABELS: Record<DetectionStatus, string> = {
  pending: "待检测",
  static_done: "静态检测完成",
  capacity_done: "容量标定完成",
  cycle_done: "循环测试完成",
  evaluated: "已评估",
};

export const GRADE_LABELS: Record<Grade, string> = {
  A: "储能级",
  B: "低速车级",
  C: "备电级",
  D: "报废",
};

export const APPEARANCE_LABELS: Record<AppearanceStatus, string> = {
  normal: "正常",
  swollen: "膨胀",
  deformed: "变形",
};

export const STATUS_ORDER: DetectionStatus[] = [
  "pending",
  "static_done",
  "capacity_done",
  "cycle_done",
  "evaluated",
];

export const CAR_MODELS: CarModel[] = [
  "比亚迪汉",
  "特斯拉Model3",
  "蔚来ES6",
  "小鹏P7",
  "理想L7",
];

export const GRADE_COLORS: Record<
  Grade,
  { light: string; dark: string; bg: string; text: string }
> = {
  A: {
    light: "#10b981",
    dark: "#34d399",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  B: {
    light: "#3b82f6",
    dark: "#60a5fa",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  C: {
    light: "#f59e0b",
    dark: "#fbbf24",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  D: {
    light: "#ef4444",
    dark: "#f87171",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
  },
};

export const GRADE_ROW_COLORS: Record<Grade, string> = {
  A: "bg-emerald-50/60 dark:bg-emerald-950/20",
  B: "bg-blue-50/60 dark:bg-blue-950/20",
  C: "bg-amber-50/60 dark:bg-amber-950/20",
  D: "bg-red-50/60 dark:bg-red-950/20",
};
