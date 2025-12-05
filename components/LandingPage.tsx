import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100 via-cyan-100 to-white py-10 px-4">
      <div className="bg-white/80 rounded-2xl shadow-2xl p-8 max-w-3xl w-full flex flex-col items-center animate-fade-in">
        <img 
          src="https://iili.io/KmUyjwu.png" 
          alt="Logo TK IT Harvysyah" 
          className="mx-auto mb-6 w-28 h-28 md:w-36 md:h-36 rounded-full shadow-lg border-4 border-emerald-300 hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-emerald-700 drop-shadow-lg tracking-wide">Selamat Datang di Aplikasi</h1>
        <p className="text-lg md:text-xl mb-6 text-cyan-700 font-medium">Generasi Qurani TK IT Harvysyah</p>
        <img
          src="https://iili.io/f9XLdV2.jpg"
          alt="Kegiatan Belajar Mengajar TK IT Harvysyah"
          className="mx-auto mt-6 rounded-xl shadow-xl max-w-2xl w-full hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
};

export default LandingPage;