<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informasi Pesanan - View Shop</title>
    <!-- Use FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <link rel="stylesheet" href="{{ asset('css/Information/informasi.css') }}">
</head>
<body>
    <!-- Header -->
    <header class="shop-header">
        <div class="header-container">
            <div class="header-left">
                <a href="{{ route('dashboard') }}" style="color: var(--teks-utama); font-size: 20px; text-decoration: none; margin-right: 15px;"><i class="fa-solid fa-arrow-left"></i></a>
                <h2 style="color: var(--teks-utama); margin: 0; font-weight: 700;">Informasi Pesanan</h2>
            </div>
            <div class="header-right">
                <a href="{{ route('chat') }}" class="menu-icon"><i class="fa-solid fa-envelope"></i></a>
            </div>
        </div>
    </header>

    <main class="informasi-main">
        <!-- Status Information Grid -->
        <section class="status-section">
            <div class="status-grid">
                <div class="status-card" onclick="openModal('modalBelumBayar')">
                    <div class="status-icon"><i class="fa-solid fa-wallet"></i></div>
                    <span class="status-label">Belum Bayar</span>
                </div>
                <div class="status-card" onclick="openModal('modalDikemas')">
                    <div class="status-icon"><i class="fa-solid fa-box"></i></div>
                    <span class="status-label">Dikemas</span>
                </div>
                <div class="status-card" onclick="openModal('modalDikirim')">
                    <div class="status-icon"><i class="fa-solid fa-truck-fast"></i></div>
                    <span class="status-label">Dikirim</span>
                </div>
                <div class="status-card" onclick="openModal('modalPenilaian')">
                    <div class="status-icon"><i class="fa-solid fa-star"></i></div>
                    <span class="status-label">Beri Penilaian</span>
                </div>
            </div>

            <!-- Bantuan Section -->
            <div class="bantuan-container">
                <button class="btn-bantuan" onclick="window.location.href='{{ route('chat') }}'">
                    <i class="fa-solid fa-headset"></i> <span>Bantuan / Hubungi Customer Service</span>
                </button>
            </div>
        </section>
    </main>

    <!-- Modal: Belum Bayar -->
    <div id="modalBelumBayar" class="modal-overlay">
        <div class="modal-box">
            <div class="modal-header">
                <h3>Belum Bayar</h3>
                <button class="close-btn" onclick="closeModal('modalBelumBayar')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Memuat...
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Dikemas -->
    <div id="modalDikemas" class="modal-overlay">
        <div class="modal-box">
            <div class="modal-header">
                <h3>Dikemas</h3>
                <button class="close-btn" onclick="closeModal('modalDikemas')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Memuat...
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Dikirim -->
    <div id="modalDikirim" class="modal-overlay">
        <div class="modal-box">
            <div class="modal-header">
                <h3>Dikirim</h3>
                <button class="close-btn" onclick="closeModal('modalDikirim')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Memuat...
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Beri Penilaian -->
    <div id="modalPenilaian" class="modal-overlay">
        <div class="modal-box">
            <div class="modal-header">
                <h3>Beri Penilaian</h3>
                <button class="close-btn" onclick="closeModal('modalPenilaian')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> Memuat...
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/Information/informasi.js') }}"></script>
</body>
</html>
