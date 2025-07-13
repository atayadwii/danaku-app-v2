
import { User, Wallet, CloudSun, PencilSimple, SignOut } from "phosphor-react";

const AccountPage = ({ user, totalBalance, weatherData, weatherLoading, weatherError, isEditProfileOpen, setIsEditProfileOpen, editName, setEditName, handleUpdateProfile, handleLogout, formatCurrency, formatNumberWithDots }) => {
  const weatherIcon = weatherData ? `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png` : null;

  return (
    <section className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Profil Saya</h2>
        <p className="text-sm text-gray-500 mt-2">Atur info akun dan lihat ringkasan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Kartu Info Akun */}
        <div className="card-glass p-6 rounded-xl shadow-md text-center flex flex-col items-center justify-center">
          <User size={48} weight="fill" className="text-blue-600 mb-2" />
          <p className="text-lg font-semibold text-gray-800 mb-1">{user.displayName || "Pengguna Danaku"}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        {/* Kartu Saldo */}
        <div className="card-glass p-6 rounded-xl shadow-md text-center flex flex-col items-center justify-center">
          <Wallet size={48} className="text-green-600 mb-2" />
          <p className="text-base sm:text-lg text-gray-600 mb-1">Total Saldo</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-800">{formatNumberWithDots(totalBalance)}</p>
        </div>

        {/* Kartu Cuaca */}
        <div className="card-glass p-6 rounded-xl shadow-md text-center flex flex-col items-center justify-center">
          <CloudSun size={48} className="text-yellow-500 mb-2" />
          <h4 className="text-base font-semibold text-gray-700 mb-2">Cuaca Sekarang</h4>
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
      </div>

      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Tombol Edit Profil */}
        <button
          onClick={() => setIsEditProfileOpen(true)}
          className="w-full py-3 px-6 bg-gray-100 text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition flex items-center justify-center space-x-2"
        >
          <PencilSimple size={20} weight="bold" />
          <span>Edit Profil</span>
        </button>

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-6 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2"
        >
          <SignOut size={20} weight="bold" />
          <span>Logout</span>
        </button>
      </div>

      {/* === Modal Edit Profil === */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold text-blue-700 text-center mb-4">✏️ Edit Profil</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <button
                onClick={() => handleUpdateProfile(editName)}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountPage;