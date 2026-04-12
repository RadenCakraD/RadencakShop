// informasi.js

// 1. Modal Logic
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// Close modal when clicking on overlay
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Format currency
const formatRp = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number);
};

// API Integration
const token = localStorage.getItem('auth_token');
if(!token) {
    window.location.href = '/login';
}

async function loadOrders() {
    try {
        const res = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if(res.ok) {
            const data = await res.json();
            renderOrders(data);
        }
    } catch(e) {
        console.error("Gagal memuat pesanan", e);
    }
}

function createOrderHTML(order, status) {
    let html = '';
    // Single order can have multiple items, rendering the first one purely for simple view
    const item = order.items && order.items.length > 0 ? order.items[0] : null;
    if(!item) return html;

    const imgUrl = "https://picsum.photos/seed/placeholder/100/100"; // Can be replaced with actual item img if joined
    
    html += `
        <div class="order-item-simple" data-id="${order.id}">
            <img src="${imgUrl}" alt="Product">
            <div class="order-info">
                <h4>${item.product_name}</h4>
                <p>Total: ${formatRp(order.total_amount)}</p>
                <small style="color:var(--text-secondary)">No: ${order.order_number}</small>
            </div>
        </div>
    `;
    return html;
}

function renderOrders(groups) {
    // 1. Belum Bayar (pending)
    const pendingBody = document.querySelector('#modalBelumBayar .modal-body');
    if(pendingBody) {
        if(groups.pending.length > 0) {
            let html = `
                <div class="timer-container">
                    <span>Cek pesanan:</span>
                    <span id="countdownTimer" class="countdown-text">23:59:59</span>
                </div>
            `;
            groups.pending.forEach(o => html += createOrderHTML(o, 'pending'));
            html += `<button class="btn-primary-action" onclick="window.location.href='/pembayaran'">Bayar Semua</button>`;
            pendingBody.innerHTML = html;
        } else {
            pendingBody.innerHTML = '<div style="text-align:center; padding: 20px;">Belum ada tagihan.</div>';
        }
    }

    // 2. Dikemas (processing)
    const processingBody = document.querySelector('#modalDikemas .modal-body');
    if(processingBody) {
        if(groups.processing.length > 0) {
            let html = `<p class="status-info-text"><i class="fa-solid fa-circle-check"></i> Pesanan sedang disiapkan.</p>`;
            groups.processing.forEach(o => html += createOrderHTML(o, 'processing'));
            processingBody.innerHTML = html;
        } else {
            processingBody.innerHTML = '<div style="text-align:center; padding: 20px;">Tidak ada pesanan dikemas.</div>';
        }
    }

    // 3. Dikirim (shipped)
    const shippedBody = document.querySelector('#modalDikirim .modal-body');
    if(shippedBody) {
        if(groups.shipped.length > 0) {
            let html = `<div class="tracking-pill">Sedang dalam perjalanan</div>`;
            groups.shipped.forEach(o => {
                html += createOrderHTML(o, 'shipped');
                html += `<button class="btn-primary-action" style="margin-bottom:15px; margin-top:-10px" onclick="markAsReceived(${o.id})">Paket Sudah Sampai</button>`;
            });
            shippedBody.innerHTML = html;
        } else {
            shippedBody.innerHTML = '<div style="text-align:center; padding: 20px;">Tidak ada paket dalam perjalanan.</div>';
        }
    }

    // 4. Penilaian (completed)
    const completedBody = document.querySelector('#modalPenilaian .modal-body');
    if(completedBody) {
        if(groups.completed.length > 0) {
            let html = `<div id="ratingList" class="rating-list">`;
            groups.completed.forEach(o => {
                const item = o.items[0];
                html += `
                    <div class="order-item-simple rating-item">
                        <img src="https://picsum.photos/seed/placeholder/100/100" alt="Product">
                        <div class="order-info">
                            <h4>${item ? item.product_name : 'Pesanan'}</h4>
                            <div class="star-rating">
                                <i class="fa-solid fa-star" onclick="rate(this, 1)"></i>
                                <i class="fa-solid fa-star" onclick="rate(this, 2)"></i>
                                <i class="fa-solid fa-star" onclick="rate(this, 3)"></i>
                                <i class="fa-solid fa-star" onclick="rate(this, 4)"></i>
                                <i class="fa-solid fa-star" onclick="rate(this, 5)"></i>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
            completedBody.innerHTML = html;
        } else {
            completedBody.innerHTML = '<div style="text-align:center; padding: 20px;">Belum ada riwayat pesanan selesai.</div>';
        }
    }
}

// 3. Mark Package as Received Logic (Dikirim -> Penilaian)
window.markAsReceived = async function(orderId) {
    if(!confirm("Apakah benar paket pesanan sudah sampai di tangan?")) return;

    try {
        const res = await fetch(`/api/orders/${orderId}/receive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if(res.ok) {
            alert("Berhasil! Silakan beri penilaian.");
            closeModal('modalDikirim');
            loadOrders(); // Refresh all
            openModal('modalPenilaian');
        } else {
            alert("Gagal merubah status pesanan.");
        }
    } catch(err) {
        console.error(err);
    }
};

// 4. Rating Logic
window.rate = function(starElement, count) {
    const parent = starElement.parentNode;
    const allStars = parent.querySelectorAll('i');

    allStars.forEach((s, index) => {
        if (index < count) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    if (count === 5) {
        alert("Terima kasih! Penilaian bintang 5 telah tersimpan.");
    } else {
        alert(`Terima kasih! Penilaian bintang ${count} telah tersimpan.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
