document.addEventListener('DOMContentLoaded', () => {

    const shopId = window.shopId;
    if (!shopId) {
        console.error("Shop ID not found");
        return;
    }

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

    // Category Pill Logic
    const catPills = document.querySelectorAll('.kategori-pill');
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });
    });

    const formatRp = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(number);
    };

    const createProductCard = (product) => {
        const isRaden = true; // Placeholder for verified status
        const tokoBadgeClass = isRaden ? 'raden' : 'rakyat';
        const tokoBadgeLabel = isRaden ? '<i class="fa-solid fa-check-circle"></i> Raden' : 'Rakyat';
        
        return `
            <a href="/product/${product.slug}" style="text-decoration: none;" class="product-card">
                <div class="shop-badge ${tokoBadgeClass}">${tokoBadgeLabel}</div>
                ${product.discount > 0 ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                
                <img src="${product.image}" alt="${product.name}" class="product-img">
                
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    
                    <div class="price-row">
                        ${product.originalPrice > product.actualPrice ? `<span class="original-price">${formatRp(product.originalPrice)}</span>` : ''}
                        <span class="actual-price">${formatRp(product.actualPrice)}</span>
                    </div>
                    
                    <div class="stats-row">
                        <span class="rating"><i class="fa-solid fa-star"></i> ${product.rating || '5.0'}</span>
                        <span class="sold">${product.sold || 0} Terjual</span>
                    </div>
                    
                    <div class="location-row">
                        <i class="fa-solid fa-location-dot"></i> ${product.location}
                    </div>
                    ${product.shopName ? `
                    <div class="shop-card-info" style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                        ${product.shopAvatar ? `<img src="${product.shopAvatar}" style="width:16px; height:16px; border-radius:50%; object-fit:cover;">` : `<i class="fa-solid fa-store" style="font-size:10px; color:var(--text-secondary);"></i>`}
                        <span style="font-size:11px; color:var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${product.shopName}</span>
                    </div>` : ''}
                </div>
            </a>
        `;
    };

    async function loadShopData() {
        try {
            const response = await fetch(`/api/shop/${shopId}`);
            if (response.ok) {
                const shop = await response.json();
                
                // Populate Profile Info
                document.querySelector('.toko-name').innerHTML = `${shop.nama_toko} <span class="badge-raden-small"><i class="fa-solid fa-check-circle"></i> Raden</span>`;
                document.querySelector('.toko-status').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${shop.alamat_toko} • Aktif Baru Saja`;
                
                const cover = document.querySelector('.toko-cover');
                if(shop.banner_toko) cover.style.backgroundImage = `url('/storage/${shop.banner_toko}')`;
                
                const avatar = document.querySelector('.toko-avatar-large');
                const fallback = document.getElementById('public-shop-fallback');
                if(shop.foto_profil) {
                    if(avatar) {
                        avatar.src = `/storage/${shop.foto_profil}`;
                        avatar.style.display = 'block';
                    }
                    if(fallback) fallback.style.display = 'none';
                }

                const statsValue = document.querySelectorAll('.stat-value')[0];
                if(statsValue) statsValue.textContent = shop.products ? shop.products.length : 0;

                const chatBtn = document.querySelector('.btn-chat-toko');
                if(chatBtn) chatBtn.setAttribute('onclick', `window.location.href='/chat?shop_id=${shop.id}'`);

                // Tab Deskripsi
                const descBox = document.querySelector('.deskripsi-box');
                if(descBox) {
                    descBox.innerHTML = `
                        <h3>Selamat Datang di ${shop.nama_toko}!</h3>
                        <p>${shop.deskripsi_toko || 'Belum ada deskripsi.'}</p>
                    `;
                }

                renderProducts(shop.products || [], shop);
                
            } else {
                alert("Gagal memuat profil toko.");
            }
        } catch(e) {
            console.error(e);
        }
    }

    function renderProducts(products, shopObj) {
        const grid = document.getElementById('toko-products-grid');
        if(!grid) return;

        if(products.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--text-secondary);">Toko ini belum memiliki produk.</p>';
            return;
        }

        let html = '';
        products.forEach(p => {
            const primaryImgObj = p.images && p.images.find(i => i.is_primary);
            const primaryImg = primaryImgObj ? `/storage/${primaryImgObj.image_url}` : (p.images && p.images.length > 0 ? `/storage/${p.images[0].image_url}` : "https://picsum.photos/seed/placeholder/300/300");
            let original = parseFloat(p.harga_dasar) > 0 ? parseFloat(p.harga_dasar) : parseFloat(p.harga_jual);
            let actual = parseFloat(p.harga_jual);

            if (p.variants && p.variants.length > 0) {
                const lowestVariant = p.variants.reduce((min, v) => parseFloat(v.harga_jual) < parseFloat(min.harga_jual) ? v : min, p.variants[0]);
                actual = parseFloat(lowestVariant.harga_jual);
                original = parseFloat(lowestVariant.harga_asli) > 0 ? parseFloat(lowestVariant.harga_asli) : actual;
            }

            const disc = original > actual ? Math.round(((original - actual) / original) * 100) : 0;

            html += createProductCard({
                slug: p.slug,
                name: p.nama_produk,
                image: primaryImg,
                discount: disc,
                originalPrice: original,
                actualPrice: actual,
                rating: 5.0,
                sold: 0,
                location: shopObj ? shopObj.alamat_toko : 'Indonesia',
                shopName: shopObj ? shopObj.nama_toko : '',
                shopAvatar: (shopObj && shopObj.foto_profil) ? `/storage/${shopObj.foto_profil}` : ''
            });
        });
        grid.innerHTML = html;
    }

    loadShopData();

});
