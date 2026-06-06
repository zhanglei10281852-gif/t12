import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { BatteryModule } from "@/data/types";
import { GRADE_LABELS, APPEARANCE_LABELS } from "@/data/types";
import { getGradeColorClass, getGradeBgClass } from "@/utils/sohCalculator";
import SOHGauge from "@/components/SOHGauge";
import { Download, CheckCircle2, ArrowRight } from "lucide-react";
import { printReport } from "@/utils/exportUtils";

interface EvaluationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  battery: BatteryModule | null;
}

export default function EvaluationReportModal({
  isOpen,
  onClose,
  battery,
}: EvaluationReportModalProps) {
  if (!battery || !battery.evaluation) return null;

  const { evaluation } = battery;

  const handlePrint = () => {
    if (battery) {
      printReport(battery);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="评估报告" size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {battery.id}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {battery.carModel}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-xl font-bold text-lg ${getGradeBgClass(evaluation.grade)} ${getGradeColorClass(evaluation.grade)}`}
          >
            {evaluation.grade}级 · {GRADE_LABELS[evaluation.grade]}
          </div>
        </div>

        <div className="flex justify-center py-4">
          <SOHGauge soh={evaluation.finalSOH} size={220} strokeWidth={18} />
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
            评估计算过程
          </h5>

          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">基础SOH</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {evaluation.baseSOH.toFixed(2)}%
              </span>
            </div>

            {evaluation.resistanceDiscount && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-amber-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  内阻增长率 {">"} 100%
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  打8折
                </span>
              </div>
            )}

            {evaluation.decayDiscount && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-amber-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  容量衰减率 {">"} 1%/100次
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  打9折
                </span>
              </div>
            )}

            {evaluation.appearanceCap && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-red-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  外观膨胀
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  封顶60%
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">
                最终SOH
              </span>
              <span
                className={`text-xl font-bold ${getGradeColorClass(evaluation.grade)}`}
              >
                {evaluation.finalSOH.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              开路电压
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {battery.staticTest?.openCircuitVoltage}V
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              内阻
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {battery.staticTest?.internalResistance}mΩ
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              外观
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {battery.staticTest &&
                APPEARANCE_LABELS[battery.staticTest.appearance]}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handlePrint}
            leftIcon={<Download size={16} />}
          >
            打印报告
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
}
