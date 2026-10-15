-- =====================================================================
-- DATABASE SCHEMA: DIGITAL ASSESSMENT (CBT & AI QUESTION GENERATOR)
-- Target: PostgreSQL 14+ / 15+ / 16+
-- Host: Server Mandiri / On-Premise (Default Port 5050)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'guru', 'siswa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('PG', 'CEKLIST', 'BENAR_SALAH', 'ESAI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exam_session_status AS ENUM ('BELUM_MULAI', 'SEDANG_MENGERJAKAN', 'SELESAI', 'RESET_LOGIN', 'DIBLOKIR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- 3. TABEL PENGATURAN APLIKASI (APP_SETTINGS)
-- Menyimpan URL Endpoint Pusat Data, API Key / Token, & Konfigurasi GUI
-- =====================================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default app_settings
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES 
    ('PUSAT_DATA_URL', 'http://192.168.7.203:5050/api/v1/sync', 'URL Endpoint Sinkronisasi Pusat Data'),
    ('PUSAT_DATA_API_KEY', 'bearer_token_pusat_data_cbt_2026', 'API Key / Bearer Token Pusat Data'),
    ('SCHOOL_NAME', 'SMK Negeri 1 Indonesia Maju', 'Nama Sekolah Resmi'),
    ('SCHOOL_NPSN', '20109988', 'Nomor Pokok Sekolah Nasional'),
    ('SERVER_PORT', '5050', 'Port Lokal Server Mandiri')
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP;

-- =====================================================================
-- 4. TABEL USERS (AUTENTIKASI TERPADU)
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'siswa',
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 5. TABEL MASTER DATA (STRUKTUR COCOK DENGAN REST API PUSAT DATA)
-- =====================================================================

-- Kelas Akademik / Rombongan Belajar
CREATE TABLE IF NOT EXISTS academic_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(50) UNIQUE NOT NULL, -- Contoh: 'X-MIPA-1'
    grade_level VARCHAR(10) NOT NULL,        -- '10', '11', '12'
    major VARCHAR(50) DEFAULT 'MIPA',        -- 'MIPA', 'IPS', dll
    academic_year VARCHAR(20) DEFAULT '2025/2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mata Pelajaran
CREATE TABLE IF NOT EXISTS master_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    subject_group VARCHAR(50) DEFAULT 'Wajib',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Guru (Sinkron dari Pusat Data)
CREATE TABLE IF NOT EXISTS master_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    nip VARCHAR(30) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) DEFAULT 'L',
    subject_id UUID REFERENCES master_subjects(id) ON DELETE SET NULL,
    email VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Siswa (Sinkron dari Pusat Data)
CREATE TABLE IF NOT EXISTS master_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    nisn VARCHAR(20) UNIQUE NOT NULL,
    nis VARCHAR(20),
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) DEFAULT 'L',
    class_name VARCHAR(50) NOT NULL,
    class_id UUID REFERENCES academic_classes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 6. TABEL KATEGORI ASESMEN & BANK SOAL
-- =====================================================================

-- Kategori Asesmen (PH, PTS, PAS, PAT, TKA)
CREATE TABLE IF NOT EXISTS assessment_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bank Soal
CREATE TABLE IF NOT EXISTS question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    subject_id UUID REFERENCES master_subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES master_teachers(id) ON DELETE SET NULL,
    grade_level VARCHAR(10) NOT NULL,
    total_questions INTEGER DEFAULT 0,
    blueprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Butir Soal
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    type question_type DEFAULT 'PG',
    question_text TEXT NOT NULL,
    options JSONB, -- [{"label": "A", "text": "Pilihan A"}]
    answer_key TEXT NOT NULL,
    score_weight NUMERIC(5,2) DEFAULT 10.0,
    difficulty VARCHAR(20) DEFAULT 'SEDANG',
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 7. TABEL UJIAN & SESI PELAKSANAAN CBT (EXAMS & SESSIONS)
-- =====================================================================

