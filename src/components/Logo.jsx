import React from 'react';
const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Ikon SVG Estetik: Koin atau Simbol Keuangan */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-7 h-7 text-blue-600" // Sesuaikan ukuran dan warna
      >
        {/* Ini adalah ikon koin/dana sederhana. Anda bisa menggantinya dengan ikon SVG lain yang Anda suka. */}
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4h-2V7h2v4h2v6z"/>
      </svg>
    <span className="text-2xl font-bold">Danaku</span>
  </div>
);
};

export default Logo;
