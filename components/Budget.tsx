import React, { useState, useEffect } from "react";
import { BudgetData, BudgetItem } from "../types";
import CurrencyInput from "./ui/CurrencyInput";
import DeleteModal from "./ui/DeleteModal";
import { formatRupiah } from "../utils";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FolderPlus,
  X,
  Check,
  AlertTriangle,
  Pencil,
  BellRing,
  OctagonAlert,
  RefreshCw,
  Calendar,
  Sliders,
  Target,
  Layers,
  Sparkles,
} from "lucide-react";

interface BudgetProps {
  income: number;
  data: BudgetData;
  isPrivacy?: boolean;
  onChange: (data: BudgetData) => void;
  currentDate?: Date;
}

interface CategorySectionProps {
  title: string;
  items: BudgetItem[];
  limit?: number;
  colorHex: string;
  isPrivacy: boolean;
  onUpdateItems: (items: BudgetItem[]) => void;
  onRequestDeleteCategory: () => void;
  onRequestDeleteItem: (id: string, name: string) => void;
  onRenameCategory: (newName: string) => void;
  onUpdateLimit?: (newLimit?: number) => void;
  defaultExpanded?: boolean;
  canDelete?: boolean;
  canRename?: boolean;
  defaultDate?: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  items,
  limit,
  colorHex,
  isPrivacy,
  onUpdateItems,
  onRequestDeleteCategory,
  onRequestDeleteItem,
  onRenameCategory,
  onUpdateLimit,
  defaultExpanded = false,
  canDelete = true,
  canRename = true,
  defaultDate,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const isLimitMode = limit !== undefined && limit > 0;
  const sumItemBudget = items?.reduce((a, b) => a + (b.budget || 0), 0) || 0;
  const catTotalAllocated = isLimitMode ? limit : sumItemBudget;
  const catTotalActual = items?.reduce((a, b) => a + (b.actual || 0), 0) || 0;
  const isCatOver = catTotalActual > catTotalAllocated;
  const catRemaining = catTotalAllocated - catTotalActual;
  const catProgress =
    catTotalAllocated > 0 ? (catTotalActual / catTotalAllocated) * 100 : 0;

  const totalCount = items?.length || 0;
  const filledCount = isLimitMode
    ? items?.filter((item) => (item.actual || 0) > 0 && item.name?.trim()).length || 0
    : items?.filter((item) => (item.actual || 0) > 0).length || 0;

  const isIncomplete =
    !isLimitMode &&
    items?.some((item) => (item.budget || 0) > 0 && (item.actual || 0) === 0);

