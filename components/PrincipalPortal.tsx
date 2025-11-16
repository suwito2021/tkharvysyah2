import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
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
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Report filters
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');

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

  // Pagination logic
  const totalStudents = filteredStudents?.length || 0;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const paginatedStudents = filteredStudents?.slice(startIndex, endIndex) || null;

  // Reset to page 1 when class filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass]);

  // Filtered scores for reports
  const filteredReportScores = useMemo(() => {
    if (!scores) return [];
    let filtered = scores;
    if (reportStartDate) {
      filtered = filtered.filter(score => score.Date >= reportStartDate);
    }
    if (reportEndDate) {
      filtered = filtered.filter(score => score.Date <= reportEndDate);
    }
    return filtered;
  }, [scores, reportStartDate, reportEndDate]);

  // Chart data calculations
  const scoreLevelData = useMemo(() => {
    const levels = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
    filteredReportScores.forEach(score => {
      if (levels[score.Score as keyof typeof levels] !== undefined) {
        levels[score.Score as keyof typeof levels]++;
      }
    });
    return Object.entries(levels).map(([level, count]) => ({
      level,
      count,
      percentage: filteredReportScores.length > 0 ? Math.round((count / filteredReportScores.length) * 100) : 0
    }));
  }, [filteredReportScores]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredReportScores.forEach(score => {
      categories[score.Category] = (categories[score.Category] || 0) + 1;
    });
    return Object.entries(categories).map(([category, count]) => ({
      category,
      count,
      percentage: filteredReportScores.length > 0 ? Math.round((count / filteredReportScores.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [filteredReportScores]);

  const timelineData = useMemo(() => {
    const dailyCounts = {};
    filteredReportScores.forEach(score => {
      dailyCounts[score.Date] = (dailyCounts[score.Date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredReportScores]);

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
              <DataTable title={`Data Siswa (Halaman ${currentPage} dari ${totalPages})`} data={paginatedStudents} columns={studentColumns} />
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-600"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-sm text-gray-600">
                    Halaman {currentPage} dari {totalPages} ({totalStudents} siswa)
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-600"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'laporan' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-700 mb-6">Laporan dan Analisis Penilaian</h3>

              {/* Filters */}
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Filter Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => { setReportStartDate(''); setReportEndDate(''); }}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Menampilkan {filteredReportScores.length} penilaian dari total {scores?.length || 0} data
                </div>
              </div>

              {/* Charts */}
              {filteredReportScores.length > 0 && (
                <div className="space-y-6">
                  {/* Score Level Distribution */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Tingkat Penilaian</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreLevelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} siswa (${scoreLevelData.find(d => d.level === name)?.percentage}%)`,
                            'Jumlah'
                          ]}
                        />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Distribution */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Penilaian per Kategori</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percentage }) => `${category}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#ef4444', '#f59e0b'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} penilaian`, 'Jumlah']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Tren Penilaian Harian</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip labelFormatter={(label) => `Tanggal: ${label}`} />
                        <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="mt-8">
                <DataTable title="Detail Penilaian" data={filteredReportScores} columns={scoreColumns} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrincipalPortal;
