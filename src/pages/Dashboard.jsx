import React, { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { CaretDown, Wallet, User, TrendDown } from "phosphor-react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Import komponen halaman yang baru
import DashboardContent from "./DashboardContent";
import TransactionsPage from "./TransactionsPage";
import SavingsPage from "./SavingsPage";

// Helper untuk memformat angka dengan titik (pemisah ribuan)
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
    case 'EUR': return 'it-IT'; // Italia (juga Spanyol, dll.)
    case 'MYR': return 'ms-MY'; // Malaysia
    case 'SAR': return 'ar-SA'; // Arab (Saudi Arabia, umum)
    case 'SGD': return 'en-SG'; // Singapura
    // DIBENARKAN: Tambahkan 'return' di sini
    case 'AUD': return 'en-AU'; // Australia
    // DIBENARKAN: Tambahkan 'return' di sini
    case 'JPY': return 'ja-JP'; // Jepang (untuk Yen)
    default: return 'id-ID'; // Fallback
  }
};


const Dashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState({});
  const [savingsPockets, setSavingsPockets] = useState([]);
  const [inputAmounts, setInputAmounts] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCurrency, setEditCurrency] = useState("IDR");

  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        const apiKey = "040775243839bfac3a492f847d2f4e26";

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

        setUser({
          ...currentUser,
          displayName: userDataFromFirestore.name || currentUser.displayName,
          currency: userDataFromFirestore.currency || "IDR"
        });

        setEditName(userDataFromFirestore.name || currentUser.displayName || "");
        setEditCurrency(userDataFromFirestore.currency || "IDR");

        await fetchData(currentUser);
        setLoading(false);
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

  const executeDeleteSelectedTransactions = async () => {
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
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error menghapus transaksi yang dipilih:", error);
      alert("Gagal menghapus transaksi. Silakan coba lagi.");
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(auth.currentUser, {
        displayName: editName
      });

      await updateDoc(doc(db, "users", user.uid), {
        name: editName,
        currency: editCurrency
      });

      setUser(prevUser => ({
        ...prevUser,
        displayName: editName,
        currency: editCurrency
      }));

      setIsEditProfileOpen(false);
    } catch (err) {
      console.error("Gagal update profil:", err);
      alert("Gagal menyimpan perubahan profil.");
    }
  };

  const handleAddTransaction = async (newTransactionData) => {
    if (!newTransactionData.category || newTransactionData.amount === '' || !newTransactionData.date) {
      alert("Semua kolom harus diisi.");
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        ...newTransactionData,
        amount: parseFloat(newTransactionData.amount),
        timestamp: new Date()
      });
      await fetchData(user);
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Gagal menambahkan transaksi.");
    }
  };

  const handleAddPocket = async (newPocketData) => {
    if (!newPocketData.name || newPocketData.target === '') {
      alert("Semua kolom harus diisi.");
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "savings"), {
        ...newPocketData,
        target: parseFloat(newPocketData.target),
        currentAmount: 0
      });
      await fetchData(user);
    } catch (error) {
      console.error("Error adding savings pocket: ", error);
      alert("Gagal menambahkan kantong tabungan.");
    }
  };


  if (loading) {
    return <p className="text-center mt-10">Memuat...</p>;
  }

  const currentCurrency = user.currency || "IDR";
  const currencyLocale = getLocaleForCurrency(currentCurrency);

  const formatCurrency = (amount) => {
    return amount.toLocaleString(currencyLocale, { style: 'currency', currency: currentCurrency });
  };

  const welcomeMessage = user.displayName ? `Hai, ${user.displayName}! ✨` : "Hai! Selamat datang kembali! ✨";
  const weatherIcon = weatherData ? `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png` : null;

  return (
    <main className="bg-gradient-to-br from-[#fef9f9] via-[#f5faff] to-[#e6f0ff] text-gray-800 min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => setActivePage("dashboard")}>
            <Logo />
          </button>

          <nav>
            <ul className="flex space-x-4 items-center text-sm sm:text-base font-medium">
              <li>
                <button
                  onClick={() => setActivePage("dashboard")}
                  className="hover:text-blue-500"
                >
                  Dashboard
                </button>
              </li>

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

              <li>
                <button
                  onClick={() => setIsAccountPopupOpen(true)}
                  className="hover:text-blue-500"
                >
                  <User size={28} weight="fill" className="text-blue-700" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Render halaman aktif */}
      {activePage === "dashboard" && (
        <DashboardContent
          user={user}
          welcomeMessage={welcomeMessage}
          totalBalance={totalBalance}
          largestExpense={largestExpense}
          savingsPockets={savingsPockets}
          transactions={transactions}
          formatCurrency={formatCurrency}
          handleAddAmount={handleAddAmount}
          handleSubtractAmount={handleSubtractAmount}
          handleDeletePocket={handleDeletePocket}
          handleInputChange={handleInputChange}
          inputAmounts={inputAmounts}
          formatNumberWithDots={formatNumberWithDots}
          parseNumberFromFormattedString={parseNumberFromFormattedString}
        />
      )}

      {activePage === "transactions" && (
        <TransactionsPage
          user={user}
          transactions={transactions}
          fetchData={fetchData}
          formatCurrency={formatCurrency}
          isManageModalOpen={isManageModalOpen}
          setIsManageModalOpen={setIsManageModalOpen}
          selectedTransactions={selectedTransactions}
          setSelectedTransactions={setSelectedTransactions}
          setIsConfirmDeleteOpen={setIsConfirmDeleteOpen}
          handleAddTransaction={handleAddTransaction}
          parseNumberFromFormattedString={parseNumberFromFormattedString}
          formatNumberWithDots={formatNumberWithDots}
        />
      )}

      {activePage === "savings" && (
        <SavingsPage
          user={user}
          savingsPockets={savingsPockets}
          fetchData={fetchData}
          formatCurrency={formatCurrency}
          handleAddAmount={handleAddAmount}
          handleSubtractAmount={handleSubtractAmount}
          handleDeletePocket={handleDeletePocket}
          handleInputChange={handleInputChange}
          inputAmounts={inputAmounts}
          handleAddPocket={handleAddPocket}
          parseNumberFromFormattedString={parseNumberFromFormattedString}
          formatNumberWithDots={formatNumberWithDots}
        />
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
                {formatCurrency(totalBalance)}
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
                setEditCurrency(user.currency || "IDR");
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
                  <option value="EGP">Pound Mesir (EGP)</option>
                  <option value="GBP">Pound Sterling (GBP)</option>
                  <option value="USD">Dolar Amerika (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="MYR">Ringgit Malaysia (MYR)</option>
                  <option value="SAR">Riyal Saudi (SAR)</option>
                  <option value="SGD">Dolar Singapura (SGD)</option>
                  <option value="AUD">Dolar Australia (AUD)</option>
                  <option value="JPY">Yen Jepang (JPY)</option>
                </select>
              </div>

              {/* Tombol Simpan */}
              <button
                onClick={handleUpdateProfile}
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
                    <th className="py-3 px-5">Jumlah ({user.currency || 'IDR'})</th>
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
                        <td className="px-5 py-3">{formatCurrency(t.amount)}</td>
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
                    setIsConfirmDeleteOpen(true);
                  } else {
                    alert("Pilih setidaknya satu transaksi untuk dihapus.");
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
                disabled={selectedTransactions.length === 0}
              >
                Hapus Terpilih ({selectedTransactions.length})
              </button>
              <button
                onClick={() => {
                  setIsManageModalOpen(false);
                  setSelectedTransactions([]);
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