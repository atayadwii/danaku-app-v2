import React, { useState, useEffect, useRef } from "react";
import { Trash, Plus, CaretDown, CaretUp } from "phosphor-react";

// Komponen CustomSelect
const CustomSelect = ({ label, options, value, onChange, placeholder = "Pilih salah satu" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={selectRef}>
      {label && <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full p-3 border rounded-lg bg-white text-left"
      >
        <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
        </span>
        <CaretDown size={20} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <li key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className="p-3 text-gray-800 hover:bg-blue-50 cursor-pointer">
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


// KOMPONEN UTAMA: TransactionsPage
const TransactionsPage = ({ user, transactions, wallets, activeWallets, formatCurrency, isManageModalOpen, setIsManageModalOpen, selectedTransactions, setSelectedTransactions, setIsConfirmDeleteOpen, handleAddTransaction, handleAddWallet, handleDeleteWallet, parseNumberFromFormattedString, formatNumberWithDots }) => {
  
  const expenseCategories = ['Jajan', 'Kebutuhan', 'Gaya Hidup', 'Hutang'];
  const incomeCategories = ['Gajian'];

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState('all');

  const [newTransaction, setNewTransaction] = useState({
    type: 'pengeluaran',
    category: expenseCategories[0],
    description: '',
    amount: '',
    date: '',
    walletId: ''
  });

  useEffect(() => {
    // Set dompet default untuk form jika belum ada dan ada dompet aktif
    if (activeWallets && activeWallets.length > 0 && !newTransaction.walletId) {
      setNewTransaction(prev => ({ ...prev, walletId: activeWallets[0].id }));
    } else if (activeWallets && activeWallets.length === 0) {
      setNewTransaction(prev => ({ ...prev, walletId: '' }));
    }
  }, [activeWallets, newTransaction.walletId]);


  useEffect(() => {
    setNewTransaction(prev => ({
      ...prev,
      category: prev.type === 'pengeluaran' ? expenseCategories[0] : incomeCategories[0]
    }));
  }, [newTransaction.type]);


  const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', currency: 'IDR' });
  
  const currencyOptions = ['IDR', 'EGP', 'GBP', 'USD', 'EUR', 'IT-IT', 'MYR', 'SAR', 'SGD', 'AUD', 'JPY'];

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.category || newTransaction.amount === '' || !newTransaction.date || !newTransaction.walletId) {
      alert("Semua kolom (kecuali keterangan) harus diisi.");
      return;
    }
    await handleAddTransaction(newTransaction);
    setNewTransaction({ 
      type: 'pengeluaran', category: expenseCategories[0], description: '', 
      amount: '', date: '', walletId: activeWallets.length > 0 ? activeWallets[0].id : '' 
    });
    setIsFormVisible(false);
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

  const filteredTransactions = transactions.filter(t => {
    if (selectedWalletId === 'all') return true;
    return t.walletId === selectedWalletId;
  });

  return (
    <section id="transactions-section" className="container mx-auto px-4 sm:px-6 py-8">
      
      <div className="bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10 mb-8">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsFormVisible(!isFormVisible)}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">💸 Catat Transaksi</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => { e.stopPropagation(); setIsCreateWalletModalOpen(true); }}
              className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
              aria-label="Buat Dompet Baru"
            >
              <Plus size={24} weight="bold" />
            </button>
            {isFormVisible ? <CaretUp size={24} /> : <CaretDown size={24} />}
          </div>
        </div>
        
        {isFormVisible && (
          <form id="transaction-form" className="grid gap-4 sm:grid-cols-2 mt-6" onSubmit={handleSubmitTransaction}>
            <CustomSelect 
              label="Dompet" 
              value={newTransaction.walletId} 
              onChange={(value) => setNewTransaction({ ...newTransaction, walletId: value })} 
              options={activeWallets.map(wallet => ({
                value: wallet.id, 
                label: `${wallet.name} (${wallet.currency})` 
              }))} 
              placeholder="Pilih dompet aktif"
            />
            <CustomSelect 
              label="Jenis" 
              value={newTransaction.type} 
              onChange={(value) => setNewTransaction({ ...newTransaction, type: value })} 
              options={[{ value: 'pengeluaran', label: 'Pengeluaran' },{ value: 'pemasukan', label: 'Pemasukan' }]}
            />
            <CustomSelect 
              label="Kategori" 
              value={newTransaction.category} 
              onChange={(value) => setNewTransaction({ ...newTransaction, category: value })} 
              options={(newTransaction.type === 'pengeluaran' ? expenseCategories : incomeCategories).map(cat => ({ value: cat, label: cat }))}
            />
            <div>
              <label htmlFor="transaction-description" className="text-sm font-medium text-gray-600 mb-1 block">Keterangan (Opsional)</label>
              <input type="text" id="transaction-description" placeholder="Contoh: Beli nasi padang" className="mt-1 block w-full p-3 border rounded-lg" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}/>
            </div>
            <div>
              <label htmlFor="transaction-amount" className="text-sm font-medium text-gray-600 mb-1 block">Jumlah</label>
              <input type="text" id="transaction-amount" required placeholder={`Contoh: ${formatNumberWithDots(50000)}`} className="mt-1 block w-full p-3 border rounded-lg" value={formatNumberWithDots(newTransaction.amount)} onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseNumberFromFormattedString(e.target.value) })} onFocus={(e) => { e.target.value = newTransaction.amount === '' ? '' : String(newTransaction.amount); }} onBlur={(e) => { e.target.value = formatNumberWithDots(newTransaction.amount); }}/>
            </div>
            <div>
              <label htmlFor="transaction-date" className="text-sm font-medium text-gray-600 mb-1 block">Tanggal</label>
              <input type="date" id="transaction-date" required className="mt-1 block w-full p-3 border rounded-lg" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}/>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition" disabled={!activeWallets || activeWallets.length === 0}>
                Tambah Transaksi
              </button>
            </div>
          </form>
        )}
      </div>

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
                <label htmlFor="wallet-name" className="text-sm font-medium text-gray-600 mb-1 block">Nama Dompet</label>
                <input
                  type="text"
                  id="wallet-name"
                  className="w-full p-3 border rounded-lg"
                  value={newWallet.name}
                  onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                  required
                />
              </div>
              <CustomSelect
                label="Mata Uang Dompet"
                value={newWallet.currency}
                onChange={(value) => setNewWallet({ ...newWallet, currency: value })}
                options={currencyOptions.map(currency => ({
                  value: currency,
                  label: currency
                }))}
              />
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
      
      <div className="bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
            <h3 className="text-lg sm:text-xl font-semibold">📑 Riwayat Transaksi</h3>
            {isHistoryVisible ? <CaretUp size={24} /> : <CaretDown size={24} />}
        </div>

        {isHistoryVisible && (
            <div className="mt-4">
                <div className="flex flex-col sm:flex-row justify-end sm:items-center mb-4 gap-4">
                    <div className="w-full sm:w-48">
                        <CustomSelect
                            label=""
                            value={selectedWalletId}
                            onChange={(value) => setSelectedWalletId(value)}
                            options={[
                                { value: 'all', label: 'Semua Dompet' },
                                ...wallets.map(w => ({ 
                                    value: w.id, 
                                    label: `${w.name}${w.isArchived ? ' (Arsip)' : ''}` 
                                }))
                            ]}
                        />
                    </div>
                    <button
                        onClick={() => setIsManageModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                    >
                        Kelola
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-blue-50 text-gray-600">
                        <tr>
                            <th className="py-3 px-5">Tanggal</th><th className="py-3 px-5">Jenis</th><th className="py-3 px-5">Kategori</th>
                            <th className="py-3 px-5">Keterangan</th><th className="py-3 px-5">Jumlah</th><th className="py-3 px-5">Dompet</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredTransactions.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">
                                Tidak ada transaksi di dompet ini.
                            </td></tr>
                        ) : (
                            filteredTransactions
                            .slice()
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((t, i) => {
                                const wallet = wallets.find(w => w.id === t.walletId) || { currency: 'IDR', name: 'N/A' };
                                return (
                                <tr key={i}>
                                    <td className="px-6 py-4">{t.date}</td>
                                    <td className={`px-6 py-4 font-medium ${t.type === "pengeluaran" ? "text-red-600" : "text-green-600"}`}>{t.type}</td>
                                    <td className="px-6 py-4">{t.category}</td>
                                    <td className="px-6 py-4 text-gray-500">{t.description || '-'}</td>
                                    <td className="px-6 py-4 font-semibold">{formatCurrency(t.amount, wallet.currency)}</td>
                                    <td className="px-6 py-4">{wallet.name}</td>
                                </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};

export default TransactionsPage;