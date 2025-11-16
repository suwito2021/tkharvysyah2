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
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
  const [selectedClassForReport, setSelectedClassForReport] = useState<string>('all');
  const [reportPage, setReportPage] = useState(1);
  const reportsPerPage = 10;
  const [studentSummaryPage, setStudentSummaryPage] = useState(1);
  const studentsPerSummaryPage = 10;

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

  // Reset pages when filters change
  useEffect(() => {
    setReportPage(1);
  }, [reportStartDate, reportEndDate, selectedStudentForReport, selectedClassForReport]);

  useEffect(() => {
    setStudentSummaryPage(1);
  }, [reportStartDate, reportEndDate, selectedClassForReport]); // Reset student summary page when date/class filters change

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
    if (selectedClassForReport !== 'all') {
      const classStudents = students?.filter(s => s.Class === selectedClassForReport).map(s => s.NISN) || [];
      filtered = filtered.filter(score => classStudents.includes(score['Student ID']));
    }
    if (selectedStudentForReport) {
      filtered = filtered.filter(score => score['Student ID'] === selectedStudentForReport);
    }
    return filtered;
  }, [scores, reportStartDate, reportEndDate, selectedStudentForReport, selectedClassForReport, students]);

  // Pagination for reports
  const totalReportPages = Math.ceil(filteredReportScores.length / reportsPerPage);
  const startReportIndex = (reportPage - 1) * reportsPerPage;
  const endReportIndex = startReportIndex + reportsPerPage;
  const paginatedReportScores = filteredReportScores.slice(startReportIndex, endReportIndex);

  // Student-specific data for detailed view
  const studentReportData = useMemo(() => {
    if (!selectedStudentForReport || !scores) return null;

    const studentScores = scores.filter(score => score['Student ID'] === selectedStudentForReport);
    const studentName = students?.find(s => s.NISN === selectedStudentForReport)?.Name || selectedStudentForReport;

    // Score distribution for this student
    const scoreLevels = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
    studentScores.forEach(score => {
      if (scoreLevels[score.Score as keyof typeof scoreLevels] !== undefined) {
        scoreLevels[score.Score as keyof typeof scoreLevels]++;
      }
    });

    // Category performance
    const categoryPerformance: Record<string, { total: number; scores: Record<string, number> }> = {};
    studentScores.forEach(score => {
      if (!categoryPerformance[score.Category]) {
        categoryPerformance[score.Category] = { total: 0, scores: { BB: 0, MB: 0, BSH: 0, BSB: 0 } };
      }
      categoryPerformance[score.Category].total++;
      categoryPerformance[score.Category].scores[score.Score as keyof typeof scoreLevels]++;
    });

    // Timeline data
    const timelineData = {};
    studentScores.forEach(score => {
      timelineData[score.Date] = (timelineData[score.Date] || 0) + 1;
    });

    return {
      name: studentName,
      totalAssessments: studentScores.length,
      scoreDistribution: Object.entries(scoreLevels).map(([level, count]) => ({
        level,
        count,
        percentage: studentScores.length > 0 ? Math.round((count / studentScores.length) * 100) : 0
      })),
      categoryPerformance: Object.entries(categoryPerformance).map(([category, data]) => ({
        category,
        ...data
      })),
      timelineData: Object.entries(timelineData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recentAssessments: studentScores
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 5)
    };
  }, [selectedStudentForReport, scores, students]);

  // Student summary data for rekap laporan
  const studentSummaryData = useMemo(() => {
    if (!students || !scores) return [];

    // Filter students by class if selected
    let filteredStudents = students;
    if (selectedClassForReport !== 'all') {
      filteredStudents = students.filter(s => s.Class === selectedClassForReport);
    }

    // Filter scores by date range for summary
    let filteredScoresForSummary = scores;
    if (reportStartDate) {
      filteredScoresForSummary = filteredScoresForSummary.filter(score => score.Date >= reportStartDate);
    }
    if (reportEndDate) {
      filteredScoresForSummary = filteredScoresForSummary.filter(score => score.Date <= reportEndDate);
    }

    return filteredStudents.map(student => {
      const studentScores = filteredScoresForSummary.filter(score => score['Student ID'] === student.NISN);

      // Calculate score levels
      const scoreLevels = { BB: 0, MB: 0, BSH: 0, BSB: 0 };
      studentScores.forEach(score => {
        if (scoreLevels[score.Score as keyof typeof scoreLevels] !== undefined) {
          scoreLevels[score.Score as keyof typeof scoreLevels]++;
        }
      });

      // Calculate average score (assigning numeric values: BB=1, MB=2, BSH=3, BSB=4)
      const scoreValues = { BB: 1, MB: 2, BSH: 3, BSB: 4 };
      const totalScoreValue = studentScores.reduce((sum, score) => sum + scoreValues[score.Score as keyof typeof scoreValues], 0);
      const averageScore = studentScores.length > 0 ? (totalScoreValue / studentScores.length).toFixed(1) : '0';

      // Get latest assessment date
      const latestDate = studentScores.length > 0
        ? studentScores.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0].Date
        : '-';

      return {
        nisn: student.NISN,
        name: student.Name,
        class: student.Class,
        totalAssessments: studentScores.length,
        bb: scoreLevels.BB,
        mb: scoreLevels.MB,
        bsh: scoreLevels.BSH,
        bsb: scoreLevels.BSB,
        averageScore,
        latestDate
      };
    }).sort((a, b) => b.totalAssessments - a.totalAssessments); // Sort by most active students first
  }, [students, scores, reportStartDate, reportEndDate, selectedClassForReport]);

  // Pagination for student summary
  const totalStudentSummaryPages = Math.ceil(studentSummaryData.length / studentsPerSummaryPage);
  const startStudentSummaryIndex = (studentSummaryPage - 1) * studentsPerSummaryPage;
  const endStudentSummaryIndex = startStudentSummaryIndex + studentsPerSummaryPage;
  const paginatedStudentSummary = studentSummaryData.slice(startStudentSummaryIndex, endStudentSummaryIndex);

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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
                    <select
                      value={selectedClassForReport}
                      onChange={(e) => setSelectedClassForReport(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Semua Kelas</option>
                      {classes.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Siswa</label>
                    <select
                      value={selectedStudentForReport}
                      onChange={(e) => setSelectedStudentForReport(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Semua Siswa</option>
                      {students?.filter(s => selectedClassForReport === 'all' || s.Class === selectedClassForReport).map(student => (
                        <option key={student.NISN} value={student.NISN}>
                          {student.Name} ({student.NISN})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setReportStartDate('');
                        setReportEndDate('');
                        setSelectedClassForReport('all');
                        setSelectedStudentForReport('');
                      }}
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

              {/* Student Detail View */}
              {studentReportData && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">Detail Siswa: {studentReportData.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{studentReportData.totalAssessments}</div>
                      <div className="text-sm text-gray-600">Total Penilaian</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {studentReportData.scoreDistribution.find(s => s.level === 'BSB')?.count || 0}
                      </div>
                      <div className="text-sm text-gray-600">BSB</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {studentReportData.scoreDistribution.find(s => s.level === 'BSH')?.count || 0}
                      </div>
                      <div className="text-sm text-gray-600">BSH</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {studentReportData.scoreDistribution.find(s => s.level === 'MB')?.count || 0}
                      </div>
                      <div className="text-sm text-gray-600">MB</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Score Distribution */}
                    <div>
                      <h5 className="text-lg font-medium text-gray-700 mb-3">Distribusi Penilaian</h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={studentReportData.scoreDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="level" />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [`${value} (${studentReportData.scoreDistribution.find(d => d.level === name)?.percentage}%)`, 'Jumlah']} />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Student Timeline */}
                    <div>
                      <h5 className="text-lg font-medium text-gray-700 mb-3">Aktivitas Penilaian</h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={studentReportData.timelineData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip labelFormatter={(label) => `Tanggal: ${label}`} />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Assessments */}
                  <div className="mt-6">
                    <h5 className="text-lg font-medium text-gray-700 mb-3">Penilaian Terbaru</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skor</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentReportData.recentAssessments.map((assessment, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{assessment.Date}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{assessment.Category}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{assessment['Item Name']}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-900">{assessment.Score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* General Charts - only show when no specific student is selected */}
              {!selectedStudentForReport && filteredReportScores.length > 0 && (
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

              {/* Rekap Laporan per Siswa */}
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800">Rekap Laporan per Siswa</h4>
                    <p className="text-sm text-gray-600 mt-1">Ringkasan performa setiap siswa berdasarkan penilaian yang telah dilakukan</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NISN</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Penilaian</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BB</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MB</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BSH</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BSB</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penilaian Terakhir</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedStudentSummary.map((student, index) => (
                          <tr key={student.nisn} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.nisn}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-blue-600">{student.totalAssessments}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">{student.bb}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-yellow-600 font-semibold">{student.mb}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">{student.bsh}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-emerald-600 font-semibold">{student.bsb}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">{student.averageScore}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.latestDate}</td>
                          </tr>
                        ))}
                        {studentSummaryData.length === 0 && (
                          <tr>
                            <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                              Tidak ada data siswa
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Detail Penilaian - Visual Cards Layout */}
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-semibold text-gray-800">Detail Penilaian</h4>
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {filteredReportScores.length} penilaian total
                    </span>
                  </div>

                  {paginatedReportScores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedReportScores.map((score, index) => {
                        const studentName = students?.find(s => s.NISN === score['Student ID'])?.Name || score['Student ID'];
                        const scoreColor = {
                          BB: 'bg-red-100 text-red-800 border-red-200',
                          MB: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          BSH: 'bg-green-100 text-green-800 border-green-200',
                          BSB: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }[score.Score] || 'bg-gray-100 text-gray-800 border-gray-200';

                        return (
                          <div key={`${score['Student ID']}-${score.Date}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 text-sm truncate">{studentName}</h5>
                                <p className="text-xs text-gray-500">{score['Student ID']}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${scoreColor}`}>
                                {score.Score}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Kategori:</span>
                                <span className="font-medium text-gray-900">{score.Category}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Item:</span>
                                <span className="font-medium text-gray-900 truncate ml-2">{score['Item Name']}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tanggal:</span>
                                <span className="font-medium text-gray-900">{score.Date}</span>
                              </div>
                              {score.Notes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                  <span className="font-medium">Catatan:</span> {score.Notes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data penilaian</h3>
                      <p className="text-gray-500">Coba ubah filter untuk melihat data penilaian lainnya.</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalReportPages > 1 && (
                    <div className="flex justify-center items-center mt-8 space-x-2">
                      <button
                        onClick={() => setReportPage(prev => Math.max(prev - 1, 1))}
                        disabled={reportPage === 1}
                        className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        ← Sebelumnya
                      </button>

                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalReportPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalReportPages - 4, reportPage - 2)) + i;
                          if (pageNum > totalReportPages) return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setReportPage(pageNum)}
                              className={`px-3 py-2 border rounded-lg ${
                                pageNum === reportPage
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setReportPage(prev => Math.min(prev + 1, totalReportPages))}
                        disabled={reportPage === totalReportPages}
                        className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Selanjutnya →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrincipalPortal;
