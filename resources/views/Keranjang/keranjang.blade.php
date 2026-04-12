<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keranjang Saya - View Shop</title>
    <!-- FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <link rel="stylesheet" href="{{ asset('css/Keranjang/keranjang.css') }}">
</head>
<body>
    <!-- Header -->
    <header class="shop-header">
        <div class="header-container">
            <div class="header-left">
                <a href="{{ route('dashboard') }}" style="color: var(--teks-utama); font-size: 20px; text-decoration: none; margin-right: 15px;"><i class="fa-solid fa-arrow-left"></i></a>
                <h2 style="color: var(--teks-utama); margin: 0; font-weight: 700;">Keranjang Saya</h2>
            </div>
            
            <div class="header-right">
                <a href="{{ route('chat') }}" class="menu-icon"><i class="fa-solid fa-envelope"></i></a>
            </div>
        </div>
    </header>

    <main class="cart-main">
        
        <div id="cart-container">
            <!-- Dynamic Cart Groups will be injected here -->
            <div style="text-align: center; padding: 50px; color: var(--text-secondary);">
                <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                <p style="margin-top: 15px;">Memuat keranjang...</p>
            </div>
        </div>

    </main>

    <!-- Sticky Checkout Bottom Bar -->
    <div class="checkout-bar">
        <div class="checkout-bar-container">
            <div class="checkout-left">
                <label class="custom-checkbox-wrapper select-all-wrapper">
                    <input type="checkbox" id="checkAll">
                    <span class="custom-check"></span>
                </label>
                <span style="color:var(--teks-utama); font-size: 14px;">Pilih Semua</span>
            </div>
            
            <div class="checkout-right">
                <div class="total-wrapper">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-price" id="totalPriceDisplay">Rp 0</span>
                </div>
                <button class="btn-checkout" id="btnCheckout" disabled>Checkout (0)</button>
            </div>
        </div>
    </div>

    <!-- JS files -->
    <script src="{{ asset('js/Keranjang/keranjang.js') }}"></script>
</body>
</html>
