document.addEventListener('DOMContentLoaded', () => {
    const escapeHTML = str => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag]));
    };

    /* --- INITIAL GALLERY INIT (OVERRIDDEN LATER) --- */
    // Kept to avoid errors on quick DOM loads before fetch.
    initGallery();

    /* --- VARIANTS LOGIC --- */
    const variantGroups = document.querySelectorAll('.variant-group');
    variantGroups.forEach(group => {
        const buttons = group.querySelectorAll('.variant-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // remove active from siblings
                buttons.forEach(b => b.classList.remove('active'));
                // add to clicked
                btn.classList.add('active');
            });
        });
    });

    /* --- QUANTITY LOGIC --- */
    const qtyInput = document.querySelector('.qty-input');
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');

    if (qtyInput && minusBtn && plusBtn) {
        minusBtn.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            let max = parseInt(qtyInput.getAttribute('max')) || 99;
            if (val < max) {
                qtyInput.value = val + 1;
            }
        });

        qtyInput.addEventListener('change', () => {
            let val = parseInt(qtyInput.value);
            let max = parseInt(qtyInput.getAttribute('max')) || 99;
            if (isNaN(val) || val < 1) qtyInput.value = 1;
            if (val > max) qtyInput.value = max;
        });
    }

    /* --- SIMILAR PRODUCTS LOGIC (Reused from Dashboard) --- */
    const formatRp = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(number);
    };

    const createProductCard = (product) => {
        const isRaden = product.isVerified;
        const tokoBadgeClass = isRaden ? 'raden' : 'rakyat';
        const tokoBadgeLabel = isRaden ? '<i class="fa-solid fa-check-circle"></i> Raden' : 'Rakyat';

        return `
            <a href="/product/${product.slug}" style="text-decoration: none;" class="product-card">
                <div class="shop-badge ${tokoBadgeClass}">${tokoBadgeLabel}</div>
                ${product.discount > 0 ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                <img src="${product.image}" alt="${product.name}" class="product-img">
                <div class="product-info">
                    <div class="product-name">${escapeHTML(product.name)}</div>
                    <div class="price-row">
                        ${product.originalPrice > product.actualPrice ? `<span class="original-price">${formatRp(product.originalPrice)}</span>` : ''}
                        <span class="actual-price">${formatRp(product.actualPrice)}</span>
                    </div>
                    <div class="stats-row">
                        <span class="rating"><i class="fa-solid fa-star"></i> ${product.rating || '5.0'}</span>
                        <span class="sold">${product.sold || 0} Terjual</span>
                    </div>
                    <div class="location-row">
                        <i class="fa-solid fa-location-dot"></i> ${escapeHTML(product.location)}
                    </div>
                    ${product.shopName ? `
                    <div class="shop-card-info" style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                        ${product.shopAvatar ? `<img src="${product.shopAvatar}" style="width:16px; height:16px; border-radius:50%; object-fit:cover;">` : `<i class="fa-solid fa-store" style="font-size:10px; color:#f2e8cf;"></i>`}
                        <span style="font-size:11px; color:#f2e8cf; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHTML(product.shopName)}</span>
                    </div>` : ''}
                </div>
            </a>
        `;
    };

    // Load recommendations (Similar Products)
    async function fetchSimilarProducts(category) {
        try {
            const response = await fetch('/api/products', { headers: { 'Accept': 'application/json' } });
            if (response.ok) {
                const dbProducts = await response.json();
                const recommendationGrid = document.getElementById('similar-products-grid');
                if (!recommendationGrid) return;

                let recHtml = '';
                // Just grab up to 6 products for now
                dbProducts.slice(0, 6).forEach(p => {
                    const primaryImg = p.images && p.images.find(i => i.is_primary);
                    const defaultImgUrl = "https://picsum.photos/seed/placeholder/300/300";
                    let org = parseFloat(p.harga_dasar) > 0 ? parseFloat(p.harga_dasar) : parseFloat(p.harga_jual);
                    let act = parseFloat(p.harga_jual);

                    if (p.variants && p.variants.length > 0) {
                        const lowestVariant = p.variants.reduce((min, v) => parseFloat(v.harga_jual) < parseFloat(min.harga_jual) ? v : min, p.variants[0]);
                        act = parseFloat(lowestVariant.harga_jual);
                        org = parseFloat(lowestVariant.harga_asli) > 0 ? parseFloat(lowestVariant.harga_asli) : act;
                    }

                    let disc = org > act ? Math.round(((org - act) / org) * 100) : 0;

                    const fProd = {
                        id: p.id,
                        slug: p.slug,
                        name: p.nama_produk,
                        image: primaryImg ? `/storage/${primaryImg.image_url}` : defaultImgUrl,
                        isVerified: true,
                        discount: disc,
                        originalPrice: org,
                        actualPrice: act,
                        rating: 5.0,
                        sold: 0,
                        location: p.shop ? p.shop.alamat_toko : "Indonesia",
                        shopName: p.shop ? p.shop.nama_toko : "",
                        shopAvatar: (p.shop && p.shop.foto_profil) ? `/storage/${p.shop.foto_profil}` : ""
                    };
                    recHtml += createProductCard(fProd);
                });
                recommendationGrid.innerHTML = recHtml;
            }
        } catch (e) { console.error(e); }
    }

    /* --- DYNAMIC PRODUCT DETAIL LOGIC --- */
    let currentProduct = null;

    async function loadProductDetail() {
        const slug = window.PRODUCT_SLUG;
        if (!slug) return;

        try {
            const response = await fetch(`/api/products/${slug}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                currentProduct = await response.json();
                renderProductDetails(currentProduct);
                fetchSimilarProducts(currentProduct.kategori);
            } else {
                console.error("Produk tidak ditemukan");
            }
        } catch (e) {
            console.error(e);
        }
    }

    function renderProductDetails(product) {
        // Text info
        document.querySelector('.product-title').textContent = product.nama_produk;

        // Prices & Stock Default 
        let org = parseFloat(product.harga_dasar) > 0 ? parseFloat(product.harga_dasar) : parseFloat(product.harga_jual);
        let act = parseFloat(product.harga_jual);

        if (product.variants && product.variants.length > 0) {
            const lowestVariant = product.variants.reduce((min, v) => parseFloat(v.harga_jual) < parseFloat(min.harga_jual) ? v : min, product.variants[0]);
            act = parseFloat(lowestVariant.harga_jual);
            org = parseFloat(lowestVariant.harga_asli) > 0 ? parseFloat(lowestVariant.harga_asli) : act;
        }

        let currentAPrice = act;
        let currentOPrice = org;
        let currentStock = product.stok;

        const updatePriceAndStock = (aPrice, oPrice, stockCount) => {
            currentAPrice = aPrice;
            currentOPrice = oPrice;
            currentStock = stockCount;

            const qtyInput = document.querySelector('.qty-input');
            let currentQty = 1;

            if (qtyInput) {
                qtyInput.setAttribute('max', stockCount);
                if (parseInt(qtyInput.value) > parseInt(stockCount)) qtyInput.value = stockCount;
                if (parseInt(stockCount) === 0) qtyInput.value = 0;
                currentQty = parseInt(qtyInput.value) || 1;
            }

            // Kalikan harga base dengan qty
            document.querySelector('.price-actual').innerHTML = `${formatRp(aPrice * currentQty)} ${oPrice > aPrice ? `<span class="discount-badge-large">Diskon ${Math.round(((oPrice - aPrice) / oPrice) * 100)}%</span>` : ''}`;
            document.querySelector('.price-original').textContent = oPrice > aPrice ? formatRp(oPrice * currentQty) : '';
            document.querySelector('.price-original').style.display = oPrice > aPrice ? 'block' : 'none';

            const stockInfo = document.querySelector('.stock-info');
            if (stockInfo) stockInfo.textContent = `Tersisa ${stockCount} buah`;
        };

        // Event listener u/ qty buttons (- dan +) & manual input
        const minusBtn = document.querySelector('.qty-btn.minus');
        const plusBtn = document.querySelector('.qty-btn.plus');
        const qtyInp = document.querySelector('.qty-input');

        if (qtyInp) {
            qtyInp.addEventListener('input', () => {
                if (parseInt(qtyInp.value) < 1) qtyInp.value = 1;
                updatePriceAndStock(currentAPrice, currentOPrice, currentStock);
            });

            if (minusBtn) {
                const newMinusBtn = minusBtn.cloneNode(true);
                minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
                newMinusBtn.addEventListener('click', () => {
                    let v = parseInt(qtyInp.value) || 1;
                    if (v > 1) {
                        qtyInp.value = v - 1;
                        updatePriceAndStock(currentAPrice, currentOPrice, currentStock);
                    }
                });
            }
            if (plusBtn) {
                const newPlusBtn = plusBtn.cloneNode(true);
                plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);
                newPlusBtn.addEventListener('click', () => {
                    let v = parseInt(qtyInp.value) || 1;
                    if (v < currentStock) {
                        qtyInp.value = v + 1;
                        updatePriceAndStock(currentAPrice, currentOPrice, currentStock);
                    }
                });
            }
        }

        updatePriceAndStock(act, org, product.stok);

        // Render Variants Dynamically
        const variantsSection = document.querySelector('.variants-section');
        if (variantsSection) {
            if (product.variants && product.variants.length > 0) {
                // Find lowest variant to match with Dashboard logic
                const lowestVarIdx = product.variants.reduce((minIndex, v, idx, arr) =>
                    parseFloat(v.harga_jual) < parseFloat(arr[minIndex].harga_jual) ? idx : minIndex, 0);

                let varsHtml = `<div class="variant-group">
                                    <span class="variant-label">Pilih Varian</span>
                                    <div class="variant-options">`;
                product.variants.forEach((v, idx) => {
                    const asli = parseFloat(v.harga_asli) > 0 ? parseFloat(v.harga_asli) : parseFloat(v.harga_jual);
                    varsHtml += `<button class="variant-btn ${idx === lowestVarIdx ? 'active' : ''}" 
                                   data-harga="${v.harga_jual}" data-asli="${asli}" data-stok="${v.stok}" data-id="${v.id}"
                                   data-img="${v.image_url || ''}">
                                   ${v.nama_jenis}
                                 </button>`;
                });
                varsHtml += `</div></div>`;
                variantsSection.innerHTML = varsHtml;

                // Overwrite price/stock with the lowest variant by default
                let lowestV = product.variants[lowestVarIdx];
                const lowestVAsli = parseFloat(lowestV.harga_asli) > 0 ? parseFloat(lowestV.harga_asli) : parseFloat(lowestV.harga_jual);
                updatePriceAndStock(parseFloat(lowestV.harga_jual), lowestVAsli, lowestV.stok);

                // Add event listeners to buttons
                const varBtns = variantsSection.querySelectorAll('.variant-btn');
                varBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        varBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        updatePriceAndStock(parseFloat(btn.getAttribute('data-harga')), parseFloat(btn.getAttribute('data-asli')), parseInt(btn.getAttribute('data-stok')));

                        // Sync Image if it has one
                        const vImg = btn.getAttribute('data-img');
                        if (vImg && window._galleryShowImage) {
                            window._galleryShowImage(vImg);
                        }
                    });
                });
            } else {
                variantsSection.innerHTML = ''; // Clear if no variants
            }
        }

        // Shop Profile
        if (product.shop) {
            const shopName = document.querySelector('.shop-name-wrapper .shop-name');
            const shopLoc = document.querySelector('.shop-stats');
            const shopLogo = document.querySelector('.shop-logo');
            const shopFallback = document.getElementById('shop-overview-logo-fallback');
            const visitBtn = document.querySelector('.btn-visit-shop');
            const chatBtn = document.querySelector('.btn-chat');

            if (shopName) shopName.textContent = product.shop.nama_toko;
            if (shopLoc) shopLoc.innerHTML = `Kota ${product.shop.alamat_toko}`;
            if (shopLogo && product.shop.foto_profil) {
                shopLogo.src = `/storage/${product.shop.foto_profil}`;
                shopLogo.style.display = 'block';
                if (shopFallback) shopFallback.style.display = 'none';
            }
            if (visitBtn) visitBtn.setAttribute('onclick', `window.location.href='/toko/${product.shop.id}'`);
            if (chatBtn) chatBtn.setAttribute('onclick', `window.location.href='/chat?shop_id=${product.shop.id}'`);
        }

        // Description
        const descContent = document.querySelector('.description-content');
        if (descContent) descContent.innerHTML = `<p>${escapeHTML(product.deskripsi).replace(/\\n/g, '<br>')}</p>`;

        // Collect all images including variants
        let allImages = [];
        if (product.images) allImages = [...product.images];
        if (product.variants) {
            product.variants.forEach(v => {
                if (v.image_url) allImages.push({ image_url: v.image_url, is_variant: true, var_id: v.id });
            });
        }

        // Render Images dynamically
        if (allImages.length > 0) {
            const gallerySlides = document.querySelector('.gallery-slides');
            const galleryDots = document.querySelector('.gallery-dots');
            const thumbContainer = document.querySelector('.thumbnails-container');

            let slidesHtml = '';
            let dotsHtml = '';
            let thumbsHtml = '';

            allImages.forEach((img, idx) => {
                const isActive = (idx === 0) ? 'active' : '';
                const fullUrl = `/storage/${img.image_url}`;
                slidesHtml += `<img src="${fullUrl}" alt="Product Image" class="gallery-img ${isActive}" data-src="${img.image_url}">`;
                dotsHtml += `<span class="dot ${isActive}" data-index="${idx}"></span>`;
                thumbsHtml += `<img src="${fullUrl}" alt="Thumb" class="thumbnail ${isActive}" data-index="${idx}">`;
            });

            if (gallerySlides) gallerySlides.innerHTML = slidesHtml;
            if (galleryDots) galleryDots.innerHTML = dotsHtml;
            if (thumbContainer) thumbContainer.innerHTML = thumbsHtml;

            // Re-init gallery logic
            initGallery();
        }

        // Add to Cart Logic
        const btnCart = document.querySelector('.btn-cart');
        if (btnCart) {
            // Remove previous listeners using clone to avoid multiple binds
            const newBtn = btnCart.cloneNode(true);
            btnCart.parentNode.replaceChild(newBtn, btnCart);

            newBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    alert('Silakan login terlebih dahulu!');
                    window.location.href = '/login';
                    return;
                }

                const qty = parseInt(document.querySelector('.qty-input').value) || 1;
                const activeVarBtn = document.querySelector('.variant-btn.active');
                const varId = activeVarBtn ? activeVarBtn.getAttribute('data-id') : null;

                const payload = {
                    product_id: product.id,
                    quantity: qty,
                    product_variant_id: varId
                };

                const oldHtml = newBtn.innerHTML;
                newBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
                newBtn.disabled = true;

                try {
                    const res = await fetch('/api/cart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        alert('Berhasil ditambah ke keranjang!');
                    } else {
                        const err = await res.json();
                        alert(err.message || 'Gagal menambahkan');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Terjadi kesalahan server');
                } finally {
                    newBtn.innerHTML = oldHtml;
                    newBtn.disabled = false;
                }
            });
        }

        // Buy Now Logic
        const btnBuyNow = document.getElementById('btn-buy-now');
        if (btnBuyNow) {
            const newBtnBuy = btnBuyNow.cloneNode(true);
            btnBuyNow.parentNode.replaceChild(newBtnBuy, btnBuyNow);

            newBtnBuy.addEventListener('click', async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    alert('Silakan login terlebih dahulu!');
                    window.location.href = '/login';
                    return;
                }

                const qty = parseInt(document.querySelector('.qty-input').value) || 1;
                const activeVarBtn = document.querySelector('.variant-btn.active');
                const varId = activeVarBtn ? activeVarBtn.getAttribute('data-id') : null;

                const payload = {
                    product_id: product.id,
                    quantity: qty,
                    product_variant_id: varId
                };

                const oldHtml = newBtnBuy.innerHTML;
                newBtnBuy.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
                newBtnBuy.disabled = true;

                try {
                    const res = await fetch('/api/cart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        // Pastikan menyimpannya sebagai string, agar compatible dengan array filter di Pembayaran.js
                        localStorage.setItem('checkout_items', JSON.stringify([String(data.cart.id)]));
                        window.location.href = '/pembayaran';
                    } else {
                        const err = await res.json();
                        alert(err.message || 'Gagal memproses Beli Sekarang');
                        newBtnBuy.innerHTML = oldHtml;
                        newBtnBuy.disabled = false;
                    }
                } catch (e) {
                    console.error(e);
                    alert('Terjadi kesalahan server');
                    newBtnBuy.innerHTML = oldHtml;
                    newBtnBuy.disabled = false;
                }
            });
        }
    }

    function initGallery() {
        const mainImages = document.querySelectorAll('.gallery-img');
        const dots = document.querySelectorAll('.gallery-dots .dot');
        const thumbnails = document.querySelectorAll('.thumbnails-container .thumbnail');
        const prevBtn = document.querySelector('.gallery-btn.prev-btn');
        const nextBtn = document.querySelector('.gallery-btn.next-btn');

        let currentImageIndex = 0;

        const showImage = (index) => {
            currentImageIndex = (index + mainImages.length) % mainImages.length;
            mainImages.forEach(img => img.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            thumbnails.forEach(thumb => thumb.classList.remove('active'));

            if (mainImages[currentImageIndex]) mainImages[currentImageIndex].classList.add('active');
            if (dots[currentImageIndex]) dots[currentImageIndex].classList.add('active');
            if (thumbnails[currentImageIndex]) thumbnails[currentImageIndex].classList.add('active');
        };

        // Expose function globally to let variant buttons trigger this
        window._galleryShowImage = (partialUrl) => {
            const targetIndex = Array.from(mainImages).findIndex(img => img.getAttribute('data-src') === partialUrl);
            if (targetIndex !== -1) {
                showImage(targetIndex);
            }
        };

        if (prevBtn) {
            // Replace old listeners by cloning
            const newPrev = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrev, prevBtn);
            newPrev.addEventListener('click', () => showImage(currentImageIndex - 1));
        }
        if (nextBtn) {
            const newNext = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNext, nextBtn);
            newNext.addEventListener('click', () => showImage(currentImageIndex + 1));
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showImage(index));
        });

        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => showImage(index));
        });
    }

    loadProductDetail();
});
