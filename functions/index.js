const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

/**
 * Mengubah jumlah uang menjadi format Rupiah.
 * @param {number} amount
 * @return {string}
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mengirim laporan keuangan harian ke pengguna.
 * @param {object} user - Data pengguna.
 * @param {number} totalBalance - Total saldo pengguna.
 * @param {array} transactions - Daftar transaksi.
 */
async function sendEmailReport(user, totalBalance, transactions) {
  if (!user || !user.email) {
    console.warn("Email kosong. Tidak bisa kirim laporan.");
    return;
  }

  const today = new Date().toLocaleDateString("id-ID");

  const templateParams = {
    to_name: user.name || "User",
    to_email: user.email,
    date: today,
    total_balance: formatRupiah(totalBalance),
    total_transactions: transactions.length,
  };

  const payload = {
    service_id: functions.config().emailjs.serviceid,
    template_id: functions.config().emailjs.templateid,
    user_id: functions.config().emailjs.userid,
    accessToken: functions.config().emailjs.privatekey,
    template_params: templateParams,
  };

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log("Laporan harian terkirim!", result);
  } catch (error) {
    console.error("Gagal kirim laporan:", error);
  }
}

/**
 * Fungsi utama yang dijadwalkan untuk berjalan setiap hari.
 */
exports.sendDailyReport = functions.pubsub.schedule("every day 23:00")
    .timeZone("Asia/Jakarta")
    .onRun(async (context) => {
      console.log("Menjalankan fungsi laporan harian pada pukul 23:00.");

      try {
        const usersRef = admin.firestore().collection("users");
        const usersSnapshot = await usersRef.get();

        if (usersSnapshot.empty) {
          console.log("Tidak ada pengguna ditemukan.");
          return null;
        }

        const promises = [];
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          const userId = userDoc.id;

          const reportPromise = admin.firestore()
              .collection(`users/${userId}/transactions`)
              .get()
              .then((transactionsSnapshot) => {
                const transactions = transactionsSnapshot.docs
                    .map((doc) => doc.data());
                const totalBalance = transactions.reduce(
                    (acc, t) => acc + (t.type === "pemasukan" ? t.amount : -t.amount),
                    0,
                );

                return sendEmailReport(userData, totalBalance, transactions);
              });
          promises.push(reportPromise);
        });

        await Promise.all(promises);
        console.log("Semua laporan harian berhasil dikirim.");
        return null;
      } catch (error) {
        console.error("Terjadi kesalahan dalam pengiriman laporan:", error);
        return null;
      }
    });
