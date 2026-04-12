<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raden Shop - Buka Toko Anda</title>
    <link rel="stylesheet" href="{{ asset('css/Auth/daftarToko.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="registration-container">
        <!-- Back Button -->
        <button class="back-btn" type="button" onclick="window.location.href='{{ route('dashboard') }}'">
            <i class="fa-solid fa-arrow-left"></i> Batal Buka Toko
        </button>

        <!-- Header -->
        <div class="form-header">
            <div class="logo">
                <i class="fa-solid fa-store"></i>
                <span>Buka Toko di raden<b>shop</b></span>
            </div>
            <p class="subtitle">Jangkau jutaan pembeli dan kembangkan bisnis Anda bersama kami.</p>
        </div>

        <form id="shop-register-form" action="{{ route('daftar.toko') }}" method="POST" enctype="multipart/form-data">
            
            <!-- Section 1: Informasi Dasar -->
            <div class="form-section">
                <div class="section-title">
                    <i class="fa-solid fa-circle-info"></i> Informasi Dasar Toko
                </div>

                <div class="input-group">
                    <label for="nama-toko">Nama Toko</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-shop"></i>
                        <input type="text" id="nama-toko" name="nama_toko" placeholder="Contoh: Raden Fashion" required>
                    </div>
                </div>

                <div class="input-group">
                    <label for="url-toko">Domain/URL Toko</label>
                    <div class="prefix-input-group">
                        <span class="url-prefix">radenshop.com/</span>
                        <input type="text" id="url-toko" name="url_toko" placeholder="radenfashion" required>
                    </div>
                    <small class="helper-text">URL ini akan menjadi tautan resmi toko Anda.</small>
                </div>

                <div class="input-group">
                    <label>Foto Profil Toko</label>
                    <div class="file-upload-wrapper">
                        <input type="file" id="foto-profil" name="foto_profil" accept="image/*" class="file-input" required>
                        <label for="foto-profil" class="file-label">
                            <i class="fa-solid fa-circle-user"></i>
                            <span class="file-name" id="name-foto">Pilih foto profil (1:1)...</span>
                        </label>
                    </div>
                </div>

                <div class="input-group">
                    <label>Banner Toko</label>
                    <div class="file-upload-wrapper">
                        <input type="file" id="banner-toko" name="banner_toko" accept="image/*" class="file-input" required>
                        <label for="banner-toko" class="file-label">
                            <i class="fa-regular fa-image"></i>
                            <span class="file-name" id="name-banner">Pilih foto banner (16:9)...</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Section 2: Branding & Kontak -->
            <div class="form-section">
                <div class="section-title">
                    <i class="fa-solid fa-bullhorn"></i> Branding & Kontak
                </div>

                <div class="input-group">
                    <label for="slogan">Slogan Toko <span class="badge">Opsional</span></label>
                    <div class="input-icon">
                        <i class="fa-solid fa-quote-left"></i>
                        <input type="text" id="slogan" name="slogan" placeholder="Contoh: Kualitas terbaik dengan harga terjangkau" maxlength="60">
                    </div>
                </div>

                <div class="input-group">
                    <label for="no-telepon">Nomor Telepon Aktif</label>
                    <div class="phone-input-group">
                        <div class="custom-select-wrapper country-code-select">
                            <select name="kode_negara">
                                <option value="+62" selected>🇮🇩 +62</option>
                                <option value="+60">🇲🇾 +60</option>
                                <option value="+65">🇸🇬 +65</option>
                            </select>
                            <i class="fa-solid fa-chevron-down suffix-icon"></i>
                        </div>
                        <input type="tel" id="no-telepon" name="no_telepon" placeholder="81234567890" required>
                    </div>
                </div>
            </div>

            <!-- Section 3: Logistik -->
            <div class="form-section">
                <div class="section-title">
                    <i class="fa-solid fa-truck-fast"></i> Logistik & Pengiriman
                </div>

                <div class="input-group">
                    <label for="alamat-toko">Alamat Asal Pengiriman (Gudang/Toko)</label>
                    <div class="input-icon textarea-icon">
                        <i class="fa-solid fa-location-dot"></i>
                        <textarea id="alamat-toko" name="alamat_toko" rows="3" placeholder="Masukkan alamat lengkap pengambilan barang oleh kurir" required></textarea>
                    </div>
                </div>

                <div class="input-group">
                    <label>Layanan Kurir yang Didukung</label>
                    <div class="checkbox-grid">
                        <label class="checkbox-container">
                            <input type="checkbox" name="kurir[]" value="jne" checked>
                            <span class="checkmark"></span>
                            JNE Express
                        </label>
                        <label class="checkbox-container">
                            <input type="checkbox" name="kurir[]" value="jnt" checked>
                            <span class="checkmark"></span>
                            J&T Express
                        </label>
                        <label class="checkbox-container">
                            <input type="checkbox" name="kurir[]" value="sicepat">
                            <span class="checkmark"></span>
                            SiCepat
                        </label>
                        <label class="checkbox-container">
                            <input type="checkbox" name="kurir[]" value="gojek">
                            <span class="checkmark"></span>
                            Gojek / Grab (Instant)
                        </label>
                    </div>
                </div>
            </div>

            <!-- Footer Action -->
            <div class="form-actions">
                <label class="checkbox-container terms">
                    <input type="checkbox" id="terms" required>
                    <span class="checkmark"></span>
                    Saya menyetujui <a href="#">Syarat dan Ketentuan</a> Raden Shop
                </label>

                <button type="submit" class="btn-primary" id="btn-submit">
                    <span>Buat Toko Sekarang</span>
                    <i class="fa-solid fa-rocket"></i>
                </button>
            </div>
            
        </form>
    </div>

    <!-- Toast Component -->
    <div id="toast" class="toast"></div>

    <script src="{{ asset('js/Auth/daftarToko.js') }}"></script>
</body>
</html>
