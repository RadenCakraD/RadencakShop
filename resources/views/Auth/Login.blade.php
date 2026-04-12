<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raden Shop - Login</title>
    <link rel="stylesheet" href="{{ asset('css/Auth/Login.css') }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <div class="auth-container">
        <!-- Logo / Branding Header -->
        <div class="auth-header">
            <div class="logo">
                <i class="fa-solid fa-gem"></i>
                <span>raden<b>shop</b></span>
            </div>
            <p class="subtitle">Selamat datang kembali di pusat perbelanjaan Anda.</p>
        </div>

        <!-- Login Form Container -->
        <div class="form-wrapper active" id="login-form-wrapper">
            <h2>Masuk</h2>
            <form id="login-form" action="{{ route('login') }}" method="POST">
                <div class="input-group">
                    <label for="username">Username</label>
                    <div class="input-icon">
                        <i class="fa-regular fa-user"></i>
                        <input type="text" id="username" name="username" placeholder="Masukkan username Anda" required>
                    </div>
                </div>

                <div class="input-group">
                    <label for="password">Password</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                        <i class="fa-regular fa-eye-slash toggle-password"></i>
                    </div>
                </div>

                <div class="form-actions">
                    <a href="#" id="lupa-sandi-trigger" class="forgot-link">Lupa Sandi?</a>
                </div>

                <button type="submit" class="btn-primary">
                    <span>Masuk Sekarang</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </form>

            <p class="auth-footer-text">
                Belum memiliki akun? <a href="{{ route('daftar') }}">Daftar sekarang</a>
            </p>
        </div>

        <!-- Forgot Password Form Container -->
        <div class="form-wrapper" id="forgot-form-wrapper">
            <button class="back-btn" id="back-to-login">
                <i class="fa-solid fa-arrow-left"></i> Kembali
            </button>

            <h2>Pemulihan Sandi</h2>

            <!-- Step 1: Email -->
            <div class="forgot-step active" id="forgot-step-1">
                <p class="step-desc">Masukkan alamat email yang terdaftar untuk menemukan akun Anda.</p>
                <div class="input-group">
                    <label for="reset-email">Email</label>
                    <div class="input-icon">
                        <i class="fa-regular fa-envelope"></i>
                        <input type="email" id="reset-email" placeholder="contoh@email.com" required>
                    </div>
                </div>
                <button type="button" class="btn-primary" id="btn-next-step1">Cari Akun</button>
            </div>

            <!-- Step 2: Select Username -->
            <div class="forgot-step" id="forgot-step-2">
                <p class="step-desc">Satu email dapat memiliki beberapa username. Pilih username yang ingin diubah
                    sandinya.</p>
                <div class="input-group">
                    <label for="select-username">Pilih Username</label>
                    <div class="custom-select-wrapper">
                        <i class="fa-regular fa-user prefix-icon"></i>
                        <select id="select-username" required>
                            <option value="" disabled selected>Pilih username...</option>
                            <!-- Options will be populated by JS simulation -->
                        </select>
                        <i class="fa-solid fa-chevron-down suffix-icon"></i>
                    </div>
                </div>
                <button type="button" class="btn-primary" id="btn-next-step2">Lanjutkan</button>
            </div>

            <!-- Step 3: New Password -->
            <div class="forgot-step" id="forgot-step-3">
                <p class="step-desc">Masukkan sandi baru untuk username terpilih.</p>
                <div class="input-group">
                    <label for="new-password">Sandi Baru</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="new-password" placeholder="Minimal 8 karakter" required>
                        <i class="fa-regular fa-eye-slash toggle-password"></i>
                    </div>
                </div>
                <div class="input-group">
                    <label for="confirm-new-password">Konfirmasi Sandi Baru</label>
                    <div class="input-icon">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="confirm-new-password" placeholder="Ulangi sandi baru" required>
                    </div>
                </div>
                <button type="button" class="btn-primary" id="btn-submit-reset">Simpan Sandi Baru</button>
            </div>
        </div>
    </div>

    <!-- Toast Notification for success/error Simulation -->
    <div id="toast" class="toast"></div>

    <script src="{{ asset('js/Auth/Login.js') }}"></script>
</body>

</html>