// public/js/app.js
(() => {
    // Helper corto
    const $ = (sel) => document.querySelector(sel);

  // Elementos
    const loginForm = $('#login-form');
    const loginSpan = $('#login-span');
    const registerForm = $('#register-form');
    const registerSpan = $('#register-span');
    const logoutButton = $('#close-session');
    const loginMethodSel = $('#login-method'); // cookie | jwt

  // Para /jwt
    const refreshBtn  = $('#refresh-token');
    const refreshSpan = $('#refresh-status');
    const meP         = $('#me');

  // Helpers
    async function fetchMe(token) {
        const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
    }

    async function updateMeFromStorage() {
        if (!meP) return;
        const token = sessionStorage.getItem('accessToken');
        if (!token) { meP.textContent = 'Sin token'; return; }
        try {
        const user = await fetchMe(token);
        meP.textContent = `Hola ${user.username} (rol: ${user.role})`;
        } catch {
        meP.textContent = 'No autorizado';
        }
    }

  // --- LOGIN ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#login-username').value.trim();
        const password = $('#login-password').value;
        const method   = loginMethodSel ? loginMethodSel.value : 'cookie';

        const btn = loginForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // importante para cookies (sesion o refresh)
            body: JSON.stringify({ username, password, method })
        });

        if (!res.ok){
            loginSpan.textContent = 'Error al iniciar sesion';
            loginSpan.style.color = 'red';
            return;
        }

        const data = await res.json(); // { ok, method, csrfToken? | accessToken? }
        
        if (method === 'cookie'){
            // guardar CSRF para mutaciones protegidas
            if (data.csrfToken) window.__csrf = data.csrfToken;
            loginSpan.textContent = 'Sesion iniciada... Entrando...';
            loginSpan.style.color = 'green';
            setTimeout(() => { window.location.href = '/protected'; }, 700);
        } else {
            // JWT -> guardamos access en memoria (no en cookie) y vamos a /jwt
            if (data.accessToken) sessionStorage.setItem('accessToken', data.accessToken);
            loginSpan.textContent = 'Token obtenido... Abriendo panel JWT...';
            loginSpan.style.color = 'green';
            setTimeout(() => { window.location.href = '/jwt'; }, 700);
        }
        } catch(err){
        console.error('Login error:', err);
        loginSpan.textContent = 'Error al iniciar sesion';
        loginSpan.style.color = 'red';
        } finally {
        if (btn) btn.disabled = false;
        }
    });

  // --- REGISTER ---
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#register-username').value.trim();
        const password = $('#register-password').value;
        const confirmPassword = $('#register-confirm-password').value;

        if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
        }

        try{
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        if (res.ok || res.status === 201) {
            registerSpan.textContent = 'Usuario registrado. Iniciando sesion...';
            registerSpan.style.color = 'green';
            setTimeout(() => { window.location.href = '/'; }, 600);
        } else if (res.status === 409) {
            registerSpan.textContent = 'El usuario ya existe';
            registerSpan.style.color = 'red';
        } else {
            registerSpan.textContent = 'Error al registrar usuario';
            registerSpan.style.color = 'red';
        }
        } catch(err){
        console.error('Register error:', err);
        registerSpan.textContent = 'Error de red';
        registerSpan.style.color = 'red';
        }
    });

  // --- LOGOUT ---
    logoutButton?.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
        await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
            // Si usás CSRF en la rama cookie y el endpoint lo requiere:
            // headers: { 'X-CSRF-Token': window.__csrf }
        });
        } catch(err) {
        console.error('Logout error:', err);
        } finally {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/';
        }
    });

    // --- REFRESH TOKEN (solo flujo JWT) ---
    refreshBtn?.addEventListener('click', async () => {
        if (refreshSpan) { refreshSpan.textContent = 'Refrescando...'; refreshSpan.style.color = ''; }

        try {
        const res = await fetch('/token/refresh', {
            method: 'POST',
            credentials: 'include' // manda la cookie refresh_token
        });

        if (!res.ok) {
            if (refreshSpan) { refreshSpan.textContent = 'No autorizado'; refreshSpan.style.color = 'red'; }
            return;
        }

        const data = await res.json(); // { accessToken, exp }
        if (data.accessToken) {
            sessionStorage.setItem('accessToken', data.accessToken);
            if (refreshSpan) { refreshSpan.textContent = 'Token actualizado ✅'; refreshSpan.style.color = 'green'; }
            // refrescar el /api/me para mostrar usuario actualizado
            await updateMeFromStorage();
        }
        } catch (e) {
        console.error('refresh error', e);
        if (refreshSpan) { refreshSpan.textContent = 'Error de red'; refreshSpan.style.color = 'red'; }
        }
    });

    // --- Auto-carga de /api/me al entrar a /jwt ---
    (async () => {
        if (window.location.pathname === '/jwt') {
        await updateMeFromStorage();
        }
    })();
})();
