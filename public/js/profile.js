document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const profileForm = document.getElementById('profileForm');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarFallback = document.getElementById('avatarFallback');

    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const hpInput = document.getElementById('hpInput');
    const alamatInput = document.getElementById('alamatInput');
    
    const btnSave = document.getElementById('btnSave');
    const saveSpinner = document.getElementById('saveSpinner');
    const btnText = btnSave.querySelector('span');

    let loadedFile = null;

    // Load Data
    async function loadData() {
        try {
            const res = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const user = await res.json();
                
                nameInput.value = user.name || '';
                emailInput.value = user.email || '';
                hpInput.value = user.no_hp || '';
                alamatInput.value = user.alamat || '';
                
                if (user.avatar) {
                    avatarPreview.src = `/storage/${user.avatar}`;
                    avatarPreview.style.display = 'block';
                    avatarFallback.style.display = 'none';
                }
            } else {
                alert('Sesi telah habis, silakan login ulang.');
                window.location.href = '/login';
            }
        } catch (e) {
            console.error('Gagal meload data:', e);
        }
    }

    // Avatar preview logic
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            loadedFile = file;
            const url = URL.createObjectURL(file);
            avatarPreview.src = url;
            avatarPreview.style.display = 'block';
            avatarFallback.style.display = 'none';
        }
    });

    // Form Submit
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Loading State
        btnSave.disabled = true;
        btnText.textContent = 'Menyimpan...';
        saveSpinner.style.display = 'inline-block';

        const formData = new FormData();
        formData.append('name', nameInput.value);
        formData.append('no_hp', hpInput.value);
        formData.append('alamat', alamatInput.value);
        if (loadedFile) {
            formData.append('avatar', loadedFile);
        }

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await res.json();
            
            if (res.ok) {
                alert('Profil berhasil disimpan!');
            } else {
                alert('Gagal menyimpan profil: ' + (result.message || 'Error'));
            }
        } catch (e) {
            console.error(e);
            alert('Koneksi terputus.');
        } finally {
            btnSave.disabled = false;
            btnText.textContent = 'Simpan Perubahan';
            saveSpinner.style.display = 'none';
        }
    });

    loadData();
});
