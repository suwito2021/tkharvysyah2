import React from 'react';
import { MenuIcon } from './icons';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 bg-white shadow-md z-30 md:hidden">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <h1 className="text-xl font-bold text-emerald-600">Portal Laporan Belajar</h1>
          </div>
          <div className="flex md:hidden">
            <button
              onClick={onMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Buka menu utama</span>
              <MenuIcon className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;