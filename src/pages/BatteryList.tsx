import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBatteryStore } from "@/store/batteryStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type {
  BatteryModule,
  DetectionStatus,
  Grade,
  SortConfig,
} from "@/data/types";
import { STATUS_LABELS, GRADE_LABELS, GRADE_ROW_COLORS } from "@/data/types";
import { getGradeColorClass } from "@/utils/sohCalculator";
import { formatDate } from "@/utils/exportUtils";
import { exportToCSV } from "@/utils/exportUtils";
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Eye,
  GitCompare,
} from "lucide-react";

const PAGE_SIZE = 15;

export default function BatteryList() {
  const {
    batteries,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    batchUpdateGrade,
  } = useBatteryStore();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<DetectionStatus | "">("");
  const [gradeFilter, setGradeFilter] = useState<Grade | "">("");
  const [sohMin, setSohMin] = useState<number>(0);
  const [sohMax, setSohMax] = useState<number>(100);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [batchGrade, setBatchGrade] = useState<Grade>("A");
  const [showBatchModal, setShowBatchModal] = useState(false);

  const filteredBatteries = useMemo(() => {
    let result = [...batteries];

    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (b) =>
          b.id.toLowerCase().includes(search) ||
          b.carModel.toLowerCase().includes(search),
      );
    }

    if (statusFilter) {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (gradeFilter) {
      result = result.filter((b) => b.evaluation?.grade === gradeFilter);
    }

    if (sohMin > 0 || sohMax < 100) {
      result = result.filter((b) => {
        if (!b.evaluation) return false;
        return (
          b.evaluation.finalSOH >= sohMin && b.evaluation.finalSOH <= sohMax
        );
      });
    }

    if (dateFrom) {
      result = result.filter((b) => b.arrivalDate >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((b) => b.arrivalDate <= dateTo);
    }

    return result;
  }, [
    batteries,
    searchText,
    statusFilter,
    gradeFilter,
    sohMin,
    sohMax,
    dateFrom,
    dateTo,
  ]);

  const sortedBatteries = useMemo(() => {
    if (sortConfigs.length === 0) return filteredBatteries;

    return [...filteredBatteries].sort((a, b) => {
      for (const config of sortConfigs) {
        let aVal: number | string = "";
        let bVal: number | string = "";

        switch (config.key) {
          case "id":
            aVal = a.id;
            bVal = b.id;
            break;
          case "carModel":
            aVal = a.carModel;
            bVal = b.carModel;
            break;
          case "nominalCapacity":
            aVal = a.nominalCapacity;
            bVal = b.nominalCapacity;
            break;
          case "arrivalDate":
            aVal = a.arrivalDate;
            bVal = b.arrivalDate;
            break;
          case "soh":
            aVal = a.evaluation?.finalSOH ?? -1;
            bVal = b.evaluation?.finalSOH ?? -1;
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            continue;
        }

        if (aVal < bVal) return config.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return config.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredBatteries, sortConfigs]);

  const totalPages = Math.ceil(sortedBatteries.length / PAGE_SIZE);
  const paginatedBatteries = sortedBatteries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSort = (key: string) => {
    setSortConfigs((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        if (existing.direction === "asc") {
          return prev.map((c) =>
            c.key === key ? { ...c, direction: "desc" } : c,
          );
        } else {
          return prev.filter((c) => c.key !== key);
        }
      }
      return [...prev, { key, direction: "asc" }];
    });
    setCurrentPage(1);
  };

  const getSortIcon = (key: string) => {
    const config = sortConfigs.find((c) => c.key === key);
    if (!config) return <ArrowUpDown size={14} className="text-gray-400" />;
    return config.direction === "asc" ? (
      <ArrowUp size={14} className="text-teal-500" />
    ) : (
      <ArrowDown size={14} className="text-teal-500" />
    );
  };

  const getRowBgClass = (battery: BatteryModule) => {
    if (!battery.evaluation) {
      return "bg-gray-50/50 dark:bg-gray-800/30";
    }
    return GRADE_ROW_COLORS[battery.evaluation.grade];
  };

  const pageIds = paginatedBatteries.map((b) => b.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected = pageIds.some((id) => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      const newSelected = selectedIds.filter((id) => !pageIds.includes(id));
      if (newSelected.length === 0) {
        clearSelection();
      } else {
        selectAll(newSelected);
      }
    } else {
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      selectAll(combined);
    }
  };

  const handleBatchUpdate = () => {
    const evaluableIds = selectedIds.filter((id) => {
      const battery = batteries.find((b) => b.id === id);
      return battery?.evaluation;
    });
    batchUpdateGrade(evaluableIds, batchGrade);
    setShowBatchModal(false);
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2 && selectedIds.length <= 4) {
      navigate(`/compare?ids=${selectedIds.join(",")}`);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredBatteries, "电池清单.csv");
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setGradeFilter("");
    setSohMin(0);
    setSohMax(100);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            电池清单
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            共 {filteredBatteries.length} 个电池模组，已选择{" "}
            {selectedIds.length} 个
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter size={16} />}
          >
            筛选
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={16} />}
          >
            导出CSV
          </Button>
          {selectedIds.length > 0 &&
            selectedIds.every((id) => {
              const b = batteries.find((x) => x.id === id);
              return b?.evaluation;
            }) && (
              <Button size="sm" onClick={() => setShowBatchModal(true)}>
                批量调整分级
              </Button>
            )}
          {selectedIds.length >= 2 && selectedIds.length <= 4 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCompare}
              leftIcon={<GitCompare size={16} />}
            >
              对比 ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              label="搜索"
              placeholder="编码/车型"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              label="检测状态"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as DetectionStatus | "");
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "全部" },
                { value: "pending", label: STATUS_LABELS.pending },
                { value: "static_done", label: STATUS_LABELS.static_done },
                { value: "capacity_done", label: STATUS_LABELS.capacity_done },
                { value: "cycle_done", label: STATUS_LABELS.cycle_done },
                { value: "evaluated", label: STATUS_LABELS.evaluated },
              ]}
            />
            <Select
              label="梯次分级"
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value as Grade | "");
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "全部" },
                { value: "A", label: "A级 - 储能级" },
                { value: "B", label: "B级 - 低速车级" },
                { value: "C", label: "C级 - 备电级" },
                { value: "D", label: "D级 - 报废" },
              ]}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SOH范围: {sohMin}% - {sohMax}%
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sohMin}
                  onChange={(e) => {
                    setSohMin(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="flex-1 accent-teal-500"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sohMax}
                  onChange={(e) => {
                    setSohMax(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="flex-1 accent-teal-500"
                />
              </div>
            </div>
            <Input
              label="到货日期从"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Input
              label="到货日期至"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              重置筛选
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-3 py-3 text-left w-10">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {allSelected ? (
                      <CheckSquare size={18} className="text-teal-500" />
                    ) : someSelected ? (
                      <CheckSquare
                        size={18}
                        className="text-teal-500 opacity-60"
                      />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th
                  className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center gap-1">
                    电池编码
                    {getSortIcon("id")}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("carModel")}
                >
                  <div className="flex items-center gap-1">
                    来源车型
                    {getSortIcon("carModel")}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("nominalCapacity")}
                >
                  <div className="flex items-center gap-1">
                    标称容量
                    {getSortIcon("nominalCapacity")}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    检测状态
                    {getSortIcon("status")}
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("soh")}
                >
                  <div className="flex items-center gap-1">
                    SOH
                    {getSortIcon("soh")}
                  </div>
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  分级
                </th>
                <th
                  className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("arrivalDate")}
                >
                  <div className="flex items-center gap-1">
                    到货日期
                    {getSortIcon("arrivalDate")}
                  </div>
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300 w-20">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedBatteries.map((battery) => (
                <tr
                  key={battery.id}
                  className={`${getRowBgClass(battery)} hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors`}
                >
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleSelect(battery.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {selectedIds.includes(battery.id) ? (
                        <CheckSquare size={18} className="text-teal-500" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3 font-mono text-gray-900 dark:text-white font-medium">
                    {battery.id}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-200">
                    {battery.carModel}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-200">
                    {battery.nominalCapacity}Ah
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {STATUS_LABELS[battery.status]}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-3 font-medium ${battery.evaluation ? getGradeColorClass(battery.evaluation.grade) : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {battery.evaluation
                      ? `${battery.evaluation.finalSOH.toFixed(1)}%`
                      : "-"}
                  </td>
                  <td className="px-3 py-3">
                    {battery.evaluation ? (
                      <span
                        className={`font-bold ${getGradeColorClass(battery.evaluation.grade)}`}
                      >
                        {battery.evaluation.grade}级
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        未评估
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                    {formatDate(battery.arrivalDate)}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      to={`/batteries/${battery.id}`}
                      className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-xs"
                    >
                      <Eye size={14} />
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
              {paginatedBatteries.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            第 {currentPage} / {totalPages || 1} 页
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBatchModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              批量调整分级
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              已选择{" "}
              {
                selectedIds.filter(
                  (id) => batteries.find((b) => b.id === id)?.evaluation,
                ).length
              }{" "}
              个已评估电池
            </p>
            <Select
              label="目标分级"
              value={batchGrade}
              onChange={(e) => setBatchGrade(e.target.value as Grade)}
              options={[
                { value: "A", label: "A级 - 储能级" },
                { value: "B", label: "B级 - 低速车级" },
                { value: "C", label: "C级 - 备电级" },
                { value: "D", label: "D级 - 报废" },
              ]}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowBatchModal(false)}
              >
                取消
              </Button>
              <Button onClick={handleBatchUpdate}>确认调整</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
