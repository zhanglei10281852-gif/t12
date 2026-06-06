import { NavLink } from "react-router-dom";
import {
  Sun,
  Moon,
  LayoutGrid,
  List,
  BarChart3,
  GitCompare,
  Package,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { path: "/", label: "检测看板", icon: LayoutGrid, end: true },
  { path: "/batteries", label: "电池清单", icon: List },
  { path: "/dashboard", label: "数据分析", icon: BarChart3 },
  { path: "/compare", label: "电池对比", icon: GitCompare },
  { path: "/batches", label: "批次管理", icon: Package },
];

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-500/20">
              电
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                电池梯次利用管理系统
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                Battery Echelon Utilization
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="切换主题"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto -mx-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`
                }
              >
                <Icon size={14} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
