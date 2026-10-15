import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import {
  GraduationCap,
  LogOut,
  Moon,
  Sun,
  Palette,
  Shield,
  UserCheck,
  BookOpen,
  Server,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, setUserDirectly } = useAuth();
  const { theme, setTheme } = useTheme();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'ADMINISTRATOR',
          bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: <Shield className="w-3.5 h-3.5" />,
        };
      case 'GURU':
        return {
          label: 'PORTAL GURU',
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: <BookOpen className="w-3.5 h-3.5" />,
        };
      case 'SISWA':
        return {
          label: 'PORTAL SISWA',
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: <UserCheck className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: role,
          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          icon: null,
        };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors bg-white/85 dark:bg-gray-900/85 border-gray-200 dark:border-gray-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & School Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Digital Assessment
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">
                CBT & AI
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate max-w-xs">
              SMK Negeri 1 Indonesia Maju
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher for seamless testing */}
          {user && (
            <div className="hidden lg:flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
              <span className="text-[11px] text-gray-400 px-2 font-medium">Beralih Demo:</span>
              <button
                onClick={() =>
                  setUserDirectly({
                    id: 'd0000000-0000-0000-0000-000000000001',
                    username: 'admin',
                    namaLengkap: 'Administrator Utama',
                    role: 'ADMIN',
                  })
                }
                className={`px-2 py-1 rounded transition-colors ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Admin
              </button>
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
                className={`px-2 py-1 rounded transition-colors ${
                  user.role === 'GURU'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Guru
              </button>
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
                className={`px-2 py-1 rounded transition-colors ${
                  user.role === 'SISWA'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Siswa
              </button>
            </div>
          )}

          {/* Theme Selector Dropdown */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(['light', 'dark', 'emerald', 'midnight'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setTheme(m)}
                title={`Tema ${m}`}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  theme === m
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs font-medium'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {m === 'light' && <Sun className="w-4 h-4" />}
                {m === 'dark' && <Moon className="w-4 h-4" />}
                {m === 'emerald' && <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block" />}
                {m === 'midnight' && <span className="w-4 h-4 rounded-full bg-indigo-600 inline-block" />}
              </button>
            ))}
          </div>

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-800">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                  {user.namaLengkap}
                </div>
                {badge && (
                  <div className="flex items-center justify-end gap-1 text-[11px] font-medium">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${badge.bg}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                title="Keluar dari Portal"
                className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
