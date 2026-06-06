import type { BatteryModule } from "@/data/types";
import { STATUS_LABELS, GRADE_LABELS, APPEARANCE_LABELS } from "@/data/types";

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function exportToCSV(
  batteries: BatteryModule[],
  filename: string = "batteries.csv",
) {
  const headers = [
    "电池编码",
    "来源车型",
    "标称容量(Ah)",
    "标称电压(V)",
    "出厂日期",
    "到货日期",
    "检测状态",
    "开路电压(V)",
    "内阻(mΩ)",
    "外观状态",
    "实测容量(Ah)",
    "标定SOH(%)",
    "循环次数",
    "容量衰减率(%/100次)",
    "内阻增长率(%)",
    "最终SOH(%)",
    "梯次分级",
  ];

  const rows = batteries.map((b) => [
    b.id,
    b.carModel,
    b.nominalCapacity,
    b.nominalVoltage,
    formatDate(b.manufactureDate),
    formatDate(b.arrivalDate),
    STATUS_LABELS[b.status],
    b.staticTest?.openCircuitVoltage ?? "",
    b.staticTest?.internalResistance ?? "",
    b.staticTest ? APPEARANCE_LABELS[b.staticTest.appearance] : "",
    b.capacityTest?.actualCapacity ?? "",
    b.capacityTest?.calibratedSOH ?? "",
    b.cycleTest?.cycleCount ?? "",
    b.cycleTest?.capacityDecayRate ?? "",
    b.cycleTest?.resistanceGrowthRate ?? "",
    b.evaluation?.finalSOH ?? "",
    b.evaluation
      ? `${b.evaluation.grade}级(${GRADE_LABELS[b.evaluation.grade]})`
      : "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReport(battery: BatteryModule) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  const html = generateReportHTML(battery);
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function generateReportHTML(battery: BatteryModule): string {
  const gradeLabel = battery.evaluation
    ? `${battery.evaluation.grade}级 - ${GRADE_LABELS[battery.evaluation.grade]}`
    : "未评估";

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>电池检测报告 - ${battery.id}</title>
  <style>
    body { font-family: -apple-system, "Segoe UI", sans-serif; padding: 40px; color: #333; }
    h1 { text-align: center; color: #0f766e; margin-bottom: 30px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; font-size: 18px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
    .info-value { font-size: 16px; font-weight: 500; }
    .grade-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; }
    .grade-A { background: #d1fae5; color: #065f46; }
    .grade-B { background: #dbeafe; color: #1e40af; }
    .grade-C { background: #fef3c7; color: #92400e; }
    .grade-D { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f0fdfa; color: #0f766e; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>退役电池检测报告</h1>
  
  <div class="section">
    <h2>基本信息</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">电池编码</span>
        <span class="info-value">${battery.id}</span>
      </div>
      <div class="info-item">
        <span class="info-label">来源车型</span>
        <span class="info-value">${battery.carModel}</span>
      </div>
      <div class="info-item">
        <span class="info-label">梯次分级</span>
        <span class="grade-badge grade-${battery.evaluation?.grade || "none"}">${gradeLabel}</span>
      </div>
      <div class="info-item">
        <span class="info-label">标称容量</span>
        <span class="info-value">${battery.nominalCapacity} Ah</span>
      </div>
      <div class="info-item">
        <span class="info-label">标称电压</span>
        <span class="info-value">${battery.nominalVoltage} V</span>
      </div>
      <div class="info-item">
        <span class="info-label">检测状态</span>
        <span class="info-value">${STATUS_LABELS[battery.status]}</span>
      </div>
      <div class="info-item">
        <span class="info-label">出厂日期</span>
        <span class="info-value">${formatDate(battery.manufactureDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">到货日期</span>
        <span class="info-value">${formatDate(battery.arrivalDate)}</span>
      </div>
    </div>
  </div>

  ${
    battery.staticTest
      ? `
  <div class="section">
    <h2>静态检测</h2>
    <table>
      <tr><th>项目</th><th>结果</th><th>检测日期</th></tr>
      <tr><td>开路电压</td><td>${battery.staticTest.openCircuitVoltage} V</td><td rowspan="3">${formatDate(battery.staticTest.testDate)}</td></tr>
      <tr><td>内阻</td><td>${battery.staticTest.internalResistance} mΩ</td></tr>
      <tr><td>外观状态</td><td>${APPEARANCE_LABELS[battery.staticTest.appearance]}</td></tr>
    </table>
  </div>
  `
      : ""
  }

  ${
    battery.capacityTest
      ? `
  <div class="section">
    <h2>容量标定</h2>
    <table>
      <tr><th>项目</th><th>结果</th><th>检测日期</th></tr>
      <tr><td>实测容量</td><td>${battery.capacityTest.actualCapacity} Ah</td><td rowspan="2">${formatDate(battery.capacityTest.testDate)}</td></tr>
      <tr><td>标定SOH</td><td>${battery.capacityTest.calibratedSOH}%</td></tr>
    </table>
  </div>
  `
      : ""
  }

  ${
    battery.cycleTest
      ? `
  <div class="section">
    <h2>循环测试</h2>
    <table>
      <tr><th>项目</th><th>结果</th><th>检测日期</th></tr>
      <tr><td>测试循环数</td><td>${battery.cycleTest.cycleCount} 次</td><td rowspan="3">${formatDate(battery.cycleTest.testDate)}</td></tr>
      <tr><td>容量衰减率</td><td>${battery.cycleTest.capacityDecayRate}% / 100次</td></tr>
      <tr><td>内阻增长率</td><td>${battery.cycleTest.resistanceGrowthRate}%</td></tr>
    </table>
  </div>
  `
      : ""
  }

  ${
    battery.evaluation
      ? `
  <div class="section">
    <h2>评估结果</h2>
    <table>
      <tr><th>项目</th><th>结果</th></tr>
      <tr><td>基础SOH</td><td>${battery.evaluation.baseSOH}%</td></tr>
      <tr><td>内阻修正</td><td>${battery.evaluation.resistanceDiscount ? "是（打8折）" : "否"}</td></tr>
      <tr><td>衰减修正</td><td>${battery.evaluation.decayDiscount ? "是（打9折）" : "否"}</td></tr>
      <tr><td>外观封顶</td><td>${battery.evaluation.appearanceCap ? "是（60%上限）" : "否"}</td></tr>
      <tr style="font-weight: bold; background: #f0fdfa;"><td>最终SOH</td><td>${battery.evaluation.finalSOH}%</td></tr>
      <tr style="font-weight: bold; background: #f0fdfa;"><td>梯次分级</td><td>${battery.evaluation.grade}级 - ${GRADE_LABELS[battery.evaluation.grade]}</td></tr>
    </table>
  </div>
  `
      : ""
  }

  <div class="footer">
    报告生成时间：${new Date().toLocaleString("zh-CN")}
  </div>
</body>
</html>
  `;
}
