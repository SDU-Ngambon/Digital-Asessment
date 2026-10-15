import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  GraduationCap,
  Key,
  User as UserIcon,
  Eye,
  EyeOff,
  Calendar,
  Sun,
  Moon,
  Shield,
  BookOpen,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleDarkMode } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Indonesian date
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError('Harap masukkan Username / NIP / NISN dan Kata Sandi.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'ID Pengguna atau Kata Sandi tidak sesuai');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 relative bg-gradient-to-br from-slate-100 via-sky-50/70 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      
      {/* Top Bar: Discreet theme toggle */}
      <div className="w-full flex justify-end items-center max-w-5xl mx-auto pt-2">
        <button
          type="button"
          onClick={toggleDarkMode}
          title="Ganti Mode Gelap / Terang"
          className="p-2.5 rounded-2xl glass-card border border-white/80 dark:border-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-xs transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Centered macOS Aqua Glass Card */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="glass-panel border border-white/80 dark:border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* macOS Window Header Chrome */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-xs inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs inline-block" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
              Smart Edu • macOS Aqua
            </span>
          </div>

          {/* Header Card */}
          <div className="text-center space-y-3 pt-1">
            {/* Glowing squircle badge with graduation cap */}
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 ring-4 ring-white/60 dark:ring-slate-800">
                <GraduationCap className="w-9 h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Akses Portal Asesmen
              </h1>
              <p className="text-[11px] font-extrabold text-sky-700 dark:text-sky-400 tracking-wider uppercase">
                PORTAL UJIAN, CBT & BANK SOAL TERPADU
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                SMK Negeri 1 Indonesia Maju • Digital Assessment
              </p>
            </div>

            {/* Date Pill Capsule */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Username Field */}
            <div className="relative">
              <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 mb-1">
                Username atau NIP / NISN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: guru.andi atau 1980..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-950 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 mb-1">
                Password Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600 dark:text-sky-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-950 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button (macOS Aqua Button) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl aqua-button text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2 shadow-md"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Masuk Akses Portal Asesmen</span>
              )}
            </button>
          </form>

          {/* Footnote Guide */}
          <div className="pt-2 text-center space-y-3">
            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium">
              Akses login diperoleh dari <b className="text-slate-950 dark:text-white">Akun Guru / Siswa</b> yang didaftarkan oleh administrator sekolah.
            </p>

            {/* Quick Demo Switcher Glass Pills */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-center gap-2 text-xs">
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">Pintasan Demo:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 hover:bg-purple-200 font-extrabold text-[11px] cursor-pointer transition-all"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('198501152010011002', 'guru123')}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 hover:bg-emerald-200 font-extrabold text-[11px] cursor-pointer transition-all"
              >
                Guru
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('0081234567', 'siswa123')}
                className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-950 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 hover:bg-sky-200 font-extrabold text-[11px] cursor-pointer transition-all"
              >
                Siswa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="w-full text-center py-3">
        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
          Aplikasi Smart Edu • Digital Assessment & CBT Mandiri © 2026
        </p>
      </div>
    </div>
  );
};
