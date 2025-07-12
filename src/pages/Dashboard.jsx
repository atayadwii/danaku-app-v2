import React, { useEffect, useState } from "react";
import { CaretDown, Wallet, User, TrendDown } from "phosphor-react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Logo from "../components/Logo";

const Dashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState({});
  const [savingsPockets, setSavingsPockets] = useState([]);
  const [inputAmounts, setInputAmounts] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true); // Mempertahankan loading untuk data awal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || "");
  const [editCurrency, setEditCurrency] = useState("IDR");
  // --- Fungsionalitas Tambahan untuk Halaman Info Akun ---
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- State untuk Manajemen Transaksi ---
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);


  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const apiKey = "040775243839bfac3a492f847d2f4e26"; // Pastikan API Key ini valid dan aman

        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=id&appid=${apiKey}`);
          const data = await res.json();
          setWeatherData(data);
          setWeatherLoading(false);
        } catch (err) {
          console.error("Gagal ambil cuaca:", err);
          setWeatherError("Gagal mengambil data cuaca.");
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
  const [newTransaction, setNewTransaction] = useState({
    type: 'pengeluaran',
    category: '',
    amount: '',
    date: ''
  });
  const [newPocket, setNewPocket] = useState({
    name: '',
    target: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchData(currentUser);
        setLoading(false); // Set loading ke false setelah data diambil
      } else {
        window.location.href = "/login";
      }
    });
    fetchWeather();
    return () => unsubscribe();
  }, []);

  const fetchData = async (currentUser) => {
    const savingsSnap = await getDocs(collection(db, "users", currentUser.uid, "savings"));
    const savingsData = savingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSavingsPockets(savingsData);

    const transSnap = await getDocs(collection(db, "users", currentUser.uid, "transactions"));
    // Pastikan transaksi memiliki ID unik untuk manajemen
    const transData = transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTransactions(transData);
  };

  const handleInputChange = (index, value) => {
    setInputAmounts(prev => ({ ...prev, [index]: value }));
  };

const handleAddAmount = async (index) => {
  const rawInput = inputAmounts[index];
  const amount = parseFloat(rawInput);

  if (isNaN(amount) || rawInput === "") return;

  const pocket = savingsPockets[index];
  const current = pocket.currentAmount || 0;
  const updatedAmount = current + amount;

  await updateDoc(doc(db, "users", user.uid, "savings", pocket.id), {
    currentAmount: updatedAmount
  });

  await fetchData(user);
  setInputAmounts(prev => ({ ...prev, [index]: "" }));
};

  const handleDeletePocket = async (index) => {
    const pocket = savingsPockets[index];
    await deleteDoc(doc(db, "users", user.uid, "savings", pocket.id));
    await fetchData(user);
  };

  const handleLogout = () => {
    signOut(auth).then(() => window.location.href = "/login");
  };

  const totalBalance = transactions.reduce((acc, t) => acc + (t.type === "pemasukan" ? t.amount : -t.amount), 0);

  const largestExpense = () => {
    const expenses = transactions.filter(t => t.type === "pengeluaran");
    const grouped = expenses.reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
      return acc;
    }, {});
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return sorted.length ? { category: sorted[0][0], amount: sorted[0][1] } : { category: "Belum Ada", amount: 0 };
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.date) {
      alert("Semua kolom harus diisi.");
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        timestamp: new Date()
      });
      setNewTransaction({ type: 'pengeluaran', category: '', amount: '', date: '' });
      await fetchData(user);
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Gagal menambahkan transaksi.");
    }
  };

  const handleAddPocket = async (e) => {
    e.preventDefault();
    if (!newPocket.name || !newPocket.target) {
      alert("Semua kolom harus diisi.");
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "savings"), {
        ...newPocket,
        target: parseFloat(newPocket.target),
        currentAmount: 0
      });
      setNewPocket({ name: '', target: '' });
      await fetchData(user);
    } catch (error) {
      console.error("Error adding savings pocket: ", error);
      alert("Gagal menambahkan kantong tabungan.");
    }
  };
const handleSubtractAmount = async (index) => {
  const amount = parseFloat(inputAmounts[index]);
  if (isNaN(amount) || amount <= 0) return;

  const pocket = savingsPockets[index];
  const updatedAmount = (pocket.currentAmount || 0) - amount;

  if (updatedAmount < 0) {
    alert("Jumlah tidak boleh kurang dari 0");
    return;
  }

  await updateDoc(doc(db, "users", user.uid, "savings", pocket.id), {
    currentAmount: updatedAmount
  });

  await fetchData(user);
  setInputAmounts(prev => ({ ...prev, [index]: "" }));
};
  // Fungsi untuk menghapus transaksi yang dipilih
  const executeDeleteSelectedTransactions = async () => {
    // Filter out any invalid IDs before proceeding
    const validSelectedIds = selectedTransactions.filter(id => typeof id === 'string' && id.length > 0);

    if (validSelectedIds.length === 0) {
      console.warn("Tidak ada transaksi valid yang dipilih untuk dihapus.");
      setIsConfirmDeleteOpen(false);
      return;
    }

    console.log("Mencoba menghapus transaksi dengan ID:", validSelectedIds);

    try {
      await Promise.all(
        validSelectedIds.map((id) =>
          deleteDoc(doc(db, "users", user.uid, "transactions", id))
        )
      );
      console.log(`Berhasil menghapus ${validSelectedIds.length} transaksi.`);
      await fetchData(user);
      setSelectedTransactions([]);
      setIsManageModalOpen(false);
      setIsConfirmDeleteOpen(false); // Tutup modal konfirmasi
    } catch (error) {
      console.error("Error menghapus transaksi yang dipilih:", error);
      alert("Gagal menghapus transaksi. Silakan coba lagi.");
      setIsConfirmDeleteOpen(false);
    }
  };


  if (loading) {
    return <p className="text-center mt-10">Memuat...</p>;
  }

  const welcomeMessage = user.displayName ? `Hai, ${user.displayName}! ✨` : "Hai! Selamat datang kembali! ✨";
  const weatherIcon = weatherData ? `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png` : null;

  return (
    <main className="bg-gradient-to-br from-[#fef9f9] via-[#f5faff] to-[#e6f0ff] text-gray-800 min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo / App Title */}
          <button onClick={() => setActivePage("dashboard")}>
            <Logo />
          </button>

          {/* Navigation */}
          <nav>
            <ul className="flex space-x-4 items-center text-sm sm:text-base font-medium">
              {/* Dashboard */}
              <li>
                <button
                  onClick={() => setActivePage("dashboard")}
                  className="hover:text-blue-500"
                >
                  Dashboard
                </button>
              </li>

              {/* Dropdown: Kelola Uang */}
              <li className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="hover:text-blue-500 flex items-center"
                >
                  <Wallet size={28} className="mr-1 text-blue-700" />
                  <CaretDown size={15} weight="fill" className="text-blue-700" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                    <button
                      onClick={() => {
                        setActivePage("transactions");
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Transaksi
                    </button>
                    <button
                      onClick={() => {
                        setActivePage("savings");
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Tabungan
                    </button>
                  </div>
                )}
              </li>

              {/* Account Icon */}
              <li>
                <button
                  onClick={() => setIsAccountPopupOpen(true)}
                  className="hover:text-blue-500"
                >
                  <User size={28} color="#0056d6" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* === Halaman Dashboard === */}
      {activePage === "dashboard" && (
        <section className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{welcomeMessage}</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Mari hemat dan atur keuanganmu dengan cerdas 🌟</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="card-glass p-6 rounded-xl shadow-md text-center">
              <Wallet size={48} className="text-blue-600 mb-2 mx-auto" /> {/* Menggunakan komponen Phosphor */}
              <p className="text-base sm:text-lg text-gray-600">Total Uang Dimiliki</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-800">Rp {totalBalance.toLocaleString("id-ID")}</p>
            </div>
            <div className="card-glass p-6 rounded-xl shadow-md text-center">
              <TrendDown size={48} className="text-red-500 mb-2 mx-auto" /> {/* Menggunakan komponen Phosphor */}
              <p className="text-base sm:text-lg text-gray-600">Pengeluaran Terbesar</p>
              <p className="text-xl font-semibold text-red-600">{largestExpense().category}</p>
              <p className="text-lg text-red-500">Rp {largestExpense().amount.toLocaleString("id-ID")}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3">🎁 Kantong Tabungan Anda</h3>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {savingsPockets.map((pocket, index) => {
    const percent = Math.round((pocket.currentAmount / pocket.target) * 100);
    return (
      <div key={pocket.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-lg text-blue-700">{pocket.name}</h4>
          <div className="space-x-2">
            <button
              onClick={() => handleAddAmount(index)}
              className="text-green-600 font-bold text-xl"
              title="Tambah Dana"
            >
              +
            </button>
            <button
              onClick={() => handleSubtractAmount(index)}
              className="text-yellow-500 font-bold text-xl"
              title="Kurangi Dana"
            >
              −
            </button>
            <button
              onClick={() => handleDeletePocket(index)}
              className="text-red-500 font-bold text-xl"
              title="Hapus Kantong"
            >
              ×
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Target: <strong>Rp {pocket.target.toLocaleString("id-ID")}</strong>
        </p>
        <p className="text-sm text-green-600">
          Terkumpul: <strong>Rp {pocket.currentAmount.toLocaleString("id-ID") || 0}</strong>
        </p>
        <input
          type="number"
          placeholder="Tambah/Kurangi dana"
          className="mt-2 w-full p-2 border border-gray-300 rounded"
          onChange={(e) => handleInputChange(index, e.target.value)}
          value={inputAmounts[index] || ""}
        />
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-2">
          <div className="bg-green-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
        </div>
        <p className="text-xs text-right text-gray-500 mt-1">{percent}% tercapai</p>
      </div>
    );
  })}
</div>
          </div>
          <div className="mt-10">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">📋 Transaksi Terbaru</h3>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-blue-50 text-gray-600">
                  <tr>
                    <th className="py-3 px-5">Tanggal</th>
                    <th className="py-3 px-5">Jenis</th>
                    <th className="py-3 px-5">Kategori</th>
                    <th className="py-3 px-5">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-4 text-gray-500">Belum ada transaksi.</td></tr>
                  ) : (
                    transactions.slice(-5).reverse().map((t, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 text-sm">{t.date}</td>
                        <td className={`px-6 py-4 text-sm ${t.type === "pengeluaran" ? "text-red-600" : "text-green-600"}`}>{t.type}</td>
                        <td className="px-6 py-4 text-sm">{t.category}</td>
                        <td className="px-6 py-4 text-sm">{t.amount.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* === Halaman Transaksi === */}
      {activePage === "transactions" && (
        <section id="transactions-section" className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">💸 Catat Transaksi</h2>
          <form id="transaction-form" className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddTransaction}>
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
              <label htmlFor="transaction-amount" className="text-sm font-medium text-gray-600">Jumlah (Rp)</label>
              <input
                type="number"
                id="transaction-amount"
                required
                placeholder="Contoh: 50000"
                className="mt-1 block w-full p-3 border rounded-lg"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
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
                    <th className="py-3 px-5">Jumlah (Rp)</th>
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
                        <td className="px-6 py-4 text-sm">{t.amount.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* === Halaman Tabungan === */}
      {activePage === "savings" && (
        <section id="savings-section" className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">🏦 Kelola Tabungan</h2>
          <form id="savings-pocket-form" className="grid gap-4 sm:grid-cols-2 mb-6" onSubmit={handleAddPocket}>
            <div>
              <label htmlFor="pocket-name" className="text-sm font-medium text-gray-600">Nama Kantong</label>
              <input
                type="text"
                id="pocket-name"
                required
                placeholder="Contoh: Beli Laptop"
                className="mt-1 block w-full p-3 border rounded-lg"
                value={newPocket.name}
                onChange={(e) => setNewPocket({ ...newPocket, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pocket-target" className="text-sm font-medium text-gray-600">Target (Rp)</label>
              <input
                type="number"
                id="pocket-target"
                required
                placeholder="Contoh: 5000000"
                className="mt-1 block w-full p-3 border rounded-lg"
                value={newPocket.target}
                onChange={(e) => setNewPocket({ ...newPocket, target: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition">
                Tambah Kantong Tabungan
              </button>
            </div>
          </form>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {savingsPockets.map((pocket, index) => {
    const percentRaw = (pocket.currentAmount / pocket.target) * 100;
    const percent = Math.max(0, Math.round(percentRaw)); // Cegah negatif di progress bar

    return (
      <div key={pocket.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-3">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-lg text-blue-700">{pocket.name}</h4>
          <div className="space-x-2">
            <button onClick={() => handleAddAmount(index)} className="text-green-600 font-bold text-xl">+</button>
            <button onClick={() => handleSubtractAmount(index)} className="text-yellow-600 font-bold text-xl">−</button>
            <button onClick={() => handleDeletePocket(index)} className="text-red-500 font-bold text-xl">×</button>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Target: <strong>Rp {pocket.target.toLocaleString("id-ID")}</strong>
        </p>
        <p className={`text-sm ${pocket.currentAmount < 0 ? "text-red-500" : "text-green-600"}`}>
          Terkumpul: <strong>Rp {pocket.currentAmount.toLocaleString("id-ID")}</strong>
        </p>

        <input
          type="number"
          placeholder="Jumlah dana"
          className="mt-2 w-full p-2 border border-gray-300 rounded"
          onChange={(e) => handleInputChange(index, e.target.value)}
          value={inputAmounts[index] || ""}
        />

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-2">
          <div
            className="bg-green-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <p className="text-xs text-right text-gray-500 mt-1">{percent}% tercapai</p>
      </div>
    );
  })}
</div>
        </section>
      )}

      {/* === Popup Info Akun === */}
{isAccountPopupOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative">

      {/* Tombol Tutup */}
      <button
        onClick={() => setIsAccountPopupOpen(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold"
        aria-label="Tutup"
      >
        &times;
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-blue-700">👤 Info Akun</h3>
        <p className="text-sm text-gray-500 mt-1">Lihat profil, saldo & cuaca</p>
      </div>

      {/* Info Akun */}
      <div className="bg-blue-50/50 rounded-xl p-4 text-center mb-4 shadow-inner">
        <p className="text-lg font-semibold text-gray-800">
          {user.displayName || "Pengguna Danaku"}
        </p>
        <p className="text-sm text-gray-600">{user.email}</p>
      </div>

      {/* Saldo */}
      <div className="bg-green-50 rounded-xl p-4 text-center mb-4 shadow-inner">
        <p className="text-sm text-gray-600 mb-1">Total Saldo</p>
        <p className="text-2xl font-bold text-green-700">
          Rp {totalBalance.toLocaleString("id-ID")}
        </p>
      </div>

      {/* Cuaca */}
      <div className="bg-gray-50 rounded-xl p-4 text-center shadow-inner mb-6">
        <h4 className="text-base font-semibold text-gray-700 mb-2">🌤️ Cuaca Sekarang</h4>
        {weatherLoading && <p className="text-sm text-gray-500">Memuat data cuaca...</p>}
        {weatherError && <p className="text-sm text-red-500">{weatherError}</p>}
        {weatherData && (
          <div className="flex flex-col items-center">
            <img src={weatherIcon} alt="ikon cuaca" className="w-14 h-14 mb-1" />
            <p className="text-sm font-medium text-gray-700 capitalize">
              {weatherData.weather[0].description}, {Math.round(weatherData.main.temp)}°C
            </p>
            <p className="text-xs text-gray-500">{weatherData.name}</p>
          </div>
        )}
      </div>

      {/* Tombol Edit Profil */}
      <button
        onClick={() => {
          setEditName(user.displayName || "");
          setIsEditProfileOpen(true);
          setIsAccountPopupOpen(false);
        }}
        className="w-full py-3 mb-3 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition"
      >
        ✏️ Edit Profil
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  </div>
)}
{isEditProfileOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative">
      
      {/* Tombol Tutup */}
      <button
        onClick={() => setIsEditProfileOpen(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold"
      >
        &times;
      </button>

      <h3 className="text-2xl font-bold text-blue-700 text-center mb-4">✏️ Edit Profil</h3>

      <div className="space-y-4">
        {/* Ganti Nama */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Nama Lengkap</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>

        {/* Ganti Mata Uang */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Mata Uang</label>
          <select
            className="w-full p-3 border rounded-lg"
            value={editCurrency}
            onChange={(e) => setEditCurrency(e.target.value)}
          >
            <option value="IDR">Rupiah (IDR)</option>
            <option value="USD">Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="JPY">Yen (JPY)</option>
            {/* bisa ditambah */}
          </select>
        </div>

        {/* Tombol Simpan */}
        <button
          onClick={async () => {
            try {
              await updateProfile(auth.currentUser, {
                displayName: editName
              });
              // Simpan currency ke Firestore (opsional)
              await updateDoc(doc(db, "users", user.uid), {
                currency: editCurrency
              });
              await fetchData(user);
              setIsEditProfileOpen(false);
              alert("Profil berhasil diperbarui!");
            } catch (err) {
              console.error("Gagal update profil", err);
              alert("Gagal menyimpan perubahan.");
            }
          }}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
)}
      {/* === Modal Kelola Transaksi === */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-lg relative max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Kelola Transaksi</h2>
            {/* Tombol tutup modal */}
            <button onClick={() => setIsManageModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold">
              &times;
            </button>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-blue-50 text-gray-600">
                  <tr>
                    <th className="py-3 px-5">
                      <input
                        type="checkbox"
                        // Pilih semua jika jumlah transaksi yang dipilih sama dengan total transaksi, dan ada transaksi
                        checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransactions(transactions.map((t) => t.id));
                          } else {
                            setSelectedTransactions([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-3 px-5">Tanggal</th>
                    <th className="py-3 px-5">Jenis</th>
                    <th className="py-3 px-5">Kategori</th>
                    <th className="py-3 px-5">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4 text-gray-500">Tidak ada transaksi untuk dikelola.</td></tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(t.id)}
                            onChange={() => {
                              setSelectedTransactions((prev) =>
                                prev.includes(t.id)
                                  ? prev.filter((id) => id !== t.id)
                                  : [...prev, t.id]
                              );
                            }}
                          />
                        </td>
                        <td className="px-5 py-3">{t.date}</td>
                        <td className={`px-5 py-3 ${t.type === "pengeluaran" ? "text-red-600" : "text-green-600"}`}>{t.type}</td>
                        <td className="px-5 py-3">{t.category}</td>
                        <td className="px-5 py-3">Rp {t.amount.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => {
                  if (selectedTransactions.length > 0) {
                    setIsConfirmDeleteOpen(true); // Membuka modal konfirmasi kustom
                  } else {
                    alert("Pilih setidaknya satu transaksi untuk dihapus."); // Menggunakan alert karena ini bukan konfirmasi utama
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
                disabled={selectedTransactions.length === 0} // Nonaktifkan jika tidak ada yang dipilih
              >
                Hapus Terpilih ({selectedTransactions.length})
              </button>
              <button
                onClick={() => {
                  setIsManageModalOpen(false);
                  setSelectedTransactions([]); // Reset pilihan saat batal
                }}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Konfirmasi Hapus Kustom === */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm mx-4 relative text-center">
            <h3 className="text-xl font-bold mb-4 text-blue-700">Konfirmasi Hapus</h3>
            <p className="mb-6 text-gray-700">Yakin ingin menghapus {selectedTransactions.length} transaksi yang dipilih?</p>
            <div className="flex justify-around space-x-4">
              <button
                onClick={executeDeleteSelectedTransactions}
                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition flex-1"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition flex-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
