import React, { useState } from "react";

const TransactionsPage = ({ user, transactions, fetchData, formatCurrency, isManageModalOpen, setIsManageModalOpen, selectedTransactions, setSelectedTransactions, setIsConfirmDeleteOpen, handleAddTransaction, parseNumberFromFormattedString, formatNumberWithDots }) => {
  const [newTransaction, setNewTransaction] = useState({
    type: 'pengeluaran',
    category: '',
    amount: '',
    date: ''
  });

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.category || newTransaction.amount === '' || !newTransaction.date) {
      alert("Semua kolom harus diisi.");
      return;
    }
    await handleAddTransaction(newTransaction);
    setNewTransaction({ type: 'pengeluaran', category: '', amount: '', date: '' });
  };

  return (
    <section id="transactions-section" className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">💸 Catat Transaksi</h2>
      <form id="transaction-form" className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmitTransaction}>
        <div>
          <label htmlFor="transaction-type" className="text-sm font-medium text-gray-600">Jenis</label>
          <select
            id="transaction-type"
            className="mt-1 block w-full p-3 border rounded-lg"
            value={newTransaction.type}
            onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
          >
            <option value="pengeluaran">Pengeluaran</option>
            <option value="pemasukan">Pemasukan</option>
          </select>
        </div>
        <div>
          <label htmlFor="transaction-category" className="text-sm font-medium text-gray-600">Kategori</label>
          <input
            type="text"
            id="transaction-category"
            required
            placeholder="Contoh: Makan, Gaji"
            className="mt-1 block w-full p-3 border rounded-lg"
            value={newTransaction.category}
            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="transaction-amount" className="text-sm font-medium text-gray-600">Jumlah ({user.currency || 'IDR'})</label>
          <input
            type="text"
            id="transaction-amount"
            required
            placeholder={`Contoh: ${formatNumberWithDots(50000)}`}
            className="mt-1 block w-full p-3 border rounded-lg"
            value={formatNumberWithDots(newTransaction.amount)}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseNumberFromFormattedString(e.target.value) })}
            onFocus={(e) => {
              e.target.value = newTransaction.amount === '' ? '' : String(newTransaction.amount);
            }}
            onBlur={(e) => {
              e.target.value = formatNumberWithDots(newTransaction.amount);
            }}
          />
        </div>
        <div>
          <label htmlFor="transaction-date" className="text-sm font-medium text-gray-600">Tanggal</label>
          <input
            type="date"
            id="transaction-date"
            required
            className="mt-1 block w-full p-3 border rounded-lg"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
            Tambah Transaksi
          </button>
        </div>
      </form>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg sm:text-xl font-semibold">📑 Riwayat Transaksi</h3>
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Kelola Transaksi
          </button>
        </div>
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-blue-50 text-gray-600">
              <tr>
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Jenis</th>
                <th className="py-3 px-5">Kategori</th>
                <th className="py-3 px-5">Jumlah ({user.currency || 'IDR'})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-gray-500">Belum ada transaksi.</td></tr>
              ) : (
                transactions.slice().reverse().map((t, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm">{t.date}</td>
                    <td className={`px-6 py-4 text-sm ${t.type === "pengeluaran" ? "text-red-600" : "text-green-600"}`}>{t.type}</td>
                    <td className="px-6 py-4 text-sm">{t.category}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(t.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default TransactionsPage;