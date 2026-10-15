import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar,
  Clock,
  Key,
  Play,
  CheckCircle2,
  Award,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  BookOpen,
  Check,
  Zap,
} from 'lucide-react';
import { getJadwalListApi, getBankSoalListApi, submitCbtExamApi } from '../../services/api';
import { JadwalAsesmen, Soal, BankSoal } from '../../types';
import { CBTExamRoom } from './CBTExamRoom';

export const SiswaDashboard: React.FC = () => {
  const { user, logout, setUserDirectly } = useAuth();
  const { theme, toggleDarkMode } = useTheme();

  const [jadwalList, setJadwalList] = useState<JadwalAsesmen[]>([]);
  const [bankList, setBankList] = useState<BankSoal[]>([]);
  const [activeTab, setActiveTab] = useState<'aktif' | 'akan-datang' | 'selesai'>('aktif');

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedClock = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);

  // Exam execution state
  const [activeExam, setActiveExam] = useState<JadwalAsesmen | null>(null);
  const [activeSoalList, setActiveSoalList] = useState<Soal[]>([]);

  // Token Modal states
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [targetJadwal, setTargetJadwal] = useState<JadwalAsesmen | null>(null);
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Result state
  const [examResult, setExamResult] = useState<{
    jadwal: JadwalAsesmen;
    hasil: any;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jList, bList] = await Promise.all([getJadwalListApi(), getBankSoalListApi()]);
      setJadwalList(jList);
      setBankList(bList);
    } catch (e) {
      console.error(e);
    }
  };

  const activeSchedules = jadwalList.filter((j) => j.status === 'AKTIF');
  const upcomingSchedules = jadwalList.filter((j) => j.status === 'DRAFT');
  const finishedSchedules = jadwalList.filter((j) => j.status === 'SELESAI');

  const handleStartExamClick = (jadwal: JadwalAsesmen) => {
    setTargetJadwal(jadwal);
    setInputToken('');
    setTokenError(null);
    if (jadwal.gunakanToken || (jadwal as any).use_token) {
      setShowTokenModal(true);
    } else {
      launchExam(jadwal);
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetJadwal) return;

    const correctToken = targetJadwal.tokenUjian || (targetJadwal as any).exam_token || 'EXPO99';

    if (inputToken.trim().toUpperCase() !== correctToken.toUpperCase()) {
      setTokenError(`Token ujian tidak valid. Mintalah token ke pengawas ujian.`);
      return;
    }

    setShowTokenModal(false);
    launchExam(targetJadwal);
  };

  const launchExam = (jadwal: JadwalAsesmen) => {
    const bank = bankList.find((b) => b.id === (jadwal.bankSoalId || (jadwal as any).bank_id));
    let soals = bank?.soalList || [];

    if (soals.length === 0) {
      soals = [
        {
          id: 'soal-1',
          nomorUrut: 1,
          tipeSoal: 'PG',
          pertanyaan: 'Manakah dari berikut yang merupakan tujuan utama pelaksanaan asesmen digital terintegrasi?',
          opsiJawaban: [
            { label: 'A', text: 'Efisiensi penilaian instan dan analisis butir soal objektif' },
            { label: 'B', text: 'Memerlukan cetak kertas ujian fisik dalam jumlah banyak' },
            { label: 'C', text: 'Hanya dapat dikerjakan secara manual di luar kelas' },
            { label: 'D', text: 'Tidak mendukung fitur acak soal dan opsi' },
            { label: 'E', text: 'Memperlambat pelaporan nilai siswa' },
          ],
          kunciJawaban: 'A',
          bobotNilai: 10,
          tingkatKesulitan: 'MUDAH',
          pembahasan: 'Asesmen CBT memberikan evaluasi instan dan efisien.',
        },
      ];
    }

    setActiveExam(jadwal);
    setActiveSoalList(soals);
  };

  const handleFinishExam = async (
    answers: Record<string, { jawaban: string; isRagu: boolean }>,
    remainingSeconds: number
  ) => {
    if (!activeExam || !user) return;

    try {
      const res = await submitCbtExamApi({
        jadwalId: activeExam.id,
        siswaId: user.id,
        jawabanDetail: answers,
        sisaWaktuDetik: remainingSeconds,
      });

      setActiveExam(null);
      setExamResult({
        jadwal: activeExam,
        hasil: res.hasil,
      });
      loadData();
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan jawaban ujian');
    }
  };

  // If currently taking exam in CBT Room
  if (activeExam) {
    return (
      <CBTExamRoom
        jadwal={activeExam}
        soalList={activeSoalList}
        siswaId={user?.id || 'siswa-1'}
        onFinishExam={handleFinishExam}
        onExit={() => setActiveExam(null)}
      />
    );
  }

  const userInitial = user?.namaLengkap ? user.namaLengkap.charAt(0).toUpperCase() : 'S';

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* =========================================================================
          macOS AQUA TOP NAVIGATION BAR
      ========================================================================= */}
      <header className="h-16 px-4 sm:px-8 glass-panel border-b border-white/60 dark:border-white/10 flex items-center justify-between sticky top-0 z-30">
        
        {/* Left: Window Controls + App Identity */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs inline-block" />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm text-slate-950 dark:text-white leading-tight flex items-center gap-1.5">
                <span>Smart Edu CBT</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 uppercase">
                  Siswa
                </span>
              </div>
              <div className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">SMK Negeri 1 Indonesia Maju</div>
            </div>
          </div>
        </div>

        {/* Right: Demo Shortcuts, User Chip, Clock, Theme, Logout */}
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
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-300 text-purple-950 bg-purple-100 hover:bg-purple-200 dark:border-purple-900 dark:text-purple-300 dark:bg-purple-950/40 text-xs font-bold cursor-pointer transition-all"
            title="Beralih ke Panel Admin"
          >
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            <span>Panel Admin</span>
          </button>

          {/* Shortcut: Buka Akses Guru */}
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
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 text-amber-950 bg-amber-100 hover:bg-amber-200 dark:border-amber-900 dark:text-amber-300 dark:bg-amber-950/40 text-xs font-bold cursor-pointer transition-all"
            title="Beralih ke Akses Guru"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Akses Guru</span>
          </button>

          {/* User Profile Glass Pill */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl glass-card border border-white/90 dark:border-white/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {userInitial}
            </div>
            <div className="text-left text-xs">
              <div className="font-black text-slate-950 dark:text-white truncate max-w-[130px]">
                {user?.namaLengkap}
              </div>
              <div className="text-[10px] text-slate-700 dark:text-slate-300 font-mono font-bold">
                NISN: {user?.nisn || user?.username} • {user?.kelas || 'X-MIPA-1'}
              </div>
            </div>
          </div>

          {/* Real-Time Clock WIB Glass Pill */}
          <div className="hidden md:flex items-center gap-1.5 text-right text-xs glass-pill px-3 py-1.5 rounded-xl font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="font-black text-slate-950 dark:text-slate-100">{formattedClock} WIB</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl glass-card border border-white/80 dark:border-white/10 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer"
            title="Ganti Mode Gelap / Terang"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-rose-700 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/60 hover:bg-rose-200 transition-colors cursor-pointer"
            title="Keluar dari Akun Siswa"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN STUDENT CONTENT CANVAS
      ========================================================================= */}
      <main className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6 flex-1">
        
        {/* Welcome Glass Card Banner */}
        <div className="p-6 sm:p-7 rounded-3xl glass-card border border-white/90 dark:border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-black mb-1 border border-sky-300 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/20">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Selamat Datang, {user?.namaLengkap}
            </h1>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xl leading-relaxed">
              Rombel: <span className="font-black text-slate-950 dark:text-slate-100">{user?.kelas || 'X-MIPA-1'}</span> • Pastikan koneksi internet stabil dan mintalah token ujian kepada bapak/ibu pengawas sebelum memulai.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-400/30 text-xs font-black flex items-center gap-2 self-start md:self-auto shrink-0 z-10 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Akun Siap Ujian CBT</span>
          </div>
        </div>

        {/* macOS Style Glass Segmented Tab Controls */}
        <div className="p-1 rounded-2xl glass-panel border border-white/80 dark:border-white/10 flex gap-1 shadow-sm max-w-md">
          <button
            onClick={() => setActiveTab('aktif')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'aktif'
                ? 'aqua-button text-white shadow-md'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-bold'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Ujian Aktif ({activeSchedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('akan-datang')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'akan-datang'
                ? 'aqua-button text-white shadow-md'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-bold'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Akan Datang ({upcomingSchedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('selesai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'selesai'
                ? 'aqua-button text-white shadow-md'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white font-bold'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Riwayat ({finishedSchedules.length})</span>
          </button>
        </div>

        {/* Announcement Result Card if just submitted */}
        {examResult && (
          <div className="p-6 sm:p-7 rounded-3xl glass-card border-2 border-emerald-500/80 shadow-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-400/30">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Ujian Berhasil Diselesaikan
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {examResult.jadwal.namaUjian}
                </h3>
              </div>
            </div>

            {/* Bento Grid Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl glass-panel border border-white/70 dark:border-white/10">
                <div className="text-xs text-slate-700 dark:text-slate-300 font-bold">Nilai Akhir</div>
                <div className="text-3xl font-black text-sky-800 dark:text-sky-400 mt-1 tabular-nums font-mono">
                  {examResult.hasil.tampilkanNilai ? examResult.hasil.nilaiAkhir : '—'}
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-panel border border-white/70 dark:border-white/10">
                <div className="text-xs text-emerald-800 dark:text-emerald-400 font-bold">Jawaban Benar</div>
                <div className="text-3xl font-black text-emerald-800 dark:text-emerald-400 mt-1 tabular-nums font-mono">
                  {examResult.hasil.totalBenar}
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-panel border border-white/70 dark:border-white/10">
                <div className="text-xs text-rose-800 dark:text-rose-400 font-bold">Jawaban Salah</div>
                <div className="text-3xl font-black text-rose-800 dark:text-rose-400 mt-1 tabular-nums font-mono">
                  {examResult.hasil.totalSalah}
                </div>
              </div>
              <div className="p-4 rounded-2xl glass-panel border border-white/70 dark:border-white/10">
                <div className="text-xs text-slate-700 dark:text-slate-300 font-bold">Total Soal</div>
                <div className="text-3xl font-black text-slate-950 dark:text-slate-200 mt-1 tabular-nums font-mono">
                  {examResult.hasil.totalSoal}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setExamResult(null)}
                className="px-5 py-2.5 rounded-xl aqua-button text-white font-extrabold text-xs"
              >
                Tutup Pengumuman
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 1: UJIAN AKTIF (BENTO GRID CARDS)
        ===================================================================== */}
        {activeTab === 'aktif' && (
          <div className="space-y-4">
            {activeSchedules.length === 0 ? (
              <div className="p-12 text-center rounded-3xl glass-card border border-white/90 dark:border-white/10 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                <h3 className="font-black text-slate-950 dark:text-slate-100 text-sm">Tidak Ada Ujian Aktif Saat Ini</h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Silakan tanyakan kepada bapak/ibu guru pengawas untuk pembukaan sesi asesmen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSchedules.map((j) => (
                  <div
                    key={j.id}
                    className="p-6 rounded-3xl glass-card border border-white/90 dark:border-white/10 shadow-lg space-y-4 hover:border-sky-400 dark:hover:border-sky-500/60 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/10 dark:text-sky-300">
                          {j.kodeJadwal}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          SIAP DIKERJAKAN
                        </span>
                      </div>

                      <h3 className="font-black text-base text-slate-950 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                        {j.namaUjian}
                      </h3>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Guru Pengampu: <span className="font-bold text-slate-900 dark:text-white">{j.guruNama}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-800 dark:text-slate-200 font-bold">
                        <div className="p-2.5 rounded-xl glass-panel border border-white/80 dark:border-white/10 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>{j.durasiMenit} Menit</span>
                        </div>
                        <div className="p-2.5 rounded-xl glass-panel border border-white/80 dark:border-white/10 flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{j.gunakanToken ? 'Perlu Token' : 'Tanpa Token'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-700 dark:text-slate-400 font-mono font-bold">
                        {j.tipeWaktu === 'DINAMIS' ? 'Fleksibel' : 'Terjadwal'}
                      </span>
                      <button
                        onClick={() => handleStartExamClick(j)}
                        className="px-5 py-2.5 rounded-xl aqua-button text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Play className="w-4 h-4" />
                        <span>Mulai Ujian</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AKAN DATANG */}
        {activeTab === 'akan-datang' && (
          <div className="p-12 text-center rounded-3xl glass-card border border-white/80 dark:border-white/10 space-y-2">
            <Calendar className="w-10 h-10 text-sky-600 dark:text-sky-400 mx-auto" />
            <h3 className="font-black text-sm text-slate-950 dark:text-slate-100">Belum Ada Jadwal Ujian Mendatang</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Jadwal baru akan muncul otomatis ketika guru memaketkan sesi ujian.</p>
          </div>
        )}

        {/* TAB 3: SELESAI */}
        {activeTab === 'selesai' && (
          <div className="p-12 text-center rounded-3xl glass-card border border-white/80 dark:border-white/10 space-y-2">
            <Award className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-black text-sm text-slate-950 dark:text-slate-100">Riwayat Penilaian Asesmen</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Hasil penilaian yang telah disetujui guru pengampu akan tercatat di sini.</p>
          </div>
        )}
      </main>

      {/* =========================================================================
          macOS AQUA GLASS TOKEN VERIFICATION MODAL
      ========================================================================= */}
      {showTokenModal && targetJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-white/90 dark:border-white/15 rounded-3xl max-w-sm w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-2">
              <div className="w-13 h-13 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-400/30 shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                Verifikasi Token Ujian
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Ujian <b className="text-slate-950 dark:text-white">{targetJadwal.namaUjian}</b> memerlukan token akses resmi dari pengawas ruangan.
              </p>
            </div>

            {tokenError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs text-center font-bold">
                {tokenError}
              </div>
            )}

            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                  placeholder="Ketik Token (e.g. EXPO99)"
                  className="w-full text-center tracking-widest font-mono text-xl py-3 px-4 rounded-xl border border-slate-300/80 dark:border-slate-700 glass-card font-black focus:ring-2 focus:ring-sky-500 outline-none uppercase text-slate-950 dark:text-white"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl aqua-button text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Mulai Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
