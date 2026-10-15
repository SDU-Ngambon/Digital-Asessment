import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Activity,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Edit3,
  Upload,
  FileSpreadsheet,
  Printer,
  Key,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  UserX,
  Send,
  Eye,
  Sliders,
  LogOut,
  Sun,
  Moon,
  GraduationCap,
  Layers,
  ChevronDown,
  Camera,
  Check,
  Award,
  Bell,
  Smartphone,
  Shield,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import {
  generateAiQuestionsApi,
  importWordQuestionsApi,
  saveBankSoalApi,
  getBankSoalListApi,
  getJadwalListApi,
  createJadwalApi,
  getLiveMonitorApi,
  resetLoginStudentApi,
  generateNewTokenApi,
  forceSubmitStudentApi,
  exportToExcel,
  printPdfReport,
} from '../../services/api';
import { Soal, BankSoal, JadwalAsesmen, PesertaAsesmen } from '../../types';

export const GuruDashboard: React.FC = () => {
  const { user, logout, setUserDirectly } = useAuth();
  const { theme, toggleDarkMode } = useTheme();
  const isDark = theme === 'dark';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'ai-generator' | 'bank-soal' | 'jadwal' | 'monitor' | 'laporan' | 'profil'>('ai-generator');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Live WIB Clock & Date
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

  // AI Generator Form States
  const [aiMapel, setAiMapel] = useState('Matematika Wajib');
  const [aiMateri, setAiMateri] = useState('Persamaan Eksponen dan Logaritma');
  const [aiJumlahSoal, setAiJumlahSoal] = useState(10);
  const [aiTipeSoal, setAiTipeSoal] = useState<'PG' | 'CEKLIST' | 'BENAR_SALAH' | 'CAMPURAN'>('PG');
  const [aiKisiKisi, setAiKisiKisi] = useState(
    '1. Menentukan penyelesaian persamaan eksponensial sederhana.\n2. Menggunakan sifat-sifat logaritma basis 10 dan natural.\n3. Pemodelan pertumbuhan fungsi eksponensial.'
  );
  const [aiTingkatKelas, setAiTingkatKelas] = useState('10');
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedSoal, setGeneratedSoal] = useState<Soal[]>([]);
  const [aiSaveSuccess, setAiSaveSuccess] = useState<string | null>(null);

  // Bank Soal States
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([]);
  const [selectedBankSoalId, setSelectedBankSoalId] = useState('');

  // Word Import States
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Jadwal & Pemaketan States
  const [jadwalList, setJadwalList] = useState<JadwalAsesmen[]>([]);
  const [showNewJadwalModal, setShowNewJadwalModal] = useState(false);
  const [namaUjian, setNamaUjian] = useState('');
  const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState('1');
  const [selectedRombelIds, setSelectedRombelIds] = useState<string[]>(['c0000000-0000-0000-0000-000000000001']);
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [tipeWaktu, setTipeWaktu] = useState<'DINAMIS' | 'TERJADWAL_KAKU'>('DINAMIS');
  const [gunakanToken, setGunakanToken] = useState(true);
  const [tanggalUjian, setTanggalUjian] = useState(new Date().toISOString().split('T')[0]);
  const [jamUjian, setJamUjian] = useState('08:00');

  // Live Monitor States
  const [monitoredJadwalId, setMonitoredJadwalId] = useState<string>('');
  const [liveData, setLiveData] = useState<{ jadwal?: JadwalAsesmen; peserta?: PesertaAsesmen[]; summary?: any }>({});
  const [monitorRefreshing, setMonitorRefreshing] = useState(false);

  useEffect(() => {
    loadBankSoal();
    loadJadwal();
  }, []);

  const loadBankSoal = async () => {
    try {
      const list = await getBankSoalListApi();
      setBankSoalList(list);
      if (list.length > 0 && !selectedBankSoalId) {
        setSelectedBankSoalId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadJadwal = async () => {
    try {
      const list = await getJadwalListApi();
      setJadwalList(list);
      if (list.length > 0 && !monitoredJadwalId) {
        setMonitoredJadwalId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Poll live monitor if tab is monitor
  useEffect(() => {
    if (activeTab === 'monitor' && monitoredJadwalId) {
      refreshLiveMonitor();
      const interval = setInterval(refreshLiveMonitor, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, monitoredJadwalId]);

  const refreshLiveMonitor = async () => {
    if (!monitoredJadwalId) return;
    setMonitorRefreshing(true);
    try {
      const res = await getLiveMonitorApi(monitoredJadwalId);
      if (res.success) {
        setLiveData(res);
      }
    } finally {
      setMonitorRefreshing(false);
    }
  };

  // Generate Soal AI
  const handleGenerateAi = async () => {
    setAiLoading(true);
    setAiSaveSuccess(null);
    try {
      const res = await generateAiQuestionsApi({
        mapel: aiMapel,
        materi: aiMateri,
        jumlahSoal: aiJumlahSoal,
        tipeSoal: aiTipeSoal,
        kisiKisi: aiKisiKisi,
        tingkatKelas: aiTingkatKelas,
      });
      if (res.success) {
        setGeneratedSoal(res.soalList);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal generate soal AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Simpan ke Bank Soal
  const handleSaveToBankSoal = async () => {
    if (generatedSoal.length === 0) return;
    try {
      const res = await saveBankSoalApi({
        judul: `Bank Soal: ${aiMateri}`,
        mapelId: 'b0000000-0000-0000-0000-000000000001',
        guruId: user?.id,
        tingkat: aiTingkatKelas,
        soalList: generatedSoal,
        kisiKisi: aiKisiKisi,
      });
      setAiSaveSuccess(res.message);
      loadBankSoal();
      setTimeout(() => setAiSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan ke bank soal');
    }
  };

  // Import Word
  const handleImportWord = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    try {
      const res = await importWordQuestionsApi({ textContent: importText, mapel: aiMapel });
      if (res.success) {
        setGeneratedSoal(res.soalList);
        setShowImportModal(false);
        setActiveTab('ai-generator');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal import format Word');
    } finally {
      setImportLoading(false);
    }
  };

  // Buat Jadwal
  const handleCreateJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJadwalApi({
        namaUjian: namaUjian || `Ujian ${aiMapel}`,
        jenisAsesmenId: selectedJenisAsesmen,
        bankSoalId: selectedBankSoalId,
        guruId: user?.id,
        targetRombelIds: selectedRombelIds,
        tanggalMulai: tanggalUjian,
        jamMulai: jamUjian,
        durasiMenit,
        tipeWaktu,
        gunakanToken,
      });
      setShowNewJadwalModal(false);
      loadJadwal();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat jadwal');
    }
  };

  // Kontrol Live
  const handleResetLogin = async (siswaId: string) => {
    if (!confirm('Reset sesi login siswa ini agar dapat masuk kembali?')) return;
    await resetLoginStudentApi(monitoredJadwalId, siswaId);
    refreshLiveMonitor();
  };

  const handleGenerateNewToken = async () => {
    const res = await generateNewTokenApi(monitoredJadwalId);
    if (res.success) {
      refreshLiveMonitor();
      alert(`Token ujian baru berhasil diterbitkan: ${res.tokenUjian}`);
    }
  };

  const handleForceSubmit = async (siswaId: string) => {
    if (!confirm('Selesaikan ujian siswa ini secara paksa? Jawaban saat ini akan dinilai.')) return;
    await forceSubmitStudentApi(monitoredJadwalId, siswaId);
    refreshLiveMonitor();
  };

  // Initial of teacher
  const userInitial = user?.namaLengkap ? user.namaLengkap.charAt(0).toUpperCase() : 'G';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors text-slate-800 dark:text-slate-100">
      
      {/* =========================================================================
          1. MOBILE VIEW CONTAINER (< 768px - IDENTIK REFERENSI GAMBAR 3)
      ========================================================================= */}
      <div className="md:hidden flex-1 flex flex-col p-4 pb-24">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/20">
              {userInitial}
            </div>
            <div>
              <div className="text-xs text-slate-400">Selamat Malam 👋</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                {user?.namaLengkap}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-semibold text-[10px]">
                  {aiMapel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                  T.A. 2026/2027
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Card Emerald Gradient (Identik Referensi Gambar 3) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-900/20 mb-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-2 font-semibold">
              <GraduationCap className="w-4 h-4 text-emerald-200" />
              <span>PENUGASAN ASESMEN HARI INI</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-medium">
              {formattedDate.split(',')[0]}
            </span>
          </div>

          <div className="text-xs text-emerald-100 mb-1">Status Pelaksanaan CBT</div>
          <div className="text-3xl font-extrabold tracking-tight mb-4 tabular-nums">
            {jadwalList.filter((j) => j.status === 'AKTIF').length} Ujian Aktif
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-center text-[11px]">
            <div>
              <div className="text-emerald-200 text-[10px]">Bank Soal</div>
              <div className="font-bold text-sm mt-0.5 tabular-nums">{bankSoalList.length} Paket</div>
            </div>
            <div className="border-x border-white/15">
              <div className="text-emerald-200 text-[10px]">Peserta Ujian</div>
              <div className="font-bold text-sm mt-0.5 tabular-nums">{liveData.peserta?.length || 0} Siswa</div>
            </div>
            <div>
              <div className="text-emerald-200 text-[10px]">Soal Tergenerate</div>
              <div className="font-bold text-sm mt-0.5 tabular-nums">{generatedSoal.length} Butir</div>
            </div>
          </div>
        </div>

        {/* Menu Utama & Pintasan (Grid 2 Kolom dengan Squircle Warna-warni) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Menu Utama & Pintasan</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              6 Layanan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('ai-generator')}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs ${
                activeTab === 'ai-generator' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Generator Soal AI</span>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold">
                Perangkat
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bank-soal')}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs ${
                activeTab === 'bank-soal' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2 shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Bank Soal Guru</span>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 text-[10px] font-semibold">
                Paket Soal
              </span>
            </button>

            <button
              onClick={() => setActiveTab('jadwal')}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs ${
                activeTab === 'jadwal' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Jadwal Asesmen</span>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                Utama
              </span>
            </button>

            <button
              onClick={() => setActiveTab('monitor')}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs ${
                activeTab === 'monitor' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 shadow-xs">
                <Activity className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Live Monitoring</span>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold">
                Kontrol Ujian
              </span>
            </button>

            <button
              onClick={() => setActiveTab('laporan')}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs ${
                activeTab === 'laporan' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Rekapitulasi Nilai</span>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold">
                Laporan
              </span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Import Word (.docx)</span>
              <span className="mt-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold">
                Dokumen
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Bottom Floating Nav */}
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex items-center justify-around">
          <button
            onClick={() => setActiveTab('ai-generator')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold ${
              activeTab === 'ai-generator' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Soal</span>
          </button>
          <button
            onClick={() => setActiveTab('bank-soal')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold ${
              activeTab === 'bank-soal' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bank Soal</span>
          </button>
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold ${
              activeTab === 'jadwal' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal</span>
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold ${
              activeTab === 'monitor' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Monitor</span>
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-semibold ${
              activeTab === 'laporan' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nilai</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. DESKTOP SIDEBAR KIRI (macOS AQUA GLASS - COLLAPSIBLE)
      ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 glass-panel border-r border-white/60 dark:border-white/10 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Header Sidebar: macOS Traffic Lights, Brand & Collapse Toggle */}
          {/* Header Sidebar: macOS Traffic Lights, Brand & Collapse Toggle */}
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
                    Smart Edu • Guru
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {userInitial}
                </div>
                <div className="overflow-hidden">
                  <div className={`font-black text-xs ${isDark ? 'text-white' : 'text-[#091322]'} truncate`}>
                    {user?.namaLengkap}
                  </div>
                  <div className="text-[10px] text-sky-800 dark:text-sky-300 font-black truncate uppercase tracking-wide">
                    {aiMapel}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px]">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold truncate max-w-[100px]">
                  NIP: {user?.nip || user?.username}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-extrabold border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Aktif
                </span>
              </div>
            </div>
          )}

          {/* Menu Header Label */}
          {!sidebarCollapsed && (
            <div className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider px-1 pt-1">
              Navigasi Asesmen
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {[
              { id: 'ai-generator', label: 'Generator Soal AI', icon: <Sparkles className="w-4 h-4" />, badge: 'Gemini' },
              { id: 'bank-soal', label: 'Bank Soal Guru', icon: <BookOpen className="w-4 h-4" />, badge: 'Paket' },
              { id: 'jadwal', label: 'Jadwal Asesmen', icon: <Calendar className="w-4 h-4" />, badge: 'Jadwal' },
              { id: 'monitor', label: 'Live Monitoring CBT', icon: <Activity className="w-4 h-4" />, badge: 'Live' },
              { id: 'laporan', label: 'Rekap & Nilai Siswa', icon: <FileSpreadsheet className="w-4 h-4" />, badge: 'Jurnal' },
            ].map((menu) => {
              const isActive = activeTab === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveTab(menu.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'aqua-button text-white shadow-md'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white'
                  }`}
                  title={menu.label}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className={isActive ? 'text-white' : 'text-sky-600 dark:text-sky-400'}>{menu.icon}</span>
                    {!sidebarCollapsed && <span className="truncate">{menu.label}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-white/20 text-white font-extrabold'
                          : 'bg-slate-200/70 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold'
                      }`}
                    >
                      {menu.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Profil & Logout */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10 space-y-2">
          {!sidebarCollapsed && (
            <div className="text-[11px] text-slate-700 dark:text-slate-400 text-center font-bold font-mono">
              Smart Edu Aqua CBT © 2026
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Keluar Portal</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          3. MAIN CONTENT CONTAINER (DESKTOP TOP BAR & BENTO BOX CARDS)
      ========================================================================= */}
      <div className="hidden md:flex flex-1 flex-col overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="h-16 px-6 glass-panel border-b border-white/80 dark:border-white/10 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-black text-slate-950 dark:text-white text-sm">
              {activeTab === 'ai-generator' && 'Generator Soal AI (Gemini 3.8)'}
              {activeTab === 'bank-soal' && 'Bank Soal & Kurasi Asesmen'}
              {activeTab === 'jadwal' && 'Jadwal Asesmen & Pemaketan'}
              {activeTab === 'monitor' && 'Live Pengawasan Ujian CBT'}
              {activeTab === 'laporan' && 'Rekapitulasi Nilai Siswa'}
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-950 font-extrabold text-[10px] border border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-400/30">
              Akses Guru CBT
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-bold hidden xl:inline">
              • {aiMapel} • Terintegrasi Pusat Data
            </span>
          </div>

          {/* Right Header: Role Shortcuts, Periode, Clock WIB, Theme & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Shortcut: Buka Panel Admin */}
            <button
              onClick={() =>
                setUserDirectly({
                  id: 'd0000000-0000-0000-0000-000000000001',
                  username: 'admin',
                  namaLengkap: 'Administrator Utama',
                  role: 'ADMIN',
                })
              }
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-300 text-purple-950 bg-purple-100 hover:bg-purple-200 dark:border-purple-900 dark:text-purple-300 dark:bg-purple-950/40 text-xs font-bold cursor-pointer transition-colors"
              title="Beralih ke Panel Admin"
            >
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Panel Admin</span>
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
            </button>

            {/* Periode Aktif Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill border border-sky-300/80 text-sky-950 dark:text-sky-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>T.A. 2026/2027</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl glass-card border border-white/80 dark:border-white/10 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Real-time Clock WIB */}
            <div className="text-right text-xs glass-pill px-3 py-1.5 rounded-xl font-mono tabular-nums">
              <div className="font-black text-slate-950 dark:text-slate-100">{formattedClock} WIB</div>
              <div className="text-[10px] text-slate-700 dark:text-slate-300 font-sans font-bold">{formattedDate.split(',')[0]}</div>
            </div>

            {/* Logout Shortcut */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-600 bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Bento Box Layout */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Top Primary Action Pill Bar */}
          <div className="p-1.5 rounded-2xl glass-panel border border-white/80 dark:border-white/10 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ai-generator')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'ai-generator'
                    ? 'aqua-button text-white shadow-md'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60 font-bold'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Generator Soal AI Baru</span>
              </button>

              <button
                onClick={() => setActiveTab('bank-soal')}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'bank-soal'
                    ? 'aqua-button text-white shadow-md'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60 font-bold'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Koleksi Bank Soal</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pr-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-xl glass-card border border-white/90 dark:border-white/10 hover:border-sky-400 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Import Word (.docx)</span>
              </button>
            </div>
          </div>


          {/* ===================================================================
              SECTION: GENERATOR SOAL AI (BENTO BOX STRUKTUR BERURUTAN)
          =================================================================== */}
          {activeTab === 'ai-generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Bento Card 1: Informasi Pembelajaran & Parameter AI */}
              <div className="lg:col-span-5 glass-card border border-white/90 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60 dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-950 dark:text-white">
                      Parameter Generator Soal AI
                    </h3>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">Model Gemini 3.8 Flash • Standar Asesmen Kurikulum</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                      Mata Pelajaran & Jenjang Kelas
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={aiMapel}
                        onChange={(e) => setAiMapel(e.target.value)}
                        className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-700 glass-panel text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <select
                        value={aiTingkatKelas}
                        onChange={(e) => setAiTingkatKelas(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-700 glass-panel text-slate-950 dark:text-white font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                      >
                        <option value="10">Kelas 10</option>
                        <option value="11">Kelas 11</option>
                        <option value="12">Kelas 12</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                      Topik / Pokok Bahasan
                    </label>
                    <input
                      type="text"
                      value={aiMateri}
                      onChange={(e) => setAiMateri(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 glass-panel text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Jumlah Butir Soal</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold border border-sky-400/20 font-mono">
                        {aiJumlahSoal} Butir
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="5"
                      value={aiJumlahSoal}
                      onChange={(e) => setAiJumlahSoal(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>10 Soal</span>
                      <span>20 Soal</span>
                      <span>30 Soal</span>
                      <span>40 Soal</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis / Format Soal
                    </label>
                    <select
                      value={aiTipeSoal}
                      onChange={(e) => setAiTipeSoal(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 glass-panel text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="PG">Pilihan Ganda (A-E)</option>
                      <option value="CEKLIST">Pilihan Ganda Kompleks (Ceklist Multiple Correct)</option>
                      <option value="BENAR_SALAH">Benar / Salah (True/False)</option>
                      <option value="CAMPURAN">Campuran (Kombinasi Variatif)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cakupan Materi & Kisi-kisi / Indikator
                    </label>
                    <textarea
                      rows={4}
                      value={aiKisiKisi}
                      onChange={(e) => setAiKisiKisi(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300/70 dark:border-slate-700 glass-panel text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={aiLoading}
                      onClick={handleGenerateAi}
                      className="w-full py-3.5 px-4 rounded-xl aqua-button text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Gemini AI Sedang Menulis Soal...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-sky-200" />
                          <span>{generatedSoal.length > 0 ? 'Generate Ulang Butir Soal' : 'Generate Soal dengan AI'}</span>
                        </>
                      )}
                    </button>

                    {generatedSoal.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSaveToBankSoal}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400/30"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan ke Bank Soal</span>
                      </button>
                    )}
                  </div>

                  {aiSaveSuccess && (
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{aiSaveSuccess}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bento Card 2: Hasil Butir Soal & Kurasi Live */}
              <div className="lg:col-span-7 glass-card border border-white/80 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      2
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Daftar Butir Soal ({generatedSoal.length} Butir)
                      </h3>
                      <p className="text-[11px] text-slate-400">Guru dapat meninjau dan mengedit langsung setiap butir soal</p>
                    </div>
                  </div>


                  {generatedSoal.length > 0 && (
                    <button
                      onClick={() => setGeneratedSoal([])}
                      className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Bersihkan
                    </button>
                  )}
                </div>

                {generatedSoal.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Belum Ada Soal yang Di-generate
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Atur parameter di panel sebelah kiri lalu klik tombol "Generate Soal dengan AI", atau impor teks dari file Word.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                    {generatedSoal.map((soal, sIdx) => (
                      <div
                        key={soal.id || sIdx}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/40 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                              {sIdx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                              {soal.tipeSoal}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-semibold">
                              {soal.tingkatKesulitan}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 text-[11px]">
                            Kunci: {soal.kunciJawaban}
                          </span>
                        </div>

                        <textarea
                          rows={2}
                          value={soal.pertanyaan}
                          onChange={(e) => {
                            const updated = [...generatedSoal];
                            updated[sIdx].pertanyaan = e.target.value;
                            setGeneratedSoal(updated);
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                        />

                        <div className="space-y-1.5">
                          {soal.opsiJawaban?.map((opsi, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 text-xs">
                              <span
                                className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  soal.kunciJawaban === opsi.label
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {opsi.label}
                              </span>
                              <input
                                type="text"
                                value={opsi.text}
                                onChange={(e) => {
                                  const updated = [...generatedSoal];
                                  updated[sIdx].opsiJawaban[oIdx].text = e.target.value;
                                  setGeneratedSoal(updated);
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                              />
                            </div>
                          ))}
                        </div>

                        {soal.pembahasan && (
                          <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-[11px] text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                            <b>Pembahasan: </b>{soal.pembahasan}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: BANK SOAL GURU
          =================================================================== */}
          {activeTab === 'bank-soal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Koleksi Bank Soal Saya</h3>
                  <p className="text-xs text-slate-400">Paket soal siap uji untuk penilaian formatif dan sumatif</p>
                </div>
                <button
                  onClick={() => setActiveTab('ai-generator')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Buat Paket Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankSoalList.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 hover:border-blue-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {b.kodeBankSoal}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px]">
                          Kelas {b.tingkat}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{b.judul}</h4>
                      <p className="text-xs text-slate-400 mt-1">Mapel: {b.mapelNama}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-600">{b.soalList?.length || b.totalSoal} Butir Soal</span>
                      <button
                        onClick={() => {
                          setGeneratedSoal(b.soalList || []);
                          setActiveTab('ai-generator');
                        }}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Buka Soal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: JADWAL ASESMEN & PEMAKETAN
          =================================================================== */}
          {activeTab === 'jadwal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Jadwal Asesmen & Pemaketan</h3>
                  <p className="text-xs text-slate-400">Atur alokasi rombel, tanggal mulai, durasi, dan proteksi token</p>
                </div>
                <button
                  onClick={() => setShowNewJadwalModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Buat Paket Jadwal Ujian
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Nama Ujian</th>
                      <th className="px-4 py-3.5 font-semibold">Jenis</th>
                      <th className="px-4 py-3.5 font-semibold">Bank Soal</th>
                      <th className="px-4 py-3.5 font-semibold">Waktu & Durasi</th>
                      <th className="px-4 py-3.5 font-semibold">Token</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {jadwalList.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{j.namaUjian}</div>
                          <div className="font-mono text-[10px] text-slate-400">{j.kodeJadwal}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px]">
                            {j.jenisAsesmenKode}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{j.bankSoalJudul}</td>
                        <td className="px-4 py-3.5">
                          <div>{j.durasiMenit} Menit ({j.tipeWaktu})</div>
                          <div className="text-[10px] text-slate-400">{j.tanggalMulai} {j.jamMulai}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {j.gunakanToken ? (
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              {j.tokenUjian}
                            </span>
                          ) : (
                            <span className="text-slate-400">Tanpa Token</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setMonitoredJadwalId(j.id);
                              setActiveTab('monitor');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 font-bold text-[11px] cursor-pointer"
                          >
                            Monitor Live
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: LIVE MONITORING & KONTROL
          =================================================================== */}
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Pengawasan Sesi Ujian CBT Real-Time
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ujian: <b>{liveData.jadwal?.namaUjian || 'Pilih Jadwal Ujian'}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={monitoredJadwalId}
                    onChange={(e) => setMonitoredJadwalId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                  >
                    {jadwalList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.namaUjian}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleGenerateNewToken}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Rilis Token Baru</span>
                  </button>

                  <button
                    onClick={refreshLiveMonitor}
                    disabled={monitorRefreshing}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${monitorRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-400">Total Peserta</div>
                  <div className="text-xl font-bold mt-1 tabular-nums">{liveData.summary?.totalPeserta || 0}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-blue-600">Sedang Mengerjakan</div>
                  <div className="text-xl font-bold text-blue-600 mt-1 tabular-nums">{liveData.summary?.sedangMengerjakan || 0}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-emerald-600">Selesai Submit</div>
                  <div className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">{liveData.summary?.selesai || 0}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-amber-600">Token Aktif</div>
                  <div className="text-xl font-mono font-bold text-amber-600 mt-1">{liveData.jadwal?.tokenUjian || 'N/A'}</div>
                </div>
              </div>

              {/* Tabel Peserta CBT & Kontrol */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                      <th className="px-4 py-3 font-semibold">Kelas</th>
                      <th className="px-4 py-3 font-semibold">Status CBT</th>
                      <th className="px-4 py-3 font-semibold">Progres Soal</th>
                      <th className="px-4 py-3 font-semibold">Nilai Sementara</th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi Kontrol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(liveData.peserta || []).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{p.siswaNama}</div>
                          <div className="font-mono text-[10px] text-slate-400">{p.siswaNisn}</div>
                        </td>
                        <td className="px-4 py-3">{p.siswaKelas}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              p.status === 'SEDANG_MENGERJAKAN'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                                : p.status === 'SELESAI'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{p.totalDijawab} Soal Terisi</td>
                        <td className="px-4 py-3 font-bold">{p.status === 'SELESAI' ? p.nilaiAkhir : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleResetLogin(p.siswaId)}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Reset Login
                            </button>
                            {p.status === 'SEDANG_MENGERJAKAN' && (
                              <button
                                onClick={() => handleForceSubmit(p.siswaId)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <UserX className="w-3 h-3" /> Force Submit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION: REKAPITULASI NILAI & ANALISIS
          =================================================================== */}
          {activeTab === 'laporan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Rekapitulasi Nilai Asesmen</h3>
                  <p className="text-xs text-slate-400">Unduh berkas nilai format Excel (.xlsx) atau cetak PDF</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const data = (liveData.peserta || []).map((p, i) => ({
                        No: i + 1,
                        Nama: p.siswaNama,
                        NISN: p.siswaNisn,
                        Kelas: p.siswaKelas,
                        Nilai: p.nilaiAkhir,
                      }));
                      exportToExcel(data, `Rekap_Nilai_${liveData.jadwal?.kodeJadwal || 'CBT'}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Excel
                  </button>
                  <button
                    onClick={printPdfReport}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> Cetak PDF
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">No</th>
                      <th className="px-4 py-3.5 font-semibold">NISN</th>
                      <th className="px-4 py-3.5 font-semibold">Nama Siswa</th>
                      <th className="px-4 py-3.5 font-semibold">Kelas</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Nilai Akhir</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Ketuntasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(liveData.peserta || []).map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{p.siswaNisn}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{p.siswaNama}</td>
                        <td className="px-4 py-3.5">{p.siswaKelas}</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-sm">{p.nilaiAkhir}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.nilaiAkhir >= 75
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {p.nilaiAkhir >= 75 ? 'TUNTAS' : 'REMIDI'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODAL: IMPORT WORD (.DOCX)
      ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Import Soal dari Word</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Contoh format soal Word:
1. Hasil perhitungan 2^4 adalah...
A. 8
B. 16
C. 32
D. 64
E. 128
Kunci: B`}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importLoading || !importText.trim()}
                onClick={handleImportWord}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {importLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Proses & Simpan Soal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: BUAT JADWAL UJIAN
      ========================================================================= */}
      {showNewJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Buat Paket Jadwal Asesmen</h3>
              <button onClick={() => setShowNewJadwalModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateJadwal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Ujian</label>
                <input
                  type="text"
                  value={namaUjian}
                  onChange={(e) => setNamaUjian(e.target.value)}
                  placeholder="e.g. Penilaian Harian Matematika Bab 1"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Pilih Bank Soal</label>
                <select
                  value={selectedBankSoalId}
                  onChange={(e) => setSelectedBankSoalId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  {bankSoalList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.judul} ({b.soalList?.length || b.totalSoal} Soal)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(Number(e.target.value))}
                    min="15"
                    max="180"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tipe Waktu</label>
                  <select
                    value={tipeWaktu}
                    onChange={(e) => setTipeWaktu(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="DINAMIS">Dinamis (Fleksibel Mulai)</option>
                    <option value="TERJADWAL_KAKU">Terjadwal Kaku (Sinkron)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tokenCheck"
                  checked={gunakanToken}
                  onChange={(e) => setGunakanToken(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="tokenCheck" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Wajibkan Token Ujian (Disampaikan pengawas saat ujian mulai)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewJadwalModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan & Rilis Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
