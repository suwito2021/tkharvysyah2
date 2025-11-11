import React, { Fragment } from 'react';
import { HomeIcon, BookIcon, UsersIcon, ShieldCheckIcon, LogOutIcon, XIcon, InfoIcon } from './icons';

type Portal = 'teacher' | 'parent' | 'principal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (portal: Portal) => void;
  onGoHome: () => void;
  onShowSchoolInfo: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className="text-gray-300 hover:bg-emerald-700 hover:text-white group flex items-center px-3 py-2 text-base font-medium rounded-md"
    >
        {icon}
        {label}
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, onGoHome, onShowSchoolInfo, isLoggedIn, onLogout }) => {
  const commonIconClass = "mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300";

  return (
    <Fragment>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:flex`}
      >
        <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-emerald-800">
           <h1 className="text-xl font-bold">Navigasi Portal</h1>
           <button onClick={onClose} className="md:hidden p-1 rounded-full text-white hover:bg-emerald-700">
              <XIcon className="w-6 h-6"/>
           </button>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-2">
            <NavLink icon={<HomeIcon className={commonIconClass} />} label="Home" onClick={onGoHome} />
            <hr className="border-t border-emerald-700 my-4" />
            <NavLink icon={<BookIcon className={commonIconClass} />} label="Portal Guru" onClick={() => onNavigate('teacher')} />
            <NavLink icon={<UsersIcon className={commonIconClass} />} label="Portal Orang Tua" onClick={() => onNavigate('parent')} />
            <NavLink icon={<ShieldCheckIcon className={commonIconClass} />} label="Portal Kepala Sekolah" onClick={() => onNavigate('principal')} />
            <hr className="border-t border-emerald-700 my-4" />
            <NavLink icon={<InfoIcon className={commonIconClass} />} label="Info Sekolah" onClick={onShowSchoolInfo} />
        </nav>

        {isLoggedIn && (
            <div className="px-2 py-4 border-t border-emerald-700">
                 <NavLink icon={<LogOutIcon className={commonIconClass} />} label="Logout" onClick={onLogout} />
            </div>
        )}
      </div>
    </Fragment>
  );
};

export default Sidebar;