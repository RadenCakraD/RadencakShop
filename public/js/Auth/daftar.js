document.addEventListener('DOMContentLoaded', () => {
    // --- Password Visibility Toggle ---
    const togglePasswords = document.querySelectorAll('.toggle-password');
    togglePasswords.forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });

    // --- Form Validation ---
    const registerForm = document.getElementById('register-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // --- File Upload UI Update ---
    const fileFoto = document.getElementById('foto-profil');
    const nameFoto = document.getElementById('name-foto');
    if (fileFoto) {
        fileFoto.addEventListener('change', function() {
            if(this.files && this.files[0]) {
                nameFoto.textContent = this.files[0].name;
                nameFoto.style.color = '#fff';
            }
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check password match
        if (passwordInput.value !== confirmPasswordInput.value) {
            showToast('Password dan konfirmasi password tidak cocok!', 'error');
            return;
        }

        // Check password length
        if (passwordInput.value.length < 8) {
            showToast('Password minimal 8 karakter!', 'error');
            return;
        }
        
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Memproses...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;

        const formData = new FormData(registerForm);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message + ' Mengalihkan...', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showToast(result.message || 'Terjadi kesalahan saat mendaftar!', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            showToast('Koneksi server gagal!', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
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
