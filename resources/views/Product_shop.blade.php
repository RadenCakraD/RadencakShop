<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Produk - View Shop</title>
    <!-- Use FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font (Inherited mostly, but good to ensure load) -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    
    <!-- Reuse Dashboard styling for colors, fonts, and header -->
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <!-- Specific Product Page styling -->
    <link rel="stylesheet" href="{{ asset('css/Product_shop.css') }}">
</head>
<body>
    <!-- Reused Header -->
    <header class="shop-header">
        <div class="header-container">
            <!-- Left: Back Button & Logo -->
            <div class="header-left">
                <a href="javascript:history.back()" style="color: var(--teks-utama); font-size: 20px; text-decoration: none; margin-right: 4px; transition: 0.2s;"><i class="fa-solid fa-arrow-left"></i></a>
                <h2 style="color: var(--teks-utama); margin: 0; font-weight: 700; cursor: pointer;" onclick="window.location.href='{{ route('dashboard') }}'">Raden<b>Product</b></h2>
            </div>
            
            <!-- Center: Search Box -->
            <div class="header-center">
                <div class="search-box">
                    <input type="text" placeholder="Cari produk impianmu...">
                    <button class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                </div>
            </div>
            
            <!-- Right: Menus/Icons -->
            <div class="header-right">
                <a href="#" class="menu-icon mobile-search-icon"><i class="fa-solid fa-magnifying-glass"></i></a>
                <a href="{{ route('keranjang') }}" class="menu-icon"><i class="fa-solid fa-cart-shopping"></i></a>
                <a href="{{ route('informasi') }}" class="menu-icon"><i class="fa-solid fa-bell"></i></a>
                <a href="{{ route('chat') }}" class="menu-icon"><i class="fa-solid fa-envelope"></i></a>
            </div>
        </div>
    </header>

    <main class="product-body">
        <!-- Breadcrumb Category -->
        <div class="breadcrumb">
            <a href="{{ route('dashboard') }}">Home</a> <i class="fa-solid fa-chevron-right"></i>
            <a href="#">Elektronik</a> <i class="fa-solid fa-chevron-right"></i>
            <span>Laptop Gaming Super Cepat RTX 4090</span>
        </div>

        <!-- Top Section: Gallery (Left) & Info (Right) -->
        <section class="product-top-section">
            
            <!-- Left: Gallery -->
            <div class="product-gallery">
                <div class="main-image-container">
                    <div class="gallery-slides" id="product-gallery-slides">
                        <div class="gallery-img active" style="background-color: var(--bg-card);"></div>
                    </div>
                    
                    <!-- Slider Controls -->
                    <button class="gallery-btn prev-btn"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="gallery-btn next-btn"><i class="fa-solid fa-chevron-right"></i></button>
                    
                    <!-- Dots -->
                    <div class="gallery-dots">
                        <span class="dot active" data-index="0"></span>
                        <span class="dot" data-index="1"></span>
                        <span class="dot" data-index="2"></span>
                        <span class="dot" data-index="3"></span>
                    </div>
                </div>

                <!-- Thumbnails -->
                <div class="thumbnails-container" id="product-thumbnails">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!-- Right: Product Info -->
            <div class="product-info-panel">
                <h1 class="product-title" id="product-detail-title">Memuat Detail Produk...</h1>
                
                <div class="rating-row">
                    <div class="stars">
                        <span>0.0</span>
                    </div>
                </div>

                <div class="price-container">
                    <div class="price-original" id="product-detail-original-price"></div>
                    <div class="price-actual" id="product-detail-price">
                        Menghitung harga...
                    </div>
                </div>

                <!-- Variants -->
                <div class="variants-section">
                    <div class="variant-group">
                        <span class="variant-label">Warna</span>
                        <div class="variant-options color-options">
                            <button class="variant-btn active">Titanium Black</button>
                            <button class="variant-btn">Glacier White</button>
                        </div>
                    </div>
                    
                    <div class="variant-group">
                        <span class="variant-label">Spesifikasi</span>
                        <div class="variant-options spec-options">
                            <button class="variant-btn active">Intel i9, 32GB RAM</button>
                            <button class="variant-btn">Intel i7, 16GB RAM</button>
                        </div>
                    </div>
                </div>

                <!-- Stock & Quantity -->
                <div class="quantity-section">
                    <span class="variant-label">Kuantitas</span>
                    <div class="qty-control">
                        <button class="qty-btn minus">-</button>
                        <input type="number" class="qty-input" value="1" min="1" max="50">
                        <button class="qty-btn plus">+</button>
                    </div>
                    <span class="stock-info">Tersisa 45 buah</span>
                </div>

                <!-- Actions -->
                <div class="action-buttons">
                    <button class="btn btn-chat" onclick="window.location.href='{{ route('chat') }}'"><i class="fa-regular fa-comment-dots"></i> Chat Penjual</button>
                    <button class="btn btn-cart"><i class="fa-solid fa-cart-shopping"></i> Masukkan Keranjang</button>
                    <button class="btn btn-buy" id="btn-buy-now">Beli Sekarang</button>
                </div>
            </div>
            
        </section>

        <!-- Shop Overview / Badges -->
        <section class="shop-overview">
            <img src="" alt="Shop Logo" class="shop-logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; display: none;">
            <i class="fa-solid fa-store" id="shop-overview-logo-fallback" style="font-size: 40px; color:#fff; border-radius: 50%; background: var(--bg-card); padding: 10px;"></i>
            <div class="shop-details" style="margin-left: 20px;">
                <div class="shop-name-wrapper">
                    <span class="badge-raden"><i class="fa-solid fa-check-circle"></i> Raden</span>
                    <h3 class="shop-name" id="shop-overview-name">Toko...</h3>
                </div>
                <div class="shop-stats" id="shop-overview-stats">Mengambil data penjual...</div>
            </div>
            <button class="btn-visit-shop" onclick="window.location.href='{{ route('toko') }}'"><i class="fa-solid fa-store"></i> Kunjungi Toko</button>
        </section>

        <!-- Product Details / Description -->
        <section class="product-description-section">
            <h2 class="section-title">Deskripsi Produk</h2>
            <div class="description-content" id="product-desc-content">
                <p>Memuat spesifikasi lengkap...</p>
            </div>
        </section>

        <!-- Product Reviews -->
        <section class="product-reviews-section">
            <h2 class="section-title">Ulasan Pembeli</h2>
            
            <div class="review-summary">
                <div class="score">4.9<span>/5.0</span></div>
                <div class="stars-large">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>

            <div class="review-list">
                <div style="padding: 20px; color: var(--text-secondary); text-align: center;">Belum ada ulasan untuk produk ini.</div>
            </div>
            <button class="btn-load-more">Lihat Ulasan Lainnya</button>
        </section>

        <!-- Recommendations Grid -->
        <section class="recommendation-section">
            <h2 class="section-title">Produk Serupa</h2>
            <div class="recommendation-grid" id="similar-products-grid">
               <!-- Will be populated by JS -->
            </div>
        </section>

    </main>

    <!-- We will reuse the createProductCard logic in Product_shop.js for Similar Products -->
    <script>
        window.PRODUCT_SLUG = "{{ $slug ?? '' }}";
    </script>
    <script src="{{ asset('js/Product_shop.js') }}"></script>
</body>
</html>
