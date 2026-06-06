import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BatteryModule } from "@/data/types";
import { GRADE_LABELS } from "@/data/types";
import { getGradeColorClass, getGradeBgClass } from "@/utils/sohCalculator";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface BatteryCardProps {
  battery: BatteryModule;
  draggable?: boolean;
}

export default function BatteryCard({
  battery,
  draggable = true,
}: BatteryCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: battery.id,
      disabled: !draggable,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const grade = battery.evaluation?.grade;
  const soh = battery.evaluation?.finalSOH;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      className={`group bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 
        hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 
        transition-all duration-200 cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
          {battery.id}
        </div>
        {grade && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeBgClass(grade)} ${getGradeColorClass(grade)}`}
          >
            {grade}级
          </span>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {battery.carModel}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-600 dark:text-gray-300">
          <span className="text-gray-400 dark:text-gray-500">容量:</span>{" "}
          <span className="font-medium">{battery.nominalCapacity}Ah</span>
        </div>
        {soh !== undefined && (
          <div className={`font-medium ${getGradeColorClass(grade)}`}>
            SOH: {soh.toFixed(1)}%
          </div>
        )}
      </div>

      <Link
        to={`/batteries/${battery.id}`}
        className="mt-2 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 
          text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 
          hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/30 dark:hover:text-teal-300
          transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Eye size={12} />
        查看详情
      </Link>
    </div>
  );
}
