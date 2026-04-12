document.addEventListener('DOMContentLoaded', () => {
    const escapeHTML = str => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag]));
    };
    
    // Sidebar Logic
    const headerLeftProfile = document.querySelector('.header-left');
    const userSidebar = document.getElementById('userSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    const openSidebar = () => {
        userSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
    };

    const closeSidebar = () => {
        userSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    };

    if (headerLeftProfile) headerLeftProfile.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    
    // Helper to format currency
    const formatRp = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // Card Generation Template
    const createProductCard = (product) => {
        // Toko badge logic (raden = verified, rakyat = unverified)
        const isRaden = product.isVerified;
        const tokoBadgeClass = isRaden ? 'raden' : 'rakyat';
        const tokoBadgeLabel = isRaden ? '<i class="fa-solid fa-check-circle"></i> Raden' : 'Rakyat';
        
        return `
            <a href="/product/${product.slug}" style="text-decoration: none;" class="product-card">
                <div class="shop-badge ${tokoBadgeClass}">${tokoBadgeLabel}</div>
                ${product.discount > 0 ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
                
                <div class="product-info">
                    <div class="product-name">${escapeHTML(product.name)}</div>
                    
                    <div class="price-row">
                        ${product.originalPrice > product.actualPrice ? `<span class="original-price">${formatRp(product.originalPrice)}</span>` : ''}
                        <span class="actual-price">${formatRp(product.actualPrice)}</span>
                    </div>
                    
                    <div class="stats-row">
                        <span class="rating"><i class="fa-solid fa-star"></i> ${product.rating}</span>
                        <span class="sold">${product.sold} Terjual</span>
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

    // API Product Fetching (Pagination & Scroll)
    let apiProducts = [];
    let currentProductsPool = []; // For searching functionality
    let isSearchActive = false;
    let displayedProductIds = new Set();
    let isFetchingProducts = false;
    let currentPage = 1;
    let hasMorePages = true;

    async function fetchProducts(page = 1) {
        if(isFetchingProducts || (!hasMorePages && !isSearchActive)) return;
        isFetchingProducts = true;
        try {
            const response = await fetch(`/api/products?page=${page}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const dbResponse = await response.json();
                
                if (dbResponse.last_page) {
                    hasMorePages = page < dbResponse.last_page;
                } else if (!dbResponse.data) {
                    hasMorePages = false;
                } else {
                    hasMorePages = dbResponse.data && dbResponse.data.length > 0;
                }

                const rawProducts = dbResponse.data || dbResponse;
                const newFormattedProducts = rawProducts.map(p => {
                    const primaryImg = p.images && p.images.find(i => i.is_primary);
                    const defaultImgUrl = "https://picsum.photos/seed/placeholder/300/300";
                    
                    let original = parseFloat(p.harga_dasar) > 0 ? parseFloat(p.harga_dasar) : parseFloat(p.harga_jual);
                    let actual = parseFloat(p.harga_jual);

                    if (p.variants && p.variants.length > 0) {
                        const lowestVariant = p.variants.reduce((min, v) => parseFloat(v.harga_jual) < parseFloat(min.harga_jual) ? v : min, p.variants[0]);
                        actual = parseFloat(lowestVariant.harga_jual);
                        original = parseFloat(lowestVariant.harga_asli) > 0 ? parseFloat(lowestVariant.harga_asli) : actual;
                    }

                    let disc = original > actual ? Math.round(((original - actual) / original) * 100) : 0;

                    return {
                        id: p.id,
                        slug: p.slug,
                        name: p.nama_produk,
                        image: primaryImg ? `/storage/${primaryImg.image_url}` : defaultImgUrl,
                        isVerified: true, 
                        discount: disc,
                        originalPrice: original,
                        actualPrice: actual,
                        rating: 5.0,
                        sold: 0,
                        location: p.shop ? p.shop.alamat_toko : "Indonesia",
                        shopName: p.shop ? p.shop.nama_toko : "",
                        shopAvatar: (p.shop && p.shop.foto_profil) ? `/storage/${p.shop.foto_profil}` : ""
                    };
                });
                
                if (page === 1) {
                    apiProducts = newFormattedProducts;
                    displayedProductIds.clear();
                } else {
                    apiProducts = [...apiProducts, ...newFormattedProducts];
                }

                if (!isSearchActive) {
                    currentProductsPool = [...apiProducts];
                }
                
                if (page === 1 && !isSearchActive) {
                    initProductUI();
                } else if (!isSearchActive) {
                    // Append new items
                    const recommendationGrid = document.getElementById('recommendation-grid');
                    if(recommendationGrid) {
                        let recHtml = '';
                        newFormattedProducts.forEach(p => {
                            if (!displayedProductIds.has(p.id)) {
                                recHtml += createProductCard(p);
                                displayedProductIds.add(p.id);
                            }
                        });
                        recommendationGrid.insertAdjacentHTML('beforeend', recHtml);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            isFetchingProducts = false;
        }
    }

    // Banner Slider Logic
    const slides = document.querySelectorAll('.banner-slides .slide-item');
    const dots = document.querySelectorAll('.slider-dots .dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (slides.length > 0) {
        let currentSlide = 0;
        let slideInterval;

        const showSlide = (index) => {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            if(dots[currentSlide]) dots[currentSlide].classList.add('active');
        };

        const nextSlide = () => showSlide(currentSlide + 1);
        const prevSlide = () => showSlide(currentSlide - 1);

        const startSlide = () => {
            slideInterval = setInterval(nextSlide, 5000);
        };

        const resetSlide = () => {
            clearInterval(slideInterval);
            startSlide();
        };

        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetSlide(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetSlide(); });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => { showSlide(index); resetSlide(); });
        });

        startSlide();
    }

    function initProductUI() {
        // Flash Sale (First 6 items, with mocked 99% discount logic)
        const flashSaleContainer = document.getElementById('flash-sale-container');
        if (flashSaleContainer) {
            if (apiProducts.length === 0) {
                flashSaleContainer.innerHTML = '<p style="color:var(--text-secondary); grid-column:1/-1;">Belum ada produk dari database.</p>';
            } else {
                const flashProducts = apiProducts.slice(0, 6);
                let flashHtml = '';
                flashProducts.forEach(prod => {
                    const fProd = {...prod, discount: 99, actualPrice: prod.originalPrice * 0.01};
                    flashHtml += createProductCard(fProd);
                });
                flashSaleContainer.innerHTML = flashHtml;
            }
        }

        // Populate Recommendations Sequence without random duplication
        const recommendationGrid = document.getElementById('recommendation-grid');
        if (recommendationGrid) {
            if (currentPage === 1) recommendationGrid.innerHTML = '';
            
            let recHtml = '';
            apiProducts.forEach(p => {
                if (!displayedProductIds.has(p.id)) {
                    recHtml += createProductCard(p);
                    displayedProductIds.add(p.id);
                }
            });
            recommendationGrid.insertAdjacentHTML('beforeend', recHtml);
            
            // Only add scroll listener once (we can attach it on init, and it pulls pages)
            if (!window._scrollListenerAdded) {
                window.addEventListener('scroll', () => {
                    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
                        if (!isFetchingProducts && hasMorePages) {
                            currentPage++;
                            fetchProducts(currentPage);
                        }
                    }
                });
                window._scrollListenerAdded = true;
            }

            window._resetRecommendationGrid = () => {
                currentPage = 1;
                hasMorePages = true;
                recommendationGrid.innerHTML = '';
                displayedProductIds.clear();
                // Since this might be called on search, we need to adapt search pool rendering
                if(isSearchActive) {
                   let searchHtml = '';
                   currentProductsPool.forEach(p => searchHtml += createProductCard(p));
                   recommendationGrid.innerHTML = searchHtml;
                } else {
                   fetchProducts(currentPage);
                }
            };
        }
    }
    
    // Fungsi untuk menyelipkan produk secara realtime di urutan awal grid Rekomendasi 
    function updateProductUINonDisruptive() {
        const recommendationGrid = document.getElementById('recommendation-grid');
        if(!recommendationGrid) return;
        
        let newItemsHtml = '';
        apiProducts.forEach(p => {
            if(!displayedProductIds.has(p.id)) {
                newItemsHtml += createProductCard(p);
                displayedProductIds.add(p.id);
            }
        });
        
        if(newItemsHtml !== '') {
            recommendationGrid.insertAdjacentHTML('afterbegin', newItemsHtml);
            
            // Juga update Flash sale sekilas agar tetap fresh
            const flashSaleContainer = document.getElementById('flash-sale-container');
            if(flashSaleContainer && apiProducts.length > 0) {
                 const flashProducts = apiProducts.slice(0, 6);
                 let flashHtml = '';
                 flashProducts.forEach(prod => {
                     const fProd = {...prod, discount: 99, actualPrice: prod.originalPrice * 0.01};
                     flashHtml += createProductCard(fProd);
                 });
                 flashSaleContainer.innerHTML = flashHtml;
            }
        }
    }

    // Call the initializer fetch
    fetchProducts(currentPage);
    
    // Setup Search Logic
    const searchInput = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.search-btn');

    const performSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            isSearchActive = false;
            currentProductsPool = [...apiProducts];
        } else {
            isSearchActive = true;
            currentProductsPool = apiProducts.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.shopName && p.shopName.toLowerCase().includes(query))
            );
        }
        
        if(window._resetRecommendationGrid) {
            window._resetRecommendationGrid();
        }
        
        const recGrid = document.getElementById('recommendation-grid');
        if(currentProductsPool.length === 0 && recGrid && isSearchActive) {
            recGrid.innerHTML = '<p style="color:var(--teks-pendukung); grid-column:1/-1; text-align:center;">Tidak ada produk yang cocok dengan pencarian Anda.</p>';
        }
    };

    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        searchInput.addEventListener('input', () => {
            if (searchInput.value.trim() === '') performSearch();
        });
    }

    // Fetch global user info
    async function fetchUserInfo() {
        const token = localStorage.getItem('auth_token');
        if(!token) return;

        try {
            const res = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if(res.ok) {
                const user = await res.json();
                
                // Update Sidebar
                const sidebarName = document.querySelector('.sidebar-user-info h3');
                const sidebarEmail = document.querySelector('.sidebar-user-info span');
                const sidebarAvatar = document.querySelector('.sidebar-avatar');
                if(sidebarName) sidebarName.textContent = user.name;
                if(sidebarEmail) sidebarEmail.textContent = user.email;
                if(sidebarAvatar && user.avatar) {
                    sidebarAvatar.src = '/storage/' + user.avatar;
                    sidebarAvatar.style.display = 'block';
                    const fb = document.querySelector('.sidebar-avatar-fallback');
                    if (fb) fb.style.display = 'none';
                }

                // Logic Pengalihan Otomatis "Toko Saya"
                const myTokoLink = document.getElementById('toko-saya-link');
                if (myTokoLink) {
                    if (!user.shop) {
                        myTokoLink.href = "/daftar-toko";
                    } else {
                        myTokoLink.href = "/mytoko";
                    }
                }

                // Update Header
                const headerName = document.getElementById('header-user-name');
                const headerAvatar = document.getElementById('header-user-avatar');
                if(headerName) headerName.textContent = user.name;
                if(headerAvatar && user.avatar) {
                    headerAvatar.src = '/storage/' + user.avatar;
                    headerAvatar.style.display = 'block';
                    const fbHeader = document.getElementById('header-user-avatar-fallback');
                    if (fbHeader) fbHeader.style.display = 'none';
                }
            }
        } catch(e) {
            console.error(e);
        }
    }
    fetchUserInfo();
});
