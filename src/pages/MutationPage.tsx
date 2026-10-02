import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionForm } from '../components/mutation/TransactionForm';

export const MutationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Input Transaksi & Mutasi Stok</h1>
        <p className="text-sm text-slate-400 mt-1">
          Catat Masuk, Pakai, atau Serah Terima. Satu transaksi bisa berisi banyak sparepart, masing-masing dengan kondisi
          baru / bekas / rusak.
        </p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800">
        <TransactionForm defaultType="Masuk" onSaved={() => navigate('/history')} />
      </div>
    </div>
  );
};
