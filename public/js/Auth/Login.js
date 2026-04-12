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

    // --- Form Switching (Login <-> Forgot Password) ---
    const loginWrapper = document.getElementById('login-form-wrapper');
    const forgotWrapper = document.getElementById('forgot-form-wrapper');
    const lupaSandiTrigger = document.getElementById('lupa-sandi-trigger');
    const backToLoginBtn = document.getElementById('back-to-login');

    lupaSandiTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        loginWrapper.classList.remove('active');
        forgotWrapper.classList.add('active');
        resetForgotSteps();
    });

    backToLoginBtn.addEventListener('click', () => {
        forgotWrapper.classList.remove('active');
        loginWrapper.classList.add('active');
    });

    // --- Login Form Submit ---
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Memeriksa...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Simpan token
                localStorage.setItem('auth_token', result.token);
                // Set shop state indicator
                if(result.user.shop) {
                     localStorage.setItem('isShopRegistered', 'true');
                } else {
                     localStorage.setItem('isShopRegistered', 'false');
                }
                
                showToast(result.message + ' Mengalihkan...', 'success');
                setTimeout(() => {
                    window.location.href = '/'; // Redirect to Dashboard
                }, 1500);
            } else {
                showToast(result.message || 'Username atau password salah!', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            showToast('Koneksi server gagal!', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // --- Forgot Password Flow Simulation ---
    const step1 = document.getElementById('forgot-step-1');
    const step2 = document.getElementById('forgot-step-2');
    const step3 = document.getElementById('forgot-step-3');
    
    const btnNextStep1 = document.getElementById('btn-next-step1');
    const btnNextStep2 = document.getElementById('btn-next-step2');
    const btnSubmitReset = document.getElementById('btn-submit-reset');

    const resetEmailInput = document.getElementById('reset-email');
    const selectUsername = document.getElementById('select-username');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');

    function resetForgotSteps() {
        step1.classList.add('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        resetEmailInput.value = '';
        selectUsername.innerHTML = '<option value="" disabled selected>Pilih username...</option>';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
    }

    // Step 1 -> Step 2
    btnNextStep1.addEventListener('click', () => {
        const email = resetEmailInput.value.trim();
        if (!email) {
            showToast('Silakan masukkan email Anda', 'error');
            return;
        }
        
        // Simulate finding usernames based on email
        // In real app, this would be an AJAX call to the server
        showToast('Mencari akun...', 'success');
        
        // Mock data
        setTimeout(() => {
            const mockUsernames = ['user_premium1', 'toko_baju01', 'admin_radenshop'];
            
            mockUsernames.forEach(uname => {
                const option = document.createElement('option');
                option.value = uname;
                option.textContent = uname;
                selectUsername.appendChild(option);
            });

            step1.classList.remove('active');
            step2.classList.add('active');
        }, 800);
    });

    // Step 2 -> Step 3
    btnNextStep2.addEventListener('click', () => {
        if (!selectUsername.value) {
            showToast('Silakan pilih username', 'error');
            return;
        }
        step2.classList.remove('active');
        step3.classList.add('active');
    });

    // Step 3 (Submit)
    btnSubmitReset.addEventListener('click', () => {
        const p1 = newPasswordInput.value;
        const p2 = confirmNewPasswordInput.value;

        if (p1.length < 8) {
            showToast('Sandi minimal 8 karakter!', 'error');
            return;
        }

        if (p1 !== p2) {
            showToast('Sandi tidak cocok!', 'error');
            return;
        }

        // Simulate success
        showToast('Sandi berhasil diubah! Silakan masuk kembali.', 'success');
        setTimeout(() => {
            forgotWrapper.classList.remove('active');
            loginWrapper.classList.add('active');
        }, 1500);
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
