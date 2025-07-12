import React, { useState } from "react";
// DIBENARKAN: Tambahkan ikon Plus
import { Trash, Plus } from "phosphor-react";

const TransactionsPage = ({ user, transactions, wallets, fetchData, formatCurrency, isManageModalOpen, setIsManageModalOpen, selectedTransactions, setSelectedTransactions, setIsConfirmDeleteOpen, handleAddTransaction, handleAddWallet, handleDeleteWallet, parseNumberFromFormattedString, formatNumberWithDots }) => {
  const [newTransaction, setNewTransaction] = useState({
    type: 'pengeluaran',
    category: '',
    amount: '',
    date: '',
    walletId: wallets.length > 0 ? wallets[0].id : ''
  });

  const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: '',
    currency: 'IDR'
  });
  
  const currencyOptions = [
    'IDR', 'EGP', 'GBP', 'USD', 'EUR', 'IT-IT', 'MYR', 'SAR', 'SGD', 'AUD', 'JPY'
  ];

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.category || newTransaction.amount === '' || !newTransaction.date || !newTransaction.walletId) {
      alert("Semua kolom harus diisi.");
      return;
    }
    await handleAddTransaction(newTransaction);
    setNewTransaction({ type: 'pengeluaran', category: '', amount: '', date: '', walletId: wallets.length > 0 ? wallets[0].id : '' });
  };
  
  const handleSubmitNewWallet = async (e) => {
    e.preventDefault();
    if (!newWallet.name || !newWallet.currency) {
      alert("Nama dan mata uang dompet harus diisi.");
      return;
    }
    await handleAddWallet(newWallet);
    setNewWallet({ name: '', currency: 'IDR' });
    setIsCreateWalletModalOpen(false);
  };

  return (
    <section id="transactions-section" className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">💸 Catat Transaksi</h2>
        {/* DIBENARKAN: Ubah tombol menjadi ikon saja */}
        <button
          onClick={() => setIsCreateWalletModalOpen(true)}
          className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
          aria-label="Buat Dompet Baru"
        >
          <Plus size={24} weight="bold" />
        </button>
      </div>
      
      {!isManageModalOpen && wallets.length > 0 && (
        <form id="transaction-form" className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmitTransaction}>
          <div>
            <label htmlFor="transaction-wallet" className="text-sm font-medium text-gray-600">Dompet</label>
            <select
              id="transaction-wallet"
              className="mt-1 block w-full p-3 border rounded-lg"
              value={newTransaction.walletId}
              onChange={(e) => setNewTransaction({ ...newTransaction, walletId: e.target.value })}
              required
            >
              {wallets.length === 0 ? (
                <option value="" disabled>Buat dompet terlebih dahulu</option>
              ) : (
                wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({wallet.currency})
                  </option>
                ))
              )}
            </select>
          </div>

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
            <label htmlFor="transaction-amount" className="text-sm font-medium text-gray-600">Jumlah</label>
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
            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition" disabled={wallets.length === 0}>
              Tambah Transaksi
            </button>
          </div>
        </form>
      )}

      {isCreateWalletModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative">
            <button
              onClick={() => setIsCreateWalletModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold text-blue-700 text-center mb-4">Buat Dompet Baru</h3>
            <form onSubmit={handleSubmitNewWallet} className="space-y-4">
              <div>
                <label htmlFor="wallet-name" className="text-sm font-medium text-gray-600">Nama Dompet</label>
                <input
                  type="text"
                  id="wallet-name"
                  className="w-full p-3 border rounded-lg"
                  value={newWallet.name}
                  onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="wallet-currency" className="text-sm font-medium text-gray-600">Mata Uang Dompet</label>
                <select
                  id="wallet-currency"
                  className="w-full p-3 border rounded-lg"
                  value={newWallet.currency}
                  onChange={(e) => setNewWallet({ ...newWallet, currency: e.target.value })}
                  required
                >
                  {currencyOptions.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition"
              >
                Simpan Dompet
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h3 className="text-lg sm:text-xl font-semibold mb-3">👛 Dompet Anda</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              <p>Anda belum memiliki dompet. Buat dompet pertama Anda di atas!</p>
            </div>
          ) : (
            wallets.map(wallet => (
              <div key={wallet.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-blue-700">{wallet.name}</h4>
                  <button 
                    onClick={() => handleDeleteWallet(wallet.id)}
                    title="Hapus Dompet"
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Saldo: <strong className="text-base font-bold">{formatCurrency(wallet.balance, wallet.currency)}</strong>
                </p>
              </div>
            ))
          )}
        </div>
      </div>


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
                <th className="py-3 px-5">Jumlah</th>
                <th className="py-3 px-5">Dompet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">Belum ada transaksi.</td></tr>
              ) : (
                transactions.slice().reverse().map((t, i) => {
                  const wallet = wallets.find(w => w.id === t.walletId) || { currency: 'IDR', name: 'N/A' };
                  return (
                    <tr key={i}>
                      <td className="px-6 py-4 text-sm">{t.date}</td>
                      <td className={`px-6 py-4 text-sm ${t.type === "pengeluaran" ? "text-red-600" : "text-green-600"}`}>{t.type}</td>
                      <td className="px-6 py-4 text-sm">{t.category}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(t.amount, wallet.currency)}</td>
                      <td className="px-6 py-4 text-sm">{wallet.name}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default TransactionsPage;