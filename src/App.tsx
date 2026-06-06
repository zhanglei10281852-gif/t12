import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import KanbanBoard from "@/pages/KanbanBoard";
import BatteryList from "@/pages/BatteryList";
import BatteryDetail from "@/pages/BatteryDetail";
import Dashboard from "@/pages/Dashboard";
import Compare from "@/pages/Compare";
import BatchManage from "@/pages/BatchManage";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<KanbanBoard />} />
          <Route path="/batteries" element={<BatteryList />} />
          <Route path="/batteries/:id" element={<BatteryDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/batches" element={<BatchManage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
