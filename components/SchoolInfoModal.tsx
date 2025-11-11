import React from 'react';
import { XIcon } from './icons';

interface SchoolInfoModalProps {
  onClose: () => void;
}

const SchoolInfoModal: React.FC<SchoolInfoModalProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8 relative transform transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Tutup"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
          <img 
            src="https://iili.io/KmUyjwu.png" 
            alt="Logo TK IT Harvysyah" 
            className="mx-auto mb-4 w-20 h-20"
          />
          <h2 className="text-2xl font-bold text-gray-800">Informasi Sekolah</h2>
          <p className="text-gray-500">TK IT Harvysyah</p>
        </div>
        
        <div className="space-y-3 text-sm md:text-base text-gray-700">
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Nama</p>
            <p>: TK IT Harvysyah</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Alamat</p>
            <p>: Jalan Sadar Timur Gang Rahmad No. 042</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Kelurahan</p>
            <p>: Sekip</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Kecamatan</p>
            <p>: Lubuk Pakam</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Kabupaten</p>
            <p>: Deli Serdang</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Provinsi</p>
            <p>: Sumatera Utara</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Kode Pos</p>
            <p>: 20517</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Status</p>
            <p>: Swasta</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Kepala Sekolah</p>
            <p>: Yusri Elvida Daulay</p>
          </div>
          <div className="flex">
            <p className="font-semibold w-32 shrink-0">Handphone</p>
            <p>: 081262006253</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolInfoModal;