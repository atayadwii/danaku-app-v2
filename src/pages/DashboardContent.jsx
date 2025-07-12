import React from "react";
import { Wallet, TrendDown } from "phosphor-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DashboardContent = ({ user, welcomeMessage, totalBalance, largestExpense, savingsPockets, transactions, formatCurrency, handleAddAmount, handleSubtractAmount, handleDeletePocket, handleInputChange, inputAmounts, formatNumberWithDots, parseNumberFromFormattedString }) => {

  const expenseData = transactions.filter(t => t.type === "pengeluaran")
    .reduce((acc, curr) => {
      const existingCategory = acc.find(item => item.name === curr.category);
      if (existingCategory) {
        existingCategory.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A0', '#19FFD1'];

  return (
    <section className="container mx-auto px-4 sm:px-6 py-8 bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{welcomeMessage}</h2>
        <p className="text-sm sm:text-base text-gray-500 mt-2">Mari hemat dan atur keuanganmu dengan cerdas 🌟</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card-glass p-6 rounded-xl shadow-md text-center">
          <Wallet size={48} className="text-blue-600 mb-2 mx-auto" />
          <p className="text-base sm:text-lg text-gray-600">Total Uang Dimiliki</p>
          <p className="text-3xl sm:text-4xl font-bold text-blue-800">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="card-glass p-6 rounded-xl shadow-md text-center">
          <TrendDown size={48} className="text-red-500 mb-2 mx-auto" />
          <p className="text-base sm:text-lg text-gray-600">Pengeluaran Terbesar</p>
          <p className="text-xl font-semibold text-red-600">{largestExpense().category}</p>
          <p className="text-lg text-red-500">{formatCurrency(largestExpense().amount)}</p>
        </div>
      </div>

      {expenseData.length > 0 && (
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10 mb-10">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 text-center">📊 Distribusi Pengeluaran</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {expenseData.length === 0 && (
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 sm:p-10 text-center text-gray-500 mb-10">
          <p>Belum ada data pengeluaran untuk ditampilkan di grafik.</p>
        </div>
      )}

      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-3">🎁 Kantong Tabungan Anda</h3>
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
                <th className="py-3 px-5">Jumlah ({user.currency || 'IDR'})</th>
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

export default DashboardContent;