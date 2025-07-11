import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("Tombol 'Daftar' ditekan...");

    if (password !== rePassword) {
      setError("Konfirmasi password tidak cocok.");
      console.log("Error: Password tidak cocok.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User berhasil dibuat:", user);

      // Menyimpan nama pengguna ke profil Firebase
      await updateProfile(user, { displayName: name });
      
      // Menyimpan data pengguna ke Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
      });

      console.log("Data pengguna berhasil disimpan di Firestore.");

      setSuccess("Pendaftaran berhasil! Anda akan diarahkan ke halaman login.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (err) {
      console.error("Kesalahan saat pendaftaran:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("Email sudah terdaftar. Silakan gunakan email lain.");
      } else if (err.code === "auth/weak-password") {
        setError("Password terlalu lemah. Password harus lebih dari 6 karakter.");
      } else {
        setError("Pendaftaran gagal. Silakan coba lagi.");
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fef9f9] via-[#f5faff] to-[#e6f0ff] text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Daftar Akun Baru</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">Nama</label>
            <input
              type="text"
              id="name"
              className="w-full p-3 border rounded-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-3 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              id="password"
              className="w-full p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="repassword" className="block text-sm font-medium mb-1">Konfirmasi Password</label>
            <input
              type="password"
              id="repassword"
              className="w-full p-3 border rounded-lg"
              value={rePassword}
              onChange={(e) => setRePassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Daftar
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Sudah punya akun?{" "}
          <button onClick={() => window.location.href = "/login"} className="text-blue-600 hover:underline">
            Masuk di sini
          </button>
        </p>
      </div>
    </main>
  );
};

export default Register;