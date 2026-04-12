<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pembayaran - View Shop</title>
    <!-- Use FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font (Inherited mostly, but good to ensure load) -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    
    <!-- Reuse Dashboard styling for colors, fonts, and header -->
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <!-- Specific Checkout Page styling -->
    <link rel="stylesheet" href="{{ asset('css/Pembayaran.css') }}">
</head>
<body>
    <!-- Reused Header -->
    <header class="shop-header">
        <div class="header-container">
            <!-- Left: Back Button & Logo -->
            <div class="header-left">
                <a href="javascript:history.back()" style="color: var(--teks-utama); font-size: 20px; text-decoration: none; margin-right: 4px; transition: 0.2s;"><i class="fa-solid fa-arrow-left"></i></a>
                <h2 style="color: var(--teks-utama); margin: 0; font-weight: 700; cursor: pointer;" onclick="window.location.href='{{ route('dashboard') }}'">Raden Pembayaran</h2>
            </div>
            
            <!-- Right: Menus/Icons (Simplified for checkout) -->
            <div class="header-right">
                <!-- Removed search for checkout pages generally, keep only essential icons like back to dashboard -->
                <a href="{{ route('dashboard') }}" class="menu-icon"><i class="fa-solid fa-house"></i></a>
            </div>
        </div>
    </header>

    <main class="checkout-body">
        
        <!-- Left Column: User Input & Details -->
        <div class="checkout-main-content">
            
            <h1 class="page-title">Pembayaran</h1>

            <!-- 1. Alamat Section -->
            <section class="checkout-card">
                <div class="card-header">
                    <h2><i class="fa-solid fa-location-dot"></i> Alamat Pengiriman</h2>
                </div>
                
                <!-- Address Type Selectors -->
                <div class="address-tabs" id="address-tabs">
                    <button class="address-tab active" data-type="rumah">Rumah</button>
                    <button class="address-tab" data-type="kantor">Kantor</button>
                    <button class="address-tab" data-type="pacar">Pacar</button>
                    <button class="address-tab" data-type="keluarga">Keluarga</button>
                </div>

                <!-- Active Address Content -->
                <div class="address-content" id="address-content">
                    <!-- JS will populate this -->
                </div>
            </section>

            <!-- 2. Product Summary Section -->
            <section class="checkout-card">
                <div class="card-header">
                    <h2><i class="fa-solid fa-box-open"></i> Detail Pesanan</h2>
                </div>
                
                <div id="checkout-items-container">
                    <!-- Dynamic Cart Items will be injected here -->
                    <div style="padding: 20px; color: var(--text-secondary);">Memuat detail pesanan...</div>
                </div>
            </section>

            <!-- 3. Voucher Section -->
            <section class="checkout-card">
                <div class="card-header">
                    <h2><i class="fa-solid fa-ticket"></i> Vouchers</h2>
                </div>
                
                <div class="vouchers-container">
                    <div class="voucher-box" id="vc-web">
                        <div class="voucher-icon"><i class="fa-solid fa-globe"></i></div>
                        <div class="voucher-details">
                            <div class="voucher-title">Voucher Web/Platform</div>
                            <div class="voucher-status">Tidak Dipakai</div>
                        </div>
                        <div class="voucher-action"><button class="btn-use" data-type="web">Pilih</button></div>
                    </div>

                    <div class="voucher-box" id="vc-shop">
                        <div class="voucher-icon"><i class="fa-solid fa-store"></i></div>
                        <div class="voucher-details">
                            <div class="voucher-title">Voucher Toko</div>
                            <div class="voucher-status">Tidak Dipakai</div>
                        </div>
                        <div class="voucher-action"><button class="btn-use" data-type="shop">Pilih</button></div>
                    </div>
                </div>
            </section>

            <!-- 4. Payment Method Section -->
            <section class="checkout-card">
                <div class="card-header">
                    <h2><i class="fa-solid fa-wallet"></i> Metode Pembayaran</h2>
                </div>
                
                <div class="payment-methods" id="payment-methods">
                    <div class="payment-method-box active" data-method="bank">
                        <i class="fa-solid fa-building-columns"></i>
                        <span>Transfer Bank</span>
                    </div>
                    <div class="payment-method-box" data-method="cash">
                        <i class="fa-solid fa-money-bill-wave"></i>
                        <span>Cash (COD)</span>
                    </div>
                    <div class="payment-method-box" data-method="dll">
                        <i class="fa-brands fa-alipay"></i>
                        <span>Lainnya</span>
                    </div>
                </div>

                <!-- Sub Options Container -->
                <div id="sub-options-bank" class="payment-sub-options" style="display: grid;">
                    <div class="sub-option-btn active">BCA Virtual Account</div>
                    <div class="sub-option-btn">Mandiri Virtual Account</div>
                    <div class="sub-option-btn">BNI Virtual Account</div>
                    <div class="sub-option-btn">BRI Virtual Account</div>
                </div>

                <div id="sub-options-dll" class="payment-sub-options" style="display: none;">
                    <div class="sub-option-btn active">GoPay</div>
                    <div class="sub-option-btn">OVO</div>
                    <div class="sub-option-btn">DANA</div>
                    <div class="sub-option-btn">ShopeePay</div>
                </div>
            </section>

        </div>

        <!-- Right Column: Sticky Invoice Summary -->
        <div class="checkout-sidebar">
            <div class="invoice-card">
                <h3>Rincian Pembayaran</h3>
                
                <div class="invoice-row">
                    <span class="label" id="label-total-product">Total Harga Produk</span>
                    <span class="value" id="calc-total-product">Menghitung...</span>
                </div>
                
                <div class="invoice-row highlight-discount" id="row-discount-web" style="display: none;">
                    <span class="label">Voucher Web</span>
                    <span class="value">- Rp <span id="calc-disc-web">0</span></span>
                </div>
                
                <div class="invoice-row highlight-discount" id="row-discount-shop" style="display: none;">
                    <span class="label">Voucher Toko</span>
                    <span class="value">- Rp <span id="calc-disc-shop">0</span></span>
                </div>

                <div class="invoice-row">
                    <span class="label">Biaya Layanan</span>
                    <span class="value">+ Rp 500</span>
                </div>

                <div class="invoice-divider"></div>

                <div class="invoice-row grand-total-row">
                    <span class="label">Total Pembayaran</span>
                    <span class="value grand-total" id="calc-grand-total">Menghitung...</span>
                </div>

                <button class="btn-checkout-final">Bayar Sekarang</button>
            </div>
        </div>

    </main>

    <!-- Voucher Modal -->
    <div class="modal-overlay" id="voucher-modal" style="display: none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Pilih Voucher</h3>
                <button class="btn-close-modal" id="close-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div class="modal-body">
                <!-- Redeem Box -->
                <div class="redeem-box">
                    <input type="text" id="voucher-code-input" placeholder="Masukkan Kode Voucher..." autocomplete="off">
                    <button id="btn-redeem">Klaim</button>
                </div>
                
                <h4 class="voucher-list-title">Voucher Tersedia</h4>
                <!-- List -->
                <div class="voucher-list" id="voucher-list">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- App Logic -->
    <script src="{{ asset('js/Pembayaran.js') }}"></script>
</body>
</html>