  const handleRename = () => {
    if (tempTitle.trim() && tempTitle !== title) {
      onRenameCategory(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      className={`glass-panel rounded-[2rem] overflow-hidden mb-6 transition-all duration-500 ${isCatOver ? "ring-2 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]" : "hover:shadow-2xl hover:border-white/20"}`}
      style={{ borderLeft: `6px solid ${colorHex}` }}
    >
      <div className="flex items-stretch border-b border-white/5">
        <div
          className="flex-1 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => !isEditingTitle && setExpanded(!expanded)}
        >
          <div
            className="p-3 rounded-2xl bg-slate-900 shadow-inner shrink-0"
            style={{ color: isCatOver ? "#F43F5E" : colorHex }}
          >
            {expanded ? (
              <ChevronUp size={20} className="sm:w-6 sm:h-6" />
            ) : (
              <ChevronDown size={20} className="sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isEditingTitle ? (
                <div
                  className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-indigo-500/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    autoFocus
                    className="bg-transparent border-none outline-none text-white font-black text-sm sm:text-lg uppercase px-2 w-40 sm:w-64"
                  />
                  <button
                    onClick={handleRename}
                    className="p-1 bg-indigo-600 rounded text-white"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <h4 className="font-black text-sm sm:text-lg text-white uppercase tracking-tighter truncate">
                    {title}
                  </h4>
                  {canRename && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 opacity-0 group-hover/title:opacity-100 transition-opacity"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 bg-slate-900 px-2 sm:px-3 py-1 rounded-full border border-slate-700 whitespace-nowrap uppercase">
                  {filledCount}/{totalCount} TERISI
                </span>
                {limit !== undefined && limit > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-black text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-500/40 whitespace-nowrap uppercase flex items-center gap-1">
                    <Target size={11} className="text-indigo-400" /> LIMIT KATEGORI
                  </span>
                )}
                {isCatOver && (
                  <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-white bg-rose-600 px-2.5 py-1 rounded-full border border-rose-400/50 animate-pulse whitespace-nowrap shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                    <BellRing size={10} /> ALARM OVERBUDGET
                  </span>
                )}
                {isIncomplete && !isCatOver && (
                  <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20 whitespace-nowrap">
                    <AlertTriangle size={10} /> BELUM LENGKAP
                  </span>
                )}
                {onUpdateLimit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLimitModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-2.5 py-1 rounded-full border border-indigo-500/30 transition-all ml-auto"
                  >
                    <Sliders size={10} />
                    {limit !== undefined && limit > 0 ? "EDIT LIMIT" : "+ ATUR LIMIT"}
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-white/5 pt-2">
              <span className="flex items-center gap-1.5">
                {limit !== undefined && limit > 0 ? "LIMIT:" : "BUDGET:"}{" "}
                <span className={limit !== undefined && limit > 0 ? "text-indigo-300 font-black" : "text-white"}>
                  {formatRupiah(catTotalAllocated, isPrivacy)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                AKTUAL:{" "}
                <span
                  className={
                    isCatOver ? "text-rose-400 font-black" : "text-emerald-400"
                  }
                >
                  {formatRupiah(catTotalActual, isPrivacy)}
                </span>
              </span>
              <span className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                SISA:{" "}
                <span
                  className={
                    catRemaining < 0
                      ? "text-rose-400"
                      : "text-emerald-400 font-black"
                  }
                >
                  {formatRupiah(catRemaining, isPrivacy)}
                </span>
              </span>
              <span className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                PROGRES:{" "}
                <span
                  className={isCatOver ? "text-rose-400" : "text-indigo-400"}
                >
                  {catProgress.toFixed(0)}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {canDelete && (
          <div className="flex items-center px-3 sm:px-4 bg-slate-950/20 border-l border-white/5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRequestDeleteCategory();
              }}
              className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-4 sm:p-8 bg-slate-950/40 space-y-4 animate-fadeIn">
          {isLimitMode && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-500/20 text-xs font-bold text-indigo-200 gap-2">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-400 shrink-0" />
                <span>Skema Limit Kategori: Pengeluaran langsung mengurangi Limit Anggaran.</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider bg-indigo-900/60 px-3 py-1 rounded-xl border border-indigo-500/30 text-indigo-300 font-black whitespace-nowrap">
                Sisa Limit: <span className={catRemaining < 0 ? "text-rose-400 font-black" : "text-emerald-400 font-black"}>{formatRupiah(catRemaining, isPrivacy)}</span>
              </div>
            </div>
          )}

          {(items || []).map((item) => {
            if (isLimitMode) {
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 items-end transition-all hover:border-white/10"
                >
                  <div className="col-span-2 md:col-span-5">
                    <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1 block mb-1.5">
                      Keterangan Pengeluaran
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        onUpdateItems(
                          items.map((i) =>
                            i.id === item.id ? { ...i, name: e.target.value } : i,
                          ),
                        )
                      }
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 sm:py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-sm shadow-inner transition-all duration-200"
                      placeholder="Contoh: Bensin, Belanja, Obat..."
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <CurrencyInput
                      label="Nominal Pengeluaran"
                      value={item.actual}
                      isPrivacy={isPrivacy}
                      onChange={(v) =>
                        onUpdateItems(
                          items.map((i) =>
                            i.id === item.id ? { ...i, actual: v, budget: 0 } : i,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1 block mb-1.5">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={item.date || ""}
                      onChange={(e) =>
                        onUpdateItems(
                          items.map((i) =>
                            i.id === item.id ? { ...i, date: e.target.value } : i,
                          ),
                        )
                      }
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 sm:py-3 px-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs sm:text-sm cursor-pointer uppercase text-center"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onRequestDeleteItem(item.id, item.name)}
                      className="p-3 text-slate-600 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            }

            const isItemOver = (item.actual || 0) > (item.budget || 0);
            return (
              <div
                key={item.id}
                className={`grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 p-4 bg-slate-900/60 rounded-2xl border ${isItemOver ? "border-rose-500/30 bg-rose-900/5" : "border-white/5"} items-end transition-all`}
              >
                <div className="col-span-2 md:col-span-4">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1 block mb-1.5">
                    Detail Item
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      onUpdateItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, name: e.target.value } : i,
                        ),
                      )
                    }
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 sm:py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-sm shadow-inner transition-all duration-200"
                    placeholder="Nama item..."
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <CurrencyInput
                    label="Budget"
                    value={item.budget}
                    isPrivacy={isPrivacy}
                    onChange={(v) =>
                      onUpdateItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, budget: v } : i,
                        ),
                      )
                    }
                  />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <CurrencyInput
                    label="Realisasi"
                    value={item.actual}
                    isPrivacy={isPrivacy}
                    onChange={(v) =>
                      onUpdateItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, actual: v } : i,
                        ),
                      )
                    }
                  />
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[8px] font-black uppercase text-slate-500">
                      SISA:{" "}
                      <span
                        className={
                          item.budget - item.actual < 0
                            ? "text-rose-400"
                            : "text-slate-400"
                        }
                      >
                        {formatRupiah(item.budget - item.actual, isPrivacy)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1 block mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={item.date || ""}
                    onChange={(e) =>
                      onUpdateItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, date: e.target.value } : i,
                        ),
                      )
                    }
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 sm:py-3 px-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs sm:text-sm cursor-pointer uppercase text-center"
                  />
                </div>
                <div className="col-span-1 md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRequestDeleteItem(item.id, item.name)}
                    className="p-3 text-slate-600 hover:text-rose-500"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() =>
              onUpdateItems([
                ...(items || []),
                {
                  id: Date.now().toString(),
                  name: "",
                  budget: 0,
                  actual: 0,
                  date: defaultDate || new Date().toISOString().split("T")[0],
                },
              ])
            }
            className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all hover:bg-slate-900/50"
          >
            <Plus size={16} /> {isLimitMode ? "TAMBAH PENGELUARAN" : "TAMBAH ITEM ANGGARAN"}
          </button>
        </div>
      )}

      {onUpdateLimit && (
        <EditLimitModal
          isOpen={isLimitModalOpen}
          categoryName={title}
          currentLimit={limit}
          onClose={() => setIsLimitModalOpen(false)}
          onSave={(newLimit) => {
            onUpdateLimit(newLimit);
          }}
          isPrivacy={isPrivacy}
        />
      )}
    </div>
  );
};

/* --- ADD CATEGORY MODAL --- */
const PRESET_CATEGORIES = [
  { name: "Pendidikan & Kursus", icon: "🎓" },
  { name: "Kesehatan & Obat", icon: "🏥" },
  { name: "Hobi & Rekreasi", icon: "🎯" },
  { name: "Anabul & Peliharaan", icon: "🐶" },
  { name: "Langganan & Digital", icon: "📱" },
  { name: "Transportasi & Bensin", icon: "🚗" },
  { name: "Belanja Bulanan", icon: "🛍️" },
  { name: "Bisnis / Sampingan", icon: "🛠️" },
];

const QUICK_LIMITS = [500000, 1000000, 2500000, 5000000, 10000000];

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (category: { name: string; limit?: number }) => void;
  isPrivacy?: boolean;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isPrivacy = false,
}) => {
  const [name, setName] = useState("");
  const [useLimit, setUseLimit] = useState(true);
  const [limit, setLimit] = useState<number>(1000000);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      limit: useLimit && limit > 0 ? limit : undefined,
    });
    setName("");
    setLimit(1000000);
    setUseLimit(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <FolderPlus size={24} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                Tambah Kategori Baru
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400">
                Pilih skema budgeting & limit sesuai kebutuhan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preset tags */}
          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 block">
              Pilihan Kategori Populer
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {PRESET_CATEGORIES.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => setName(preset.name)}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                    name === preset.name
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-300 border-slate-700/60 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5 block">
              Nama Kategori <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kesehatan, Hobi, Transportasi..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 uppercase"
            />
          </div>

          {/* Budgeting mode choice */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              Pilihan Skema Anggaran & Limit
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseLimit(true)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  useLimit
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target size={16} className={useLimit ? "text-indigo-400" : "text-slate-500"} />
                  <span className="text-xs font-black uppercase">Limit Total Kategori</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400">
                  Tetapkan batas maksimal anggaran total
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUseLimit(false)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                  !useLimit
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} className={!useLimit ? "text-indigo-400" : "text-slate-500"} />
                  <span className="text-xs font-black uppercase">Itemized Budget</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400">
                  Anggaran terakumulasi dari rincian item
                </span>
              </button>
            </div>
          </div>

          {/* Limit CurrencyInput if useLimit */}
          {useLimit && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 space-y-3 animate-fadeIn">
              <CurrencyInput
                label="Batas Limit Anggaran Kategori (Rp)"
                value={limit}
                isPrivacy={isPrivacy}
                onChange={(v) => setLimit(v)}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[9px] font-black uppercase text-slate-500 mr-1">Cepat:</span>
                {QUICK_LIMITS.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setLimit(q)}
                    className="text-[9px] font-black uppercase bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all"
                  >
                    {formatRupiah(q, false)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-black text-xs uppercase hover:bg-slate-700 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Check size={16} /> Simpan Kategori
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- EDIT LIMIT MODAL --- */
interface EditLimitModalProps {
  isOpen: boolean;
  categoryName: string;
  currentLimit?: number;
  onClose: () => void;
  onSave: (limit?: number) => void;
  isPrivacy?: boolean;
}

const EditLimitModal: React.FC<EditLimitModalProps> = ({
  isOpen,
  categoryName,
  currentLimit,
  onClose,
  onSave,
  isPrivacy = false,
}) => {
  const [limit, setLimit] = useState<number>(currentLimit || 0);
  const [hasLimit, setHasLimit] = useState<boolean>(currentLimit !== undefined && currentLimit > 0);

  useEffect(() => {
    setLimit(currentLimit || 0);
    setHasLimit(currentLimit !== undefined && currentLimit > 0);
  }, [currentLimit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(hasLimit && limit > 0 ? limit : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 border border-white/10 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Atur Limit Anggaran
              </h3>
              <p className="text-[10px] font-bold text-slate-400">
                Kategori: <span className="text-indigo-300">{categoryName}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs font-black text-white uppercase">Gunakan Limit Anggaran</span>
            <input
              type="checkbox"
              checked={hasLimit}
              onChange={(e) => {
                setHasLimit(e.target.checked);
                if (e.target.checked && limit === 0) setLimit(1000000);
              }}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {hasLimit && (
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/20">
              <CurrencyInput
                label="Batas Limit Anggaran (Rp)"
                value={limit}
                isPrivacy={isPrivacy}
                onChange={(v) => setLimit(v)}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_LIMITS.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setLimit(q)}
                    className="text-[9px] font-black uppercase bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-2 py-1 rounded transition-all"
                  >
                    {formatRupiah(q, false)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-black text-xs uppercase"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase hover:bg-indigo-500 transition-all flex items-center gap-1.5"
          >
            <Check size={16} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

const Budget: React.FC<BudgetProps> = ({
  income,
  data,
  isPrivacy = false,
  onChange,
  currentDate,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const CATEGORY_COLORS = {
    needs: "#6366F1",
    savings: "#10B981",
    debt: "#EF4444",
    others: "#A855F7",
    extra: ["#F59E0B", "#06B6D4", "#EC4899", "#14B8A6", "#F97316"],
  };

  const totalAlloc =
    (data.needs?.limit !== undefined && data.needs.limit > 0
      ? data.needs.limit
      : data.needs?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0) +
    (data.savings?.limit !== undefined && data.savings.limit > 0
      ? data.savings.limit
      : data.savings?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0) +
    (data.debt?.limit !== undefined && data.debt.limit > 0
      ? data.debt.limit
      : data.debt?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0) +
    (data.others?.allocation || 0) +
    (data.custom?.reduce((a, c) => {
      const alloc =
        c.limit !== undefined && c.limit > 0
          ? c.limit
          : c.items.reduce((ia, ii) => ia + (ii.budget || 0), 0);
      return a + alloc;
    }, 0) || 0);

  const totalAct =
    (data.needs?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
    (data.savings?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
    (data.debt?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
    (data.others?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0) +
    (data.custom?.reduce(
      (a, c) => a + c.items.reduce((ia, ii) => ia + (ii.actual || 0), 0),
      0,
    ) || 0);

  const checkOver = (
    items: { actual: number; budget?: number }[] | undefined,
    limit?: number,
  ) => {
    if (limit !== undefined && limit > 0) {
      const act = items?.reduce((a, b) => a + (b.actual || 0), 0) || 0;
      return act > limit;
    }
    const alloc = items?.reduce((a, b) => a + (b.budget || 0), 0) || 0;
    const act = items?.reduce((a, b) => a + (b.actual || 0), 0) || 0;
    return act > alloc;
  };

  const isAnyOver =
    checkOver(data.needs?.items, data.needs?.limit) ||
    checkOver(data.savings?.items, data.savings?.limit) ||
    checkOver(data.debt?.items, data.debt?.limit) ||
    checkOver(data.others?.items, data.others?.allocation) ||
    data.custom?.some((c) => checkOver(c.items, c.limit)) ||
    false;

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const newData = { ...data };

    if (deleteTarget.type === "category") {
      const { categoryKey, id } = deleteTarget;
      if (categoryKey === "custom") {
        newData.custom = (data.custom || []).filter((c) => c.id !== id);
      } else if (categoryKey === "needs") {
        newData.needs = undefined;
      } else if (categoryKey === "savings") {
        newData.savings = undefined;
      } else if (categoryKey === "debt") {
        newData.debt = undefined;
      } else if (categoryKey === "others") {
        newData.others = undefined;
      }
      onChange(newData);
    } else {
      const { categoryKey, id } = deleteTarget;
      if (["needs", "savings", "debt"].includes(categoryKey)) {
        const cat = (data as any)[categoryKey];
        if (cat) {
          onChange({
            ...data,
            [categoryKey]: {
              ...cat,
              items: cat.items.filter((i: any) => i.id !== id),
            },
          });
        }
      } else if (categoryKey === "others-items") {
        if (data.others) {
          onChange({
            ...data,
            others: {
              ...data.others,
              items: data.others.items.filter((i) => i.id !== id),
            },
          });
        }
      } else {
        const updatedCustom = (data.custom || []).map((cat) =>
          cat.id === categoryKey
            ? { ...cat, items: cat.items.filter((i) => i.id !== id) }
            : cat,
        );
        onChange({ ...data, custom: updatedCustom });
      }
    }
    setDeleteTarget(null);
  };

  const restoreDefaults = () => {
    const newData = { ...data };
    if (!newData.needs) newData.needs = { items: [], name: "Kebutuhan Pokok" };
    if (!newData.savings)
      newData.savings = { items: [], name: "Tabungan & Investasi" };
    if (!newData.debt) newData.debt = { items: [], name: "Hutang & Cicilan" };
    if (!newData.others) newData.others = { allocation: 0, items: [] };
    onChange(newData);
  };

  const hasMissingDefaults =
    !data.needs || !data.savings || !data.debt || !data.others;

  const handleRenameFixed = (
    key: "needs" | "savings" | "debt",
    newName: string,
  ) => {
    const section = data[key];
    if (section) {
      onChange({ ...data, [key]: { ...section, name: newName } });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 border-indigo-600 shadow-xl">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">
            Net Income
          </p>
          <h3 className="text-sm sm:text-2xl font-black text-white tracking-tight">
            {formatRupiah(income, isPrivacy)}
          </h3>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 border-blue-500 shadow-xl">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">
            Anggaran
          </p>
          <h3 className="text-sm sm:text-2xl font-black text-white tracking-tight">
            {formatRupiah(totalAlloc, isPrivacy)}
          </h3>
        </div>
        <div className="glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 border-amber-500 shadow-xl">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">
            Realisasi
          </p>
          <h3 className="text-sm sm:text-2xl font-black text-amber-500 tracking-tight">
            {formatRupiah(totalAct, isPrivacy)}
          </h3>
        </div>
        <div
          className={`glass-panel p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-l-4 sm:border-l-8 shadow-xl ${income - totalAct < 0 ? "border-rose-600" : "border-emerald-600"}`}
        >
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">
            Sisa
          </p>
          <h3
            className={`text-sm sm:text-2xl font-black tracking-tight ${income - totalAct < 0 ? "text-rose-500" : "text-emerald-500"}`}
          >
            {formatRupiah(income - totalAct, isPrivacy)}
          </h3>
        </div>
      </div>

      {isAnyOver && (
        <div className="animate-bounce-slow mt-4">
          <div className="bg-gradient-to-r from-rose-600 to-rose-800 p-4 sm:p-5 rounded-[1.5rem] border border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.4)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                <OctagonAlert className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h4 className="text-white text-xs sm:text-base font-black uppercase tracking-tight">
                  Perhatian: Overbudget Terdeteksi!
                </h4>
                <p className="text-rose-100 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest">
                  Ada kategori yang melampaui batas anggaran yang telah
                  ditetapkan.
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <BellRing className="text-white/40 animate-pulse" size={32} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-b border-white/5 pb-6">
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <div className="w-2 h-6 sm:h-8 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          ALOKASI ANGGARAN
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {hasMissingDefaults && (
            <button
              onClick={restoreDefaults}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-slate-800/80 text-slate-400 border border-slate-700 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest transition-all hover:text-white hover:border-slate-500 shadow-lg"
            >
              <RefreshCw size={16} /> RESET KATEGORI
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black flex items-center justify-center gap-3 uppercase tracking-widest transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-600/30"
          >
            <FolderPlus size={16} /> TAMBAH KATEGORI
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.needs && (
          <CategorySection
            title={data.needs.name || "Kebutuhan Pokok"}
            items={data.needs.items}
            limit={data.needs.limit}
            colorHex={CATEGORY_COLORS.needs}
            isPrivacy={isPrivacy}
            onRenameCategory={(val) => handleRenameFixed("needs", val)}
            onUpdateLimit={(limit) =>
              onChange({ ...data, needs: { ...data.needs!, limit } })
            }
            onRequestDeleteCategory={() =>
              setDeleteTarget({
                type: "category",
                id: "needs",
                name: data.needs?.name || "Kebutuhan Pokok",
                categoryKey: "needs",
              })
            }
            onRequestDeleteItem={(id, name) =>
              setDeleteTarget({ type: "item", id, name, categoryKey: "needs" })
            }
            onUpdateItems={(i) =>
              onChange({ ...data, needs: { ...data.needs, items: i } })
            }
            canDelete={true}
            canRename={true}
            defaultDate={defaultDate}
          />
        )}

        {data.savings && (
          <CategorySection
            title={data.savings.name || "Tabungan & Investasi"}
            items={data.savings.items}
            limit={data.savings.limit}
            colorHex={CATEGORY_COLORS.savings}
            isPrivacy={isPrivacy}
            onRenameCategory={(val) => handleRenameFixed("savings", val)}
            onUpdateLimit={(limit) =>
              onChange({ ...data, savings: { ...data.savings!, limit } })
            }
            onRequestDeleteCategory={() =>
              setDeleteTarget({
                type: "category",
                id: "savings",
                name: data.savings?.name || "Tabungan & Investasi",
                categoryKey: "savings",
              })
            }
            onRequestDeleteItem={(id, name) =>
              setDeleteTarget({
                type: "item",
                id,
                name,
                categoryKey: "savings",
              })
            }
            onUpdateItems={(i) =>
              onChange({ ...data, savings: { ...data.savings, items: i } })
            }
            canDelete={true}
            canRename={true}
            defaultDate={defaultDate}
          />
        )}

        {data.debt && (
          <CategorySection
            title={data.debt.name || "Hutang & Cicilan"}
            items={data.debt.items}
            limit={data.debt.limit}
            colorHex={CATEGORY_COLORS.debt}
            isPrivacy={isPrivacy}
            onRenameCategory={(val) => handleRenameFixed("debt", val)}
            onUpdateLimit={(limit) =>
              onChange({ ...data, debt: { ...data.debt!, limit } })
            }
            onRequestDeleteCategory={() =>
              setDeleteTarget({
                type: "category",
                id: "debt",
                name: data.debt?.name || "Hutang & Cicilan",
                categoryKey: "debt",
              })
            }
            onRequestDeleteItem={(id, name) =>
              setDeleteTarget({ type: "item", id, name, categoryKey: "debt" })
            }
            onUpdateItems={(i) =>
              onChange({ ...data, debt: { ...data.debt, items: i } })
            }
            canDelete={true}
            canRename={true}
            defaultDate={defaultDate}
          />
        )}

        {(data.custom || []).map((cat, idx) => (
          <CategorySection
            key={cat.id}
            title={cat.name}
            items={cat.items}
            limit={cat.limit}
            colorHex={CATEGORY_COLORS.extra[idx % CATEGORY_COLORS.extra.length]}
            isPrivacy={isPrivacy}
            onRenameCategory={(newTitle) =>
              onChange({
                ...data,
                custom: data.custom!.map((c) =>
                  c.id === cat.id ? { ...c, name: newTitle } : c,
                ),
              })
            }
            onUpdateLimit={(newLimit) =>
              onChange({
                ...data,
                custom: data.custom!.map((c) =>
                  c.id === cat.id ? { ...c, limit: newLimit } : c,
                ),
              })
            }
            onRequestDeleteCategory={() =>
              setDeleteTarget({
                type: "category",
                id: cat.id,
                name: cat.name,
                categoryKey: "custom",
              })
            }
            onRequestDeleteItem={(id, name) =>
              setDeleteTarget({ type: "item", id, name, categoryKey: cat.id })
            }
            onUpdateItems={(i) =>
              onChange({
                ...data,
                custom: data.custom!.map((c) =>
                  c.id === cat.id ? { ...c, items: i } : c,
                ),
              })
            }
            defaultDate={defaultDate}
          />
        ))}

        {data.others && (
          <OthersSection
            data={data.others}
            isPrivacy={isPrivacy}
            onUpdate={(o) => onChange({ ...data, others: o })}
            onRequestDelete={() =>
              setDeleteTarget({
                type: "category",
                id: "others",
                name: "Lain-lain",
                categoryKey: "others",
              })
            }
            onRequestDeleteItem={(id, name) =>
              setDeleteTarget({
                type: "item",
                id,
                name,
                categoryKey: "others-items",
              })
            }
            defaultDate={defaultDate}
          />
        )}
      </div>

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isPrivacy={isPrivacy}
        onAdd={({ name, limit }) => {
          onChange({
            ...data,
            custom: [
              ...(data.custom || []),
              {
                id: Date.now().toString(),
                name,
                limit,
                items: [],
              },
            ],
          });
        }}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === "category" ? "Hapus Kategori" : "Hapus Item"
        }
        itemName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const OthersSection: React.FC<{
  data: any;
  isPrivacy: boolean;
  onUpdate: (d: any) => void;
  onRequestDelete: () => void;
  onRequestDeleteItem: (id: string, name: string) => void;
  defaultDate?: string;
}> = ({ data, isPrivacy, onUpdate, onRequestDelete, onRequestDeleteItem, defaultDate }) => {
  const [expanded, setExpanded] = useState(false);
  const totalAct =
    data.items?.reduce((a: any, b: any) => a + (b.actual || 0), 0) || 0;
  const totalAlloc = data.allocation || 0;
  const isOver = totalAct > totalAlloc;
  const remaining = totalAlloc - totalAct;
  const progress = totalAlloc > 0 ? (totalAct / totalAlloc) * 100 : 0;

  const itemsWithActual =
    data.items?.filter((item: any) => (item.actual || 0) > 0).length || 0;
  const totalItems = data.items?.length || 0;

  return (
    <div
      className={`glass-panel rounded-[2rem] overflow-hidden mb-6 transition-all ${isOver ? "ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]" : "hover:shadow-2xl"}`}
      style={{ borderLeft: "6px solid #8B5CF6" }}
    >
      <div className="flex items-stretch border-b border-white/5">
        <div
          className="flex-1 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="p-3 rounded-2xl bg-slate-900 text-[#8B5CF6] shrink-0">
            {expanded ? (
              <ChevronUp size={20} className="sm:w-6 sm:h-6" />
            ) : (
              <ChevronDown size={20} className="sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h4 className="font-black text-sm sm:text-lg text-white uppercase tracking-tighter">
                Lain-lain / Hiburan
              </h4>
              <div className="flex gap-2">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 bg-slate-900 px-2 sm:px-3 py-1 rounded-full border border-slate-700 uppercase">
                  {itemsWithActual}/{totalItems} TERISI
                </span>
                {isOver && (
                  <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-white bg-rose-600 px-2.5 py-1 rounded-full animate-pulse shadow-lg shadow-rose-900/40">
                    <BellRing size={10} /> ALARM
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest pt-2 border-t border-white/5">
              <span>
                LIMIT:{" "}
                <span className="text-white">
                  {formatRupiah(totalAlloc, isPrivacy)}
                </span>
              </span>
              <span>
                AKTUAL:{" "}
                <span className={isOver ? "text-rose-400" : "text-violet-400"}>
                  {formatRupiah(totalAct, isPrivacy)}
                </span>
              </span>
              <span className="border-l border-white/10 pl-3">
                SISA:{" "}
                <span
                  className={
                    remaining < 0
                      ? "text-rose-400"
                      : "text-emerald-400 font-black"
                  }
                >
                  {formatRupiah(remaining, isPrivacy)}
                </span>
              </span>
              <span className="border-l border-white/10 pl-3">
                PROGRES:{" "}
                <span className={isOver ? "text-rose-400" : "text-indigo-400"}>
                  {progress.toFixed(0)}%
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center px-3 sm:px-4 bg-slate-950/20 border-l border-white/5">
          <button
            type="button"
            onClick={onRequestDelete}
            className="p-3 text-slate-600 hover:text-rose-500"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-4 sm:p-8 bg-slate-950/40 space-y-6 animate-fadeIn">
          <CurrencyInput
            label="Limit Anggaran Hiburan"
            value={data.allocation}
            isPrivacy={isPrivacy}
            onChange={(v) => onUpdate({ ...data, allocation: v })}
          />
          <div className="space-y-4 pt-4 border-t border-white/5">
            {(data.items || []).map((item: any) => (
              <div
                key={item.id}
                className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 items-end transition-all"
              >
                <div className="col-span-2 md:col-span-6">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1 block mb-1.5">
                    Keterangan
                  </label>
                  <input
                    value={item.name}
                    onChange={(e) =>
                      onUpdate({
                        ...data,
                        items: data.items.map((i: any) =>
                          i.id === item.id ? { ...i, name: e.target.value } : i,
                        ),
                      })
                    }
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 sm:py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-sm shadow-inner transition-all duration-200"
                    placeholder="Misal: Bioskop..."
                  />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <CurrencyInput
                    label="Nominal"
                    value={item.actual}
                    isPrivacy={isPrivacy}
                    onChange={(v) =>
                      onUpdate({
                        ...data,
                        items: data.items.map((i: any) =>
                          i.id === item.id ? { ...i, actual: v } : i,
                        ),
                      })
                    }
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 font-bold pl-1 block mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={item.date || ""}
                    onChange={(e) =>
                      onUpdate({
                        ...data,
                        items: data.items.map((i: any) =>
                          i.id === item.id ? { ...i, date: e.target.value } : i,
                        ),
                      })
                    }
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 sm:py-3 px-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs sm:text-sm cursor-pointer uppercase text-center"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRequestDeleteItem(item.id, item.name)}
                    className="p-3 text-slate-600 hover:text-rose-500"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                ...data,
                items: [
                  ...(data.items || []),
                  {
                    id: Date.now().toString(),
                    name: "",
                    actual: 0,
                    date: defaultDate || new Date().toISOString().split("T")[0],
                  },
                ],
              })
            }
            className="w-full py-4 border-2 border-dashed border-violet-900/40 text-violet-400 bg-violet-900/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-900/10 transition-all"
          >
            <Plus size={16} /> TAMBAH PENGELUARAN
          </button>
        </div>
      )}
    </div>
  );
};

export default Budget;
