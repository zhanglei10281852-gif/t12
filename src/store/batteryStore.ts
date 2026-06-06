import { create } from "zustand";
import type {
  BatteryModule,
  DetectionStatus,
  Grade,
  StaticTestData,
  CapacityTestData,
  CycleTestData,
} from "@/data/types";
import { mockBatteries } from "@/data/mockBatteries";
import { calculateSOH } from "@/utils/sohCalculator";

interface BatteryStore {
  batteries: BatteryModule[];
  selectedIds: string[];
  getBatteryById: (id: string) => BatteryModule | undefined;
  updateStaticTest: (id: string, data: StaticTestData) => void;
  updateCapacityTest: (id: string, data: CapacityTestData) => void;
  updateCycleTest: (id: string, data: CycleTestData) => void;
  advanceStatus: (id: string) => void;
  evaluateBattery: (id: string) => void;
  updateGrade: (id: string, grade: Grade) => void;
  batchUpdateGrade: (ids: string[], grade: Grade) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useBatteryStore = create<BatteryStore>((set, get) => ({
  batteries: mockBatteries,
  selectedIds: [],

  getBatteryById: (id: string) => {
    return get().batteries.find((b) => b.id === id);
  },

  updateStaticTest: (id: string, data: StaticTestData) => {
    set((state) => ({
      batteries: state.batteries.map((b) =>
        b.id === id ? { ...b, staticTest: data } : b,
      ),
    }));
  },

  updateCapacityTest: (id: string, data: CapacityTestData) => {
    set((state) => ({
      batteries: state.batteries.map((b) =>
        b.id === id ? { ...b, capacityTest: data } : b,
      ),
    }));
  },

  updateCycleTest: (id: string, data: CycleTestData) => {
    set((state) => ({
      batteries: state.batteries.map((b) =>
        b.id === id ? { ...b, cycleTest: data } : b,
      ),
    }));
  },

  advanceStatus: (id: string) => {
    const statusOrder: DetectionStatus[] = [
      "pending",
      "static_done",
      "capacity_done",
      "cycle_done",
      "evaluated",
    ];
    set((state) => ({
      batteries: state.batteries.map((b) => {
        if (b.id !== id) return b;
        const currentIndex = statusOrder.indexOf(b.status);
        if (currentIndex < statusOrder.length - 1) {
          return { ...b, status: statusOrder[currentIndex + 1] };
        }
        return b;
      }),
    }));
  },

  evaluateBattery: (id: string) => {
    set((state) => ({
      batteries: state.batteries.map((b) => {
        if (b.id !== id) return b;
        const evaluation = calculateSOH(b);
        if (evaluation) {
          return { ...b, status: "evaluated", evaluation };
        }
        return b;
      }),
    }));
  },

  updateGrade: (id: string, grade: Grade) => {
    set((state) => ({
      batteries: state.batteries.map((b) => {
        if (b.id !== id || !b.evaluation) return b;
        return { ...b, evaluation: { ...b.evaluation, grade } };
      }),
    }));
  },

  batchUpdateGrade: (ids: string[], grade: Grade) => {
    set((state) => ({
      batteries: state.batteries.map((b) => {
        if (!ids.includes(b.id) || !b.evaluation) return b;
        return { ...b, evaluation: { ...b.evaluation, grade } };
      }),
    }));
  },

  toggleSelect: (id: string) => {
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    }));
  },

  selectAll: (ids: string[]) => {
    set({ selectedIds: ids });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },
}));
