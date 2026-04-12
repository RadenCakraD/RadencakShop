<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toko - radenshop</title>
    <script>window.shopId = "{{ $id }}";</script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <link rel="stylesheet" href="{{ asset('css/Toko_shop.css') }}">
</head>
<body>
    <!-- Same Header as Dashboard -->
    <header class="shop-header">
        <div class="header-container">
            <div class="header-left">
                <a href="{{ route('dashboard') }}" style="color: var(--teks-utama); font-size: 20px; text-decoration: none; margin-right: 15px;"><i class="fa-solid fa-arrow-left"></i></a>
                <h2 style="color: var(--teks-utama); margin: 0; font-weight: 700; cursor: pointer;" onclick="window.location.href='{{ route('dashboard') }}'">raden<b>shop</b></h2>
            </div>
            <div class="header-center">
                <div class="search-box">
                    <input type="text" placeholder="Cari di toko ini...">
                    <button class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </div>
            <div class="header-right">
                <a href="{{ route('keranjang') }}" class="menu-icon"><i class="fa-solid fa-cart-shopping"></i></a>
                <a href="{{ route('informasi') }}" class="menu-icon"><i class="fa-solid fa-bell"></i></a>
                <a href="{{ route('chat') }}" class="menu-icon"><i class="fa-solid fa-envelope"></i></a>
            </div>
        </div>
    </header>

    <main class="toko-main">
        <!-- Store Banner and Profile -->
        <section class="toko-header-section">
            <div class="toko-cover" id="public-shop-cover" style="background-color: var(--bg-card);"></div>
            <div class="toko-profile-card">
                <div class="profile-left">
                    <img src="" alt="Toko Avatar" class="toko-avatar-large" id="public-shop-avatar" style="display:none;">
                    <i class="fa-solid fa-store" id="public-shop-fallback" style="font-size: 60px; color:#fff; display:block; padding: 20px;"></i>
                    <div class="toko-identitas">
                        <h1 class="toko-name" id="public-shop-name">Memuat Toko... <span class="badge-raden-small"><i class="fa-solid fa-check-circle"></i> Raden</span></h1>
                        <span class="toko-status" id="public-shop-location"><i class="fa-solid fa-location-dot"></i> Memuat lokasi...</span>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="public-shop-product-count">0</span>
                        <span class="stat-label">Produk</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">0</span>
                        <span class="stat-label">Pengikut</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">0.0 <i class="fa-solid fa-star" style="color:#f2e8cf"></i></span>
                        <span class="stat-label">Penilaian</span>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn-toko btn-follow"><i class="fa-solid fa-plus"></i> Ikuti Toko</button>
                    <button class="btn-toko btn-chat-toko" onclick="window.location.href='{{ route('chat') }}'"><i class="fa-regular fa-comment-dots"></i> Chat</button>
                </div>
            </div>
        </section>

        <!-- Tabs Navigation -->
        <section class="toko-nav-section">
            <button class="toko-tab-btn active" data-target="tab-deskripsi">Deskripsi Toko</button>
            <button class="toko-tab-btn" data-target="tab-produk">Kategori Produk</button>
        </section>

        <!-- Tab 1: Deskripsi -->
        <section class="toko-content-section active" id="tab-deskripsi">
            <div class="deskripsi-box" id="public-shop-desc">
                <h3>Memuat detail toko...</h3>
            </div>
        </section>

        <!-- Tab 2: Produk -->
        <section class="toko-content-section" id="tab-produk">
            <div class="kategori-filter">
                <button class="kategori-pill active">Semua</button>
                <button class="kategori-pill">Laptop</button>
                <button class="kategori-pill">PC Komponen</button>
                <button class="kategori-pill">Aksesoris</button>
            </div>

            <div class="recommendation-grid" id="toko-products-grid">
                <!-- Javascript will populate this similar to Dashboard_Shop -->
            </div>
        </section>

    </main>

    <script src="{{ asset('js/Toko_shop.js') }}"></script>
</body>
</html>
