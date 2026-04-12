# Objektif

Menghidupkan fitur **Pencarian Produk** di Dashboard dan menerapkan standarisasi desain visual elegan ke seluruh ekosistem (*Dashboard, Product, Pembayaran, Keranjang, MyToko, Toko, Profile, Chat, Informasi*) menyesuaikan dengan skema warna yang ditentukan di Login.

### Skema Warna Target:
1. `--accent` / `--logo-icon`: `#ffd700` (Emas spesifik "Raden")
2. `--bg-utama`: `#151515` (Latar Belakang Global)
3. `--teks-utama`: `#f2e8cf` (Teks Primer & Ikon)
4. `--teks-pendukung`: `#a69d8b` (Teks Subsider)
5. `--card-bg` / `--bg-secondary`: `#1d1d1d` (Kotak Kontainer/Card)

## User Review Required

Perubahan ini akan mengubah Nuansa UI menjadi jauh lebih premium, keemasan-pucat (cream), dan latar belakang abu-abu sangat gelap (`#151515` tidak pure hitam seperti `#000`/`#0a0a0a`). Apakah Anda setuju dengan transisi ini?

## Proposed Changes

### Pengembangan Javascript (Fitur Cari)
#### [MODIFY] `Dashboard_Shop.js`
- Mengaitkan elemen `input` pada *search box*.
- Melakukan penyaringan string (`filter()`) pada koleksi variabel RAM `apiProducts` (mencakup string kategori dan nama).
- Mengganti grid rekomendasi yang tampil dengan array yang telah tersaring tanpa *trigger reload API*.
- Apabila kosong, mengembalikan fungsionalitas memuat ulang katalog awal (`loadMoreProducts`).

### Standarisasi Skema Visual (Master CSS)
#### [MODIFY] `Dashboard_Shop.css` 
Ini adalah file pengontrol pusat *(Root/Master Layout)* bagi kebanyakan halaman kita.
- Mengganti `:root` untuk mencocokkan skema 5 warna dari user.
- Mengubah warna *stroke/card borders* dari putih samar menjadi stroke elegan: `1px solid rgba(255, 215, 0, 0.15)` atau ekuivalen aksen `#a69d8b` transparan agar garis lebih tipis dan klasik.  

#### [MODIFY] `Keranjang/keranjang.css`, `Pembayaran.css`, `Product_shop.css`, `profile.css`, `Toko_shop.css`
- Memastikan tidak ada sisa *hardcode hex color* (seperti `#000`, `#ff0000`, dsb). 
- Semua *background color* pada elemen `card` / `box` akan di sinkronisasi ke `#1d1d1d` (`var(--card-bg)`).
- Border dan tombol sekunder akan menggunakan style seragam *"Thin Stroke"*.

## Verification Plan

### Manual Verification
- Masuk ke rute `/dashboard`. Ketikkan kueri seperti "Sepatu" ke dalam kolom pencarian, klik Enter. Hasil *grid product* di bawah akan langsung merespons dan menampilkan sepatu saja tanpa lag koneksi.
- Tampilan 11 halaman rute akan mengabsorpsi tema `#151515` dan `#f2e8cf`, memberikan pencahayaan kalem premium layaknya layar Bioskop eksklusif di seluruh menu (dari Login hingga Pembayaran final).
