

// public/js/app.js

(() => {
  // Helper corto tipo jQuery
    const $ = (sel) => document.querySelector(sel);

  // Elementos
    const loginForm = $('#login-form');
    const loginSpan = $('#login-span');
    const registerForm = $('#register-form');
    const registerSpan = $('#register-span');
    const logoutButton = $('#close-session');
    const loginMethodSel = $('#login-method'); // cookie | jwt

  // --- LOGIN ---
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = $('#login-username').value.trim();
        const password = $('#login-password').value;
        const method = loginMethodSel ? loginMethodSel.value : 'cookie';

        fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // importante para cookies (sesion o refresh)
        body: JSON.stringify({ username, password, method })
        })
        .then(async (res) => {
            if (res.ok) {
            loginSpan.textContent = 'Sesion iniciada... Entrando...';
            loginSpan.style.color = 'green';

            // Si se necesita csrfToken cuando method=cookie:
            // const data = await res.json(); window.__csrf = data.csrfToken;

            setTimeout(() => {
                window.location.href = '/protected';
            }, 800);
            } else {
            loginSpan.textContent = 'Error al iniciar sesion';
            loginSpan.style.color = 'red';
            }
        })
        .catch((err) => {
            console.error('Login error:', err);
            loginSpan.textContent = 'Error de red';
            loginSpan.style.color = 'red';
        });
    });

    // --- REGISTER ---
    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = $('#register-username').value.trim();
        const password = $('#register-password').value;
        const confirmPassword = $('#register-confirm-password').value;

        if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
        }

        fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
        })
        .then((res) => {
            if (res.ok || res.status === 201) {
            registerSpan.textContent = 'Usuario registrado. Iniciando sesion...';
            registerSpan.style.color = 'green';
            // Se podria redirigir al login o intentar login automatico aca
            setTimeout(() => {
                window.location.href = '/';
            }, 600);
            } else if (res.status === 409) {
            registerSpan.textContent = 'El usuario ya existe';
            registerSpan.style.color = 'red';
            } else {
            registerSpan.textContent = 'Error al registrar usuario';
            registerSpan.style.color = 'red';
            }
        })
        .catch((err) => {
            console.error('Register error:', err);
            registerSpan.textContent = 'Error de red';
            registerSpan.style.color = 'red';
        });
    });

    // --- LOGOUT ---
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();

        fetch('/logout', {
        method: 'POST',
        credentials: 'include'
        // Si se us CSRF en la rama cookie y el endpoint lo requiere:
        // headers: { 'X-CSRF-Token': window.__csrf }
        })
        .then((res) => {
            if (res.ok) {
            window.location.href = '/';
            } else {
            console.warn('Logout no respondio 200:', res.status);
            window.location.href = '/';
            }
        })
        .catch((err) => {
            console.error('Logout error:', err);
            window.location.href = '/';
        });
    });
})();
