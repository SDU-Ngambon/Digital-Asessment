import * as XLSX from 'xlsx';
import {
  User,
  SekolahProfile,
  MataPelajaran,
  Rombel,
  Guru,
  Siswa,
  JenisAsesmen,
  BankSoal,
  Soal,
  JadwalAsesmen,
  PesertaAsesmen,
  AnalisisButirSoal,
} from '../types';

const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('cbt_jwt_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('cbt_jwt_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('cbt_jwt_token');
  localStorage.removeItem('cbt_user_data');
};

const getHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// =====================================================================
// AUTH API
// =====================================================================

export const loginApi = async (username: string, password: string): Promise<{ success: boolean; user: User; token: string }> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login gagal');
  }

  setAuthToken(data.token);
  localStorage.setItem('cbt_user_data', JSON.stringify(data.user));
  return data;
};

export const verifySessionApi = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      clearAuthToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    const saved = localStorage.getItem('cbt_user_data');
    return saved ? JSON.parse(saved) : null;
  }
};

// =====================================================================
// PUSAT DATA INTEGRATION & USER AUTOMATION API
// =====================================================================

export const getAppSettingsApi = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
  return res.json();
};

export const saveAppSettingsApi = async (settings: Record<string, string>): Promise<any> => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  return res.json();
};

export const testPusatDataConnectionApi = async (url: string, apiKey: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/pusat-data/test-connection`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ url, apiKey }),
  });
  return res.json();
};

export const getPusatDataStatus = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/pusat-data/status`, { headers: getHeaders() });
  return res.json();
};

export const syncPusatDataApi = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/pusat-data/sync`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal sinkronisasi');
  return data;
};

export const generateGuruAccountsApi = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/users/generate-guru`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
};

export const generateSiswaAccountsApi = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/users/generate-siswa`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
};

export const resetPasswordsMassalApi = async (role: 'GURU' | 'SISWA' | 'SEMUA'): Promise<any> => {
  const res = await fetch(`${API_BASE}/users/reset-passwords-massal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });
  return res.json();
};

// =====================================================================
// AI QUESTION GENERATOR API
// =====================================================================

export const generateAiQuestionsApi = async (params: {
  mapel: string;
  materi: string;
  jumlahSoal: number;
  tipeSoal: 'PG' | 'CEKLIST' | 'BENAR_SALAH' | 'CAMPURAN';
  kisiKisi: string;
  tingkatKelas?: string;
}): Promise<{ success: boolean; message: string; soalList: Soal[] }> => {
  const res = await fetch(`${API_BASE}/ai/generate-questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal membuat soal via AI');
  return data;
};

// =====================================================================
// IMPORT WORD (.DOCX) API
// =====================================================================

export const importWordQuestionsApi = async (payload: {
  textContent?: string;
  base64Docx?: string;
  mapel?: string;
}): Promise<{ success: boolean; message: string; soalList: Soal[] }> => {
  const res = await fetch(`${API_BASE}/import/word`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal import dokumen Word');
  return data;
};

// =====================================================================
// BANK SOAL API
// =====================================================================

export const getBankSoalListApi = async (): Promise<BankSoal[]> => {
  const res = await fetch(`${API_BASE}/bank-soal`, { headers: getHeaders() });
  const data = await res.json();
  return data.data || [];
};

export const saveBankSoalApi = async (bankSoalData: Partial<BankSoal>): Promise<any> => {
  const res = await fetch(`${API_BASE}/bank-soal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bankSoalData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan bank soal');
  return data;
};

// =====================================================================
// JADWAL ASESMEN & CBT MONITORING (LIVE CONTROL) API
// =====================================================================

export const getJadwalListApi = async (): Promise<JadwalAsesmen[]> => {
  const res = await fetch(`${API_BASE}/jadwal`, { headers: getHeaders() });
  const data = await res.json();
  return data.data || [];
};

export const createJadwalApi = async (jadwalData: any): Promise<any> => {
  const res = await fetch(`${API_BASE}/jadwal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(jadwalData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal membuat jadwal');
  return data;
};

export const getLiveMonitorApi = async (jadwalId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/jadwal/${jadwalId}/monitor`, { headers: getHeaders() });
  return res.json();
};

export const resetLoginStudentApi = async (jadwalId: string, siswaId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/jadwal/${jadwalId}/reset-login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ siswaId }),
  });
  return res.json();
};

export const generateNewTokenApi = async (jadwalId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/jadwal/${jadwalId}/new-token`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
};

export const forceSubmitStudentApi = async (jadwalId: string, siswaId: string): Promise<any> => {
  const res = await fetch(`${API_BASE}/jadwal/${jadwalId}/force-submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ siswaId }),
  });
  return res.json();
};

export const submitCbtExamApi = async (payload: {
  jadwalId: string;
  siswaId: string;
  jawabanDetail: Record<string, { jawaban: string; isRagu: boolean }>;
  sisaWaktuDetik: number;
}): Promise<any> => {
  const res = await fetch(`${API_BASE}/cbt/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const fetchDatabaseSqlApi = async (): Promise<string> => {
  const res = await fetch(`${API_BASE}/database-sql`);
  const data = await res.json();
  return data.sql || '-- Database SQL DDL Not Found';
};

// =====================================================================
// EXPORT EXCEL & PDF UTILITIES
// =====================================================================

export const exportToExcel = (data: any[], fileName: string, sheetName = 'Rekapitulasi') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const printPdfReport = () => {
  window.print();
};
