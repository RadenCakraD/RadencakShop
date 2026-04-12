document.addEventListener('DOMContentLoaded', () => {
    
    const globalToken = localStorage.getItem('auth_token');
    if (!globalToken) {
        window.location.href = '/login';
    } else {
        fetch('/api/user', {
            headers: { 'Authorization': `Bearer ${globalToken}`, 'Accept': 'application/json' }
        }).then(r => r.json()).then(u => {
            if(u.shop) {
                window.location.href = '/mytoko';
            }
        }).catch(e => console.error(e));
    }

    const form = document.getElementById('shop-register-form');
    const urlToko = document.getElementById('url-toko');

    // Auto-format for URL (lowercase, replace spaces with hyphen, prevent special chars)
    urlToko.addEventListener('input', function(e) {
        let value = this.value;
        value = value.toLowerCase()
                     .replace(/\s+/g, '-')       // Replace spaces with -
                     .replace(/[^a-z0-9-]/g, '');// Remove all non-alphanumeric except -
        this.value = value;
    });

    // File upload names
    const fileFoto = document.getElementById('foto-profil');
    const nameFoto = document.getElementById('name-foto');
    fileFoto.addEventListener('change', function() {
        if(this.files && this.files[0]) {
            nameFoto.textContent = this.files[0].name;
            nameFoto.style.color = 'var(--text-primary)';
        }
    });

    const fileBanner = document.getElementById('banner-toko');
    const nameBanner = document.getElementById('name-banner');
    fileBanner.addEventListener('change', function() {
        if(this.files && this.files[0]) {
            nameBanner.textContent = this.files[0].name;
            nameBanner.style.color = 'var(--text-primary)';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic Checkbox validation for curriers
        const kurirCheckboxes = document.querySelectorAll('input[name="kurir[]"]:checked');
        if (kurirCheckboxes.length === 0) {
            showToast('Pilih minimal satu layanan kurir pengiriman!', 'error');
            return;
        }

        // Submit via Fetch
        const btnSubmit = document.getElementById('btn-submit');
        const originalContent = btnSubmit.innerHTML;
        
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Membuat Toko...</span>';
        btnSubmit.disabled = true;

        const formData = new FormData(form);
        const token = localStorage.getItem('auth_token');

        if (!token) {
            showToast('Anda harus login terlebih dahulu!', 'error');
            setTimeout(() => window.location.href = '/login', 1500);
            return;
        }

        fetch('/api/shop/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(res => res.json().then(data => ({status: res.status, ok: res.ok, body: data})))
        .then(response => {
            if (response.ok) {
                showToast('Toko berhasil dibuat! Selamat datang di Raden Shop.', 'success');
                setTimeout(() => {
                    btnSubmit.innerHTML = originalContent;
                    btnSubmit.disabled = false;
                    window.location.href = '/mytoko';
                }, 2000);
            } else {
                showToast(response.body.message || 'Gagal mendaftar toko', 'error');
                btnSubmit.innerHTML = originalContent;
                btnSubmit.disabled = false;
            }
        })
        .catch(err => {
            showToast('Koneksi server gagal!', 'error');
            btnSubmit.innerHTML = originalContent;
            btnSubmit.disabled = false;
        });
    });

    // --- Utility: Toast Notification ---
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