-- Jadwal Ujian / Paket Asesmen
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES assessment_categories(id) ON DELETE RESTRICT,
    bank_id UUID REFERENCES question_banks(id) ON DELETE RESTRICT,
    teacher_id UUID REFERENCES master_teachers(id) ON DELETE SET NULL,
    target_class_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_date DATE NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    time_mode VARCHAR(20) DEFAULT 'DINAMIS',
    use_token BOOLEAN DEFAULT TRUE,
    exam_token VARCHAR(10) DEFAULT 'CBT2026',
    randomize_questions BOOLEAN DEFAULT TRUE,
    randomize_options BOOLEAN DEFAULT TRUE,
    show_score_to_student BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'AKTIF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sesi Peserta Ujian (Pantauan Live)
CREATE TABLE IF NOT EXISTS student_exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES master_students(id) ON DELETE CASCADE,
    status exam_session_status DEFAULT 'BELUM_MULAI',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    remaining_seconds INTEGER,
    ip_address VARCHAR(45),
    answered_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    final_score NUMERIC(6,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_student UNIQUE (exam_id, student_id)
);

-- Jawaban Siswa per Butir Soal
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES student_exam_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    is_doubt BOOLEAN DEFAULT FALSE,
    is_correct BOOLEAN,
    score_earned NUMERIC(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

-- =====================================================================
-- 8. INDEKS OPTIMISASI PERFORMA
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_master_students_nisn ON master_students(nisn);
CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON student_exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student ON student_exam_sessions(student_id);

-- =====================================================================
-- 9. SEED DATA AWAL (DEMO & TESTING SIAP PAKAI)
-- =====================================================================

-- Kategori Asesmen
INSERT INTO assessment_categories (code, name, description) VALUES
('PH', 'Penilaian Harian', 'Evaluasi materi formatif mingguan'),
('PTS', 'Penilaian Tengah Semester', 'Evaluasi sumatif pertengahan semester'),
('PAS', 'Penilaian Akhir Semester', 'Evaluasi sumatif akhir semester gasal'),
('PAT', 'Penilaian Akhir Tahun', 'Evaluasi kenaikan kelas semester genap'),
('TKA', 'Simulasi Tes Kemampuan Akademik', 'Uji coba persiapan seleksi SNBT')
ON CONFLICT (code) DO NOTHING;

-- Pengguna Default:
-- Admin (admin / admin123)
-- Guru (198501152010011002 / guru123)
-- Siswa (0081234567 / siswa123)
INSERT INTO users (id, username, password_hash, role, full_name, is_active) VALUES
('a1000000-0000-0000-0000-000000000001', 'admin', 'admin123', 'admin', 'Administrator Utama', true),
('a1000000-0000-0000-0000-000000000002', '198501152010011002', 'guru123', 'guru', 'Budi Santoso, M.Pd.', true),
('a1000000-0000-0000-0000-000000000003', '0081234567', 'siswa123', 'siswa', 'Ahmad Rizky Pratama', true)
ON CONFLICT (username) DO NOTHING;

-- Mapel & Kelas
INSERT INTO master_subjects (id, subject_code, subject_name, subject_group) VALUES
('b1000000-0000-0000-0000-000000000001', 'MAT-W', 'Matematika Wajib', 'Wajib')
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO academic_classes (id, class_name, grade_level, major, academic_year) VALUES
('c1000000-0000-0000-0000-000000000001', 'X-MIPA-1', '10', 'MIPA', '2025/2026')
ON CONFLICT (class_name) DO NOTHING;

-- Profil Guru & Siswa
INSERT INTO master_teachers (id, user_id, nip, full_name, subject_id) VALUES
('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', '198501152010011002', 'Budi Santoso, M.Pd.', 'b1000000-0000-0000-0000-000000000001')
ON CONFLICT (nip) DO NOTHING;

INSERT INTO master_students (id, user_id, nisn, nis, full_name, class_name, class_id) VALUES
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', '0081234567', '2122001', 'Ahmad Rizky Pratama', 'X-MIPA-1', 'c1000000-0000-0000-0000-000000000001')
ON CONFLICT (nisn) DO NOTHING;
