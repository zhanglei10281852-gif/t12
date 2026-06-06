import { useState, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useBatteryStore } from "@/store/batteryStore";
import BatteryCard from "@/components/BatteryCard";
import TestDataModal from "@/components/TestDataModal";
import EvaluationReportModal from "@/components/EvaluationReportModal";
import Button from "@/components/ui/Button";
import type {
  BatteryModule,
  DetectionStatus,
  StaticTestData,
  CapacityTestData,
  CycleTestData,
} from "@/data/types";
import { STATUS_LABELS, STATUS_ORDER } from "@/data/types";
import {
  Activity,
  ClipboardCheck,
  Gauge,
  BatteryCharging,
  Award,
} from "lucide-react";
import clsx from "clsx";

const columns = [
  {
    status: "pending" as DetectionStatus,
    color: "from-gray-400 to-gray-500",
    icon: Activity,
  },
  {
    status: "static_done" as DetectionStatus,
    color: "from-blue-400 to-blue-500",
    icon: ClipboardCheck,
  },
  {
    status: "capacity_done" as DetectionStatus,
    color: "from-purple-400 to-purple-500",
    icon: Gauge,
  },
  {
    status: "cycle_done" as DetectionStatus,
    color: "from-amber-400 to-amber-500",
    icon: BatteryCharging,
  },
  {
    status: "evaluated" as DetectionStatus,
    color: "from-emerald-400 to-emerald-500",
    icon: Award,
  },
];

function KanbanColumn({
  status,
  color,
  icon: Icon,
  batteries,
  isOver,
  canDrop,
  onEvaluate,
}: {
  status: DetectionStatus;
  color: string;
  icon: typeof Activity;
  batteries: BatteryModule[];
  isOver: boolean;
  canDrop: boolean;
  onEvaluate?: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${status}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex flex-col rounded-2xl overflow-hidden min-h-[500px] transition-all duration-200",
        isOver && canDrop
          ? "bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-400 dark:ring-teal-500"
          : "bg-gray-50 dark:bg-gray-800/50",
        isOver && !canDrop && "opacity-50",
      )}
    >
      <div className={`bg-gradient-to-r ${color} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={18} />
            <span className="font-medium text-sm">{STATUS_LABELS[status]}</span>
          </div>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
            {batteries.length}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {batteries.map((battery) => (
          <div key={battery.id} className="relative">
            <BatteryCard battery={battery} draggable={status !== "evaluated"} />
            {status === "cycle_done" && (
              <Button
                size="sm"
                variant="primary"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEvaluate?.(battery.id);
                }}
              >
                执行评估
              </Button>
            )}
          </div>
        ))}
        {batteries.length === 0 && (
          <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-600 text-sm">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const {
    batteries,
    updateStaticTest,
    updateCapacityTest,
    updateCycleTest,
    advanceStatus,
    evaluateBattery,
    getBatteryById,
  } = useBatteryStore();

  const [modalBattery, setModalBattery] = useState<BatteryModule | null>(null);
  const [testType, setTestType] = useState<
    "static" | "capacity" | "cycle" | null
  >(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [reportBatteryId, setReportBatteryId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const batteriesByStatus = useMemo(() => {
    const grouped: Record<DetectionStatus, BatteryModule[]> = {
      pending: [],
      static_done: [],
      capacity_done: [],
      cycle_done: [],
      evaluated: [],
    };
    batteries.forEach((b) => {
      grouped[b.status].push(b);
    });
    return grouped;
  }, [batteries]);

  const canDropTo = (
    fromStatus: DetectionStatus,
    toStatus: DetectionStatus,
  ): boolean => {
    const fromIndex = STATUS_ORDER.indexOf(fromStatus);
    const toIndex = STATUS_ORDER.indexOf(toStatus);
    return toIndex === fromIndex + 1;
  };

  const activeBattery = activeId ? getBatteryById(activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string;
    if (overId?.startsWith("column-")) {
      setOverColumnId(overId);
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over) return;

    const activeBattery = getBatteryById(active.id as string);
    if (!activeBattery) return;

    const overId = over.id as string;

    if (overId.startsWith("column-")) {
      const targetStatus = overId.replace("column-", "") as DetectionStatus;

      if (canDropTo(activeBattery.status, targetStatus)) {
        handleDropToColumn(activeBattery, targetStatus);
      }
    }
  };

  const handleDropToColumn = (
    battery: BatteryModule,
    targetStatus: DetectionStatus,
  ) => {
    if (targetStatus === "static_done" && battery.status === "pending") {
      setModalBattery(battery);
      setTestType("static");
      setIsDataModalOpen(true);
    } else if (
      targetStatus === "capacity_done" &&
      battery.status === "static_done"
    ) {
      setModalBattery(battery);
      setTestType("capacity");
      setIsDataModalOpen(true);
    } else if (
      targetStatus === "cycle_done" &&
      battery.status === "capacity_done"
    ) {
      setModalBattery(battery);
      setTestType("cycle");
      setIsDataModalOpen(true);
    } else if (
      targetStatus === "evaluated" &&
      battery.status === "cycle_done"
    ) {
      evaluateBattery(battery.id);
      setReportBatteryId(battery.id);
    }
  };

  const handleTestDataSubmit = (
    data: StaticTestData | CapacityTestData | CycleTestData,
  ) => {
    if (!modalBattery) return;

    if (testType === "static") {
      updateStaticTest(modalBattery.id, data as StaticTestData);
    } else if (testType === "capacity") {
      updateCapacityTest(modalBattery.id, data as CapacityTestData);
    } else if (testType === "cycle") {
      updateCycleTest(modalBattery.id, data as CycleTestData);
    }

    advanceStatus(modalBattery.id);
    setIsDataModalOpen(false);
    setModalBattery(null);
    setTestType(null);
  };

  const handleCloseDataModal = () => {
    setIsDataModalOpen(false);
    setModalBattery(null);
    setTestType(null);
  };

  const handleEvaluate = (batteryId: string) => {
    evaluateBattery(batteryId);
    setReportBatteryId(batteryId);
  };

  const reportBattery = reportBatteryId
    ? getBatteryById(reportBatteryId)
    : null;

  return (
    <div className="h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          检测流程看板
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          拖拽电池卡片到下一阶段进行状态流转，每阶段需录入对应检测数据
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {columns.map((col) => {
            const columnBatteries = batteriesByStatus[col.status];
            const columnId = `column-${col.status}`;
            const isOver = overColumnId === columnId;
            const canDrop = activeBattery
              ? canDropTo(activeBattery.status, col.status)
              : false;

            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                color={col.color}
                icon={col.icon}
                batteries={columnBatteries}
                isOver={isOver}
                canDrop={canDrop}
                onEvaluate={handleEvaluate}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeId && activeBattery ? (
            <div style={{ transform: "rotate(3deg)" }}>
              <BatteryCard battery={activeBattery} draggable={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TestDataModal
        isOpen={isDataModalOpen}
        onClose={handleCloseDataModal}
        battery={modalBattery}
        testType={testType}
        onSubmit={handleTestDataSubmit}
      />

      <EvaluationReportModal
        isOpen={!!reportBatteryId}
        onClose={() => setReportBatteryId(null)}
        battery={reportBattery}
      />
    </div>
  );
}
