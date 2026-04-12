document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token');
    const checkoutContainer = document.getElementById('checkout-items-container');
    const textGrandTotal = document.getElementById('calc-grand-total');
    const textTotalProduct = document.getElementById('calc-total-product');
    const btnCheckoutFinal = document.querySelector('.btn-checkout-final');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    const formatRp = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(number);
    };

    /* --- DATA ALAMAT PENGGUNA --- */
    const addressContentBox = document.getElementById('address-content');
    const addressTabs = document.querySelectorAll('.address-tab');
    let currentUserData = null;

    const loadUserData = async () => {
        try {
            const response = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) {
                currentUserData = await response.json();
                renderAddress();
            }
        } catch(e) { console.error('Failed to load user', e); }
    };

    const renderAddress = () => {
        if (currentUserData) {
            const name = currentUserData.name || 'Nama Belum Diatur';
            const phone = currentUserData.no_hp || 'No HP Belum Diatur';
            const address = currentUserData.alamat || 'Alamat Belum Diatur. Harap konfigurasi di setelan akun.';

            addressContentBox.innerHTML = `
                <div class="address-name">${name}</div>
                <div class="address-phone">${phone}</div>
                <div class="address-full"><span style="color: var(--teks-utama); font-weight:600;">[Alamat Utama]</span> ${address}</div>
            `;
        }
    };

    // Hide dummy tabs
    addressTabs.forEach(tab => {
        if (tab.dataset.type !== 'rumah') {
            tab.style.display = 'none';
        } else {
            tab.innerText = 'Alamat Saya';
            tab.classList.add('active');
        }
    });

    loadUserData();

    /* --- FETCH CHECKOUT ITEMS --- */
    let checkoutItems = [];
    let totalPrice = 0;

    const loadCheckoutData = async () => {
        const selectedIds = JSON.parse(localStorage.getItem('checkout_items') || '[]');
        if (selectedIds.length === 0) {
            alert('Tidak ada item untuk di-checkout.');
            window.location.href = '/keranjang';
            return;
        }

        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) {
                const carts = await response.json();
                checkoutItems = carts.filter(c => selectedIds.includes(c.id.toString()));
                renderCheckoutItems();
                recalculateTotal();
            }
        } catch (error) {
            console.error('Error loading checkout items:', error);
        }
    };

    const renderCheckoutItems = () => {
        let html = '';
        checkoutItems.forEach(item => {
            const price = item.variant ? item.variant.harga_jual : item.product.harga_jual;
            const originalPrice = item.variant ? (item.variant.harga_asli || price) : (item.product.harga_dasar || price);
            const strikethroughHtml = parseFloat(originalPrice) > parseFloat(price) 
                ? `<span style="text-decoration:line-through; color:var(--text-secondary); font-size:11px; margin-right:6px;">${formatRp(originalPrice)}</span>`
                : '';

            const img = item.product.images && item.product.images.length > 0 
                ? `/storage/${item.product.images.find(i => i.is_primary)?.image_url || item.product.images[0].image_url}` 
                : 'https://picsum.photos/seed/placeholder/100/100';

            html += `
                <div class="product-summary-row" style="margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                    <img src="${img}" alt="Product" class="checkout-product-img" loading="lazy">
                    <div class="checkout-product-info">
                        <div class="checkout-product-category">${item.product.kategori}</div>
                        <div class="checkout-product-name">${item.product.nama_produk}</div>
                        <div class="checkout-product-variant">${item.variant ? 'Varian: ' + item.variant.nama_jenis : ''}</div>
                        <div style="color:var(--teks-utama); font-size:12px; margin-top:4px;">Harga per satuan: ${strikethroughHtml}${formatRp(price)}</div>
                        <div style="color:var(--aksen-emas); font-weight:600; margin-top:2px;">Subtotal: ${formatRp(price * item.qty)}</div>
                    </div>
                    <div class="checkout-product-qty">x ${item.qty}</div>
                </div>
            `;
        });
        checkoutContainer.innerHTML = html;
    };

    const recalculateTotal = () => {
        let productTotal = 0;
        let totalItems = 0;
        checkoutItems.forEach(item => {
            const price = item.variant ? item.variant.harga_jual : item.product.harga_jual;
            productTotal += price * item.qty;
            totalItems += item.qty;
        });

        const serviceFee = 500;
        const finalTotal = productTotal + serviceFee;

        textTotalProduct.textContent = formatRp(productTotal);
        textGrandTotal.textContent = formatRp(finalTotal);
        
        const labelTotalProduct = document.getElementById('label-total-product');
        if (labelTotalProduct) {
            labelTotalProduct.textContent = `Total Harga (${totalItems} Penjumlahan Qty)`;
        }
    };

    /* --- PAYMENT METHODS --- */
    const paymentMethods = document.querySelectorAll('.payment-method-box');
    const subOptionContainers = document.querySelectorAll('.payment-sub-options');
    const subOptionBtns = document.querySelectorAll('.sub-option-btn');

    paymentMethods.forEach(box => {
        box.addEventListener('click', () => {
            paymentMethods.forEach(b => b.classList.remove('active'));
            box.classList.add('active');
            subOptionContainers.forEach(c => c.style.display = 'none');
            const targetSub = document.getElementById('sub-options-' + box.dataset.method);
            if (targetSub) targetSub.style.display = 'grid';
        });
    });

    subOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.payment-sub-options').querySelectorAll('.sub-option-btn').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    /* --- FINAL CHECKOUT --- */
    if (btnCheckoutFinal) {
        btnCheckoutFinal.addEventListener('click', async () => {
            const cartIds = checkoutItems.map(item => item.id);
            if (!currentUserData) {
                alert('Tunggu sebentar, sistem sedang memuat data alamat Anda...');
                return;
            }

            const selectedMethodBox = document.querySelector('.payment-method-box.active');
            let methodText = selectedMethodBox ? selectedMethodBox.querySelector('span').textContent : "Transfer Bank";
            const targetSub = document.getElementById('sub-options-' + (selectedMethodBox ? selectedMethodBox.dataset.method : 'bank'));
            if (targetSub) {
                const sub = targetSub.querySelector('.sub-option-btn.active');
                if (sub) methodText += ' - ' + sub.textContent;
            }

            const payload = {
                cart_ids: cartIds,
                address_info: `${currentUserData.name || 'Tanpa Nama'} | ${currentUserData.no_hp || '-'} | ${currentUserData.alamat || '-'}`,
                payment_method: methodText,
                shipping_method: 'Reguler'
            };

            btnCheckoutFinal.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Pesanan...';
            btnCheckoutFinal.disabled = true;

            try {
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    alert('Pesanan Berhasil Dibuat!\nTerima kasih telah berbelanja.');
                    localStorage.removeItem('checkout_items');
                    window.location.href = '/';
                } else {
                    const err = await res.json();
                    alert(err.message || 'Gagal membuat pesanan');
                    btnCheckoutFinal.innerHTML = 'Bayar Sekarang';
                    btnCheckoutFinal.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert('Terjadi kesalahan server');
                btnCheckoutFinal.innerHTML = 'Bayar Sekarang';
                btnCheckoutFinal.disabled = false;
            }
        });
    }

    loadCheckoutData();
});
