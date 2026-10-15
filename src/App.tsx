import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { LoginPortal } from './components/auth/LoginPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { SiswaDashboard } from './components/siswa/SiswaDashboard';
import { Server, ShieldCheck, Heart } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">Memuat Sistem Asesmen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPortal />;
  }

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100 transition-colors">
      {/* macOS Aqua Dynamic Ambient Light Orbs (Floating Background Glow) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 select-none">
        {/* Top-Left Vibrant Ocean Blue Orb */}
        <div className="absolute -top-24 -left-20 w-[520px] h-[520px] rounded-full bg-blue-600/40 dark:bg-sky-500/25 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Top-Right Bright Turquoise / Fresh Cyan Orb */}
        <div className="absolute top-8 -right-24 w-[560px] h-[560px] rounded-full bg-cyan-400/50 dark:bg-cyan-400/20 blur-3xl animate-pulse" style={{ animationDuration: '11s' }} />
        {/* Center-Left Soft Indigo / Purple Orb */}
        <div className="absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full bg-indigo-500/35 dark:bg-purple-600/20 blur-3xl" />
        {/* Center-Right Vivid Teal / Emerald Orb */}
        <div className="absolute top-2/3 right-1/6 w-[520px] h-[520px] rounded-full bg-teal-400/45 dark:bg-teal-500/20 blur-3xl" />
        {/* Bottom Ocean / Deep Cyan Orb */}
        <div className="absolute -bottom-24 left-1/3 w-[560px] h-[560px] rounded-full bg-sky-500/40 dark:bg-blue-600/20 blur-3xl" />
      </div>

      {user.role === 'ADMIN' && <AdminDashboard />}
      {user.role === 'GURU' && <GuruDashboard />}
      {user.role === 'SISWA' && <SiswaDashboard />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
