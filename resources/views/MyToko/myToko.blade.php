<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toko Saya - View Shop</title>
    <!-- Use FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- SF Pro Display Font -->
    <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet">
    
    <link rel="stylesheet" href="{{ asset('css/Dashboard_Shop.css') }}">
    <!-- Note: reuse layout from Toko_shop.css -->
    <link rel="stylesheet" href="{{ asset('css/Toko_shop.css') }}">
    <!-- Additional styles for Modals -->
    <link rel="stylesheet" href="{{ asset('css/MyToko/myToko.css') }}">
</head>
<body>
    <!-- Header -->
    <header class="shop-header">
        <div class="header-container">
            <div class="header-left">
                <a href="{{ route('dashboard') }}" style="color: var(--teks-utama); font-size: 20px; text-decoration: none; margin-right: 15px;"><i class="fa-solid fa-arrow-left"></i></a>
                <h2 style="color: var(--teks-utama); margin: 0; font-weight: 700; cursor: pointer;" onclick="window.location.href='{{ route('dashboard') }}'">Pusat Penjual</h2>
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
            <div class="toko-cover" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a);"></div>
            <div class="toko-profile-card">
                <div class="profile-left">
                    <img src="" alt="Toko Avatar" class="toko-avatar-large" id="toko-avatar-header" style="display:none;">
                    <i class="fa-solid fa-store" id="toko-avatar-fallback" style="font-size: 60px; color:#fff; display:block; padding: 20px;"></i>
                    <div class="toko-identitas">
                        <h1 class="toko-name" id="shop-name-header">Memuat... <span class="badge-raden-small"><i class="fa-solid fa-check-circle"></i> Raden</span></h1>
                        <span class="toko-status"><i class="fa-solid fa-location-dot"></i> <span id="shop-location-header">Mengambil lokasi...</span></span>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="shop-product-count">0</span>
                        <span class="stat-label">Produk</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">0</span>
                        <span class="stat-label">Pengikut</span>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn-toko btn-outline" id="btnEditProfile"><i class="fa-solid fa-pen"></i> Edit Profil</button>
                    <button class="btn-toko btn-primary" id="btnAddProduct"><i class="fa-solid fa-plus"></i> Tambah Produk</button>
                </div>
            </div>
        </section>

        <!-- Tabs Navigation -->
        <section class="toko-nav-section">
            <button class="toko-tab-btn active" data-target="tab-deskripsi">Deskripsi Toko</button>
            <button class="toko-tab-btn" data-target="tab-produk">Produk Saya</button>
        </section>

        <!-- Tab 1: Deskripsi -->
        <section class="toko-content-section active" id="tab-deskripsi">
            <div class="deskripsi-box">
                <h3 id="shop-desc-text">Memuat informasi toko...</h3>
                <p>Klik "Edit Profil" untuk mengubah gambar banner, avatar, dan deskripsi toko Anda di sini.</p>
            </div>
        </section>

        <!-- Tab 2: Produk -->
        <section class="toko-content-section" id="tab-produk">
            <div class="kategori-filter">
                <button class="kategori-pill active">Semua</button>
                <button class="kategori-pill">Laptop</button>
                <button class="kategori-pill">Aksesoris</button>
            </div>

            <div class="recommendation-grid" id="mytoko-products-grid">
                <!-- Javascript will populate this -->
            </div>
        </section>
    </main>

    <!-- Modal: Edit Profile -->
    <div class="modal-overlay" id="editProfileModal">
        <form id="edit-profile-form" class="modal-box">
            <div class="modal-header">
                <h2>Edit Profil Toko</h2>
                <button type="button" class="close-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group half" style="align-items: center;">
                        <label>Foto Profil</label>
                        <div class="image-upload-box" style="border-radius: 50%; width: 100px; height: 100px; position:relative;">
                            <i class="fa-solid fa-camera"></i>
                            <input type="file" name="foto_profil" accept="image/*" class="file-input-hidden" style="position: absolute; width: 100%; height: 100%; top:0; left:0; opacity: 0; cursor: pointer;" onchange="this.previousElementSibling.className='fa-solid fa-check'; this.previousElementSibling.style.color='green';">
                        </div>
                    </div>
                    <div class="form-group half" style="width: 100%;">
                        <label>Foto Banner (Sampul)</label>
                        <div class="image-upload-box" style="width: 100%; height: 100px; position:relative;">
                            <i class="fa-solid fa-image"></i>
                            <span>Upload Banner</span>
                            <input type="file" name="banner_toko" accept="image/*" class="file-input-hidden" style="position: absolute; width: 100%; height: 100%; top:0; left:0; opacity: 0; cursor: pointer;" onchange="this.previousElementSibling.innerText='Terpilih'; this.previousElementSibling.style.color='green';">
                        </div>
                    </div>
                </div>
                <hr class="modal-divider" style="margin: 20px 0;">
                <div class="form-group">
                    <label>Nama Toko</label>
                    <input type="text" name="nama_toko" class="form-input" placeholder="Masukkan nama toko">
                </div>
                <div class="form-group">
                    <label>Deskripsi Toko</label>
                    <textarea name="deskripsi_toko" class="form-input" rows="4" placeholder="Ceritakan tentang toko Anda..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-toko btn-outline close-modal-btn">Batal</button>
                <button type="submit" class="btn-toko btn-primary">Simpan Profil</button>
            </div>
        </form>
    </div>

    <!-- Modal: Add Product -->
    <div class="modal-overlay" id="addProductModal">
        <form id="add-product-form" class="modal-box modal-lg">
            <div class="modal-header">
                <h2>Tambah Produk Baru</h2>
                <button type="button" class="close-modal"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Foto Produk (Bisa lebih dari 1)</label>
                    <div class="image-upload-wrapper">
                        <div class="image-upload-box" style="position:relative; margin-bottom: 10px;">
                            <i class="fa-solid fa-camera"></i>
                            <span id="product-img-label">Klik untuk Upload Foto Ekstra</span>
                            <input type="file" multiple accept="image/*" id="input-foto-produk" class="file-input-hidden" style="position: absolute; width: 100%; height: 100%; top:0; left:0; opacity: 0; cursor: pointer;">
                        </div>
                        <div id="image-preview-container" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
                        <small style="color:var(--text-secondary); font-size:11px;">* Gambar pertama akan menjadi thumbnail utama.</small>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group half">
                        <label>Nama Produk</label>
                        <input type="text" name="nama_produk" class="form-input" placeholder="Contoh: Laptop Gaming Spesifikasi Dewa" required>
                    </div>
                    <div class="form-group half">
                        <label>Kategori</label>
                        <select name="kategori" class="form-input" required>
                            <option value="Elektronik">Elektronik</option>
                            <option value="Komputer & Aksesoris">Komputer & Aksesoris</option>
                            <option value="Handphone">Handphone</option>
                            <option value="Pakaian">Pakaian</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group half">
                        <label>Kondisi</label>
                        <select name="kondisi" class="form-input" required>
                            <option value="baru">Baru</option>
                            <option value="bekas">Bekas</option>
                        </select>
                    </div>
                    <div class="form-group half">
                        <label>Berat (Gram)</label>
                        <input type="number" name="berat" class="form-input" value="1000" placeholder="Misal: 1000" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group half">
                        <label>Harga Asli (Coret)</label>
                        <input type="number" name="harga_dasar" class="form-input" placeholder="Misal: 100000">
                    </div>
                    <div class="form-group half">
                        <label>Harga Jual Akhir</label>
                        <input type="number" name="harga_jual" class="form-input" placeholder="Misal: 80000" required>
                    </div>
                </div>
                
                <div class="form-group" style="width: 50%;">
                    <label>Stok Barang Terkini</label>
                    <input type="number" name="stok" class="form-input" placeholder="Tentukan Stok Utama" required>
                </div>

                <div class="form-group" style="width: 100%;">
                    <label>
                        Varian Tambahan (Opsional) 
                        <button type="button" id="addVarianBtn" class="btn-toko btn-outline" style="padding: 2px 8px; font-size: 12px; margin-left:10px;">+ Tambah Varian</button>
                    </label>
                    <div id="variants-container"></div>
                </div>

                <div class="form-group">
                    <label>Deskripsi Produk Lengkap</label>
                    <textarea name="deskripsi" class="form-input" rows="5" placeholder="Tulis spesifikasi lengkap di sini..." required></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-toko btn-outline close-modal-btn" onclick="document.getElementById('addProductModal').classList.remove('active')">Batal</button>
                <button type="submit" class="btn-toko btn-primary">Publikasikan Produk <i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </form>
    </div>

    <script src="{{ asset('js/MyToko/myToko.js') }}"></script>
</body>
</html>
