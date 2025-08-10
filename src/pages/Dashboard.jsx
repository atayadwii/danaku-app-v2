import React, { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { CaretDown, Wallet, User, X, ArrowUp, ArrowDown } from "phosphor-react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, query, where, runTransaction, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';


// Import komponen halaman
import DashboardContent from "./DashboardContent";
import TransactionsPage from "./TransactionsPage";
import SavingsPage from "./SavingsPage";
import AccountPage from "./AccountPage";

// Helper untuk format angka dengan titik (pemisah ribuan)
const formatNumberWithDots = (num) => {
  if (num === null || num === undefined || num === '') return '';
  const number = parseFloat(num);
  if (isNaN(number)) return '';
  return number.toLocaleString('id-ID');
};

// Helper untuk membersihkan string berformat menjadi angka float
const parseNumberFromFormattedString = (str) => {
  if (str === null || str === undefined || str === '') return '';
  const cleanStr = String(str).replace(/\./g, '').replace(/,/g, '.');
  const number = parseFloat(cleanStr);
  return isNaN(number) ? '' : number;
};

// Helper untuk mendapatkan locale berdasarkan kode mata uang
const getLocaleForCurrency = (currencyCode) => {
  switch (currencyCode) {
    case 'IDR': return 'id-ID'; // Indonesia
    case 'EGP': return 'ar-EG'; // Mesir
    case 'GBP': return 'en-GB'; // Inggris
    case 'USD': return 'en-US'; // Amerika
    case 'EUR': return 'it-IT'; // Italia
    case 'MYR': return 'ms-MY'; // Malaysia
    case 'SAR': return 'ar-SA'; // Arab
    case 'SGD': return 'en-SG'; // Singapura
    case 'AUD': return 'en-AU'; // Australia
    case 'JPY': return 'ja-JP'; // Jepang
    default: return 'id-ID'; // Fallback
  }
};

// ====================================================================
// ============ KOMPONEN MODAL LAPORAN KEUANGAN DIMASUKKAN DI SINI ======
// ====================================================================
const ReportModal = ({ isOpen, onClose, wallet, transactions, formatCurrency }) => {
  if (!isOpen || !wallet) return null;

  const walletTransactions = transactions.filter(t => t.walletId === wallet.id);
  const totalIncome = walletTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = walletTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0);
  const netResult = totalIncome - totalExpense;

  const expenseByCategory = walletTransactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.keys(expenseByCategory).map(category => ({ name: category, value: expenseByCategory[category] }));
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold"><X size={24} /></button>
        <div className="text-center mb-6">
          <Wallet size={40} className="text-blue-600 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h2>
          <p className="text-lg font-semibold text-blue-700">{wallet.name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
          <div className="bg-green-50 p-4 rounded-xl"><ArrowUp size={24} className="text-green-600 mx-auto mb-1" /><p className="text-sm text-green-800">Total Pemasukan</p><p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome, wallet.currency)}</p></div>
          <div className="bg-red-50 p-4 rounded-xl"><ArrowDown size={24} className="text-red-600 mx-auto mb-1" /><p className="text-sm text-red-800">Total Pengeluaran</p><p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense, wallet.currency)}</p></div>
          <div className={`p-4 rounded-xl ${netResult >= 0 ? 'bg-blue-50' : 'bg-yellow-50'}`}><p className={`text-sm ${netResult >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>Hasil Akhir</p><p className={`text-xl font-bold ${netResult >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>{formatCurrency(netResult, wallet.currency)}</p></div>
        </div>
        {pieData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">Distribusi Pengeluaran</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value, wallet.currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Daftar Transaksi</h3>
          <div className="overflow-y-auto max-h-48 border rounded-lg">{walletTransactions.length > 0 ? (walletTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (<div key={t.id} className={`flex justify-between p-3 border-b ${t.type === 'pemasukan' ? 'bg-green-50' : 'bg-red-50'}`}><div><p className="font-semibold">{t.category}</p><p className="text-xs text-gray-500">{t.date} - {t.description || 'Tanpa keterangan'}</p></div><p className={`font-bold ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'pemasukan' ? '+' : '-'} {formatCurrency(t.amount, wallet.currency)}</p></div>))) : (<p className="text-center p-4 text-gray-500">Tidak ada transaksi di dompet ini.</p>)}</div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// =================== KOMPONEN UTAMA DASHBOARD =======================
// ====================================================================
const Dashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState({});
  const [savingsPockets, setSavingsPockets] = useState([]);
  const [inputAmounts, setInputAmounts] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // STATE BARU UNTUK MODAL LAPORAN & EDIT DOMPET
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedWalletForReport, setSelectedWalletForReport] = useState(null);
  const [isEditWalletModalOpen, setIsEditWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const apiKey = "040775243839bfac3a492f847d2f4e26";
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=id&appid=${apiKey}`);
          const data = await res.json();
          setWeatherData(data);
        } catch (err) {
          console.error("Gagal ambil cuaca:", err);
          setWeatherError("Gagal mengambil data cuaca.");
        } finally {
            setWeatherLoading(false);
        }
      }, () => {
        setWeatherError("Akses lokasi ditolak.");
        setWeatherLoading(false);
      });
    } else {
      setWeatherError("Geolocation tidak didukung.");
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocSnap = await getDocs(collection(db, "users"));
        let userDataFromFirestore = {};
        userDocSnap.forEach(doc => {
          if (doc.id === currentUser.uid) {
            userDataFromFirestore = doc.data();
          }
        });

        setUser({ ...currentUser, displayName: userDataFromFirestore.name || currentUser.displayName });
        setEditName(userDataFromFirestore.name || currentUser.displayName || "");

        const walletsUnsubscribe = onSnapshot(collection(db, "users", currentUser.uid, "wallets"), (snapshot) => {
            setWallets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        const savingsUnsubscribe = onSnapshot(collection(db, "users", currentUser.uid, "savings"), (snapshot) => {
            setSavingsPockets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const transactionsUnsubscribe = onSnapshot(collection(db, "users", currentUser.uid, "transactions"), (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        fetchWeather();
        
        return () => {
            walletsUnsubscribe();
            savingsUnsubscribe();
            transactionsUnsubscribe();
        };

      } else {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (index, value) => setInputAmounts(prev => ({ ...prev, [index]: value }));

  const handleAddAmount = async (index) => {
    const rawInput = inputAmounts[index];
    const amount = parseFloat(rawInput);
    if (isNaN(amount) || rawInput === "") return;
    const pocket = savingsPockets[index];
    const pocketRef = doc(db, "users", user.uid, "savings", pocket.id);
    try {
      await runTransaction(db, async (transaction) => {
        const pocketDoc = await transaction.get(pocketRef);
        if (!pocketDoc.exists()) throw new Error("Document does not exist!");
        const newAmount = (pocketDoc.data().currentAmount || 0) + amount;
        transaction.update(pocketRef, { currentAmount: newAmount });
      });
      setInputAmounts(prev => ({ ...prev, [index]: "" }));
    } catch (e) {
      console.error("Gagal menambah jumlah: ", e);
      alert(e.message);
    }
  };
  
  const handleSubtractAmount = async (index) => {
    const amount = parseFloat(inputAmounts[index]);
    if (isNaN(amount) || amount <= 0) return;
    const pocket = savingsPockets[index];
    const pocketRef = doc(db, "users", user.uid, "savings", pocket.id);
    try {
      await runTransaction(db, async (transaction) => {
        const pocketDoc = await transaction.get(pocketRef);
        if (!pocketDoc.exists()) throw new Error("Document does not exist!");
        const newAmount = (pocketDoc.data().currentAmount || 0) - amount;
        if (newAmount < 0) throw new Error("Jumlah tidak boleh kurang dari 0");
        transaction.update(pocketRef, { currentAmount: newAmount });
      });
      setInputAmounts(prev => ({ ...prev, [index]: "" }));
    } catch (e) {
      console.error("Gagal mengurangi jumlah: ", e);
      alert(e.message);
    }
  };

  const handleDeletePocket = async (index) => {
    const pocket = savingsPockets[index];
    await deleteDoc(doc(db, "users", user.uid, "savings", pocket.id));
  };

  const handleLogout = () => signOut(auth).then(() => window.location.href = "/login");

  const activeWallets = wallets.filter(wallet => !wallet.isArchived);
  const archivedWallets = wallets.filter(wallet => wallet.isArchived);
  const totalBalance = activeWallets.reduce((acc, wallet) => acc + wallet.balance, 0);

  const largestExpense = () => {
    const expenses = transactions.filter(t => t.type === "pengeluaran");
    const grouped = expenses.reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
      return acc;
    }, {});
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return sorted.length ? { category: sorted[0][0], amount: sorted[0][1] } : { category: "Belum Ada", amount: 0 };
  };

  const executeDeleteSelectedTransactions = async () => {
    const validSelectedIds = selectedTransactions.filter(id => typeof id === 'string' && id.length > 0);
    if (validSelectedIds.length === 0) {
      setIsConfirmDeleteOpen(false);
      return;
    }
    const transactionsToDelete = transactions.filter(t => validSelectedIds.includes(t.id));
    try {
      await runTransaction(db, async (transaction) => {
        const walletBalanceUpdates = {};
        for (const t of transactionsToDelete) {
          if (!walletBalanceUpdates[t.walletId]) {
            const walletRef = doc(db, "users", user.uid, "wallets", t.walletId);
            const walletDoc = await transaction.get(walletRef);
            if (walletDoc.exists()) {
              walletBalanceUpdates[t.walletId] = walletDoc.data().balance || 0;
            } else {
              continue;
            }
          }
          walletBalanceUpdates[t.walletId] += (t.type === 'pemasukan' ? -t.amount : t.amount);
        }
        for (const walletId in walletBalanceUpdates) {
          transaction.update(doc(db, "users", user.uid, "wallets", walletId), { balance: walletBalanceUpdates[walletId] });
        }
        for (const id of validSelectedIds) {
          transaction.delete(doc(db, "users", user.uid, "transactions", id));
        }
      });
      setSelectedTransactions([]);
      setIsManageModalOpen(false);
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error menghapus transaksi:", error);
      alert("Gagal menghapus transaksi.");
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleAddWallet = async (walletData) => {
    try {
      await addDoc(collection(db, "users", user.uid, "wallets"), { ...walletData, balance: 0, isArchived: false });
    } catch (error) {
      console.error("Error adding wallet: ", error);
      alert("Gagal menambahkan dompet.");
    }
  };
  
  const handleArchiveWallet = async (walletId, status) => {
    try {
      await updateDoc(doc(db, "users", user.uid, "wallets", walletId), { isArchived: status });
    } catch (error) {
      console.error("Gagal mengupdate status dompet:", error);
      alert("Gagal mengupdate status dompet.");
    }
  };
  
  const handleDeleteWallet = async (walletId) => {
    if (window.confirm("Yakin ingin menghapus dompet ini? Seluruh riwayat transaksi di dompet ini juga akan terhapus.")) {
      try {
        await runTransaction(db, async (transaction) => {
          const q = query(collection(db, "users", user.uid, "transactions"), where("walletId", "==", walletId));
          const transactionsSnap = await getDocs(q);
          transactionsSnap.forEach(tDoc => transaction.delete(tDoc.ref));
          transaction.delete(doc(db, "users", user.uid, "wallets", walletId));
        });
      } catch (error) {
        console.error("Error deleting wallet: ", error);
        alert("Gagal menghapus dompet.");
      }
    }
  };

  const handleUpdateProfile = async (newName) => {
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      await updateDoc(doc(db, "users", user.uid), { name: newName });
      setUser(prev => ({ ...prev, displayName: newName }));
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error("Gagal update profil:", err);
      alert("Gagal menyimpan perubahan profil.");
    }
  };
  
  const handleAddTransaction = async (newData) => {
    if (!newData.category || newData.amount === '' || !newData.date || !newData.walletId) {
      alert("Semua kolom harus diisi.");
      return;
    }
    const walletRef = doc(db, "users", user.uid, "wallets", newData.walletId);
    try {
      await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Dompet tidak ditemukan.");
        const currentBalance = walletDoc.data().balance || 0;
        const amount = parseFloat(newData.amount);
        const updatedBalance = currentBalance + (newData.type === 'pemasukan' ? amount : -amount);
        if (updatedBalance < 0) throw new Error("Saldo dompet tidak cukup.");
        
        transaction.update(walletRef, { balance: updatedBalance });
        transaction.set(doc(collection(db, "users", user.uid, "transactions")), { ...newData, amount, timestamp: new Date() });
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert(error.message);
    }
  };

  const handleAddPocket = async (newData) => {
    if (!newData.name || newData.target === '') {
      alert("Semua kolom harus diisi.");
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "savings"), { ...newData, target: parseFloat(newData.target), currentAmount: 0 });
    } catch (error) {
      console.error("Error adding savings pocket: ", error);
      alert("Gagal menambahkan kantong tabungan.");
    }
  };

  // FUNGSI BARU UNTUK MODAL
  const handleOpenReportModal = (wallet) => {
    setSelectedWalletForReport(wallet);
    setIsReportModalOpen(true);
  };
  const handleOpenEditWalletModal = (wallet) => {
    setEditingWallet(wallet);
    setIsEditWalletModalOpen(true);
  };
  const handleUpdateWalletName = async (newName) => {
    if (!editingWallet || !newName.trim()) {
      alert("Nama baru tidak boleh kosong.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid, "wallets", editingWallet.id), { name: newName });
      setEditingWallet(null);
      setIsEditWalletModalOpen(false);
    } catch (error) {
      console.error("Gagal mengubah nama dompet:", error);
      alert("Gagal mengubah nama dompet.");
    }
  };

  if (loading) return <p className="text-center mt-10">Memuat...</p>;

  const formatCurrency = (amount, currencyCode) => {
    if (typeof amount !== 'number') return '';
    return amount.toLocaleString(getLocaleForCurrency(currencyCode), { style: 'currency', currency: currencyCode });
  };
  
  const welcomeMessage = user.displayName ? `Hai, ${user.displayName}! ✨` : "Hai! Selamat datang kembali! ✨";
  
  return (
    <main className="bg-gradient-to-br from-[#fef9f9] via-[#f5faff] to-[#e6f0ff] text-gray-800 min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => setActivePage("dashboard")}><Logo /></button>
          <nav>
            <ul className="flex space-x-4 items-center text-sm sm:text-base font-medium">
              <li><button onClick={() => setActivePage("dashboard")} className="hover:text-blue-500">Dashboard</button></li>
              <li className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="hover:text-blue-500 flex items-center"><Wallet size={28} className="mr-1 text-blue-700" /><CaretDown size={15} weight="fill" className="text-blue-700" /></button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                    <button onClick={() => { setActivePage("transactions"); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Transaksi</button>
                    <button onClick={() => { setActivePage("savings"); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Tabungan</button>
                  </div>
                )}
              </li>
              <li><button onClick={() => setActivePage("account")} className="hover:text-blue-500"><User size={28} weight="fill" className="text-blue-700" /></button></li>
            </ul>
          </nav>
        </div>
      </header>

      {activePage === "dashboard" && <DashboardContent user={user} welcomeMessage={welcomeMessage} totalBalance={totalBalance} largestExpense={largestExpense} savingsPockets={savingsPockets} transactions={transactions} wallets={activeWallets} formatCurrency={formatCurrency} handleAddAmount={handleAddAmount} handleSubtractAmount={handleSubtractAmount} handleDeletePocket={handleDeletePocket} handleInputChange={handleInputChange} inputAmounts={inputAmounts} formatNumberWithDots={formatNumberWithDots} parseNumberFromFormattedString={parseNumberFromFormattedString}/>}
      {activePage === "transactions" && <TransactionsPage user={user} transactions={transactions} wallets={wallets} activeWallets={activeWallets} formatCurrency={formatCurrency} isManageModalOpen={isManageModalOpen} setIsManageModalOpen={setIsManageModalOpen} selectedTransactions={selectedTransactions} setSelectedTransactions={setSelectedTransactions} setIsConfirmDeleteOpen={setIsConfirmDeleteOpen} handleAddTransaction={handleAddTransaction} handleAddWallet={handleAddWallet} handleDeleteWallet={handleDeleteWallet} parseNumberFromFormattedString={parseNumberFromFormattedString} formatNumberWithDots={formatNumberWithDots}/>}
      {activePage === "savings" && <SavingsPage user={user} savingsPockets={savingsPockets} formatCurrency={formatCurrency} handleAddAmount={handleAddAmount} handleSubtractAmount={handleSubtractAmount} handleDeletePocket={handleDeletePocket} handleInputChange={handleInputChange} inputAmounts={inputAmounts} handleAddPocket={handleAddPocket} parseNumberFromFormattedString={parseNumberFromFormattedString} formatNumberWithDots={formatNumberWithDots}/>}
      {activePage === "account" && <AccountPage user={user} totalBalance={totalBalance} weatherData={weatherData} weatherLoading={weatherLoading} weatherError={weatherError} isEditProfileOpen={isEditProfileOpen} setIsEditProfileOpen={setIsEditProfileOpen} editName={editName} setEditName={setEditName} handleUpdateProfile={handleUpdateProfile} handleLogout={handleLogout} formatCurrency={formatCurrency} formatNumberWithDots={formatNumberWithDots} activeWallets={activeWallets} archivedWallets={archivedWallets} handleArchiveWallet={handleArchiveWallet} handleDeleteWallet={handleDeleteWallet} handleOpenReportModal={handleOpenReportModal} handleOpenEditWalletModal={handleOpenEditWalletModal}/>}

      {isManageModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"><div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-lg relative max-h-[80vh] overflow-y-auto"><h2 className="text-xl font-bold mb-4 text-blue-700">Kelola Transaksi</h2><button onClick={() => setIsManageModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button><div className="overflow-x-auto"><table className="min-w-full text-sm text-left"><thead className="bg-blue-50 text-gray-600"><tr><th className="py-3 px-5"><input type="checkbox" checked={selectedTransactions.length === transactions.length && transactions.length > 0} onChange={(e) => setSelectedTransactions(e.target.checked ? transactions.map((t) => t.id) : [])}/></th><th className="py-3 px-5">Tanggal</th><th className="py-3 px-5">Jenis</th><th className="py-3 px-5">Kategori</th><th className="py-3 px-5">Jumlah</th></tr></thead><tbody className="divide-y divide-gray-200 bg-white">{transactions.length === 0 ? (<tr><td colSpan="5" className="text-center py-4 text-gray-500">Tidak ada transaksi.</td></tr>) : (transactions.map((t) => { const wallet = wallets.find(w => w.id === t.walletId) || { currency: 'IDR' }; return (<tr key={t.id}><td className="px-5 py-3"><input type="checkbox" checked={selectedTransactions.includes(t.id)} onChange={() => setSelectedTransactions(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}/></td><td className="px-5 py-3">{t.date}</td><td className={`px-5 py-3 ${t.type === "pengeluaran" ? "text-red-600" : "text-green-600"}`}>{t.type}</td><td className="px-5 py-3">{t.category}</td><td className="px-5 py-3">{formatCurrency(t.amount, wallet.currency)}</td></tr>);}))}</tbody></table></div><div className="flex justify-between items-center mt-6"><button onClick={() => { if (selectedTransactions.length > 0) setIsConfirmDeleteOpen(true); else alert("Pilih transaksi untuk dihapus.");}} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition" disabled={selectedTransactions.length === 0}>Hapus ({selectedTransactions.length})</button><button onClick={() => setIsManageModalOpen(false)} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl transition">Batal</button></div></div></div>)}
      {isConfirmDeleteOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm mx-4 relative text-center"><h3 className="text-xl font-bold mb-4 text-blue-700">Konfirmasi Hapus</h3><p className="mb-6 text-gray-700">Yakin ingin menghapus {selectedTransactions.length} transaksi?</p><div className="flex justify-around space-x-4"><button onClick={executeDeleteSelectedTransactions} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition flex-1">Ya, Hapus</button><button onClick={() => setIsConfirmDeleteOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition flex-1">Batal</button></div></div></div>)}
      
      {/* MODAL BARU DIRENDER DI SINI */}
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} wallet={selectedWalletForReport} transactions={transactions} formatCurrency={formatCurrency}/>
      {isEditWalletModalOpen && editingWallet && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm mx-4"><h3 className="text-xl font-bold mb-4 text-blue-700">Ubah Nama Dompet</h3><input type="text" defaultValue={editingWallet.name} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateWalletName(e.target.value); }} className="w-full p-3 border rounded-lg mb-4" placeholder="Masukkan nama dompet baru" autoFocus/> <div className="flex justify-end space-x-3"><button onClick={() => setIsEditWalletModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300">Batal</button><button onClick={() => handleUpdateWalletName(document.querySelector('input[placeholder="Masukkan nama dompet baru"]').value)} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">Simpan</button></div></div></div>)}
    </main>
  );
};

export default Dashboard;