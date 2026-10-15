import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Maximize2,
  PanelRightClose,
  PanelRightOpen,
  LayoutGrid,
  Bookmark,
  Sparkles,
  Award,
} from 'lucide-react';
import { Soal, JadwalAsesmen } from '../../types';

interface CBTExamRoomProps {
  jadwal: JadwalAsesmen;
  soalList: Soal[];
  siswaId: string;
  onFinishExam: (answers: Record<string, { jawaban: string; isRagu: boolean }>, remainingSeconds: number) => void;
  onExit: () => void;
}

export const CBTExamRoom: React.FC<CBTExamRoomProps> = ({
  jadwal,
  soalList,
  siswaId,
  onFinishExam,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, { jawaban: string; isRagu: boolean }>>(() => {
    const saved = localStorage.getItem(`cbt_ans_${jadwal.id}_${siswaId}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Timer in seconds
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = localStorage.getItem(`cbt_time_${jadwal.id}_${siswaId}`);
    return savedTime ? parseInt(savedTime, 10) : jadwal.durasiMenit * 60;
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-save answers to localStorage
  useEffect(() => {
    localStorage.setItem(`cbt_ans_${jadwal.id}_${siswaId}`, JSON.stringify(answers));
  }, [answers, jadwal.id, siswaId]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        localStorage.setItem(`cbt_time_${jadwal.id}_${siswaId}`, next.toString());
        if (next <= 0) {
          clearInterval(interval);
          handleFinalSubmit();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSoal = soalList[currentIndex] || soalList[0];
  const currentAnswer = answers[currentSoal?.id] || { jawaban: '', isRagu: false };

  const handleSelectOption = (label: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentSoal.id]: {
        jawaban: label,
        isRagu: prev[currentSoal.id]?.isRagu || false,
      },
    }));
  };

  const handleToggleRagu = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentSoal.id]: {
        jawaban: prev[currentSoal.id]?.jawaban || '',
        isRagu: !prev[currentSoal.id]?.isRagu,
      },
    }));
  };

  const handleFinalSubmit = () => {
    localStorage.removeItem(`cbt_ans_${jadwal.id}_${siswaId}`);
    localStorage.removeItem(`cbt_time_${jadwal.id}_${siswaId}`);
    onFinishExam(answers, timeLeft);
  };

  const answeredCount = Object.values(answers).filter((a) => a.jawaban).length;
  const raguCount = Object.values(answers).filter((a) => a.isRagu).length;
  const unansweredCount = soalList.length - answeredCount;

  // Toggle fullscreen for distraction-free mode
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Timer style calculation based on urgency
  const getTimerStyle = () => {
    if (timeLeft < 300) {
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 animate-pulse ring-2 ring-rose-500/30';
    }
    if (timeLeft < 600) {
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20';
    }
    return 'bg-white/80 dark:bg-slate-900/80 text-sky-700 dark:text-sky-300 border-white/80 dark:border-white/15';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden font-sans bg-gradient-to-br from-slate-100 via-sky-50/60 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* =========================================================================
          1. macOS AQUA WINDOW HEADER & FLOATING GLASS PILL TIMER
      ========================================================================= */}
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 glass-panel border-b border-white/60 dark:border-white/10 z-30 relative">
        {/* Left: macOS Traffic Lights & Assessment Identity */}
        <div className="flex items-center gap-3.5">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs inline-block" title="Tutup / Batal" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs inline-block" title="Minimalisir" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs inline-block" title="Perluas" />
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-tight text-slate-950 dark:text-white">
                {jadwal.namaUjian}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/10 dark:text-sky-300 uppercase tracking-wider">
                Aqua CBT
              </span>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2 font-bold">
              <span className="font-mono">Token: {jadwal.tokenUjian || jadwal.kodeJadwal}</span>
              <span>•</span>
              <span>Soal #{currentIndex + 1} dari {soalList.length}</span>
            </div>
          </div>
        </div>

        {/* Center: Floating Glass Pill Countdown Timer */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2.5">
          <div
            className={`glass-pill px-4 sm:px-5 py-1.5 sm:py-2 rounded-full flex items-center gap-2 font-mono font-extrabold text-sm sm:text-base shadow-lg transition-all duration-300 ${getTimerStyle()}`}
          >
            <Clock className="w-4 h-4 animate-spin-slow text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="tabular-nums tracking-wide">{formatTimer(timeLeft)}</span>
            <span className="text-[10px] uppercase font-sans font-semibold tracking-wider opacity-70 hidden md:inline">
              Sisa Waktu
            </span>
          </div>
        </div>

        {/* Right: Palette Toggle, Fullscreen, and Finish Button */}
        <div className="flex items-center gap-2">
          {/* Palette Sidebar Toggle */}
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            title={isPaletteOpen ? 'Sembunyikan Panel Nomor Soal' : 'Tampilkan Panel Nomor Soal'}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isPaletteOpen
                ? 'bg-sky-100 dark:bg-sky-500/15 border-sky-300 dark:border-sky-400/40 text-sky-950 dark:text-sky-300 shadow-xs'
                : 'glass-card border-white/80 dark:border-white/10 text-slate-800 dark:text-slate-300 hover:text-sky-700'
            }`}
          >
            {isPaletteOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullScreen}
            title="Layar Penuh"
            className="p-2 rounded-xl glass-card border-white/80 dark:border-white/10 text-slate-800 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer hidden md:flex items-center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Selesai / Kumpulkan Ujian Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-rose-500/25 border border-rose-400/40 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kumpulkan</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN EXAM BODY (EXPANDABLE SOAL & COLLAPSIBLE GRID PALETTE)
      ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left / Center Area: Question Canvas (Distraction-Free) */}
        <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Question Card (High-Legibility Frosted Glass Card) */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/90 dark:border-white/10 shadow-xl space-y-6">
              
              {/* Question Header & Ragu-Ragu Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-xl aqua-button text-white font-black text-xs tracking-wider shadow-sm">
                    SOAL #{currentIndex + 1}
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                    Bobot: {currentSoal?.bobotNilai || 10} Poin
                  </span>
                </div>

                <label
                  className={`flex items-center gap-2 cursor-pointer text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
                    currentAnswer.isRagu
                      ? 'bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-400/20 dark:border-amber-400 dark:text-amber-300 shadow-sm'
                      : 'bg-white/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={currentAnswer.isRagu}
                    onChange={handleToggleRagu}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Ragu-Ragu</span>
                </label>
              </div>

              {/* Question Stimulus / Question Content Text */}
              <div className="text-base sm:text-lg text-slate-950 dark:text-slate-50 font-semibold leading-relaxed whitespace-pre-line tracking-normal">
                {currentSoal?.pertanyaan}
              </div>

              {/* Answer Options Grid (macOS Aqua Rounded Cards) */}
              <div className="space-y-3 pt-2">
                {currentSoal?.opsiJawaban?.map((opsi) => {
                  const isSelected = currentAnswer.jawaban === opsi.label;
                  return (
                    <button
                      key={opsi.label}
                      onClick={() => handleSelectOption(opsi.label)}
                      className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-100 dark:bg-sky-500/20 border-sky-400 dark:border-sky-400/80 ring-2 ring-sky-400/30 text-slate-950 dark:text-white shadow-md shadow-sky-500/10'
                          : 'bg-white/90 dark:bg-slate-800/60 border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-sky-300 dark:hover:border-sky-600/80 hover:bg-sky-50/50 dark:hover:bg-slate-800/90'
                      }`}
                    >
                      {/* Option Letter Indicator */}
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'aqua-button text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-300 border border-slate-300/80 dark:border-white/10'
                        }`}
                      >
                        {opsi.label}
                      </span>

                      {/* Option Content Text */}
                      <span className="text-sm sm:text-base pt-0.5 leading-relaxed font-medium flex-1">
                        {opsi.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Navigation Controls */}
            <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-white/80 dark:border-white/10 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-800 dark:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              {/* Question Position Badge */}
              <div className="px-3.5 py-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800/70 text-xs font-mono font-black text-slate-900 dark:text-slate-200 tabular-nums">
                {currentIndex + 1} / {soalList.length}
              </div>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, soalList.length - 1))}
                disabled={currentIndex === soalList.length - 1}
                className="px-4 sm:px-5 py-2.5 rounded-xl aqua-button text-white text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Right Area: Collapsible Question Navigation Palette */}
        {isPaletteOpen && (
          <aside className="w-80 lg:w-96 border-l border-white/80 dark:border-white/10 glass-panel p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              
              {/* Palette Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 font-black text-sm text-slate-950 dark:text-white">
                  <LayoutGrid className="w-4 h-4 text-sky-600" />
                  <span>Daftar Nomor Soal</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-950 dark:bg-sky-500/10 dark:text-sky-300 font-black font-mono border border-sky-300">
                  {soalList.length} Butir
                </span>
              </div>

              {/* Status Mini Bento Legend */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-black text-center">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30">
                  <div className="font-black text-base tabular-nums font-mono">{answeredCount}</div>
                  <div>Terjawab</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-950 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30">
                  <div className="font-black text-base tabular-nums font-mono">{raguCount}</div>
                  <div>Ragu-ragu</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-200/80 text-slate-800 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-300 dark:border-white/10">
                  <div className="font-black text-base tabular-nums font-mono">{unansweredCount}</div>
                  <div>Belum Isi</div>
                </div>
              </div>

              {/* Grid Number Palette Buttons */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {soalList.map((s, idx) => {
                  const ans = answers[s.id];
                  const isAnswered = ans && ans.jawaban;
                  const isRagu = ans && ans.isRagu;
                  const isCurrent = idx === currentIndex;

                  let btnStyle = 'glass-card border-slate-300/80 dark:border-white/10 text-slate-800 dark:text-slate-300 hover:border-sky-400 font-black';

                  if (isRagu) {
                    btnStyle = 'bg-amber-400 text-slate-950 font-black border-amber-500 shadow-sm shadow-amber-500/20';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-600 text-white font-black border-emerald-700 shadow-sm shadow-emerald-500/20';
                  }

                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105';
                  }

                  return (
                    <button
                      key={s.id || idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-11 rounded-xl border text-xs font-black flex flex-col items-center justify-center relative transition-all duration-150 active:scale-95 cursor-pointer ${btnStyle}`}
                    >
                      <span className="leading-none">{idx + 1}</span>
                      {isAnswered && (
                        <span className="text-[9px] font-mono leading-none mt-0.5 opacity-90">{ans.jawaban}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Palette Submission Button */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan & Selesaikan Ujian</span>
              </button>
              <p className="text-[10px] text-center text-slate-600 dark:text-slate-400 font-medium">
                Sistem penilaian otomatis CBT siap memproses jawaban Anda.
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================================
          3. macOS FROSTED CONFIRMATION MODAL
      ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel border border-white/90 dark:border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center shadow-inner border border-sky-400/30">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                Konfirmasi Kumpulkan Ujian
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Periksa kembali rekapitulasi butir jawaban sebelum mengakhiri sesi ujian CBT ini.
              </p>
            </div>

            {/* Answer Summary Card */}
            <div className="p-4 rounded-2xl glass-card border border-white/80 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Total Butir Soal:</span>
                <span className="font-black text-slate-950 dark:text-white font-mono tabular-nums">{soalList.length} Soal</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                <span className="text-emerald-800 dark:text-emerald-400 font-bold">Sudah Terjawab:</span>
                <span className="font-black text-emerald-800 dark:text-emerald-400 font-mono tabular-nums">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                <span className="text-amber-800 dark:text-amber-400 font-bold">Masih Ragu-Ragu:</span>
                <span className="font-black text-amber-800 dark:text-amber-400 font-mono tabular-nums">{raguCount} Soal</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-rose-800 dark:text-rose-400 font-bold">Belum Terisi:</span>
                <span className="font-black text-rose-800 dark:text-rose-400 font-mono tabular-nums">{unansweredCount} Soal</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 dark:bg-rose-500/10 dark:border-rose-900 text-[11px] text-rose-950 dark:text-rose-400 text-center font-bold">
                Perhatian: Masih terdapat {unansweredCount} butir soal yang belum Anda jawab!
              </div>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-800 dark:text-slate-200 transition-all"
              >
                Kembali Mengerjakan
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] text-white text-xs font-black shadow-md shadow-rose-600/25 cursor-pointer border border-rose-400/30 transition-all"
              >
                Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
