import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type {
  StaticTestData,
  CapacityTestData,
  CycleTestData,
} from "@/data/types";
import type { BatteryModule } from "@/data/types";

interface TestDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  battery: BatteryModule | null;
  testType: "static" | "capacity" | "cycle" | null;
  onSubmit: (data: StaticTestData | CapacityTestData | CycleTestData) => void;
}

export default function TestDataModal({
  isOpen,
  onClose,
  battery,
  testType,
  onSubmit,
}: TestDataModalProps) {
  const [staticData, setStaticData] = useState({
    openCircuitVoltage: "",
    internalResistance: "",
    appearance: "normal",
  });

  const [capacityData, setCapacityData] = useState({
    actualCapacity: "",
  });

  const [cycleData, setCycleData] = useState({
    cycleCount: "",
    capacityDecayRate: "",
    resistanceGrowthRate: "",
  });

  const getTitle = () => {
    if (!battery) return "";
    switch (testType) {
      case "static":
        return `静态检测数据录入 - ${battery.id}`;
      case "capacity":
        return `容量标定数据录入 - ${battery.id}`;
      case "cycle":
        return `循环测试数据录入 - ${battery.id}`;
      default:
        return "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const testDate = new Date().toISOString().split("T")[0];

    if (testType === "static") {
      onSubmit({
        openCircuitVoltage: parseFloat(staticData.openCircuitVoltage),
        internalResistance: parseFloat(staticData.internalResistance),
        appearance: staticData.appearance as "normal" | "swollen" | "deformed",
        testDate,
      });
    } else if (testType === "capacity") {
      const actual = parseFloat(capacityData.actualCapacity);
      const calibratedSOH = (actual / (battery?.nominalCapacity || 1)) * 100;
      onSubmit({
        actualCapacity: actual,
        calibratedSOH: Math.round(calibratedSOH * 100) / 100,
        testDate,
      });
    } else if (testType === "cycle") {
      onSubmit({
        cycleCount: parseInt(cycleData.cycleCount),
        capacityDecayRate: parseFloat(cycleData.capacityDecayRate),
        resistanceGrowthRate: parseFloat(cycleData.resistanceGrowthRate),
        testDate,
      });
    }

    setStaticData({
      openCircuitVoltage: "",
      internalResistance: "",
      appearance: "normal",
    });
    setCapacityData({ actualCapacity: "" });
    setCycleData({
      cycleCount: "",
      capacityDecayRate: "",
      resistanceGrowthRate: "",
    });
  };

  const getDefaultValues = () => {
    if (!battery) return;

    if (testType === "static" && battery.staticTest) {
      setStaticData({
        openCircuitVoltage: battery.staticTest.openCircuitVoltage.toString(),
        internalResistance: battery.staticTest.internalResistance.toString(),
        appearance: battery.staticTest.appearance,
      });
    } else if (testType === "capacity" && battery.capacityTest) {
      setCapacityData({
        actualCapacity: battery.capacityTest.actualCapacity.toString(),
      });
    } else if (testType === "cycle" && battery.cycleTest) {
      setCycleData({
        cycleCount: battery.cycleTest.cycleCount.toString(),
        capacityDecayRate: battery.cycleTest.capacityDecayRate.toString(),
        resistanceGrowthRate: battery.cycleTest.resistanceGrowthRate.toString(),
      });
    }
  };

  if (!battery || !testType) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {testType === "static" && (
          <>
            <Input
              label="开路电压 (V)"
              type="number"
              step="0.1"
              value={staticData.openCircuitVoltage}
              onChange={(e) =>
                setStaticData((prev) => ({
                  ...prev,
                  openCircuitVoltage: e.target.value,
                }))
              }
              placeholder="请输入开路电压"
              required
            />
            <Input
              label="内阻 (mΩ)"
              type="number"
              step="0.01"
              value={staticData.internalResistance}
              onChange={(e) =>
                setStaticData((prev) => ({
                  ...prev,
                  internalResistance: e.target.value,
                }))
              }
              placeholder="请输入内阻"
              required
            />
            <Select
              label="外观状态"
              value={staticData.appearance}
              onChange={(e) =>
                setStaticData((prev) => ({
                  ...prev,
                  appearance: e.target.value,
                }))
              }
              options={[
                { value: "normal", label: "正常" },
                { value: "swollen", label: "膨胀" },
                { value: "deformed", label: "变形" },
              ]}
            />
          </>
        )}

        {testType === "capacity" && (
          <>
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                标称容量：
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {battery.nominalCapacity} Ah
                </span>
              </p>
            </div>
            <Input
              label="实测容量 (Ah)"
              type="number"
              step="0.01"
              value={capacityData.actualCapacity}
              onChange={(e) =>
                setCapacityData((prev) => ({
                  ...prev,
                  actualCapacity: e.target.value,
                }))
              }
              placeholder="请输入实测容量"
              required
            />
          </>
        )}

        {testType === "cycle" && (
          <>
            <Input
              label="测试循环数 (次)"
              type="number"
              value={cycleData.cycleCount}
              onChange={(e) =>
                setCycleData((prev) => ({
                  ...prev,
                  cycleCount: e.target.value,
                }))
              }
              placeholder="请输入循环次数"
              required
            />
            <Input
              label="容量衰减率 (%/100次)"
              type="number"
              step="0.01"
              value={cycleData.capacityDecayRate}
              onChange={(e) =>
                setCycleData((prev) => ({
                  ...prev,
                  capacityDecayRate: e.target.value,
                }))
              }
              placeholder="请输入容量衰减率"
              required
            />
            <Input
              label="内阻增长率 (%)"
              type="number"
              step="0.01"
              value={cycleData.resistanceGrowthRate}
              onChange={(e) =>
                setCycleData((prev) => ({
                  ...prev,
                  resistanceGrowthRate: e.target.value,
                }))
              }
              placeholder="请输入内阻增长率"
              required
            />
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">确认提交</Button>
        </div>
      </form>
    </Modal>
  );
}
