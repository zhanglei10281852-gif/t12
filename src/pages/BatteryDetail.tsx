import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBatteryStore } from "@/store/batteryStore";
import SOHGauge from "@/components/SOHGauge";
import Timeline from "@/components/Timeline";
import Button from "@/components/ui/Button";
import EvaluationReportModal from "@/components/EvaluationReportModal";
import { formatDate, printReport } from "@/utils/exportUtils";
import { APPEARANCE_LABELS, STATUS_LABELS, GRADE_LABELS } from "@/data/types";
import { getGradeColorClass, getGradeBgClass } from "@/utils/sohCalculator";
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  Printer,
  ClipboardCheck,
  Gauge,
  BatteryCharging,
  Award,
} from "lucide-react";

export default function BatteryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBatteryById, evaluateBattery } = useBatteryStore();

  const battery = getBatteryById(id || "");
  const [showReport, setShowReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "static",
    "capacity",
    "cycle",
    "evaluation",
  ]);

  if (!battery) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          未找到该电池记录
        </p>
        <Link
          to="/batteries"
          className="text-teal-600 dark:text-teal-400 hover:underline"
        >
          返回电池清单
        </Link>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const grade = battery.evaluation?.grade;

  const handleEvaluate = () => {
    evaluateBattery(battery.id);
    setShowReport(true);
  };

  const handlePrint = () => {
    printReport(battery);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {battery.id}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {battery.carModel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer size={16} />}
          >
            打印报告
          </Button>
          {battery.status === "cycle_done" && (
            <Button size="sm" onClick={handleEvaluate}>
              执行评估
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
              基本信息
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoItem label="电池编码" value={battery.id} mono />
              <InfoItem label="来源车型" value={battery.carModel} />
              <InfoItem
                label="标称容量"
                value={`${battery.nominalCapacity} Ah`}
              />
              <InfoItem
                label="标称电压"
                value={`${battery.nominalVoltage} V`}
              />
              <InfoItem
                label="出厂日期"
                value={formatDate(battery.manufactureDate)}
              />
              <InfoItem
                label="到货日期"
                value={formatDate(battery.arrivalDate)}
              />
              <InfoItem
                label="检测状态"
                value={STATUS_LABELS[battery.status]}
                valueClass="text-teal-600 dark:text-teal-400 font-medium"
              />
              {grade && (
                <InfoItem
                  label="梯次分级"
                  value={`${grade}级 · ${GRADE_LABELS[grade]}`}
                  valueClass={getGradeColorClass(grade) + " font-bold"}
                />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
              检测时间线
            </h3>
            <Timeline battery={battery} />
          </div>

          <div className="space-y-3">
            <CollapsiblePanel
              title="静态检测"
              icon={<ClipboardCheck size={18} />}
              isOpen={expandedSections.includes("static")}
              onToggle={() => toggleSection("static")}
              hasData={!!battery.staticTest}
            >
              {battery.staticTest ? (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <InfoItem
                    label="开路电压"
                    value={`${battery.staticTest.openCircuitVoltage} V`}
                  />
                  <InfoItem
                    label="内阻"
                    value={`${battery.staticTest.internalResistance} mΩ`}
                  />
                  <InfoItem
                    label="外观状态"
                    value={APPEARANCE_LABELS[battery.staticTest.appearance]}
                  />
                  <InfoItem
                    label="检测日期"
                    value={formatDate(battery.staticTest.testDate)}
                  />
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
                  暂无静态检测数据
                </p>
              )}
            </CollapsiblePanel>

            <CollapsiblePanel
              title="容量标定"
              icon={<Gauge size={18} />}
              isOpen={expandedSections.includes("capacity")}
              onToggle={() => toggleSection("capacity")}
              hasData={!!battery.capacityTest}
            >
              {battery.capacityTest ? (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <InfoItem
                    label="实测容量"
                    value={`${battery.capacityTest.actualCapacity} Ah`}
                  />
                  <InfoItem
                    label="标定SOH"
                    value={`${battery.capacityTest.calibratedSOH}%`}
                  />
                  <InfoItem
                    label="检测日期"
                    value={formatDate(battery.capacityTest.testDate)}
                  />
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
                  暂无容量标定数据
                </p>
              )}
            </CollapsiblePanel>

            <CollapsiblePanel
              title="循环测试"
              icon={<BatteryCharging size={18} />}
              isOpen={expandedSections.includes("cycle")}
              onToggle={() => toggleSection("cycle")}
              hasData={!!battery.cycleTest}
            >
              {battery.cycleTest ? (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <InfoItem
                    label="测试循环数"
                    value={`${battery.cycleTest.cycleCount} 次`}
                  />
                  <InfoItem
                    label="容量衰减率"
                    value={`${battery.cycleTest.capacityDecayRate}%/100次`}
                  />
                  <InfoItem
                    label="内阻增长率"
                    value={`${battery.cycleTest.resistanceGrowthRate}%`}
                  />
                  <InfoItem
                    label="检测日期"
                    value={formatDate(battery.cycleTest.testDate)}
                  />
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
                  暂无循环测试数据
                </p>
              )}
            </CollapsiblePanel>

            <CollapsiblePanel
              title="评估报告"
              icon={<Award size={18} />}
              isOpen={expandedSections.includes("evaluation")}
              onToggle={() => toggleSection("evaluation")}
              hasData={!!battery.evaluation}
              accent
            >
              {battery.evaluation ? (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        最终SOH
                      </p>
                      <p
                        className={`text-2xl font-bold ${getGradeColorClass(grade)}`}
                      >
                        {battery.evaluation.finalSOH.toFixed(2)}%
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl font-bold ${getGradeBgClass(grade)} ${getGradeColorClass(grade)}`}
                    >
                      {grade}级 · {GRADE_LABELS[grade!]}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        基础SOH
                      </span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {battery.evaluation.baseSOH.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        内阻修正
                      </span>
                      <span
                        className={
                          battery.evaluation.resistanceDiscount
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-400 dark:text-gray-500"
                        }
                      >
                        {battery.evaluation.resistanceDiscount
                          ? "是（打8折）"
                          : "否"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        衰减修正
                      </span>
                      <span
                        className={
                          battery.evaluation.decayDiscount
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-400 dark:text-gray-500"
                        }
                      >
                        {battery.evaluation.decayDiscount
                          ? "是（打9折）"
                          : "否"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        外观封顶
                      </span>
                      <span
                        className={
                          battery.evaluation.appearanceCap
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-400 dark:text-gray-500"
                        }
                      >
                        {battery.evaluation.appearanceCap
                          ? "是（60%上限）"
                          : "否"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    评估日期：{formatDate(battery.evaluation.evaluateDate)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
                  暂无评估数据
                </p>
              )}
            </CollapsiblePanel>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
              SOH 状态
            </h3>
            <div className="flex justify-center py-4">
              {battery.evaluation ? (
                <SOHGauge
                  soh={battery.evaluation.finalSOH}
                  size={200}
                  strokeWidth={16}
                />
              ) : (
                <div className="text-center py-10">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-300 dark:text-gray-600">
                      --
                    </span>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    待评估
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-teal-500 rounded-full"></span>
              快速操作
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Download size={16} />}
                onClick={handlePrint}
              >
                导出检测报告
              </Button>
              {battery.status === "cycle_done" && (
                <Button
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleEvaluate}
                >
                  执行梯次评估
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <EvaluationReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        battery={battery}
      />
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p
        className={`text-sm text-gray-900 dark:text-white ${mono ? "font-mono" : ""} ${valueClass || ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function CollapsiblePanel({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  hasData,
  accent = false,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasData: boolean;
  accent?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
          accent
            ? "bg-teal-50/50 dark:bg-teal-900/10"
            : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`${hasData ? "text-teal-500" : "text-gray-300 dark:text-gray-600"}`}
          >
            {icon}
          </div>
          <span
            className={`font-medium ${hasData ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}
          >
            {title}
          </span>
          {hasData && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}
