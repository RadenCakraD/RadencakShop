document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token');
    const cartContainer = document.getElementById('cart-container');
    const totalPriceDisplay = document.getElementById('totalPriceDisplay');
    const btnCheckout = document.getElementById('btnCheckout');
    const checkAllBtn = document.getElementById('checkAll');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    const formatRp = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const fetchCartData = async () => {
        try {
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const carts = await response.json();
                renderCart(carts);
            } else {
                cartContainer.innerHTML = '<p style="text-align:center; padding:50px;">Gagal memuat keranjang.</p>';
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
            cartContainer.innerHTML = '<p style="text-align:center; padding:50px;">Terjadi kesalahan koneksi.</p>';
        }
    };

    const renderCart = (carts) => {
        if (carts.length === 0) {
            cartContainer.innerHTML = `
                <div style="text-align: center; padding: 100px 20px;">
                    <i class="fa-solid fa-cart-shopping" style="font-size: 64px; color: #333; margin-bottom: 20px;"></i>
                    <h2 style="color: var(--teks-utama);">Keranjangmu Kosong</h2>
                    <p style="color: var(--teks-pendukung); margin-bottom: 30px;">Yuk, cari produk impianmu sekarang!</p>
                    <a href="/" class="btn-toko btn-primary" style="text-decoration: none; display: inline-block;">Mulai Belanja</a>
                </div>
            `;
            updateCartSummary();
            return;
        }

        // Group by shop
        const grouped = {};
        carts.forEach(item => {
            const shopId = item.product.shop.id;
            if (!grouped[shopId]) {
                grouped[shopId] = {
                    name: item.product.shop.nama_toko,
                    items: []
                };
            }
            grouped[shopId].items.push(item);
        });

        let html = '';
        Object.values(grouped).forEach(shop => {
            html += `
                <div class="cart-group">
                    <div class="cart-store-header">
                        <label class="custom-checkbox-wrapper">
                            <input type="checkbox" class="store-check">
                            <span class="custom-check"></span>
                        </label>
                        <i class="fa-solid fa-store" style="color:var(--teks-pendukung); margin-left: 10px;"></i>
                        <span class="store-name">${shop.name}</span>
                    </div>
            `;

            shop.items.forEach(item => {
                const price = item.variant ? item.variant.harga_jual : item.product.harga_jual;
                const originalPrice = item.variant ? (item.variant.harga_asli || price) : (item.product.harga_dasar || price);
                const strikethroughHtml = parseFloat(originalPrice) > parseFloat(price) 
                    ? `<span style="text-decoration:line-through; color:var(--text-secondary); font-size:11px; margin-right:6px;">${formatRp(originalPrice)}</span>`
                    : '';

                const img = item.product.images && item.product.images.length > 0 
                    ? `/storage/${item.product.images.find(i => i.is_primary)?.image_url || item.product.images[0].image_url}` 
                    : 'https://picsum.photos/seed/placeholder/100/100';
                
                html += `
                    <div class="cart-item" data-cart-id="${item.id}">
                        <label class="custom-checkbox-wrapper">
                            <input type="checkbox" class="item-check" data-price="${price}">
                            <span class="custom-check"></span>
                        </label>
                        <img src="${img}" alt="${item.product.nama_produk}" class="item-img" loading="lazy">
                        <div class="item-info">
                            <div class="item-name">${item.product.nama_produk}</div>
                            <div class="item-variant">${item.variant ? 'Varian: ' + item.variant.nama_jenis : ''}</div>
                            <div class="item-price">${strikethroughHtml}${formatRp(price)}</div>
                        </div>
                        <div class="item-actions">
                            <div class="qty-control">
                                <button class="qty-btn min-btn"><i class="fa-solid fa-minus"></i></button>
                                <input type="number" class="qty-input" value="${item.qty}" min="1" max="${item.variant ? item.variant.stok : item.product.stok}">
                                <button class="qty-btn plus-btn"><i class="fa-solid fa-plus"></i></button>
                            </div>
                            <button class="btn-delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        cartContainer.innerHTML = html;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        const storeChecks = document.querySelectorAll('.store-check');
        const itemChecks = document.querySelectorAll('.item-check');

        // Check All
        checkAllBtn.onclick = (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('input[type="checkbox"]').forEach(ch => ch.checked = isChecked);
            updateCartSummary();
        };

        // Store Check
        storeChecks.forEach(ch => {
            ch.onclick = (e) => {
                const group = e.target.closest('.cart-group');
                group.querySelectorAll('.item-check').forEach(itemCh => itemCh.checked = e.target.checked);
                updateCartSummary();
            };
        });

        // Item Check
        itemChecks.forEach(ch => {
            ch.onclick = () => updateCartSummary();
        });

        // Qty Controls
        document.querySelectorAll('.cart-item').forEach(item => {
            const cartId = item.getAttribute('data-cart-id');
            const minBtn = item.querySelector('.min-btn');
            const plusBtn = item.querySelector('.plus-btn');
            const qtyInput = item.querySelector('.qty-input');
            const delBtn = item.querySelector('.btn-delete');

            minBtn.onclick = () => updateQty(cartId, parseInt(qtyInput.value) - 1, qtyInput);
            plusBtn.onclick = () => updateQty(cartId, parseInt(qtyInput.value) + 1, qtyInput);
            qtyInput.onchange = () => updateQty(cartId, parseInt(qtyInput.value), qtyInput);
            
            delBtn.onclick = () => deleteCartItem(cartId, item);
        });
    };

    const updateQty = async (cartId, newQty, inputEl) => {
        const min = parseInt(inputEl.getAttribute('min')) || 1;
        const max = parseInt(inputEl.getAttribute('max')) || 999;

        if (newQty < min) newQty = min;
        if (newQty > max) newQty = max;

        if (newQty == parseInt(inputEl.value) && inputEl.value != "") return;

        try {
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ quantity: newQty })
            });

            if (response.ok) {
                inputEl.value = newQty;
                updateCartSummary();
            }
        } catch (error) {
            console.error('Error updating qty:', error);
        }
    };

    const deleteCartItem = async (cartId, itemEl) => {
        if (!confirm('Hapus item ini dari keranjang?')) return;

        try {
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const group = itemEl.closest('.cart-group');
                itemEl.remove();
                if (group.querySelectorAll('.cart-item').length === 0) {
                    group.remove();
                }
                updateCartSummary();
                if (document.querySelectorAll('.cart-item').length === 0) {
                    fetchCartData(); // Show empty state
                }
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const updateCartSummary = () => {
        let total = 0;
        let count = 0;
        const checkedItems = document.querySelectorAll('.item-check:checked');
        
        checkedItems.forEach(ch => {
            const item = ch.closest('.cart-item');
            const price = parseFloat(ch.getAttribute('data-price'));
            const qty = parseInt(item.querySelector('.qty-input').value);
            total += price * qty;
            count++;
        });

        totalPriceDisplay.textContent = formatRp(total);
        btnCheckout.textContent = `Checkout (${count})`;
        btnCheckout.disabled = count === 0;

        // Sync checkAll
        const allItems = document.querySelectorAll('.item-check');
        checkAllBtn.checked = allItems.length > 0 && checkedItems.length === allItems.length;
    };

    // Checkout button logic
    btnCheckout.onclick = () => {
        const selectedItems = [];
        document.querySelectorAll('.item-check:checked').forEach(ch => {
            selectedItems.push(ch.closest('.cart-item').getAttribute('data-cart-id'));
        });
        
        if (selectedItems.length > 0) {
            // Save selected IDs to session/local storage for Checkout page
            localStorage.setItem('checkout_items', JSON.stringify(selectedItems));
            window.location.href = '/pembayaran';
        }
    };

    fetchCartData();
});
