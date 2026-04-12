<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raden Shop - Daftar</title>
    <link rel="stylesheet" href="{{ asset('css/Auth/daftar.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <div class="auth-container">
        <!-- Logo Header -->
        <div class="auth-header">
            <div class="logo">
                <i class="fa-solid fa-gem"></i>
                <span>raden<b>shop</b></span>
            </div>
            <p class="subtitle">Buat akun untuk memulai pengalaman belanja Anda.</p>
        </div>

        <!-- Register Form -->
        <div class="form-wrapper active">
            <h2>Daftar Akun Baru</h2>
            <form id="register-form" action="{{ route('daftar') }}" method="POST" enctype="multipart/form-data">

                <div class="input-group">
                    <label for="email">Email</label>
                    <div class="input-icon">
                        <i class="fa-regular fa-envelope"></i>
                        <input type="email" id="email" name="email" placeholder="Masukkan email aktif" required>
                    </div>
                </div>

                <div class="input-group">
                    <label for="alamat">Alamat Lengkap</label>
                    <div class="input-icon textarea-icon">
                        <i class="fa-solid fa-location-dot"></i>
                        <textarea id="alamat" name="alamat" rows="3" placeholder="Masukkan alamat lengkap Anda"
                            required></textarea>
                    </div>
                </div>

                <div class="input-group">
                    <label for="nohp">Nomor Telepon Aktif</label>
                    <div class="phone-input-group">
                        <div class="custom-select-wrapper country-code-select">
                            <select id="country-code" name="country_code">
                                <option value="+62" selected>🇮🇩 +62</option>
                                <option value="+60">🇲🇾 +60</option>
                                <option value="+65">🇸🇬 +65</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                            </select>
                            <i class="fa-solid fa-chevron-down suffix-icon"></i>
                        </div>
                        <input type="tel" id="nohp" name="nohp" placeholder="81234567890" required>
                    </div>
                </div>

                <div class="separator">Informasi Opsional</div>

                <div class="input-group">
                    <label>Foto Profil Pribadi</label>
                    <div
                        style="position: relative; border: 1px dashed rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 15px; text-align: center; cursor: pointer; transition: 0.3s; background: var(--bg-card); display:flex; flex-direction:column; align-items:center;">
                        <input type="file" id="foto-profil" name="avatar" accept="image/*"
                            style="position: absolute; width: 100%; height: 100%; top:0; left:0; opacity: 0; cursor: pointer;">
                        <i class="fa-solid fa-circle-user"
                            style="font-size: 24px; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px;"></i>
                        <span id="name-foto" style="font-size: 13px; color: rgba(255, 255, 255, 0.5);">Pilih foto profil
                            (Relevan: 1:1)</span>
                    </div>
                </div>

                <div class="separator">Informasi Login</div>

                <div class="input-group">
                    <label for="username">Username <span class="badge">Unik</span></label>
                    <div class="input-icon">
                        <i class="fa-regular fa-user"></i>
                        <input type="text" id="username" name="username" placeholder="Buat username unik" required>
                    </div>
                </div>

                <div class="input-group">
                    <label for="password">Password</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="password" name="password" placeholder="Minimal 8 karakter" required>
                        <i class="fa-regular fa-eye-slash toggle-password"></i>
                    </div>
                </div>

                <div class="input-group">
                    <label for="confirm-password">Konfirmasi Password</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="confirm-password" name="confirm_password"
                            placeholder="Ulangi password" required>
                    </div>
                </div>

                <button type="submit" class="btn-primary" id="btn-register">
                    <span>Daftar Sekarang</span>
                    <i class="fa-solid fa-user-plus"></i>
                </button>
            </form>

            <p class="auth-footer-text">
                Sudah memiliki akun? <a href="{{ route('login') }}">Masuk di sini</a>
            </p>
        </div>
    </div>

    <!-- Toast Notification Simulation -->
    <div id="toast" class="toast"></div>

    <script src="{{ asset('js/Auth/daftar.js') }}"></script>
</body>

</html>