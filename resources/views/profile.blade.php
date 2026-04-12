<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil Saya - Raden Shop</title>
    <!-- Use FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font for premium look -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    <!-- Base CSS -->
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <style>
        .profile-container {
            max-width: 800px;
            margin: 40px auto;
            background: var(--bg-card);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid var(--border-color);
        }

        .profile-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .profile-header h1 {
            color: var(--text-primary);
            font-size: 28px;
            font-weight: 600;
        }

        /* Avatar Upload Style */
        .avatar-upload-wrapper {
            position: relative;
            width: 150px;
            height: 150px;
            margin: 0 auto 20px auto;
            border-radius: 50%;
            border: 2px dashed var(--accent-gold);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: var(--bg-main);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .avatar-upload-wrapper:hover {
            border-color: #fff;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
        }

        .avatar-preview {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        }

        .avatar-upload-overlay {
            position: absolute;
            z-index: 2;
            color: var(--text-secondary);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            background: rgba(0,0,0,0.6);
            width: 100%;
            height: 100%;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .avatar-upload-wrapper:hover .avatar-upload-overlay {
            opacity: 1;
        }

        .avatar-upload-wrapper input[type="file"] {
            display: none;
        }

        .form-group {
            margin-bottom: 25px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-secondary);
            font-weight: 500;
            font-size: 14px;
        }

        .form-group input, .form-group textarea {
            width: 100%;
            padding: 15px;
            background: var(--bg-main);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 16px;
            transition: border-color 0.3s, box-shadow 0.3s;
        }

        .form-group input:focus, .form-group textarea:focus {
            outline: none;
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .form-group input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-save {
            width: 100%;
            padding: 16px;
            background: var(--accent-gold);
            color: var(--bg-main);
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
        }

        .btn-save:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--accent-gold);
            text-decoration: none;
            margin-bottom: 20px;
            font-weight: 500;
            transition: color 0.3s;
        }

        .back-link:hover {
            color: #fff;
        }

        .spinner {
            animation: spin 1s infinite linear;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .profile-container {
                margin: 20px;
                padding: 25px;
            }
        }
    </style>
</head>
<body class="bg-main">

    <div class="profile-container">
        <a href="{{ route('dashboard') }}" class="back-link">
            <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
        </a>

        <div class="profile-header">
            <h1>Profil Saya</h1>
        </div>

        <form id="profileForm">
            <!-- Avatar Upload -->
            <label class="avatar-upload-wrapper" for="avatarInput">
                <img src="" id="avatarPreview" class="avatar-preview" style="display: none;" alt="Preview">
                <i class="fa-solid fa-user" id="avatarFallback" style="font-size: 50px; color: var(--text-secondary);"></i>
                <div class="avatar-upload-overlay">
                    <i class="fa-solid fa-camera"></i>
                    <span style="font-size: 12px;">Ubah Foto</span>
                </div>
                <input type="file" id="avatarInput" accept="image/*">
            </label>

            <!-- Data Fields -->
            <div class="form-group">
                <label for="nameInput">Nama Lengkap</label>
                <input type="text" id="nameInput" placeholder="Masukkan nama Anda" required>
            </div>

            <div class="form-group">
                <label for="emailInput">Email (Hanya Baca)</label>
                <input type="email" id="emailInput" disabled>
            </div>

            <div class="form-group">
                <label for="hpInput">Nomor Handphone</label>
                <input type="tel" id="hpInput" placeholder="Contoh: 081234567890">
            </div>

            <div class="form-group">
                <label for="alamatInput">Alamat Pengiriman Utama</label>
                <textarea id="alamatInput" rows="4" placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos"></textarea>
            </div>

            <button type="submit" class="btn-save" id="btnSave">
                <span>Simpan Perubahan</span>
                <i class="fa-solid fa-circle-notch spinner" id="saveSpinner"></i>
            </button>
        </form>
    </div>

    <!-- Scripts -->
    <script src="{{ asset('js/profile.js') }}"></script>
</body>
</html>
