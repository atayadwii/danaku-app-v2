import React, { useState } from "react";

const SavingsPage = ({ user, savingsPockets, fetchData, formatCurrency, handleAddAmount, handleSubtractAmount, handleDeletePocket, handleInputChange, inputAmounts, handleAddPocket, parseNumberFromFormattedString, formatNumberWithDots }) => {
  const [newPocket, setNewPocket] = useState({
    name: '',
    target: ''
  });

  const handleSubmitPocket = async (e) => {
    e.preventDefault();
    if (!newPocket.name || !newPocket.target) {
      alert("Semua kolom harus diisi.");
      return;
    }
    handleAddPocket(newPocket);
    setNewPocket({ name: '', target: '' });
  };

  return (
    <section id="savings-section" className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">🏦 Kelola Tabungan</h2>
      <form id="savings-pocket-form" className="grid gap-4 sm:grid-cols-2 mb-6" onSubmit={handleSubmitPocket}>
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
          <label htmlFor="pocket-target" className="text-sm font-medium text-gray-600">Target ({user.currency || 'IDR'})</label>
          <input
            type="text"
            id="pocket-target"
            required
            placeholder={`Contoh: ${formatNumberWithDots(5000000)}`}
            className="mt-1 block w-full p-3 border rounded-lg"
            value={formatNumberWithDots(newPocket.target)}
            onChange={(e) => setNewPocket({ ...newPocket, target: parseNumberFromFormattedString(e.target.value) })}
            onFocus={(e) => {
              e.target.value = newPocket.target === '' ? '' : String(newPocket.target);
            }}
            onBlur={(e) => {
              e.target.value = formatNumberWithDots(newPocket.target);
            }}
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
          const percent = Math.max(0, Math.round(percentRaw));

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
                    className="text-yellow-600 font-bold text-xl"
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
                Target: <strong>{formatCurrency(pocket.target)}</strong>
              </p>
              <p className={`text-sm ${pocket.currentAmount < 0 ? "text-red-500" : "text-green-600"}`}>
                Terkumpul: <strong>{formatCurrency(pocket.currentAmount)}</strong>
              </p>

              <input
                type="text"
                placeholder="Jumlah dana"
                className="mt-2 w-full p-2 border border-gray-300 rounded"
                value={formatNumberWithDots(inputAmounts[index])}
                onChange={(e) => handleInputChange(index, parseNumberFromFormattedString(e.target.value))}
                onFocus={(e) => {
                  e.target.value = inputAmounts[index] === '' ? '' : String(inputAmounts[index]);
                }}
                onBlur={(e) => {
                  e.target.value = formatNumberWithDots(inputAmounts[index]);
                }}
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
  );
};

export default SavingsPage;