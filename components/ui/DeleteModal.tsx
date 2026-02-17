import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-fadeIn flex flex-col max-h-[90vh]">
        
        <div className="overflow-y-auto p-6 sm:p-8 text-center custom-scrollbar">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-rose-500/10 p-4 rounded-full mb-4 animate-pulse">
              <AlertTriangle className="text-rose-500 w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">{title}</h3>
            <p className="text-slate-400 text-sm font-bold">Apakah Anda yakin ingin menghapus ini?</p>
          </div>

          <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 mb-8">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">Objek yang akan dihapus:</p>
            <p className="text-white font-black text-lg break-words leading-tight">"{itemName}"</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/40"
            >
              Ya, Hapus
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2 bg-slate-900/50 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default DeleteModal;