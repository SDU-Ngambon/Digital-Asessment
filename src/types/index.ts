export type UserRole = 'ADMIN' | 'GURU' | 'SISWA';

export interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: UserRole;
  email?: string;
  token?: string;
  nip?: string;
  nisn?: string;
  kelas?: string;
  rombel?: string;
  lastLogin?: string;
}

export interface SekolahProfile {
  id: string;
  npsn: string;
  namaSekolah: string;
  jenjang: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  terakhirSinkron?: string;
}

export interface MataPelajaran {
  id: string;
  kodeMapel: string;
  namaMapel: string;
  kelompok: string;
}

export interface Rombel {
  id: string;
  namaRombel: string;
  tingkat: string;
  jurusan: string;
  tahunAjaran: string;
  jumlahSiswa?: number;
}

export interface Guru {
  id: string;
  userId?: string;
  nip: string;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  mapelId: string;
  mapelNama: string;
  email: string;
  noTelepon: string;
  username?: string;
  passwordDefault?: string;
}

export interface Siswa {
  id: string;
  userId?: string;
  nisn: string;
  nis: string;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  kelas: string;
  rombelId?: string;
  rombelNama?: string;
  username?: string;
  passwordDefault?: string;
}

export interface JenisAsesmen {
  id: string;
  kode: string; // 'PH', 'PTS', 'PAS', 'PAT', 'TKA'
  nama: string;
  keterangan: string;
  isActive: boolean;
}

export type TipeSoal = 'PG' | 'CEKLIST' | 'BENAR_SALAH' | 'ESAI';
export type TingkatKesulitan = 'MUDAH' | 'SEDANG' | 'SUKAR';

export interface OpsiPilihan {
  label: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
  isCorrect?: boolean;
}

export interface Soal {
  id: string;
  bankSoalId?: string;
  nomorUrut: number;
  tipeSoal: TipeSoal;
  pertanyaan: string;
  opsiJawaban: OpsiPilihan[];
  kunciJawaban: string; // 'A', atau JSON array '["A","C"]', atau 'BENAR' / 'SALAH'
  bobotNilai: number;
  tingkatKesulitan: TingkatKesulitan;
  pembahasan?: string;
}

export interface BankSoal {
  id: string;
  kodeBankSoal: string;
  judul: string;
  mapelId: string;
  mapelNama: string;
  guruId: string;
  guruNama: string;
  tingkat: string;
  totalSoal: number;
  kisiKisi: string;
  soalList: Soal[];
  createdAt: string;
  updatedAt: string;
}

export type TipeWaktu = 'DINAMIS' | 'TERJADWAL_KAKU';
export type StatusJadwal = 'DRAFT' | 'AKTIF' | 'SELESAI' | 'ARSIP';
export type StatusPeserta = 'BELUM_MULAI' | 'SEDANG_MENGERJAKAN' | 'SELESAI' | 'RESET_LOGIN' | 'DIBLOKIR';

export interface JadwalAsesmen {
  id: string;
  kodeJadwal: string;
  namaUjian: string;
  jenisAsesmenId: string;
  jenisAsesmenKode: string;
  jenisAsesmenNama: string;
  bankSoalId: string;
  bankSoalJudul: string;
  guruId: string;
  guruNama: string;
  targetRombelIds: string[];
  targetRombelNama: string[];
  tanggalMulai: string;
  jamMulai: string;
  tanggalSelesai: string;
  jamSelesai: string;
  durasiMenit: number;
  tipeWaktu: TipeWaktu;
  gunakanToken: boolean;
  tokenUjian: string;
  acakSoal: boolean;
  acakOpsi: boolean;
  tampilkanNilaiKeSiswa: boolean;
  status: StatusJadwal;
}

export interface PesertaAsesmen {
  id: string;
  jadwalAsesmenId: string;
  siswaId: string;
  siswaNama: string;
  siswaNisn: string;
  siswaKelas: string;
  status: StatusPeserta;
  waktuMulai?: string;
  waktuSelesai?: string;
  sisaWaktuDetik?: number;
  ipAddress?: string;
  totalDijawab: number;
  totalBenar: number;
  totalSalah: number;
  nilaiAkhir: number;
  jawabanDetail?: Record<string, { jawaban: string; isRagu: boolean }>;
}

export interface AnalisisButirSoal {
  soalId: string;
  nomorUrut: number;
  tipeSoal: TipeSoal;
  tingkatKesulitan: TingkatKesulitan;
  persentaseBenar: number;
  dayaPembeda: number; // Indeks daya pembeda (0.0 - 1.0)
  kategoriDayaPembeda: string; // 'Sangat Baik', 'Baik', 'Cukup', 'Jelek'
  distribusiJawaban: Record<string, number>;
}
