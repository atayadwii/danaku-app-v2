// AccountPage.js (LENGKAP)

import React from 'react';
import { User, Wallet, CloudSun, PencilSimple, SignOut, ArchiveBox, ArrowUUpLeft, Receipt, Trash, NotePencil } from "phosphor-react";

const AccountPage = ({ 
  user, totalBalance, weatherData, weatherLoading, weatherError, 
  isEditProfileOpen, setIsEditProfileOpen, editName, setEditName, 
  handleUpdateProfile, handleLogout, formatCurrency, formatNumberWithDots,
  activeWallets, archivedWallets, handleArchiveWallet, handleDeleteWallet,
  handleOpenReportModal, handleOpenEditWalletModal 
}) => {
  
  const weatherIcon = weatherData ? `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png` : null;

  // Komponen kecil untuk kartu dompet agar tidak repetitif
  const WalletCard = ({ wallet, isArchived = false }) => (
    <div className={`p-4 rounded-xl border flex flex-col justify-between ${isArchived ? 'bg-gray-100 shadow-inner opacity-80' : 'bg-white shadow-md'}`}>
      <div>
        <h5 className={`font-semibold ${isArchived ? 'text-gray-600' : 'text-gray-800'}`}>{wallet.name}</h5>
        <p className="text-sm text-gray-500">
          {isArchived ? 'Saldo Akhir:' : 'Saldo:'} <strong className="text-base font-bold">{formatCurrency(wallet.balance, wallet.currency)}</strong>
        </p>
      </div>
      <div className="flex items-center justify-end space-x-2 mt-4">
        <button onClick={() => handleOpenReportModal(wallet)} title="Lihat Laporan" className="p-2 text-gray-500 hover:text-blue-700 transition"><Receipt size={20} /></button>
        {!isArchived && <button onClick={() => handleOpenEditWalletModal(wallet)} title="Ubah Nama" className="p-2 text-gray-500 hover:text-yellow-600 transition"><NotePencil size={20} /></button>}
        
        {isArchived ? (
          <button onClick={() => handleArchiveWallet(wallet.id, false)} title="Aktifkan Kembali" className="p-2 text-green-600 hover:text-green-800 transition"><ArrowUUpLeft size={20} /></button>
        ) : (
          <button onClick={() => handleArchiveWallet(wallet.id, true)} title="Arsipkan Dompet" className="p-2 text-gray-500 hover:text-orange-700 transition"><ArchiveBox size={20} /></button>
        )}
        
        <button onClick={() => handleDeleteWallet(wallet.id)} title="Hapus Dompet" className="p-2 text-gray-500 hover:text-red-700 transition"><Trash size={20} /></button>
      </div>
    </div>
  );

  return (
    <section className="container mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
        {/* Bagian Info Profil & Cuaca (Sama seperti sebelumnya) */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Profil Saya</h2>
          <p className="text-sm text-gray-500 mt-2">Atur info akun dan kelola dompetmu</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card-glass p-6 rounded-xl shadow-md text-center flex flex-col items-center justify-center"><User size={48} weight="fill" className="text-blue-600 mb-2" /><p className="text-lg font-semibold text-gray-800 mb-1">{user.displayName || "Pengguna Danaku"}</p><p className="text-sm text-gray-600">{user.email}</p></div>
          <div className="card-glass p-6 rounded-xl shadow-md text-center flex flex-col items-center justify-center"><Wallet size={48} className="text-green-600 mb-2" /><p className="text-base sm:text-lg text-gray-600 mb-1">Total Saldo Aktif</p><p className="text-2xl sm:text-3xl font-bold text-green-800">{formatNumberWithDots(totalBalance)}</p></div>
          <div className="card-glass p-6 rounded-xl shadow-md text-center flex flex-col items-center justify-center"><CloudSun size={48} className="text-yellow-500 mb-2" /><h4 className="text-base font-semibold text-gray-700 mb-2">Cuaca Sekarang</h4>{weatherLoading ? <p className="text-sm text-gray-500">Memuat...</p> : weatherError ? <p className="text-sm text-red-500">{weatherError}</p> : weatherData && (<div className="flex flex-col items-center"><img src={weatherIcon} alt="ikon cuaca" className="w-14 h-14 mb-1" /><p className="text-sm font-medium text-gray-700 capitalize">{weatherData.weather[0].description}, {Math.round(weatherData.main.temp)}°C</p><p className="text-xs text-gray-500">{weatherData.name}</p></div>)}</div>
        </div>
        <div className="w-full max-w-sm mx-auto space-y-4 mb-12">
          <button onClick={() => setIsEditProfileOpen(true)} className="w-full py-3 px-6 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition flex items-center justify-center space-x-2"><PencilSimple size={20} weight="bold" /><span>Edit Profil</span></button>
          <button onClick={handleLogout} className="w-full py-3 px-6 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2"><SignOut size={20} weight="bold" /><span>Logout</span></button>
        </div>

        {/* Bagian Manajemen Dompet BARU */}
        <div className="border-t pt-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-6">Manajemen Dompet</h3>
            <div>
                <h4 className="text-lg font-semibold mb-3 text-blue-700">👛 Dompet Aktif</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeWallets && activeWallets.length > 0 ? (
                    activeWallets.map(wallet => <WalletCard key={wallet.id} wallet={wallet} />)
                ) : ( <p className="text-gray-500 col-span-full">Tidak ada dompet aktif.</p> )}
                </div>
            </div>

            {archivedWallets && archivedWallets.length > 0 && (
            <div className="mt-10">
                <h4 className="text-lg font-semibold mb-3 text-gray-500">🗃️ Dompet yang Diarsipkan</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedWallets.map(wallet => <WalletCard key={wallet.id} wallet={wallet} isArchived={true} />)}
                </div>
            </div>
            )}
        </div>
      </div>

      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative"><button onClick={() => setIsEditProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button><h3 className="text-2xl font-bold text-blue-700 text-center mb-4">✏️ Edit Profil</h3><div className="space-y-4"><div><label className="text-sm font-medium text-gray-600 block mb-1">Nama Lengkap</label><input type="text" className="w-full p-3 border rounded-lg" value={editName} onChange={(e) => setEditName(e.target.value)}/></div><button onClick={() => handleUpdateProfile(editName)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">Simpan Perubahan</button></div></div></div>
      )}
    </section>
  );
};

export default AccountPage;