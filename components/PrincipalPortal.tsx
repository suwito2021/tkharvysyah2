import React, { useState, useEffect } from 'react';
import { getSheetData } from '../services/googleSheetsService';
import type { Teacher, Student, Principal, Score } from '../types';
import { ChevronLeftIcon } from './icons';

interface PrincipalPortalProps {
  onBack: () => void;
  principal: Principal;
}

const DataTable = <T,>({ title, data, columns }: { title: string; data: T[] | null; columns: { header: string; accessor: keyof T }[] }) => (
    <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-700 mb-4">{title}</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={String(col.accessor)} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data && data.length > 0 ? data.map((item, index) => (
                        <tr key={index}>
                            {columns.map(col => (
                                <td key={String(col.accessor)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                    {String(item[col.accessor])}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                           <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                {data ? "Tidak ada data" : "Memuat..."}
                           </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const PrincipalPortal: React.FC<PrincipalPortalProps> = ({ onBack, principal }) => {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [scores, setScores] = useState<Score[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'guru' | 'siswa' | 'laporan'>('guru');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [teacherData, studentData, scoreData] = await Promise.all([
          getSheetData<Teacher>('Teacher'),
          getSheetData<Student>('Student'),
          getSheetData<Score>('score'),
        ]);
        setTeachers(teacherData);
        setStudents(studentData);
        setScores(scoreData);
      } catch (err) {
        setError('Gagal memuat semua data. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const classes = students ? [...new Set(students.map(s => s.Class).filter(Boolean))] : [];
  const filteredStudents = selectedClass === 'all' ? students : students?.filter(s => s.Class === selectedClass) || null;

  const teacherColumns = [{ header: 'Nama', accessor: 'Name' as keyof Teacher}, { header: 'Telepon', accessor: 'Phone' as keyof Teacher}, { header: 'Kelas', accessor: 'Class' as keyof Teacher}];
  const studentColumns = [{ header: 'Nama', accessor: 'Name' as keyof Student}, { header: 'NISN', accessor: 'NISN' as keyof Student}, { header: 'Kelas', accessor: 'Class' as keyof Student}];
  const scoreColumns = [
    { header: 'ID Siswa', accessor: 'Student ID' as keyof Score},
    { header: 'Kategori', accessor: 'Category' as keyof Score},
    { header: 'Item', accessor: 'Item Name' as keyof Score},
    { header: 'Skor', accessor: 'Score' as keyof Score},
    { header: 'Tanggal', accessor: 'Date' as keyof Score},
  ];

  return (
    <div className="bg-gray-50 rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Portal Kepala Sekolah: Monitoring</h2>
            <p className="text-gray-500">Selamat datang, {principal.Name}!</p>
        </div>
        <button onClick={onBack} className="flex items-center text-emerald-600 hover:text-emerald-800 font-semibold">
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Kembali
        </button>
      </div>

      {isLoading && <p className="text-center text-gray-500">Memuat semua data...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!isLoading && !error && (
        <div>
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('guru')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'guru'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Data Guru
                </button>
                <button
                  onClick={() => setActiveTab('siswa')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'siswa'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Data Siswa
                </button>
                <button
                  onClick={() => setActiveTab('laporan')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'laporan'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Laporan
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'guru' && <DataTable title="Data Guru" data={teachers} columns={teacherColumns} />}
          {activeTab === 'siswa' && (
            <div>
              <div className="mb-4">
                <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas:</label>
                <select
                  id="class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <DataTable title="Data Siswa" data={filteredStudents} columns={studentColumns} />
            </div>
          )}
          {activeTab === 'laporan' && <DataTable title="Laporan Penilaian" data={scores} columns={scoreColumns} />}
        </div>
      )}
    </div>
  );
};

export default PrincipalPortal;
