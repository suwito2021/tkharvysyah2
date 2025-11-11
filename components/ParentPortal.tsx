import React, { useState, useEffect } from 'react';
import { getSheetData } from '../services/googleSheetsService';
import type { Student, Score } from '../types';
import { ChevronLeftIcon } from './icons';

interface ParentPortalProps {
  onBack: () => void;
  student: Student;
}

const ParentPortal: React.FC<ParentPortalProps> = ({ onBack, student }) => {
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const scoreData = await getSheetData<Score>('score');
        const studentScores = scoreData.filter(score => score['Student ID'] === student.NISN);
        setScores(studentScores);
      } catch (err) {
        setError('Gagal memuat data penilaian.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScores();
  }, [student.NISN]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Portal Orang Tua</h2>
            <p className="text-gray-500">Laporan Belajar untuk: <strong>{student.Name}</strong></p>
        </div>
        <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 font-semibold">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Kembali
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Memuat data penilaian...</p>
      ) : error ? (
        <p className="text-center text-red-500 py-8">{error}</p>
      ) : scores.length > 0 ? (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Penilaian</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {scores.map((score, index) => (
                        <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{score.Date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.Category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score['Item Name']}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{score.Score}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{score.Notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8 py-8">Belum ada data penilaian untuk siswa ini.</p>
      )}
    </div>
  );
};

export default ParentPortal;
