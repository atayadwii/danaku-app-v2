import React, { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { CaretDown, Wallet, User } from "phosphor-react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, query, where, runTransaction, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

// Import komponen halaman yang baru
import DashboardContent from "./DashboardContent";
import TransactionsPage from "./TransactionsPage";
import SavingsPage from "./SavingsPage";
import AccountPage from "./AccountPage";

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
    case 'AUD': return 'en-AU'; // Australia
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
        });

        setEditName(userDataFromFirestore.name || currentUser.displayName || "");

        const walletsUnsubscribe = onSnapshot(collection(db, "users", currentUser.uid, "wallets"), (snapshot) => {
            const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWallets(walletsData);
            setLoading(false);
        });

        const savingsUnsubscribe = onSnapshot(collection(db, "users", currentUser.uid, "savings"), (snapshot) => {
            const savingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavingsPockets(savingsData);
        });

        const transactionsUnsubscribe = onSnapshot(collection(db, "users", currentUser.uid, "transactions"), (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(transData);
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
  
  const fetchData = async (currentUser) => {
    const walletsSnap = await getDocs(collection(db, "users", currentUser.uid, "wallets"));
    const walletsData = walletsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWallets(walletsData);

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
    const pocketRef = doc(db, "users", user.uid, "savings", pocket.id);

    try {
      await runTransaction(db, async (transaction) => {
        const pocketDoc = await transaction.get(pocketRef);
        if (!pocketDoc.exists()) {
          throw new Error("Document does not exist!");
        }
        const newAmount = (pocketDoc.data().currentAmount || 0) + amount;
        if (newAmount < 0) {
          throw new Error("Jumlah tidak boleh kurang dari 0");
        }
        transaction.update(pocketRef, { currentAmount: newAmount });
      });
      setInputAmounts(prev => ({ ...prev, [index]: "" }));
    } catch (e) {
      console.error("Gagal menambah jumlah: ", e);
      alert(e.message);
    }
  };

  const handleDeletePocket = async (index) => {
    const pocket = savingsPockets[index];
    await deleteDoc(doc(db, "users", user.uid, "savings", pocket.id));
  };

  const handleLogout = () => {
    signOut(auth).then(() => window.location.href = "/login");
  };
  
  const totalBalance = wallets.reduce((acc, wallet) => acc + wallet.balance, 0);

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
    const pocketRef = doc(db, "users", user.uid, "savings", pocket.id);

    try {
      await runTransaction(db, async (transaction) => {
        const pocketDoc = await transaction.get(pocketRef);
        if (!pocketDoc.exists()) {
          throw new Error("Document does not exist!");
        }
        const newAmount = (pocketDoc.data().currentAmount || 0) - amount;
        if (newAmount < 0) {
          throw new Error("Jumlah tidak boleh kurang dari 0");
        }
        transaction.update(pocketRef, { currentAmount: newAmount });
      });
      setInputAmounts(prev => ({ ...prev, [index]: "" }));
    } catch (e) {
      console.error("Gagal mengurangi jumlah: ", e);
      alert(e.message);
    }
  };

  const executeDeleteSelectedTransactions = async () => {
    const validSelectedIds = selectedTransactions.filter(id => typeof id === 'string' && id.length > 0);

    if (validSelectedIds.length === 0) {
      console.warn("Tidak ada transaksi valid yang dipilih untuk dihapus.");
      setIsConfirmDeleteOpen(false);
      return;
    }

    const transactionsToDelete = transactions.filter(t => validSelectedIds.includes(t.id));
    
    try {
      await runTransaction(db, async (transaction) => {
        const walletBalanceUpdates = {};

        for (const t of transactionsToDelete) {
          const walletId = t.walletId;
          const amount = t.amount;
          const type = t.type;
          
          if (!walletBalanceUpdates[walletId]) {
            const walletRef = doc(db, "users", user.uid, "wallets", walletId);
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists()) continue;
            walletBalanceUpdates[walletId] = walletDoc.data().balance || 0;
          }

          if (type === 'pemasukan') {
            walletBalanceUpdates[walletId] -= amount;
          } else {
            walletBalanceUpdates[walletId] += amount;
          }
        }
        
        for (const walletId in walletBalanceUpdates) {
          transaction.update(doc(db, "users", user.uid, "wallets", walletId), {
            balance: walletBalanceUpdates[walletId]
          });
        }

        for (const id of validSelectedIds) {
          transaction.delete(doc(db, "users", user.uid, "transactions", id));
        }
      });
      
      setSelectedTransactions([]);
      setIsManageModalOpen(false);
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error menghapus transaksi yang dipilih:", error);
      alert("Gagal menghapus transaksi. Silakan coba lagi.");
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleAddWallet = async (walletData) => {
    try {
      await addDoc(collection(db, "users", user.uid, "wallets"), {
        ...walletData,
        balance: 0,
      });
    } catch (error) {
      console.error("Error adding wallet: ", error);
      alert("Gagal menambahkan dompet.");
    }
  };
  
  const handleDeleteWallet = async (walletId) => {
    if (window.confirm("Yakin ingin menghapus dompet ini? Seluruh riwayat transaksi di dompet ini juga akan terhapus.")) {
      try {
        await runTransaction(db, async (transaction) => {
          const q = query(collection(db, "users", user.uid, "transactions"), where("walletId", "==", walletId));
          const transactionsSnap = await getDocs(q);
          
          if (!transactionsSnap.empty) {
            transactionsSnap.forEach(tDoc => {
              transaction.delete(doc(db, "users", user.uid, "transactions", tDoc.id));
            });
          }

          transaction.delete(doc(db, "users", user.uid, "wallets", walletId));
        });
        
      } catch (error) {
        console.error("Error deleting wallet and transactions: ", error);
        alert("Gagal menghapus dompet.");
      }
    }
  };

  const handleUpdateProfile = async (editName) => {
    try {
      await updateProfile(auth.currentUser, {
        displayName: editName
      });

      await updateDoc(doc(db, "users", user.uid), {
        name: editName,
      });

      setUser(prevUser => ({
        ...prevUser,
        displayName: editName,
      }));

      setIsEditProfileOpen(false);
    } catch (err) {
      console.error("Gagal update profil:", err);
      alert("Gagal menyimpan perubahan profil.");
    }
  };
  
  const handleAddTransaction = async (newTransactionData) => {
    if (!newTransactionData.category || newTransactionData.amount === '' || !newTransactionData.date || !newTransactionData.walletId) {
      alert("Semua kolom harus diisi.");
      return;
    }
    
    const walletRef = doc(db, "users", user.uid, "wallets", newTransactionData.walletId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
          throw new Error("Dompet tidak ditemukan.");
        }

        const currentBalance = walletDoc.data().balance || 0;
        let updatedBalance;
        const amount = parseFloat(newTransactionData.amount);

        if (newTransactionData.type === 'pemasukan') {
          updatedBalance = currentBalance + amount;
        } else {
          updatedBalance = currentBalance - amount;
        }

        if (updatedBalance < 0) {
          throw new Error("Saldo dompet tidak cukup.");
        }
        
        transaction.update(walletRef, { balance: updatedBalance });
        transaction.set(doc(collection(db, "users", user.uid, "transactions")), {
          ...newTransactionData,
          amount: amount,
          timestamp: new Date()
        });
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert(error.message);
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
    } catch (error) {
      console.error("Error adding savings pocket: ", error);
      alert("Gagal menambahkan kantong tabungan.");
    }
  };


  if (loading) {
    return <p className="text-center mt-10">Memuat...</p>;
  }

  const formatCurrency = (amount, currencyCode) => {
    const locale = getLocaleForCurrency(currencyCode);
    return amount.toLocaleString(locale, { style: 'currency', currency: currencyCode });
  };
  
  const welcomeMessage = user.displayName ? `Hai, ${user.displayName}! ✨` : "Hai! Selamat datang kembali! ✨";
  
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
                  onClick={() => setActivePage("account")}
                  className="hover:text-blue-500"
                >
                  <User size={28} weight="fill" className="text-blue-700" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {activePage === "dashboard" && (
        <DashboardContent
          user={user}
          welcomeMessage={welcomeMessage}
          totalBalance={totalBalance}
          largestExpense={largestExpense}
          savingsPockets={savingsPockets}
          transactions={transactions}
          wallets={wallets}
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
          wallets={wallets}
          fetchData={fetchData}
          formatCurrency={formatCurrency}
          isManageModalOpen={isManageModalOpen}
          setIsManageModalOpen={setIsManageModalOpen}
          selectedTransactions={selectedTransactions}
          setSelectedTransactions={setSelectedTransactions}
          setIsConfirmDeleteOpen={setIsConfirmDeleteOpen}
          handleAddTransaction={handleAddTransaction}
          handleAddWallet={handleAddWallet}
          handleDeleteWallet={handleDeleteWallet}
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
      
      {activePage === "account" && (
        <AccountPage
          user={user}
          totalBalance={totalBalance}
          weatherData={weatherData}
          weatherLoading={weatherLoading}
          weatherError={weatherError}
          isEditProfileOpen={isEditProfileOpen}
          setIsEditProfileOpen={setIsEditProfileOpen}
          editName={editName}
          setEditName={setEditName}
          handleUpdateProfile={handleUpdateProfile}
          handleLogout={handleLogout}
          formatCurrency={formatCurrency}
          formatNumberWithDots={formatNumberWithDots}
        />
      )}

      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-lg relative max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Kelola Transaksi</h2>
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
                    <th className="py-3 px-5">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4 text-gray-500">Tidak ada transaksi untuk dikelola.</td></tr>
                  ) : (
                    transactions.map((t) => {
                      const wallet = wallets.find(w => w.id === t.walletId) || { currency: 'IDR' };
                      return (
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
                          <td className="px-5 py-3">{formatCurrency(t.amount, wallet.currency)}</td>
                        </tr>
                      );
                    })
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
                onClick={() => setIsManageModalOpen(false)}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

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