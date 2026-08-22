# Deploy ke Vercel — KHT Brand Kit

## 1. Environment Variables

Vercel → **Project Settings → Environment Variables**. Tambahkan untuk ketiga scope
(**Production**, **Preview**, **Development**):

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://qfyvslzhspjzvwhjlggr.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | lihat `.env.example` (anon/publishable key) |
| `VITE_SUPABASE_PROJECT_ID` | `qfyvslzhspjzvwhjlggr` |

Semuanya adalah kunci publik (aman di bundle browser); akses data tetap dijaga RLS.
Kalau variabel ini kosong, build tetap jalan memakai fallback bawaan dan menampilkan
peringatan `[env] Missing …` di build log. Begitu variabel diisi, fallback tidak dipakai lagi.

> Service role key / password database **tidak** dibutuhkan dan tidak boleh ditaruh di Vercel.

## 2. CI/CD otomatis

1. Vercel → **Add New → Project → Import Git Repository**, pilih repo ini.
2. Framework Preset: **Vite** · Build Command: `npm run build` · Output Directory: `dist`
   · Install Command: `npm install`.
3. **Settings → Git**: Production Branch = `main`. Biarkan *Automatic deployments* aktif.

Hasilnya: push ke `main` → build produksi + deploy otomatis; push ke branch lain / PR →
Preview Deployment dengan URL sendiri.

`vercel.json` sudah berisi SPA rewrite sehingga deep link (`/admin`, `/auth`, `/studio`, dst.)
tidak 404 saat di-refresh.

## 3. Backend

Database, auth, storage, dan edge functions tetap berjalan di Lovable Cloud dan otomatis
ter-deploy dari sini — Vercel hanya meng-host frontend. Tidak ada langkah tambahan.

Tambahkan domain Vercel ke daftar **Redirect URLs** auth agar login/OAuth bekerja di domain
tersebut.

## 4. Checklist verifikasi setelah deploy

- [ ] `/` — Brand Kit tampil, warna/tipografi/aset terisi dari database
- [ ] `/gallery` & `/assets` — Galeri Aset terisi (bukan kosong)
- [ ] `/company-profile` — konten CMS tampil, Export PDF & PPTX terunduh
- [ ] Unduh SVG/PNG aset di Brand Kit
- [ ] Unduh Brand Kit (PDF) di section Downloads
- [ ] `/auth` — login berhasil; `/admin` hanya bisa dipakai akun admin
- [ ] Upload PDF di Studio → preview halaman pertama muncul (worker PDF ter-bundle lokal)
