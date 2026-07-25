import React, { useState } from "react";
import { BudgetData } from "../types";
import { formatRupiah } from "../utils";
import {
  Calendar,
  History,
  Search,
  ArrowUpDown,
} from "lucide-react";

interface BudgetHistoryProps {
  data: BudgetData;
  isPrivacy?: boolean;
  currentDate?: Date;
}

export const BudgetHistory: React.FC<BudgetHistoryProps> = ({
  data,
  isPrivacy = false,
  currentDate,
}) => {
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("all");
  const [historySortBy, setHistorySortBy] = useState<
    "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
  >("date-desc");

  const CATEGORY_COLORS = {
    needs: "#6366F1",
    savings: "#10B981",
    debt: "#EF4444",
    others: "#A855F7",
    extra: ["#F59E0B", "#06B6D4", "#EC4899", "#14B8A6", "#F97316"],
  };

  const defaultDate = React.useMemo(() => {
    if (!currentDate) return new Date().toISOString().split("T")[0];

    const today = new Date();
    const selectedYear = currentDate.getFullYear();
    const selectedMonth = currentDate.getMonth(); // 0-indexed

    // Today's custom budget month mapping
    const todayDay = today.getDate();
    let todayBudgetMonth = today.getMonth();
    let todayBudgetYear = today.getFullYear();
    if (todayDay >= 28) {
      todayBudgetMonth += 1;
      if (todayBudgetMonth > 11) {
        todayBudgetMonth = 0;
        todayBudgetYear += 1;
      }
    }

    if (todayBudgetMonth === selectedMonth && todayBudgetYear === selectedYear) {
      return today.toISOString().split("T")[0];
    }

    // Fallback: 1st of the selected month
    const fallbackDate = new Date(selectedYear, selectedMonth, 1);
    return fallbackDate.toISOString().split("T")[0];
  }, [currentDate]);

  const realizedItems = React.useMemo(() => {
    const list: {
      id: string;
      name: string;
      budget: number;
      actual: number;
      date: string;
      categoryName: string;
      categoryColor: string;
    }[] = [];

    // Needs
    if (data.needs?.items) {
      data.needs.items.forEach((item) => {
        if ((item.actual || 0) > 0) {
          list.push({
            id: item.id,
            name: item.name || "Tanpa Nama",
            budget: item.budget || 0,
            actual: item.actual,
            date: item.date || defaultDate,
            categoryName: data.needs?.name || "Kebutuhan Pokok",
            categoryColor: CATEGORY_COLORS.needs,
          });
        }
      });
    }

    // Savings
    if (data.savings?.items) {
      data.savings.items.forEach((item) => {
        if ((item.actual || 0) > 0) {
          list.push({
            id: item.id,
            name: item.name || "Tanpa Nama",
            budget: item.budget || 0,
            actual: item.actual,
            date: item.date || defaultDate,
            categoryName: data.savings?.name || "Tabungan & Investasi",
            categoryColor: CATEGORY_COLORS.savings,
          });
        }
      });
    }

    // Debt
    if (data.debt?.items) {
      data.debt.items.forEach((item) => {
        if ((item.actual || 0) > 0) {
          list.push({
            id: item.id,
            name: item.name || "Tanpa Nama",
            budget: item.budget || 0,
            actual: item.actual,
            date: item.date || defaultDate,
            categoryName: data.debt?.name || "Hutang & Cicilan",
            categoryColor: CATEGORY_COLORS.debt,
          });
        }
      });
    }

    // Custom categories
    if (data.custom) {
      data.custom.forEach((cat, idx) => {
        const color =
          CATEGORY_COLORS.extra[idx % CATEGORY_COLORS.extra.length];
        if (cat.items) {
          cat.items.forEach((item) => {
            if ((item.actual || 0) > 0) {
              list.push({
                id: item.id,
                name: item.name || "Tanpa Nama",
                budget: item.budget || 0,
                actual: item.actual,
                date: item.date || defaultDate,
                categoryName: cat.name,
                categoryColor: color,
              });
            }
          });
        }
      });
    }

    // Others items
    if (data.others?.items) {
      data.others.items.forEach((item) => {
        if ((item.actual || 0) > 0) {
          list.push({
            id: item.id,
            name: item.name || "Tanpa Nama",
            budget: 0,
            actual: item.actual,
            date: item.date || defaultDate,
            categoryName: "Lain-lain",
            categoryColor: CATEGORY_COLORS.others,
          });
        }
      });
    }

    return list;
  }, [data, defaultDate]);

  const uniqueCategories = React.useMemo(() => {
    const cats = new Set<string>();
    realizedItems.forEach((item) => cats.add(item.categoryName));
    return Array.from(cats);
  }, [realizedItems]);

  const filteredAndSortedHistory = React.useMemo(() => {
    let result = [...realizedItems];

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
      );
    }

    if (historyCategoryFilter !== "all") {
      result = result.filter(
        (item) => item.categoryName === historyCategoryFilter
      );
    }

    result.sort((a, b) => {
      if (historySortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (historySortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (historySortBy === "amount-desc") {
        return b.actual - a.actual;
      }
      if (historySortBy === "amount-asc") {
        return a.actual - b.actual;
      }
      return 0;
    });

    return result;
  }, [realizedItems, historySearch, historyCategoryFilter, historySortBy]);

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const totalRealized = realizedItems.reduce((acc, curr) => acc + curr.actual, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards for Realized History */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-slate-900/30">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Total Realisasi
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {formatRupiah(totalRealized, isPrivacy)}
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-slate-900/30">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Item Terealisasi
          </p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">
            {realizedItems.length} <span className="text-xs text-slate-500 font-bold">Item</span>
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-slate-900/30">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Pos Aktif
          </p>
          <p className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
            {uniqueCategories.length} <span className="text-xs text-slate-500 font-bold">Pos</span>
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-6 sm:p-8 hover:shadow-2xl hover:border-white/20 transition-all">
        {/* Header with Search and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
                RIWAYAT REALISASI (AKTUAL)
              </h3>
              <p className="text-slate-400 text-[9px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">
                Melihat semua item anggaran yang telah direalisasikan (Aktual &gt; Rp 0)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Cari item..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 sm:py-2.5 text-xs text-white">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={historySortBy}
                onChange={(e: any) => setHistorySortBy(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="date-desc" className="bg-slate-900 text-white">
                  Tanggal Terbaru
                </option>
                <option value="date-asc" className="bg-slate-900 text-white">
                  Tanggal Terlama
                </option>
                <option value="amount-desc" className="bg-slate-900 text-white">
                  Realisasi Tertinggi
                </option>
                <option value="amount-asc" className="bg-slate-900 text-white">
                  Realisasi Terendah
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Horizontal Pills */}
        {uniqueCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-thin scrollbar-thumb-slate-800 border-b border-white/5">
            <button
              onClick={() => setHistoryCategoryFilter("all")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                historyCategoryFilter === "all"
                  ? "bg-white text-slate-950 border-white shadow-lg"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              Semua Pos ({realizedItems.length})
            </button>
            {uniqueCategories.map((catName) => {
              const count = realizedItems.filter(
                (item) => item.categoryName === catName
              ).length;
              const color =
                realizedItems.find((item) => item.categoryName === catName)
                  ?.categoryColor || "#ffffff";
              const isSelected = historyCategoryFilter === catName;
              return (
                <button
                  key={catName}
                  onClick={() => setHistoryCategoryFilter(catName)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border flex items-center gap-2 ${
                    isSelected
                      ? "bg-white text-slate-950 border-white shadow-lg"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {catName} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Realization Table */}
        {filteredAndSortedHistory.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-[1.5rem] bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-slate-800/50 text-slate-500 rounded-full">
              <History size={32} />
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base">
                Tidak ada data realisasi
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {realizedItems.length === 0
                  ? "Belum ada item anggaran dengan pengeluaran aktual di atas Rp 0"
                  : "Coba ubah kata kunci pencarian atau filter kategori Anda"}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] bg-slate-900/30 border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] uppercase tracking-wider font-black text-slate-500">
                    <th className="p-4 sm:p-5">Tanggal</th>
                    <th className="p-4 sm:p-5">Nama Item</th>
                    <th className="p-4 sm:p-5">Pos Anggaran</th>
                    <th className="p-4 sm:p-5 text-right">Rencana Anggaran</th>
                    <th className="p-4 sm:p-5 text-right">Realisasi Aktual</th>
                    <th className="p-4 sm:p-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredAndSortedHistory.map((item) => {
                    const isOver = item.budget > 0 && item.actual > item.budget;
                    const isSaving = item.budget > 0 && item.actual < item.budget;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        {/* Tanggal */}
                        <td className="p-4 sm:p-5 font-medium text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            {formatDateIndo(item.date)}
                          </div>
                        </td>

                        {/* Nama Item */}
                        <td className="p-4 sm:p-5 font-black text-white capitalize max-w-[200px] truncate">
                          {item.name}
                        </td>

                        {/* Pos Anggaran */}
                        <td className="p-4 sm:p-5 whitespace-nowrap">
                          <span
                            className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border"
                            style={{
                              color: item.categoryColor,
                              borderColor: `${item.categoryColor}33`,
                              backgroundColor: `${item.categoryColor}10`,
                            }}
                          >
                            {item.categoryName}
                          </span>
                        </td>

                        {/* Rencana Anggaran */}
                        <td className="p-4 sm:p-5 text-right font-bold text-slate-400 whitespace-nowrap">
                          {item.budget > 0 ? (
                            formatRupiah(item.budget, isPrivacy)
                          ) : (
                            <span className="text-slate-600 text-[10px] uppercase font-black tracking-widest">
                              -
                            </span>
                          )}
                        </td>

                        {/* Realisasi Aktual */}
                        <td className="p-4 sm:p-5 text-right font-black text-white whitespace-nowrap">
                          {formatRupiah(item.actual, isPrivacy)}
                        </td>

                        {/* Status */}
                        <td className="p-4 sm:p-5 text-center whitespace-nowrap">
                          {item.budget > 0 ? (
                            isOver ? (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                Overbudget
                              </span>
                            ) : isSaving ? (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Hemat
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                Pas
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
                              Lainnya
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
