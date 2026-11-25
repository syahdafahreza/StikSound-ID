<div align="center">

<img src="docs/assets/app-icon.svg" alt="StikSound App Icon" width="120" height="120" />

# StikSound

**Buat stiker bersuara hingga 5 atau 10 detik (dengan sakelar di layar) dari PNG, JPG, WebP, atau GIF animasi: tempel stiker Anda, pilih audio lokal atau tautan MyInstants, potong bagian yang diinginkan, dan ekspor semuanya secara lokal.**

[![Gunakan di Web](https://img.shields.io/badge/Gunakan%20di%20Web-GitHub%20Pages-0ea5e9?style=for-the-badge&logo=githubpages&logoColor=white)](https://silverfeit.github.io/StikSound/)
[![Unduh](https://img.shields.io/github/v/release/SilverFeit/StikSound?style=for-the-badge&label=Unduh&color=25D366)](https://github.com/SilverFeit/StikSound/releases/latest)

[![Platforms](https://img.shields.io/badge/Platforms-Web%20%7C%20Windows%20%7C%20macOS%20%7C%20Chrome-25D366?style=flat-square)](#gunakan-di-web-vs-instal)
[![Local Processing](https://img.shields.io/badge/Pemrosesan-100%25%20lokal-10b981?style=flat-square)](#privasi-dan-keamanan)
[![License](https://img.shields.io/badge/License-MIT%20OR%20Apache--2.0-6366f1?style=flat-square)](LICENSE-MIT)

[**Gunakan di Web**](https://silverfeit.github.io/StikSound/) · [**Unduh**](https://github.com/SilverFeit/StikSound/releases/latest) · [**Panduan penggunaan**](#panduan-penggunaan-langkah-demi-langkah) · [**Cara kerja internal**](#cara-kerja-internal) · [**Pengembangan**](#pengembangan)

</div>

---

## 🌐 Gunakan di Web vs. Instal

Anda dapat menggunakan **StikSound langsung dari browser** tanpa menginstal apa pun (berjalan di PC, Android, dan iPhone sebagai PWA), namun perhatikan perbedaan terkait **MyInstants**:

> [!IMPORTANT]
> **Versi Web ([silverfeit.github.io/StikSound](https://silverfeit.github.io/StikSound/)):** hanya berfungsi **dengan audio yang sudah diunduh** di perangkat Anda (`MP3`, `WAV`, `M4A`, `OGG`, `AAC`) atau suara dari video pendek.
>
> **Ingin menempelkan tautan langsung dari MyInstants?** Demi keamanan browser (CORS), MyInstants memblokir pengunduhan langsung dari halaman web. Untuk menggunakan tautan MyInstants **Anda perlu menginstal** [aplikasi desktop (Windows/macOS) atau ekstensi Chrome](https://github.com/SilverFeit/StikSound/releases/latest) — atau unduh MP3-nya terlebih dahulu dari MyInstants lalu pilih secara manual di web.

| Fitur | 🌐 Versi Web (GitHub Pages) | 💻 Aplikasi Desktop / 🧩 Ekstensi Chrome |
| --- | :---: | :---: |
| **Instalasi diperlukan** | ❌ Tidak ada ([buka sekarang](https://silverfeit.github.io/StikSound/)) | ✅ [Unduh rilis](https://github.com/SilverFeit/StikSound/releases/latest) |
| **Pemrosesan 100% lokal** | ✅ | ✅ |
| **Stiker PNG / JPG / WebP / GIF** | ✅ | ✅ |
| **Video pendek (`MP4`, `MOV`, `WebM`) sebagai stiker** | ✅ | — |
| **Sakelar durasi `5s \| 10s`** | ✅ | ✅ |
| **Audio lokal yang diunduh** | ✅ | ✅ |
| **Tempel tautan langsung MyInstants** | ❌ *(unduh MP3 terlebih dahulu)* | ✅ |
| **WebM dengan transparansi** | ❌ *(hanya MP4 di ponsel/web)* | ✅ |

---

## Apa yang dilakukan StikSound

StikSound menggabungkan **gambar persegi** dan **potongan audio** menjadi file yang dapat diunduh atau disalin. Durasi maksimal potongan tersebut dipilih dengan tombol `5s | 10s` (default 10 detik). Aplikasi ini dirancang untuk menyiapkan stiker bersuara untuk WhatsApp tanpa menggunakan editor video yang rumit dan tanpa mengunggah file Anda ke layanan eksternal.

Secara khusus, aplikasi ini memungkinkan Anda:

- Menggunakan stiker atau meme dalam format **PNG, JPG/JPEG, WebP, atau GIF**.
- Bekerja dengan **GIF animasi**, memutarnya secara berulang (loop) selama durasi potongan yang diekspor.
- Menambahkan audio dari file lokal **MP3, WAV, OGG, M4A, atau AAC**.
- Menempelkan tautan **MyInstants** dan mengunduh suara tersebut secara tervalidasi.
- Memilih potongan audio dari **0,1 hingga 5 atau 10 detik** menggunakan pemilih terintegrasi `5s | 10s`.
- Mengekspor **MP4 yang kompatibel**, **WebM dengan transparansi**, **paket ZIP**, atau **WebP statis**.
- Menyimpan dan membuka kembali proyek `.stiksound.zip` berisi gambar, audio, dan pengaturan pemotongan.

> **Catatan penting tentang WhatsApp:** MP4 yang diekspor adalah video, bukan stiker. Menempelkannya di obrolan akan mengirimkannya sebagai video dan tidak menambahkannya ke daftar stiker. Pada beberapa akun beta Android Anda dapat mencoba Buat stiker dengan memilih video tersebut dari galeri; durasi dan audionya ditentukan oleh WhatsApp, dan fitur beta tersebut tidak didokumentasikan secara resmi. Profil `native-sound-sticker` masih dinonaktifkan.

---

## Panduan penggunaan langkah demi langkah

### 1. Muat stiker

Ada tiga cara untuk memuat gambar:

- Menempelkannya langsung dengan `Ctrl + V` atau `Cmd + V`.
- Menyeretnya ke area tengah.
- Mengklik area tengah dan memilih file.

StikSound menganalisis byte asli file, bukan hanya ekstensinya. Dengan begitu, aplikasi memeriksa format, dimensi, apakah memiliki transparansi, dan apakah itu GIF animasi.

### 2. Bingkai gambar dalam format 1:1

Stiker menggunakan format persegi. Jika gambar asli tidak persegi:

- StikSound secara otomatis menghitung pemotongan `1:1` yang terpusat.
- Anda dapat menggerakkan mouse di atas gambar, **tanpa mengklik**, untuk menggeser bingkai secara horizontal atau vertikal.
- Hasilnya tidak pernah diperbesar secara paksa: menggunakan sisi terkecil gambar, dengan ukuran maksimal `512 × 512 px`.
- Dimensi dibulatkan ke angka genap untuk menghindari ketidakcocokan dengan enkoder video.

### 3. Tambahkan audio

Anda juga memiliki tiga opsi:

- Menyeret file audio ke bilah bawah.
- Menekan tombol **Audio** dan memilih file.
- Menempelkan tautan MyInstants yang valid.

Batas file sumber:

| Aturan | Batas |
| --- | ---: |
| Ukuran maksimal audio | 25 MB |
| Durasi maksimal audio yang diimpor | 3 menit |
| Durasi minimal potongan yang dipilih | 0,1 detik |
| Durasi maksimal potongan yang diekspor | 5 atau 10 detik (tombol; default 10) |

Jika durasi audio sama atau kurang dari batas maksimal yang dipilih, StikSound memilih seluruh audio secara otomatis. Jika lebih panjang, aplikasi memilih 5 atau 10 detik pertama (tergantung tombol; default 10) dan memungkinkan Anda menggeser jendela tersebut.

### 4. Sesuaikan potongan suara

Bilah bawah menampilkan bentuk gelombang (waveform) yang dihitung dari audio asli:

- Batang-batang mewakili puncak minimum dan maksimum dalam 1024 pembagian audio.
- Saat mengklik gelombang, jendela pemotongan akan terpusat di dekat titik tersebut.
- Jika audio melebihi batas maksimal yang dipilih (`5s` atau `10s`), penggeser akan muncul untuk memindahkan jendela di sepanjang file.
- Indikator di sebelah kanan menampilkan `dipilih / maksimal`, misalnya `10.0s / 10.0s`.
- Tombol putar memutar tepat bagian yang dipilih.

### 5. Pilih latar belakang

Jika stiker memiliki transparansi, opsi berikut akan muncul:

- **Transparan:** mengekspor WebM dengan saluran alfa jika browser atau WebView mendukungnya.
- **Putih / Hitam / Warna:** menggabungkan gambar di atas latar belakang solid untuk MP4.

MP4 tidak mempertahankan transparansi asli; oleh karena itu transparansi diisi dengan warna yang dipilih. WebM dapat mempertahankan saluran alfa melalui VP9 saat WebCodecs tersedia.

### 6. Pratinjau, salin, atau unduh

Tombol utama:

| Tombol | Aksi |
| --- | --- |
| `✕` | Menghapus stiker, audio, potongan, dan pratinjau untuk memulai dari awal. |
| `➔` | Membuat pratinjau yang kompatibel dan mencoba menyalin hasilnya ke papan klip. |
| `⬇` | Membuka pemilih format dan mengunduh file yang dipilih. |
| `⋯` | Membuka opsi proyek, bahasa, dan lisensi. |

Jika sistem operasi atau browser tidak mengizinkan menyalin video ke papan klip, gunakan `⬇` dan bagikan file yang diunduh secara manual.

---

## Format input dan output

### Input gambar

| Format | Dukungan |
| --- | --- |
| PNG | Didukung, termasuk transparansi. |
| JPG/JPEG | Didukung, tanpa transparansi. |
| WebP | Didukung sebagai gambar input; animasi WebP bukan alur utama v1. |
| GIF | Didukung; GIF animasi didekode per bingkai dan diputar berulang. |
| MP4, MOV, WebM | Hanya di versi web, sebagai klip input hingga 60 detik. Ekspor tetap mengikuti batas 5 atau 10 detik. |

Batas keamanan untuk gambar:

- 20 MB per file.
- Maksimal lebar atau tinggi 8000 px.
- Maksimal 40 megapiksel yang didekode.

### Input audio

| Format | Dukungan |
| --- | --- |
| MP3 | Didukung melalui dekoder browser/WebView atau Rust. |
| WAV | Didukung; juga tersedia dekoder PCM cadangan. |
| OGG | Didukung jika dekoder platform mendukungnya. |
| M4A/AAC | Didukung jika dekoder platform mendukungnya. |

### Output

| Format | Penggunaan yang disarankan | Isi |
| --- | --- | --- |
| MP4 | Kompatibilitas maksimal | Video persegi dengan latar belakang solid dan audio AAC saat WebCodecs tersedia. |
| WebM | Kualitas tinggi/transparansi | Video VP9 dengan alfa dan audio Opus saat WebCodecs tersedia. |
| ZIP `.stiksound.zip` | Paket portabel/proyek | Gambar, audio, dan metadata proyek atau paket. |
| WebP | Stiker statis | Gambar `1:1` tanpa audio, dioptimalkan agar masuk dalam batas 100 KB. |

Durasi video yang diekspor mengikuti potongan audio yang dipilih, dengan toleransi validasi ±50 ms.

---

## Cara kerja internal

### Alur umum

```text
Stiker/Gambar + Audio
        │
        ▼
Validasi dan pembacaan format
        │
        ├─ Gambar: dimensi, alfa, animasi, dan pemotongan 1:1
        │
        └─ Audio: durasi, saluran, sample rate, campuran mono, dan waveform
        │
        ▼
Proyek di memori
        │
        ├─ stiker
        ├─ audio
        ├─ start_ms / end_ms potongan
        └─ format ekspor yang dipilih
        │
        ▼
Validasi sebelum ekspor
        │
        ▼
Rendering lokal
        │
        ├─ video MP4/WebM
        ├─ paket ZIP
        └─ WebP statis
        │
        ▼
Pratinjau, salin, atau unduh
```

### Pipeline gambar

1. Byte file dibaca dan format diidentifikasi berdasarkan header.
2. Gambar yang terlalu besar atau berpotensi berbahaya berdasarkan dimensi ditolak.
3. Pemotongan persegi dihitung dari `crop_x` dan `crop_y` yang dinormalisasi.
4. Untuk gambar statis, satu bingkai digambar.
5. Untuk GIF animasi, bingkai dan waktunya didekode; lalu urutan berulang dijadwalkan untuk mencakup tepat durasi yang dipilih.
6. Untuk MP4, gambar digabungkan di atas warna latar belakang yang dipilih; untuk WebM, saluran alfa dipertahankan saat enkoder mengizinkannya.

### Pipeline audio

1. File diperiksa untuk mendapatkan durasi, sample rate, dan jumlah saluran.
2. Audio didekode dan dicampur menjadi mono.
3. 1024 puncak dihitung untuk menggambar bentuk gelombang.
4. Potongan dipangkas dengan `start_ms` dan `end_ms` dalam milidetik bulat.
5. Potongan di-resample ke **48 kHz mono**, yang merupakan dasar yang digunakan oleh ekspor.
6. Validasi mengharuskan pilihan antara **100 ms dan batas maksimal yang dipilih (5.000 atau 10.000 ms; default 10.000)**.

### Enkode video

StikSound menggunakan dua jalur lokal, dalam urutan ini:

1. **WebCodecs + muxer TypeScript:** saat platform menyediakan `VideoEncoder` dan `AudioEncoder`, aplikasi menghasilkan MP4 H.264/AAC atau WebM VP9/Opus tanpa memanggil layanan eksternal.
2. **Canvas + MediaRecorder:** jika WebCodecs tidak tersedia, aplikasi menggambar di canvas, menangkap stream, dan merekam audio/video dengan kodek yang didukung oleh platform tersebut.

Jika tidak ada satu pun dari kedua jalur tersebut yang tersedia, ekspor video mengembalikan error terstruktur alih-alih gagal secara diam-diam.

### Proyek `.stiksound.zip`

Proyek yang disimpan berisi:

```text
manifest.json
assets/<file-gambar>
assets/<file-audio>
```

Manifes menyimpan:

- pengidentifikasi dan nama aset;
- format, dimensi, dan transparansi gambar;
- durasi, sample rate, dan sumber audio;
- `start_ms`, `end_ms`, volume, dan fade;
- profil ekspor yang aktif.

Saat dibuka, jalur internal divalidasi untuk mencegah entri berbahaya seperti `../` dan bentuk gelombang dihitung ulang.

---

## Arsitektur repositori

```text
apps/
  desktop/       Aplikasi Tauri untuk Windows/macOS
  extension/     Ekstensi Chrome Manifest V3
  web/           Aplikasi Web / PWA yang di-deploy di GitHub Pages
packages/
  core/          Model proyek, invarian, validasi, dan use case
  ui/            Editor React, bilah pemotongan, dan teks i18n
  media-web/     Sniffing, dekode, trim, waveform, mux, dan ZIP dalam TypeScript
  providers/     Ekstraksi dan kebijakan URL MyInstants
crates/
  audio-engine/  Probe/dekode/trim audio dalam Rust
  image-engine/  Probe dan utilitas gambar dalam Rust
  video-engine/  Validasi dan mux video dalam Rust
  project-store/ Penulisan atomik dan paket dalam Rust
docs/            Persyaratan, arsitektur, spesifikasi, dan keputusan
```

Ide utamanya adalah UI tidak berisi aturan bisnis: React memanggil use case dari `packages/core`, dan use case tersebut mendelegasikan pekerjaan media ke mesin yang dapat ditukar (`WebMediaEngine` atau komponen Rust di desktop).

---

## Instalasi

### Windows dan macOS

1. Buka [**Releases**](https://github.com/SilverFeit/StikSound/releases/latest).
2. Unduh penginstal atau file eksekusi untuk platform Anda:
   - Windows: file `windows-x64`.
   - macOS: file `macos-universal`.
3. Buka StikSound. Anda tidak perlu menginstal FFmpeg atau editor video terpisah untuk alur utama.

Di macOS, jika muncul peringatan pengembang tidak terverifikasi, klik kanan pada aplikasi dan pilih **Buka**.

### Ekstensi Chrome, Edge, atau Brave

1. Unduh `StikSound-*-chrome-extension.zip` dari [**Releases**](https://github.com/SilverFeit/StikSound/releases/latest).
2. Ekstrak ke folder permanen.
3. Buka `chrome://extensions/`.
4. Aktifkan **Mode pengembang**.
5. Klik **Muat yang belum dibuka** (Load unpacked) dan pilih folder yang sudah diekstrak.
6. Klik ikon StikSound: editor akan terbuka di tab baru.

---

## Privasi dan keamanan

- Tidak ada server StikSound yang menerima gambar atau audio Anda.
- Pemrosesan media dilakukan secara lokal di aplikasi atau di tab ekstensi.
- Satu-satunya unduhan jaringan bawaan adalah MyInstants, dan hanya saat Anda menempelkan tautan secara eksplisit.
- MyInstants dibatasi oleh kebijakan URL:
  - hanya HTTPS;
  - hanya `myinstants.com` dan `www.myinstants.com`;
  - tanpa pengguna/kata sandi yang disematkan;
  - tanpa port selain 443;
  - maksimal 2 pengalihan (redirect);
  - maksimal 25 MB per audio;
  - waktu unduh maksimal 20 detik.
- Di desktop, pengunduhan dilakukan dari backend Rust untuk menghindari batasan CORS dan menerapkan validasi tambahan untuk alamat IP pribadi atau tercadang.
- Paket ZIP divalidasi terhadap path traversal sebelum dibuka.
- Suara yang diunduh dari MyInstants tetap menjadi milik masing-masing pembuatnya.

---

## Pengembangan

### Persyaratan

- Node.js 22 atau lebih baru.
- npm 10 atau lebih baru.
- Rust stable.
- Untuk mengompilasi aplikasi Tauri di Linux mungkin diperlukan dependensi bawaan WebKitGTK sesuai dokumentasi Tauri; di Windows dan macOS digunakan WebView sistem.

### Instal dependensi

```bash
git clone https://github.com/SilverFeit/StikSound.git
cd StikSound
npm install
```

### Jalankan validasi

```bash
npm run typecheck
npm test
npm run build
cargo test --workspace --exclude stiksound-desktop
```

### Jalankan ekstensi dalam mode pengembangan

```bash
npm run build --workspace=@stiksound/extension
```

Kemudian muat `apps/extension/dist` sebagai ekstensi yang belum dibuka (unpacked) dari `chrome://extensions/`.

Untuk membangun ulang secara otomatis saat mengedit:

```bash
npm run dev --workspace=@stiksound/extension
```

### Jalankan frontend desktop dengan Vite

```bash
npm run dev --workspace=@stiksound/desktop
```

### Jalankan aplikasi Tauri lengkap

```bash
cd apps/desktop
npx tauri dev
```

### Kompilasi aplikasi desktop

```bash
cd apps/desktop
npx tauri build
```

---

## Pemecahan masalah

| Masalah | Kemungkinan penyebab | Yang harus dilakukan |
| --- | --- | --- |
| “URL ditolak oleh kebijakan keamanan” | URL bukan HTTPS dari MyInstants atau formatnya tidak diizinkan | Salin tautan publik instan atau file langsung dari `myinstants.com`. |
| “Tidak dapat mendekode audio ini” | File rusak atau kodek tidak ada di platform tersebut | Coba MP3 atau WAV, atau ekspor ulang audio dari aplikasi lain. |
| Video transparan memiliki latar belakang | Anda memilih MP4 atau platform tidak mendukung alfa VP9 | Gunakan output WebM transparan. |
| Tombol salin tidak menempel di WhatsApp | Browser/sistem memblokir video di papan klip | Unduh file dengan `⬇` dan bagikan secara manual. |
| Audio terdengar terpotong | Potongan yang dipilih dibatasi pada maksimal yang dipilih (5 atau 10 detik) | Ubah tombol `5s \| 10s`, geser jendela pemotongan, atau gunakan audio yang lebih pendek. |
| WebP gagal karena ukuran | WhatsApp mewajibkan stiker statis berukuran kecil | Gunakan gambar yang lebih sederhana atau ekspor sebagai video. |

---

## Dokumentasi tambahan

- Indeks teknis: [docs/README.md](docs/README.md)
- Arsitektur: [docs/architecture/overview.md](docs/architecture/overview.md)
- Persyaratan fungsional: [docs/requirements/functional-requirements.md](docs/requirements/functional-requirements.md)
- Ekspor: [docs/specifications/export.md](docs/specifications/export.md)
- Keamanan: [docs/specifications/security.md](docs/specifications/security.md)
- Rencana pengujian: [docs/qa/test-plan.md](docs/qa/test-plan.md)

## Lisensi

Berlisensi ganda di bawah salah satu dari:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT License ([LICENSE-MIT](LICENSE-MIT))

sesuai pilihan Anda (`MIT OR Apache-2.0`).
