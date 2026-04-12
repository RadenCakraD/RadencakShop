document.addEventListener('DOMContentLoaded', () => {
    const escapeHTML = str => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag]));
    };

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.toko-tab-btn');
    const tabContents = document.querySelectorAll('.toko-content-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const catPills = document.querySelectorAll('.kategori-pill');
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });
    });

    // Modals Logic
    const btnEditProfile = document.getElementById('btnEditProfile');
    const btnAddProduct = document.getElementById('btnAddProduct');
    const editProfileModal = document.getElementById('editProfileModal');
    const addProductModal = document.getElementById('addProductModal');
    let isEditingProduct = false;
    let editingProductId = null;
    let selectedProductImages = []; // Buffer to hold multiple images seamlessly

    const openModal = (modal) => {
        if(modal) modal.classList.add('active');
    };

    const closeModalList = () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        if (addProductModal) addProductModal.classList.remove('active');
        isEditingProduct = false;
        editingProductId = null;
        selectedProductImages = [];
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';

        if (document.getElementById('add-product-form')) {
            document.getElementById('add-product-form').reset();
            document.getElementById('variants-container').innerHTML = '';
            varCount = 0;
            document.querySelector('#addProductModal h2').textContent = 'Tambah Produk Baru';
        }
    };

    if (btnEditProfile) btnEditProfile.addEventListener('click', () => {
        // Pre-fill shop edit profile
        const cName = document.querySelector('.toko-name').textContent.replace(' Raden', '').trim();
        const cDesc = document.querySelector('.deskripsi-box h3').textContent;
        document.querySelector('input[name="nama_toko"]').value = cName !== 'Memuat...' ? cName : '';
        document.querySelector('textarea[name="deskripsi_toko"]').value = cDesc !== 'Memuat informasi toko...' ? cDesc : '';
        openModal(editProfileModal);
    });
    
    if (btnAddProduct) btnAddProduct.addEventListener('click', () => {
        isEditingProduct = false;
        editingProductId = null;
        selectedProductImages = [];
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';

        document.getElementById('add-product-form').reset();
        document.getElementById('variants-container').innerHTML = '';
        varCount = 0;
        document.querySelector('#addProductModal h2').textContent = 'Tambah Produk Baru';
        openModal(addProductModal);
    });

    // Handle interactive multi-upload
    const fotoInput = document.getElementById('input-foto-produk');
    if (fotoInput) {
        fotoInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const previewContainer = document.getElementById('image-preview-container');
            
            files.forEach(f => {
                selectedProductImages.push(f);
                const reader = new FileReader();
                reader.onload = (re) => {
                    const wrap = document.createElement('div');
                    wrap.style = "position:relative; width: 60px; height: 60px;";
                    wrap.innerHTML = `
                        <img src="${re.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:4px; border:1px solid var(--card-border);">
                        <button type="button" class="del-img-btn" style="position:absolute; top:-5px; right:-5px; background:#ff3b30; color:white; border:none; border-radius:50%; width:16px; height:16px; font-size:10px; cursor:pointer;">&times;</button>
                    `;
                    wrap.querySelector('.del-img-btn').addEventListener('click', () => {
                        selectedProductImages = selectedProductImages.filter(img => img !== f);
                        wrap.remove();
                    });
                    previewContainer.appendChild(wrap);
                }
                reader.readAsDataURL(f);
            });
            // Reset input
            fotoInput.value = '';
        });
    }

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModalList);
    });

    // Edit Profile Logic
    const token = localStorage.getItem('auth_token');
    if(!token) window.location.href = '/login';

    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = editProfileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            submitBtn.disabled = true;

            const formData = new FormData(editProfileForm);

            try {
                const res = await fetch('/api/shop/profile', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json' 
                    },
                    body: formData
                });
                if (res.ok) {
                    editProfileModal.classList.remove('active');
                    loadShopData(); 
                } else {
                    const err = await res.json();
                    let detail = err.errors ? '\\n' + JSON.stringify(err.errors) : '';
                    alert((err.message || "Gagal menyimpan profil.") + detail);
                }
            } catch(e) { alert("Terjadi kesalahan jaringan atau server"); } finally {
                submitBtn.innerHTML = originalText; submitBtn.disabled = false;
            }
        });
    }

    // Load Shop Data
    let myProductsRaw = [];
    async function loadShopData() {
        try {
            const response = await fetch('/api/shop/my', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });

            if (response.ok) {
                const shop = await response.json();
                myProductsRaw = shop.products || [];
                
                const nameEl = document.getElementById('shop-name-header');
                if(nameEl) nameEl.innerHTML = `${shop.nama_toko} <span class="badge-raden-small"><i class="fa-solid fa-check-circle"></i> Raden</span>`;
                
                const locEl = document.getElementById('shop-location-header');
                if(locEl) locEl.textContent = shop.alamat_toko;

                const coverEl = document.querySelector('.toko-cover');
                const avatarEl = document.getElementById('toko-avatar-header');
                const avatarFallback = document.getElementById('toko-avatar-fallback');
                const descEl = document.getElementById('shop-desc-text');
                const pCount = document.getElementById('shop-product-count');

                if (shop.banner_toko && coverEl) coverEl.style.backgroundImage = `url('/storage/${shop.banner_toko}')`;
                if (avatarEl && shop.foto_profil) {
                    avatarEl.src = `/storage/${shop.foto_profil}`;
                    avatarEl.style.display = 'block';
                    avatarFallback.style.display = 'none';
                }
                if (descEl && shop.deskripsi_toko) descEl.textContent = shop.deskripsi_toko;
                if (pCount) pCount.textContent = myProductsRaw.length;
                
                renderMyProducts(myProductsRaw);
            } else if (response.status === 404) {
                window.location.href = '/daftar-toko';
            }
        } catch(e) { console.error("Gagal load shop data", e); }
    }

    const formatRp = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

    function renderMyProducts(products) {
        const productsGrid = document.getElementById('mytoko-products-grid');
        if (!productsGrid) return;
        if (products.length === 0) {
            productsGrid.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1/-1;">Belum ada produk. Tambahkan produk pertamamu!</p>';
            return;
        }

        let html = '';
        products.forEach(p => {
            const primaryImgObj = p.images && p.images.find(i => i.is_primary);
            const primaryImg = primaryImgObj ? `/storage/${primaryImgObj.image_url}` : (p.images && p.images.length > 0 ? `/storage/${p.images[0].image_url}` : "https://picsum.photos/seed/placeholder/300/300");
            let org = parseFloat(p.harga_dasar) > 0 ? parseFloat(p.harga_dasar) : parseFloat(p.harga_jual);
            let act = parseFloat(p.harga_jual);
            let disc = org > act ? Math.round(((org - act) / org) * 100) : 0;

            html += `
            <div class="product-card">
                ${disc > 0 ? `<div class="discount-badge">-${disc}%</div>` : ''}
                <img src="${primaryImg}" class="product-img" loading="lazy">
                <div class="product-info">
                    <div class="product-name">${escapeHTML(p.nama_produk)}</div>
                    <div class="price-row">
                        ${org > act ? `<span class="original-price">${formatRp(org)}</span>` : ''}
                        <span class="actual-price">${formatRp(act)}</span>
                    </div>
                    <div class="stats-row" style="margin-top: 10px; border-top: none; justify-content: flex-start; gap: 10px;">
                        <button class="btn-toko btn-outline btn-small btn-edit-prod" data-id="${p.id}"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="btn-toko btn-outline btn-small btn-del-prod" data-id="${p.id}" style="color:#ff3b30; border-color: rgba(255, 59, 48, 0.5);"><i class="fa-solid fa-trash"></i> Hapus</button>
                    </div>
                </div>
            </div>`;
        });
        productsGrid.innerHTML = html;

        // BIND EDIT & DELETE
        document.querySelectorAll('.btn-del-prod').forEach(btn => {
             btn.addEventListener('click', async () => {
                 if(confirm('Hapus produk ini?')) {
                     try {
                         const res = await fetch(`/api/shop/product/${btn.getAttribute('data-id')}`, {
                             method: 'DELETE',
                             headers: { 'Authorization': `Bearer ${token}` }
                         });
                         if(res.ok) loadShopData();
                     } catch(err) { alert("Terjadi kesalahan menghapus produk"); }
                 }
             });
        });

        document.querySelectorAll('.btn-edit-prod').forEach(btn => {
             btn.addEventListener('click', () => {
                 const id = parseInt(btn.getAttribute('data-id'));
                 const prod = myProductsRaw.find(x => x.id === id);
                 if(prod) openEditProductModal(prod);
             });
        });
    }

    loadShopData();

    // Varian Logic for Add/Edit
    const addVarianBtn = document.getElementById('addVarianBtn');
    const variantsContainer = document.getElementById('variants-container');
    window.varCount = 0;
    
    window.addVariantRow = (vNama = '', vHarga = '', vHargaAsli = '', vStok = '') => {
        const div = document.createElement('div');
        div.className = 'variant-item';
        div.style = 'border:1px solid var(--card-border); padding: 12px; margin-bottom:10px; border-radius:8px; position:relative;';
        div.innerHTML = `
            <div class="form-row" style="align-items: flex-end;">
                <div class="form-group" style="width: 25%">
                    <div style="width: 50px; height: 50px; border:1px dashed var(--card-border); border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="this.nextElementSibling.click()">
                        <i class="fa-solid fa-camera" style="color:var(--text-secondary);"></i>
                    </div>
                    <input type="file" name="variants[${window.varCount}][image]" accept="image/*" style="display:none;" onchange="
                        if(this.files[0]) {
                            const url = URL.createObjectURL(this.files[0]);
                            this.previousElementSibling.innerHTML = \`<img src='\${url}' style='width:100%; height:100%; object-fit:cover; border-radius:4px;'>\`;
                        }
                    ">
                </div>
                <div class="form-group" style="width: 60%">
                    <label style="font-size: 11px; color: var(--text-secondary);">Nama Varian</label>
                    <input type="text" name="variants[${window.varCount}][nama]" value="${vNama}" class="form-input" required>
                </div>
                <button type="button" class="del-var" style="position:absolute; top:12px; right:12px; background:transparent; border:none; color:#ff3b30; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="form-row" style="margin-top: 10px; display: flex; gap: 10px;">
                <div class="form-group" style="flex: 1;">
                    <label style="font-size: 11px; color: var(--text-secondary);">Harga Coret (Opsional)</label>
                    <input type="number" name="variants[${window.varCount}][harga_asli]" value="${vHargaAsli}" class="form-input">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label style="font-size: 11px; color: var(--text-secondary);">Harga Jual</label>
                    <input type="number" name="variants[${window.varCount}][harga_jual]" value="${vHarga}" class="form-input" required>
                </div>
                <div class="form-group" style="flex: 1;">
                    <label style="font-size: 11px; color: var(--text-secondary);">Stok Varian</label>
                    <input type="number" name="variants[${window.varCount}][stok]" value="${vStok}" class="form-input" required>
                </div>
            </div>`;
        div.querySelector('.del-var').addEventListener('click', () => div.remove());
        variantsContainer.appendChild(div);
        window.varCount++;
    };

    if (addVarianBtn) addVarianBtn.addEventListener('click', () => window.addVariantRow());

    // EDIT Modal Binder
    function openEditProductModal(prod) {
        isEditingProduct = true;
        editingProductId = prod.id;
        
        document.querySelector('#addProductModal h2').textContent = 'Edit Produk';
        document.querySelector('#add-product-form input[name="nama_produk"]').value = prod.nama_produk;
        document.querySelector('#add-product-form select[name="kategori"]').value = prod.kategori;
        document.querySelector('#add-product-form select[name="kondisi"]').value = prod.kondisi;
        document.querySelector('#add-product-form input[name="berat"]').value = prod.berat;
        document.querySelector('#add-product-form input[name="harga_dasar"]').value = prod.harga_dasar;
        document.querySelector('#add-product-form input[name="harga_jual"]').value = prod.harga_jual;
        document.querySelector('#add-product-form input[name="stok"]').value = prod.stok;
        document.querySelector('#add-product-form textarea[name="deskripsi"]').value = prod.deskripsi;
        
        variantsContainer.innerHTML = '';
        window.varCount = 0;
        if(prod.variants && prod.variants.length > 0) {
            prod.variants.forEach(v => window.addVariantRow(v.nama_jenis, v.harga_jual, v.harga_asli, v.stok));
        }

        selectedProductImages = [];
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            if (prod.images && prod.images.length > 0) {
                prod.images.forEach(img => {
                    const wrap = document.createElement('div');
                    wrap.style = "position:relative; width: 60px; height: 60px;";
                    wrap.innerHTML = `<img src="/storage/${img.image_url}" style="width:100%; height:100%; object-fit:cover; border-radius:4px; border:1px solid var(--card-border);">`;
                    previewContainer.appendChild(wrap);
                });
            }
        }

        openModal(addProductModal);
    }

    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addProductForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
            submitBtn.disabled = true;

            const formData = new FormData(addProductForm);
            
            // Re-append images from global buffer since input is always reset
            selectedProductImages.forEach(f => {
                formData.append('images[]', f);
            });
            
            // If editing, and no variants in form, we need to tell backend to flush variants
            if (isEditingProduct && variantsContainer.children.length === 0) {
                formData.append('clear_variants', 1);
            }

            const url = isEditingProduct ? `/api/shop/product/update/${editingProductId}` : '/api/shop/product/add';

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json' 
                    },
                    body: formData
                });
                if (res.ok) {
                    closeModalList();
                    loadShopData();
                } else {
                    const err = await res.json(); 
                    let detail = err.errors ? '\\n' + JSON.stringify(err.errors) : '';
                    alert((err.message || "Gagal disimpan.") + detail);
                }
            } catch(e) { alert("Terjadi kesalahan jaringan atau server"); } finally {
                submitBtn.innerHTML = originalText; submitBtn.disabled = false;
            }
        });
    }
});
