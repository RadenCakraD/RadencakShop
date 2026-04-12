<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>View Shop Dashboard</title>
    <!-- Use FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Outfit Font for premium, thin elegant look -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
</head>
<body>
    <!-- Sidebar Overlay & Menu -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="user-sidebar" id="userSidebar">
        <div class="sidebar-header">
            <i class="fa-solid fa-circle-user sidebar-avatar-fallback" style="font-size: 60px; color: var(--text-secondary); margin: 0 auto 10px auto; display: block;"></i>
            <img src="" alt="Profile" class="sidebar-avatar" style="display: none;">
            <div class="sidebar-user-info">
                <h3>Memuat...</h3>
                <span>tunggu sebentar</span>
            </div>
            <button class="close-sidebar-btn" id="closeSidebar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="sidebar-nav">
            <a href="{{ route('profile') }}" class="sidebar-link"><i class="fa-solid fa-user"></i> Profil Saya</a>
            <a href="{{ route('mytoko') }}" id="toko-saya-link" class="sidebar-link"><i class="fa-solid fa-store"></i> Toko Saya</a>
            <a href="#" class="sidebar-link"><i class="fa-solid fa-gear"></i> Pengaturan</a>
        </div>
        <div class="sidebar-footer">
            <a href="#" class="sidebar-link logout"><i class="fa-solid fa-right-from-bracket"></i> Keluar</a>
        </div>
    </aside>

    <!-- Header -->
    <header class="shop-header">
        <div class="header-container">
            <!-- Left: Profile and User Name -->
            <div class="header-left">
                <div class="profile-menu">
                    <div class="profile-trigger">
                        <i class="fa-solid fa-circle-user" id="header-user-avatar-fallback" style="font-size: 30px; color: var(--text-secondary); margin-right: 10px;"></i>
                        <img src="" alt="Profile" class="header-avatar" id="header-user-avatar" style="display: none;">
                        <span class="user-greeting" id="header-user-name">Memuat...</span>
                        <i class="fa-solid fa-chevron-down dropdown-icon"></i>
                    </div>
                </div>
            </div>
            
            <!-- Center: Search Box -->
            <div class="header-center">
                <div class="search-box">
                    <input type="text" placeholder="Cari produk impianmu...">
                    <button class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </div>
            
            <!-- Right: 3 Menus/Icons -->
            <div class="header-right">
                <a href="#" class="menu-icon mobile-search-icon"><i class="fa-solid fa-magnifying-glass"></i></a>
                <a href="{{ route('keranjang') }}" class="menu-icon"><i class="fa-solid fa-cart-shopping"></i></a>
                <a href="{{ route('informasi') }}" class="menu-icon"><i class="fa-solid fa-bell"></i></a>
                <a href="{{ route('chat') }}" class="menu-icon"><i class="fa-solid fa-envelope"></i></a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="shop-body">
        
        <!-- Banner -->
        <section class="banner-section">
            <div class="banner-wrapper" id="banner-slider">
                <div class="banner-slides">
                    <div class="slide-item active" style="background-color: #3498db;">
                        <div class="banner-content">
                            <h2 class="banner-title">Selamat Datang di View Shop</h2>
                            <p class="banner-desc">Temukan berbagai produk impianmu dengan harga terbaik dan kualitas yang terjamin.</p>
                        </div>
                    </div>
                    <div class="slide-item" style="background-color: #e67e22;">
                        <div class="banner-content">
                            <h2 class="banner-title">Gratis Ongkir Seluruh Indonesia</h2>
                            <p class="banner-desc">Nikmati kemudahan berbelanja tanpa perlu memusingkan biaya pengiriman antar kota.</p>
                        </div>
                    </div>
                    <div class="slide-item" style="background-color: #27ae60;">
                        <div class="banner-content">
                            <h2 class="banner-title">Flash Sale Spesial Tiap Hari</h2>
                            <p class="banner-desc">Dapatkan diskon gila-gilaan pada jam tertentu. Promo terbatas, jangan sampai terlewat!</p>
                        </div>
                    </div>
                </div>
                
                <!-- Slider Controls -->
                <button class="slider-btn prev-btn"><i class="fa-solid fa-chevron-left"></i></button>
                <button class="slider-btn next-btn"><i class="fa-solid fa-chevron-right"></i></button>
                
                <div class="slider-dots">
                    <span class="dot active" data-index="0"></span>
                    <span class="dot" data-index="1"></span>
                    <span class="dot" data-index="2"></span>
                </div>
            </div>
        </section>

        <!-- Product Categories -->
        <section class="category-section">
            <h2 class="section-title">Kategori</h2>
            <ul class="nav-links">
                <li><a href="#" class="active"><i class="fa-solid fa-compass"></i> Beranda</a></li>
                <li><a href="#"><i class="fa-solid fa-fire"></i> Sedang Tren</a></li>
            </ul>
            <div class="category-grid">
                <div class="category-item"><i class="fa-solid fa-plug"></i><span>Elektronik</span></div>
                <div class="category-item"><i class="fa-solid fa-laptop"></i><span>Komputer & Aksesoris</span></div>
                <div class="category-item"><i class="fa-solid fa-mobile-screen"></i><span>Handphone</span></div>
                <div class="category-item"><i class="fa-solid fa-shirt"></i><span>Pakaian</span></div>
                <div class="category-item"><i class="fa-solid fa-shoe-prints"></i><span>Sepatu</span></div>
                <div class="category-item"><i class="fa-solid fa-briefcase"></i><span>Tas</span></div>
                <div class="category-item"><i class="fa-solid fa-glasses"></i><span>Fashion</span></div>
                <div class="category-item"><i class="fa-solid fa-clock"></i><span>Jam Tangan</span></div>
                <div class="category-item"><i class="fa-solid fa-heart-pulse"></i><span>Kesehatan</span></div>
                <div class="category-item"><i class="fa-solid fa-gamepad"></i><span>Hobi</span></div>
                <div class="category-item"><i class="fa-solid fa-spray-can-sparkles"></i><span>Perawatan</span></div>
                <div class="category-item"><i class="fa-solid fa-couch"></i><span>Perlengkapan Rumah</span></div>
                <div class="category-item"><i class="fa-solid fa-child"></i><span>Fashion Anak</span></div>
                <div class="category-item"><i class="fa-solid fa-car"></i><span>Otomotif</span></div>
            </div>
        </section>

        <!-- Flash Sale -->
        <section class="flash-sale-section">
            <div class="section-header">
                <h2 class="section-title">
                    Flash Sale <span class="flash-timer">02:35:10</span>
                </h2>
                <a href="#" class="see-all-link">Lainnya <i class="fa-solid fa-chevron-right"></i></a>
            </div>
            <div class="flash-sale-grid" id="flash-sale-container">
                <!-- Will be populated by JS -->
            </div>
        </section>

        <!-- Recommendations Grid -->
        <section class="recommendation-section">
            <h2 class="section-title">Rekomendasi Untukmu</h2>
            <div class="recommendation-grid" id="recommendation-grid">
               <!-- Will be populated by JS -->
            </div>
        </section>

    </main>

    <script src="{{ asset('js/Dashboard_Shop.js') }}"></script>
</body>
</html>
