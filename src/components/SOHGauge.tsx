import { GRADE_LABELS } from "@/data/types";
import type { Grade } from "@/data/types";
import { getGradeColorClass } from "@/utils/sohCalculator";

interface SOHGaugeProps {
  soh: number;
  size?: number;
  strokeWidth?: number;
}

export default function SOHGauge({
  soh,
  size = 200,
  strokeWidth = 16,
}: SOHGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = Math.min(100, Math.max(0, soh)) / 100;
  const offset = circumference * (1 - progress);

  const getGrade = (value: number): Grade => {
    if (value >= 80) return "A";
    if (value >= 60) return "B";
    if (value >= 40) return "C";
    return "D";
  };

  const grade = getGrade(soh);
  const colorClass = getGradeColorClass(grade);

  const getGradientId = () =>
    `soh-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const gradientId = getGradientId();

  const getStopColor = () => {
    if (soh >= 80) return "#10b981";
    if (soh >= 60) return "#3b82f6";
    if (soh >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={getStopColor()} stopOpacity="0.6" />
            <stop offset="100%" stopColor={getStopColor()} stopOpacity="1" />
          </linearGradient>
        </defs>

        <path
          d={`M ${strokeWidth / 2} ${size / 2} 
              A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-gray-200 dark:text-gray-700"
        />

        <path
          d={`M ${strokeWidth / 2} ${size / 2} 
              A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s ease-in-out",
          }}
        />

        <text
          x={size / 2}
          y={size / 2 - 10}
          textAnchor="middle"
          className={`text-3xl font-bold ${colorClass}`}
          fontSize="36"
          fontWeight="bold"
          fill="currentColor"
        >
          {soh.toFixed(1)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 15}
          textAnchor="middle"
          className="text-sm fill-gray-500 dark:fill-gray-400"
          fontSize="14"
        >
          {grade}级 · {GRADE_LABELS[grade]}
        </text>
      </svg>
    </div>
  );
}
