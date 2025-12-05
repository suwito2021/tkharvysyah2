import React from 'react';
import { MenuIcon } from './icons';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 md:hidden bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 backdrop-blur-lg bg-opacity-80 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="https://img.icons8.com/color/48/000000/school-building.png" alt="Logo" className="h-10 w-10 rounded-full shadow-lg" />
            <h1 className="text-2xl font-extrabold text-white drop-shadow-lg tracking-wide">Portal Laporan Belajar</h1>
          </div>
          <div className="flex md:hidden">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-full text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              aria-expanded="false"
            >
              <span className="sr-only">Buka menu utama</span>
              <MenuIcon className="block h-7 w-7" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;