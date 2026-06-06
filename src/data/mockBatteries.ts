import type { BatteryModule, CarModel, DetectionStatus } from "@/data/types";
import { calculateSOH } from "@/utils/sohCalculator";

const CAR_MODELS: CarModel[] = [
  "比亚迪汉",
  "特斯拉Model3",
  "蔚来ES6",
  "小鹏P7",
  "理想L7",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const time =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(time).toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function generateBattery(
  index: number,
  status: DetectionStatus,
  arrivalDate: string,
): BatteryModule {
  const id = `BAT2024${String(index + 1).padStart(5, "0")}`;
  const carModel = CAR_MODELS[index % 5];
  const nominalCapacity = randomInt(50, 100);
  const nominalVoltage = randomFloat(350, 400, 1);
  const manufactureDate = randomDate(
    new Date("2020-01-01"),
    new Date("2023-06-30"),
  );

  const battery: BatteryModule = {
    id,
    carModel,
    nominalCapacity,
    nominalVoltage,
    manufactureDate,
    arrivalDate,
    status,
  };

  if (status !== "pending") {
    const staticTestDate = addDays(arrivalDate, randomInt(1, 3));
    battery.staticTest = {
      openCircuitVoltage: randomFloat(340, 395, 1),
      internalResistance: randomFloat(20, 80, 2),
      appearance:
        Math.random() > 0.85
          ? Math.random() > 0.5
            ? "swollen"
            : "deformed"
          : "normal",
      testDate: staticTestDate,
    };
  }

  if (
    status === "capacity_done" ||
    status === "cycle_done" ||
    status === "evaluated"
  ) {
    const capTestDate = addDays(battery.staticTest!.testDate, randomInt(2, 5));
    const actualCapacity = randomFloat(
      nominalCapacity * 0.5,
      nominalCapacity * 0.95,
      2,
    );
    battery.capacityTest = {
      actualCapacity,
      calibratedSOH:
        Math.round((actualCapacity / nominalCapacity) * 10000) / 100,
      testDate: capTestDate,
    };
  }

  if (status === "cycle_done" || status === "evaluated") {
    const cycleTestDate = addDays(
      battery.capacityTest!.testDate,
      randomInt(5, 10),
    );
    battery.cycleTest = {
      cycleCount: randomInt(50, 500),
      capacityDecayRate: randomFloat(0.3, 2.5, 2),
      resistanceGrowthRate: randomFloat(10, 150, 2),
      testDate: cycleTestDate,
    };
  }

  if (status === "evaluated") {
    battery.evaluation = calculateSOH(battery)!;
    battery.evaluation.evaluateDate = addDays(
      battery.cycleTest!.testDate,
      randomInt(1, 3),
    );
  }

  return battery;
}

export function generateMockBatteries(): BatteryModule[] {
  const batteries: BatteryModule[] = [];
  let index = 0;

  const arrivalDates = [
    "2024-11-15",
    "2024-12-03",
    "2024-12-20",
    "2025-01-10",
    "2025-01-25",
    "2025-02-08",
    "2025-02-22",
    "2025-03-05",
    "2025-03-18",
    "2025-04-02",
    "2025-04-15",
    "2025-05-01",
    "2025-05-20",
    "2025-06-01",
  ];

  const distribution = [
    { status: "pending" as DetectionStatus, count: 10 },
    { status: "static_done" as DetectionStatus, count: 8 },
    { status: "capacity_done" as DetectionStatus, count: 7 },
    { status: "cycle_done" as DetectionStatus, count: 15 },
    { status: "evaluated" as DetectionStatus, count: 10 },
  ];

  for (const { status, count } of distribution) {
    for (let i = 0; i < count; i++) {
      const arrivalDate = arrivalDates[index % arrivalDates.length];
      batteries.push(generateBattery(index, status, arrivalDate));
      index++;
    }
  }

  return batteries;
}

export const mockBatteries: BatteryModule[] = generateMockBatteries();
