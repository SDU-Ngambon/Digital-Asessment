import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Database,
  Users,
  Settings,
  BookOpen,
  Activity,
  FileText,
  Code,
  RefreshCw,
  UserPlus,
  Key,
  Download,
  Copy,
  Check,
  CheckCircle2,
  School,
  FileSpreadsheet,
  Printer,
  Sliders,
  ShieldAlert,
  Server,
  Layers,
  Globe,
  Radio,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  LogOut,
  Sun,
  Moon,
  Clock,
  Eye,
  Award,
  GraduationCap,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import {
  getPusatDataStatus,
  syncPusatDataApi,
  generateGuruAccountsApi,
  generateSiswaAccountsApi,
  resetPasswordsMassalApi,
  getBankSoalListApi,
  getJadwalListApi,
  getLiveMonitorApi,
  fetchDatabaseSqlApi,
  getAppSettingsApi,
  saveAppSettingsApi,
  testPusatDataConnectionApi,
  exportToExcel,
  printPdfReport,
} from '../../services/api';
import { BankSoal, JadwalAsesmen, PesertaAsesmen, JenisAsesmen } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { user, logout, setUserDirectly } = useAuth();
  const { theme, toggleDarkMode } = useTheme();
  const isDark = theme === 'dark';

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'pusat-data' | 'koneksi-api' | 'akun-user' | 'manajemen-asesmen' | 'bank-soal-global' | 'monitor-sekolah' | 'laporan' | 'arsitektur-ddl'
  >('dashboard');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live WIB Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);

  const formattedClock = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Pusat Data states
  const [sekolah, setSekolah] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalGuru: 0, totalSiswa: 0, totalMapel: 0, totalRombel: 0 });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Pengaturan Umum & Koneksi API Pusat Data (GUI)
  const [pusatDataUrl, setPusatDataUrl] = useState('http://192.168.7.203:5050/api/v1/sync');
  const [pusatDataApiKey, setPusatDataApiKey] = useState('bearer_token_pusat_data_cbt_2026');
  const [schoolName, setSchoolName] = useState('SMK Negeri 1 Indonesia Maju');
  const [schoolNpsn, setSchoolNpsn] = useState('20109988');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Akun User states
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [accountActionMessage, setAccountActionMessage] = useState<string | null>(null);

  // Jenis Asesmen CRUD
  const [jenisList, setJenisList] = useState<JenisAsesmen[]>([
    { id: '1', kode: 'PH', nama: 'Penilaian Harian', keterangan: 'Evaluasi formatif rutin tiap bab materi', isActive: true },
    { id: '2', kode: 'PTS', nama: 'Penilaian Tengah Semester', keterangan: 'Evaluasi sumatif pertengahan semester', isActive: true },
    { id: '3', kode: 'PAS', nama: 'Penilaian Akhir Semester', keterangan: 'Evaluasi sumatif akhir semester gasal', isActive: true },
    { id: '4', kode: 'PAT', nama: 'Penilaian Akhir Tahun', keterangan: 'Evaluasi kenaikan kelas semester genap', isActive: true },
    { id: '5', kode: 'TKA', nama: 'Simulasi Tes Kemampuan Akademik', keterangan: 'Uji coba persiapan seleksi nasional & SNBT', isActive: true },
  ]);
  const [newKodeJenis, setNewKodeJenis] = useState('');
  const [newNamaJenis, setNewNamaJenis] = useState('');

  // Global Bank Soal & School Monitor
  const [allBankSoal, setAllBankSoal] = useState<BankSoal[]>([]);
  const [allJadwal, setAllJadwal] = useState<JadwalAsesmen[]>([]);
  const [selectedJadwalMonitor, setSelectedJadwalMonitor] = useState<string>('');
  const [monitorData, setMonitorData] = useState<{ jadwal?: JadwalAsesmen; peserta?: PesertaAsesmen[]; summary?: any }>({});

  // Architecture & DDL
  const [databaseSql, setDatabaseSql] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    loadPusatData();
    loadAppSettings();
    loadBankSoal();
    loadJadwal();
    loadSql();
  }, []);

  const loadAppSettings = async () => {
    try {
      const res = await getAppSettingsApi();
      if (res.success && res.settings) {
        if (res.settings.PUSAT_DATA_URL) setPusatDataUrl(res.settings.PUSAT_DATA_URL);
        if (res.settings.PUSAT_DATA_API_KEY) setPusatDataApiKey(res.settings.PUSAT_DATA_API_KEY);
        if (res.settings.SCHOOL_NAME) setSchoolName(res.settings.SCHOOL_NAME);
        if (res.settings.SCHOOL_NPSN) setSchoolNpsn(res.settings.SCHOOL_NPSN);
      }
    } catch (e) {
      console.warn('Menggunakan pengaturan bawaan', e);
    }
  };

  const loadPusatData = async () => {
    try {
      const res = await getPusatDataStatus();
      if (res.success) {
        setSekolah(res.sekolah);
        setStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBankSoal = async () => {
    try {
      const list = await getBankSoalListApi();
      setAllBankSoal(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadJadwal = async () => {
    try {
      const list = await getJadwalListApi();
      setAllJadwal(list);
      if (list.length > 0 && !selectedJadwalMonitor) {
        setSelectedJadwalMonitor(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSql = async () => {
    try {
      const sql = await fetchDatabaseSqlApi();
      setDatabaseSql(sql);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedJadwalMonitor) {
      fetchMonitorData();
    }
  }, [selectedJadwalMonitor]);

  const fetchMonitorData = async () => {
    if (!selectedJadwalMonitor) return;
    try {
      const res = await getLiveMonitorApi(selectedJadwalMonitor);
      if (res.success) setMonitorData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // Uji Koneksi API Pusat Data (GUI)
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testPusatDataConnectionApi(pusatDataUrl, pusatDataApiKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi endpoint Pusat Data.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Simpan Pengaturan Koneksi API Pusat Data (GUI)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMessage(null);
    try {
      const res = await saveAppSettingsApi({
        PUSAT_DATA_URL: pusatDataUrl,
        PUSAT_DATA_API_KEY: pusatDataApiKey,
        SCHOOL_NAME: schoolName,
        SCHOOL_NPSN: schoolNpsn,
      });
      setSaveMessage(res.message || 'Pengaturan berhasil disimpan ke tabel app_settings!');
      setTimeout(() => setSaveMessage(null), 4000);
      loadPusatData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSavingSettings(false);
    }
  };

  // Sync Pusat Data
  const handleSyncPusatData = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncPusatDataApi();
      setSyncMessage(res.message);
      loadPusatData();
    } catch (err: any) {
      alert(err.message || 'Gagal sinkronisasi');
    } finally {
      setSyncing(false);
    }
  };

  // Akun User Actions
  const handleGenerateGuru = async () => {
    setAccountActionLoading(true);
    try {
      const res = await generateGuruAccountsApi();
      setAccountActionMessage(res.message);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleGenerateSiswa = async () => {
    setAccountActionLoading(true);
    try {
      const res = await generateSiswaAccountsApi();
      setAccountActionMessage(res.message);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleResetPassword = async (role: 'GURU' | 'SISWA' | 'SEMUA') => {
    if (!confirm(`Konfirmasi reset password massal untuk kelompok ${role}?`)) return;
    setAccountActionLoading(true);
    try {
      const res = await resetPasswordsMassalApi(role);
      setAccountActionMessage(res.message);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(databaseSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([databaseSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.sql';
    a.click();
  };

  // Filtered Participants based on search query
  const participants = monitorData.peserta || [];
  const filteredParticipants = participants.filter(
    (p) =>
      p.siswaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.siswaNisn.includes(searchQuery) ||
      p.siswaKelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDark ? 'text-slate-100' : 'text-[#091322]'} transition-colors`}>
      
      {/* =========================================================================
          1. MOBILE TOP BAR & DRAWER (< 768px - RESPONSIVE SMARTPHONE)
      ========================================================================= */}
      <div className="md:hidden sticky top-0 z-40 glass-panel border-b border-white/80 dark:border-white/10 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {/* macOS Traffic Lights */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs inline-block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'} leading-tight`}>Smart Edu • Admin</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700'} font-bold font-mono`}>macOS Aqua Panel</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl glass-card border border-white/80 dark:border-white/10 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
            title="Ganti Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-xl glass-card border border-white/80 dark:border-white/10 ${isDark ? 'text-slate-100' : 'text-[#091322]'}`}
            title="Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-slate-950/40 backdrop-blur-md p-4 overflow-y-auto animate-in slide-in-from-top-4 duration-200">
          <div className="glass-panel border border-white/90 dark:border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl max-w-sm mx-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
              <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Navigasi Admin CBT</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300 font-extrabold border border-sky-300/80 dark:border-sky-400/30">
                {formattedClock} WIB
              </span>
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'dashboard', label: 'Dashboard & Analisis', icon: <Layers className="w-4 h-4" /> },
                { id: 'monitor-sekolah', label: 'Live Monitoring CBT', icon: <Activity className="w-4 h-4 text-rose-500" /> },
                { id: 'pusat-data', label: 'Pusat Data Master', icon: <Database className="w-4 h-4 text-sky-600" /> },
                { id: 'akun-user', label: 'Otomasi Akun User', icon: <Users className="w-4 h-4 text-emerald-600" /> },
                { id: 'bank-soal-global', label: 'Bank Soal Global', icon: <BookOpen className="w-4 h-4 text-amber-600" /> },
                { id: 'manajemen-asesmen', label: 'Pengaturan Jenis Asesmen', icon: <Sliders className="w-4 h-4 text-purple-600" /> },
                { id: 'laporan', label: 'Rekap Nilai Siswa', icon: <FileText className="w-4 h-4 text-teal-600" /> },
                { id: 'koneksi-api', label: 'Koneksi Pusat Data (GUI)', icon: <Globe className="w-4 h-4 text-blue-600" /> },
                { id: 'arsitektur-ddl', label: 'Database PostgreSQL', icon: <Code className="w-4 h-4 text-indigo-600" /> },
              ].map((m) => {
                const isActive = activeTab === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveTab(m.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'aqua-button text-white shadow-md'
                        : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/10'
                        : 'text-slate-800 hover:text-[#091322] hover:bg-white/80'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Portal Switchers */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setUserDirectly({
                    id: 'd0000000-0000-0000-0000-000000000002',
                    username: '198501152010011002',
                    namaLengkap: 'Budi Santoso, M.Pd.',
                    role: 'GURU',
                    nip: '198501152010011002',
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900 text-xs font-bold cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Buka Akses Guru</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setUserDirectly({
                    id: 'd0000000-0000-0000-0000-000000000004',
                    username: '0081234567',
                    namaLengkap: 'Ahmad Rizky Pratama',
                    role: 'SISWA',
                    nisn: '0081234567',
                    kelas: 'X-MIPA-1',
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 text-xs font-bold cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Buka Portal Siswa</span>
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. DESKTOP SIDEBAR KIRI (macOS AQUA GLASS - COLLAPSIBLE)
      ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 glass-panel border-r border-white/80 dark:border-white/10 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Header Sidebar: macOS Traffic Lights & Collapse Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
            <div className={`flex items-center gap-2.5 overflow-hidden ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-white/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs inline-block" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              {!sidebarCollapsed && (
                <div>
                  <div className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'} leading-tight`}>
                    Smart Edu • Admin
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700'} font-bold font-mono`}>macOS Aqua Panel</div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className={`p-1.5 rounded-xl ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-700 hover:text-black hover:bg-white/80'} cursor-pointer transition-all`}
                title="Ciutkan Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className={`w-full py-1.5 text-center ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-700 hover:text-black hover:bg-white/80'} rounded-xl cursor-pointer transition-all`}
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          )}

          {/* User Identity Card */}
          {!sidebarCollapsed && (
            <div className="rounded-2xl glass-card border border-white/90 dark:border-white/10 p-3.5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  A
                </div>
                <div className="overflow-hidden">
                  <div className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'} truncate`}>
                    {user?.namaLengkap || 'Administrator Utama'}
                  </div>
                  <div className="text-[10px] text-sky-800 dark:text-sky-300 font-black uppercase tracking-wide truncate">
                    Super Admin CBT
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px]">
                <span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} truncate max-w-[100px]`}>
                  SMK N 1
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30 font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
          )}

          {/* Collapsible Sections / Nav Items */}
          <nav className="space-y-3.5 text-xs font-semibold">
            {/* 1. Main Dashboard */}
            <div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'aqua-button text-white shadow-md font-black'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                    : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard & Analisis</span>}
              </button>
            </div>

            {/* 2. DATA MASTER */}
            <div>
              {!sidebarCollapsed && (
                <div className={`text-[10px] font-black ${isDark ? 'text-slate-400' : 'text-slate-800'} uppercase tracking-wider px-3 mb-1`}>
                  Data Master
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('pusat-data')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'pusat-data'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Pusat Data Master"
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 shrink-0 text-sky-600" />
                    {!sidebarCollapsed && <span>Pusat Data Master</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>

                <button
                  onClick={() => setActiveTab('akun-user')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'akun-user'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Otomasi Akun User"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0 text-emerald-600" />
                    {!sidebarCollapsed && <span>Otomasi Akun User</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              </div>
            </div>

            {/* 3. ATUR ASESMEN */}
            <div>
              {!sidebarCollapsed && (
                <div className={`text-[10px] font-black ${isDark ? 'text-slate-400' : 'text-slate-800'} uppercase tracking-wider px-3 mb-1`}>
                  Asesmen & CBT
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('monitor-sekolah')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'monitor-sekolah'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Live Monitoring CBT"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 shrink-0 text-rose-500" />
                    {!sidebarCollapsed && <span>Live Monitoring CBT</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>

                <button
                  onClick={() => setActiveTab('bank-soal-global')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'bank-soal-global'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Bank Soal Global"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 shrink-0 text-amber-600" />
                    {!sidebarCollapsed && <span>Bank Soal Global</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>

                <button
                  onClick={() => setActiveTab('manajemen-asesmen')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'manajemen-asesmen'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Jenis Asesmen"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 shrink-0 text-purple-600" />
                    {!sidebarCollapsed && <span>Jenis Asesmen</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              </div>
            </div>

            {/* 4. PENGATURAN UMUM & POSTGRESQL */}
            <div>
              {!sidebarCollapsed && (
                <div className={`text-[10px] font-black ${isDark ? 'text-slate-400' : 'text-slate-800'} uppercase tracking-wider px-3 mb-1`}>
                  Integrasi & Database
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('laporan')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'laporan'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Rekap Nilai Siswa"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 shrink-0 text-teal-600" />
                    {!sidebarCollapsed && <span>Rekap Nilai Siswa</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>

                <button
                  onClick={() => setActiveTab('koneksi-api')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'koneksi-api'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Koneksi Pusat Data (GUI)"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 shrink-0 text-sky-600" />
                    {!sidebarCollapsed && <span>Koneksi Pusat Data</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>

                <button
                  onClick={() => setActiveTab('arsitektur-ddl')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === 'arsitektur-ddl'
                      ? 'aqua-button text-white shadow-md font-black'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                      : 'text-slate-800 hover:text-[#091322] hover:bg-white/80 font-bold'
                  }`}
                  title="Database PostgreSQL"
                >
                  <div className="flex items-center gap-2.5">
                    <Code className="w-4 h-4 shrink-0 text-indigo-600" />
                    {!sidebarCollapsed && <span>Database PostgreSQL</span>}
                  </div>
                  {!sidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Sign Out */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 space-y-2">
          {!sidebarCollapsed && (
            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-700'} text-center font-bold font-mono`}>
              Smart Edu Aqua CBT © 2026
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. MAIN CONTENT CONTAINER (DESKTOP TOP BAR & BENTO BOX CARDS)
      ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 glass-panel border-b border-white/80 dark:border-white/10 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-[#091322]'}`}>
              {activeTab === 'dashboard' && 'Dashboard Monitoring & Analisis Asesmen'}
              {activeTab === 'pusat-data' && 'Pusat Data Master Sekolah'}
              {activeTab === 'akun-user' && 'Otomasi Akun Guru & Siswa'}
              {activeTab === 'monitor-sekolah' && 'Live Pengawasan Ujian CBT'}
              {activeTab === 'bank-soal-global' && 'Bank Soal Global Seluruh Guru'}
              {activeTab === 'manajemen-asesmen' && 'Pengaturan Kategori & API Asesmen'}
              {activeTab === 'laporan' && 'Rekapitulasi Nilai Asesmen Siswa'}
              {activeTab === 'koneksi-api' && 'Koneksi API Pusat Data (GUI Settings)'}
              {activeTab === 'arsitektur-ddl' && 'Arsitektur Relasional & DDL PostgreSQL'}
            </span>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-400/30 font-extrabold text-[10px] uppercase tracking-wider hidden sm:inline">
              Super Admin CBT
            </span>
          </div>

          {/* Right Header Shortcut Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Shortcut: Buka Portal Guru */}
            <button
              onClick={() =>
                setUserDirectly({
                  id: 'd0000000-0000-0000-0000-000000000002',
                  username: '198501152010011002',
                  namaLengkap: 'Budi Santoso, M.Pd.',
                  role: 'GURU',
                  nip: '198501152010011002',
                })
              }
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 text-amber-950 bg-amber-100 hover:bg-amber-200 dark:border-amber-900 dark:text-amber-300 dark:bg-amber-950/40 text-xs font-bold cursor-pointer transition-colors"
              title="Beralih ke Portal Guru"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Akses Guru</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>

            {/* Shortcut: Buka Portal Siswa */}
            <button
              onClick={() =>
                setUserDirectly({
                  id: 'd0000000-0000-0000-0000-000000000004',
                  username: '0081234567',
                  namaLengkap: 'Ahmad Rizky Pratama',
                  role: 'SISWA',
                  nisn: '0081234567',
                  kelas: 'X-MIPA-1',
                })
              }
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-950 bg-emerald-100 hover:bg-emerald-200 dark:border-emerald-900 dark:text-emerald-300 dark:bg-emerald-950/40 text-xs font-bold cursor-pointer transition-colors"
              title="Beralih ke Portal Siswa"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Portal Siswa</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>

            {/* Shortcut: Koneksi Pusat Data */}
            <button
              onClick={() => setActiveTab('koneksi-api')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl aqua-button text-white text-xs font-black shadow-sm cursor-pointer transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Koneksi Pusat Data</span>
            </button>

            {/* Real-time Clock WIB Glass Pill */}
            <div className={`hidden lg:flex items-center gap-1.5 text-right text-xs glass-pill px-3 py-1.5 rounded-xl font-mono tabular-nums ${isDark ? 'text-slate-100' : 'text-[#091322]'}`}>
              <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="font-black">{formattedClock} WIB</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl glass-card border border-white/80 dark:border-white/10 ${isDark ? 'text-slate-200 hover:text-white' : 'text-slate-800 hover:text-black'} transition-all cursor-pointer`}
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-900/60 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">

          {/* ===================================================================
              HERO MONITORING BANNER (macOS AQUA FROSTED GLASS BANNER)
          =================================================================== */}
          <div className="rounded-3xl glass-card border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                    Monitoring & Analisis Asesmen
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE SYNC
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium max-w-xl leading-relaxed`}>
                  Dashboard terpadu pemantauan asesmen siswa dan real-time CBT pelaksanaan ujian di SMK Negeri 1 Indonesia Maju.
                </p>
              </div>

              {/* Date Filter & Refresh Button */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl glass-pill border border-white/90 dark:border-white/10 text-xs font-mono font-bold ${isDark ? 'text-slate-100' : 'text-[#091322]'} shadow-xs`}>
                  <span>{formattedDate.split(',')[0]}</span>
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </div>

                <button
                  onClick={fetchMonitorData}
                  className="px-4 py-2 rounded-xl aqua-button text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Live Ticker Line */}
            <div className={`pt-3 border-t border-slate-200/70 dark:border-white/5 flex flex-wrap items-center justify-between text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <div>
                Data sinkronisasi: <span className={`${isDark ? 'text-slate-100' : 'text-[#091322]'} font-bold`}>{formattedDate}</span> • Terakhir diperbarui <span className="text-sky-700 dark:text-sky-300 font-mono font-black">{formattedClock} WIB</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Auto-Refresh (30 detik): Aktif</span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              4-KOLOM METRIC CARDS (BENTO GRID GLASSMORPHISM)
          =================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: KEHADIRAN / SISWA MENGIKUTI */}
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-5 shadow-lg space-y-3 hover:border-sky-400 transition-all">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-800'} uppercase tracking-wider`}>
                  PESERTA MENGIKUTI
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-950 dark:bg-sky-500/15 dark:text-sky-300 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#091322]'} tabular-nums font-mono`}>
                  {participants.filter((p) => p.status === 'SEDANG_MENGERJAKAN' || p.status === 'SELESAI').length} <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>/ {stats.totalSiswa || 23}</span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-800'} flex justify-between mt-1`}>
                  <span className="font-bold">Tingkat Partisipasi</span>
                  <span className="font-black text-sky-800 dark:text-sky-400">65.2%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full w-[65%]" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-extrabold">
                  {participants.filter((p) => p.status === 'SELESAI').length} Selesai
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-extrabold">
                  {participants.filter((p) => p.status === 'SEDANG_MENGERJAKAN').length} Sedang Ujian
                </span>
              </div>
            </div>

            {/* Card 2: GURU MEMBUAT ASESMEN */}
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-5 shadow-lg space-y-3 hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-800'} uppercase tracking-wider`}>
                  GURU PEMBUAT ASESMEN
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#091322]'} tabular-nums font-mono`}>
                  {stats.totalGuru || 3} <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Guru</span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-800'} flex justify-between mt-1`}>
                  <span className="font-bold">Total Jam Asesmen</span>
                  <span className="font-black text-emerald-800 dark:text-emerald-400">60 Menit / Sesi</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-extrabold">
                  {allBankSoal.length} Bank Soal Aktif
                </span>
                <span className={`${isDark ? 'text-slate-300' : 'text-slate-800'} font-black`}>Terverifikasi</span>
              </div>
            </div>

            {/* Card 3: KETERISIAN KELAS (ROMBEL) */}
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-5 shadow-lg space-y-3 hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-800'} uppercase tracking-wider`}>
                  KETERISIAN ROMBEL
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-950 dark:bg-purple-500/15 dark:text-purple-300 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#091322]'} tabular-nums font-mono`}>
                  {stats.totalRombel || 4} <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>/ 4 Kelas</span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-800'} flex justify-between mt-1`}>
                  <span className="font-bold">Cakupan Kelas</span>
                  <span className="font-black text-purple-800 dark:text-purple-400">100.0%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-full" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-extrabold">
                  Semua Rombel Terpetakan
                </span>
              </div>
            </div>

            {/* Card 4: STATUS SESI & TOKEN */}
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-5 shadow-lg space-y-3 hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-800'} uppercase tracking-wider`}>
                  SESI UJIAN AKTIF
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-950 dark:bg-amber-500/15 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#091322]'} tabular-nums font-mono`}>
                  {allJadwal.filter((j) => j.status === 'AKTIF').length} <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Paket Ujian</span>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-800'} flex justify-between mt-1`}>
                  <span className="font-bold">Token Terkini:</span>
                  <span className={`font-mono font-black ${isDark ? 'text-amber-300' : 'text-amber-950'}`}>
                    {monitorData.jadwal?.tokenUjian || 'EXPO99'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-full" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-extrabold">
                  Proteksi CBT Aktif
                </span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              TAB MONITORING & SEARCH BOX (BENTO GRID GLASSMORPHISM)
          =================================================================== */}
          {(activeTab === 'dashboard' || activeTab === 'monitor-sekolah' || activeTab === 'laporan') && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 shadow-xl overflow-hidden space-y-4 p-5 sm:p-6">
              
              {/* Header Tabs with Integrated Search on Right */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="p-1 rounded-2xl segmented-control flex items-center gap-1 shadow-inner overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'aqua-button text-white shadow-md'
                        : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
                    }`}
                  >
                    Ringkasan & Analisis Grafik
                  </button>

                  <button
                    onClick={() => setActiveTab('monitor-sekolah')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      activeTab === 'monitor-sekolah'
                        ? 'aqua-button text-white shadow-md'
                        : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
                    }`}
                  >
                    Live Monitoring Peserta CBT
                  </button>

                  <button
                    onClick={() => setActiveTab('laporan')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                      activeTab === 'laporan'
                        ? 'aqua-button text-white shadow-md'
                        : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-bold'
                    }`}
                  >
                    Rekapitulasi Nilai Siswa
                  </button>
                </div>

                {/* Integrated Search Input */}
                <div className="relative min-w-[260px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari guru, kelas, mapel, siswa..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-xs font-bold text-slate-950 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* TAB CONTENT: RINGKASAN & ANALISIS GRAFIK */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  {/* Chart Box 1: Tren Presensi & Pengerjaan Soal */}
                  <div className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                          Tren Ketuntasan Siswa (7 Hari Terakhir)
                        </h4>
                        <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                          Perbandingan proporsi nilai tuntas vs perlu remidi
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-300">
                        7 Hari
                      </span>
                    </div>

                    {/* Simulated Clean Chart Bars */}
                    <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                      {[
                        { day: 'Sen', tuntas: 85, remidi: 15 },
                        { day: 'Sel', tuntas: 78, remidi: 22 },
                        { day: 'Rab', tuntas: 92, remidi: 8 },
                        { day: 'Kam', tuntas: 88, remidi: 12 },
                        { day: 'Jum', tuntas: 95, remidi: 5 },
                        { day: 'Sab', tuntas: 80, remidi: 20 },
                        { day: 'Min', tuntas: 90, remidi: 10 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="w-full flex items-end gap-1 h-32 justify-center">
                            <div
                              style={{ height: `${bar.tuntas}%` }}
                              className="w-3 rounded-t-sm bg-emerald-500"
                              title={`Tuntas: ${bar.tuntas}%`}
                            />
                            <div
                              style={{ height: `${bar.remidi}%` }}
                              className="w-3 rounded-t-sm bg-amber-400"
                              title={`Remidi: ${bar.remidi}%`}
                            />
                          </div>
                          <span className={`text-[10px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-mono font-bold`}>{bar.day}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs font-extrabold pt-1">
                      <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tuntas
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Remidi
                      </span>
                    </div>
                  </div>

                  {/* Chart Box 2: Distribusi Mapel Asesmen */}
                  <div className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                          Distribusi Paket Asesmen per Tingkat
                        </h4>
                        <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                          Total jam pelaksanaan asesmen CBT di setiap tingkatan kelas
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className={`flex justify-between text-xs font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-[#091322]'}`}>
                          <span>Kelas 10 (Fase E)</span>
                          <span className="text-sky-700 dark:text-sky-400 font-extrabold">12 Paket Ujian</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-600 rounded-full w-[80%]" />
                        </div>
                      </div>

                      <div>
                        <div className={`flex justify-between text-xs font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-[#091322]'}`}>
                          <span>Kelas 11 (Fase F)</span>
                          <span className="text-indigo-700 dark:text-indigo-400 font-extrabold">9 Paket Ujian</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full w-[65%]" />
                        </div>
                      </div>

                      <div>
                        <div className={`flex justify-between text-xs font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-[#091322]'}`}>
                          <span>Kelas 12 (Kelulusan & SNBT)</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">15 Paket Ujian</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full w-[95%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: LIVE MONITORING SISWA */}
              {(activeTab === 'monitor-sekolah' || activeTab === 'dashboard') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                      Peserta Ujian Real-Time ({filteredParticipants.length} Siswa)
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedJadwalMonitor}
                        onChange={(e) => setSelectedJadwalMonitor(e.target.value)}
                        className={`px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800 ${isDark ? 'text-white' : 'text-[#091322]'} text-xs font-bold outline-none`}
                      >
                        {allJadwal.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.namaUjian}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-extrabold">Nama Siswa</th>
                          <th className="px-4 py-3 font-extrabold">NISN</th>
                          <th className="px-4 py-3 font-extrabold">Kelas</th>
                          <th className="px-4 py-3 font-extrabold">Status CBT</th>
                          <th className="px-4 py-3 font-extrabold">Soal Terisi</th>
                          <th className="px-4 py-3 font-extrabold">IP Address</th>
                          <th className="px-4 py-3 font-extrabold text-right">Nilai Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredParticipants.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className={`px-4 py-3.5 font-black ${isDark ? 'text-white' : 'text-[#091322]'}`}>{p.siswaNama}</td>
                            <td className={`px-4 py-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'} font-bold`}>{p.siswaNisn}</td>
                            <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.siswaKelas}</td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  p.status === 'SEDANG_MENGERJAKAN'
                                    ? 'bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-950 dark:text-sky-300 animate-pulse'
                                    : p.status === 'SELESAI'
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className={`px-4 py-3.5 font-extrabold ${isDark ? 'text-slate-100' : 'text-[#091322]'}`}>{p.totalDijawab} Butir</td>
                            <td className={`px-4 py-3.5 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-700'} font-semibold`}>{p.ipAddress || '192.168.1.104'}</td>
                            <td className={`px-4 py-3.5 text-right font-black text-sm tabular-nums ${isDark ? 'text-white' : 'text-[#091322]'} font-mono`}>
                              {p.status === 'SELESAI' ? p.nilaiAkhir : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: REKAPITULASI LAPORAN */}
              {activeTab === 'laporan' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>Rekapitulasi Nilai Asesmen Sekolah</h4>
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Unduh data dalam format Excel (.xlsx) atau cetak PDF</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const data = filteredParticipants.map((p, i) => ({
                            No: i + 1,
                            Nama: p.siswaNama,
                            NISN: p.siswaNisn,
                            Kelas: p.siswaKelas,
                            Nilai: p.nilaiAkhir,
                          }));
                          exportToExcel(data, 'Rekap_Asesmen_Sekolah');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Export Excel (.xlsx)
                      </button>
                      <button
                        onClick={printPdfReport}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Cetak PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              SECTION: PUSAT DATA MASTER (macOS AQUA GLASS PANEL)
          =================================================================== */}
          {activeTab === 'pusat-data' && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-950 dark:bg-sky-500/15 dark:text-sky-300 flex items-center justify-center font-bold">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                      Pusat Data Master Satuan Pendidikan
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                      Sinkronisasi otomatis master data sekolah, guru, rombongan belajar, dan mata pelajaran
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncPusatData}
                  disabled={syncing}
                  className="px-5 py-2.5 rounded-xl aqua-button text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Pusat Data'}</span>
                </button>
              </div>

              {syncMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncMessage}</span>
                </div>
              )}

              {/* School Info Bento Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl glass-card border border-white/90 dark:border-white/10 shadow-xs">
                  <div className={`text-[11px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Nama Sekolah</div>
                  <div className={`font-black ${isDark ? 'text-white' : 'text-[#091322]'} text-sm mt-1 truncate`}>{schoolName}</div>
                </div>
                <div className="p-4 rounded-2xl glass-card border border-white/90 dark:border-white/10 shadow-xs">
                  <div className={`text-[11px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>NPSN</div>
                  <div className={`font-mono font-black ${isDark ? 'text-white' : 'text-[#091322]'} text-sm mt-1`}>{schoolNpsn}</div>
                </div>
                <div className="p-4 rounded-2xl glass-card border border-white/90 dark:border-white/10 shadow-xs">
                  <div className={`text-[11px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Total Tenaga Pendidik</div>
                  <div className={`font-black ${isDark ? 'text-white' : 'text-[#091322]'} text-sm mt-1`}>{stats.totalGuru || 3} Guru Terdaftar</div>
                </div>
                <div className="p-4 rounded-2xl glass-card border border-white/90 dark:border-white/10 shadow-xs">
                  <div className={`text-[11px] font-black uppercase ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Status Server CBT</div>
                  <div className="font-black text-emerald-800 dark:text-emerald-400 text-sm mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung & Siap Ujian
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: OTOMASI AKUN USER (macOS AQUA GLASS PANEL)
          =================================================================== */}
          {activeTab === 'akun-user' && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-6">
              <div className="pb-4 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                      Otomasi & Manajemen Akun Guru & Siswa
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                      Pemberian kredensial massal berbasis NIP/NISN dan reset kata sandi instan
                    </p>
                  </div>
                </div>
              </div>

              {accountActionMessage && (
                <div className="p-3.5 rounded-2xl bg-sky-100 text-sky-950 border border-sky-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{accountActionMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-3">
                  <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>Akun Guru / Pengawas</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                    Sinkronkan dan terbitkan akun login untuk seluruh guru dengan username NIP.
                  </p>
                  <button
                    onClick={handleGenerateGuru}
                    disabled={accountActionLoading}
                    className="w-full py-2.5 rounded-xl aqua-button text-white font-black text-xs cursor-pointer disabled:opacity-50"
                  >
                    Generate Akun Guru
                  </button>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-3">
                  <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>Akun Peserta Siswa</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                    Terbitkan kredensial login siswa massal berdasarkan NISN dari rombel kelas.
                  </p>
                  <button
                    onClick={handleGenerateSiswa}
                    disabled={accountActionLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer disabled:opacity-50"
                  >
                    Generate Akun Siswa
                  </button>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-3">
                  <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>Reset Kata Sandi Massal</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                    Reset kata sandi serentak untuk rombel atau peserta yang mengalami kendala login.
                  </p>
                  <button
                    onClick={() => handleResetPassword('SEMUA')}
                    disabled={accountActionLoading}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer disabled:opacity-50"
                  >
                    Reset Password Semua
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: BANK SOAL GLOBAL (macOS AQUA GLASS PANEL)
          =================================================================== */}
          {activeTab === 'bank-soal-global' && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-950 dark:bg-amber-500/15 dark:text-amber-300 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                      Bank Soal Global Seluruh Guru
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                      Monitoring {allBankSoal.length} paket soal dan butir asesmen dari seluruh mata pelajaran
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allBankSoal.map((b) => (
                  <div key={b.id} className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 border border-sky-300">
                        {b.kodeBankSoal}
                      </span>
                      <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Kelas {b.tingkat}</span>
                    </div>
                    <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>{b.judul}</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>{b.mapelNama}</p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{b.soalList?.length || 0} Butir Soal</span>
                      <span className="text-emerald-800 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: PENGATURAN JENIS ASESMEN (macOS AQUA GLASS PANEL)
          =================================================================== */}
          {activeTab === 'manajemen-asesmen' && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-6">
              <div className="pb-4 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-950 dark:bg-purple-500/15 dark:text-purple-300 flex items-center justify-center font-bold">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                      Pengaturan Kategori & Jenis Asesmen
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                      Konfigurasi bobot, jenis ujian (Sumatif, Formatif, PTS, SAS, US), dan parameter CBT
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jenisList.map((j) => (
                  <div key={j.id} className="p-5 rounded-2xl glass-card border border-white/90 dark:border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-950 border border-purple-300">
                        {j.kode}
                      </span>
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-400">Aktif</span>
                    </div>
                    <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>{j.nama}</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{j.keterangan}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: PENGATURAN UMUM > KONEKSI PUSAT DATA GUI (AQUA GLASS)
          =================================================================== */}
          {activeTab === 'koneksi-api' && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                    Pengaturan Umum & Koneksi API Pusat Data
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Konfigurasi visual URL dan token integrasi data sekolah</p>
                </div>
              </div>

              {saveMessage && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className={`block font-black ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-1`}>
                    URL Endpoint Pusat Data
                  </label>
                  <input
                    type="text"
                    value={pusatDataUrl}
                    onChange={(e) => setPusatDataUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900 font-mono font-bold text-slate-950 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className={`block font-black ${isDark ? 'text-slate-200' : 'text-slate-800'} mb-1`}>
                    API Key / Bearer Token
                  </label>
                  <input
                    type="text"
                    value={pusatDataApiKey}
                    onChange={(e) => setPusatDataApiKey(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900 font-mono font-bold text-slate-950 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={handleTestConnection}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold cursor-pointer"
                  >
                    {testingConnection ? 'Menguji...' : 'Uji Koneksi'}
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-2.5 rounded-xl aqua-button text-white font-extrabold cursor-pointer"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </form>

              {testResult && (
                <div className="p-4 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold">
                  <div className="font-black">Hasil Uji Koneksi:</div>
                  <div>{testResult.message}</div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              SECTION: DATABASE POSTGRESQL & DOWNLOAD DDL (AQUA GLASS)
          =================================================================== */}
          {activeTab === 'arsitektur-ddl' && (
            <div className="glass-card rounded-3xl border border-white/90 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#091322]'}`}>
                    Skema Basis Data PostgreSQL (database.sql)
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>DDL skema relasional lengkap untuk server mandiri</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="px-4 py-2 rounded-xl aqua-button text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download database.sql</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px]">
                <pre>{databaseSql}</pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
