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

    // Helpers JWT extra
    function getAccess() { return sessionStorage.getItem('accessToken') || ''; }
    function setAccess(t) { 
    if (t) sessionStorage.setItem('accessToken', t);
    else sessionStorage.removeItem('accessToken');
    }

    // Llama /token/refresh y guarda el nuevo access
    async function tryRefresh() {
    const res = await fetch('/token/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('refresh_unauthorized');
    const data = await res.json(); // { accessToken, exp }
    if (!data.accessToken) throw new Error('refresh_no_token');
    setAccess(data.accessToken);
    return data.accessToken;
    }

    // DEBUG: traza al cargar el JS
    console.log('[jwt-panel] app.js cargado');

    // Seleccion del boton
    const btnMe = document.getElementById('btnMe');

    // Garantizar que el click se enganche y llame a updateMeFromStorage
    btnMe?.addEventListener('click', async (e) => {
    e.preventDefault(); // evita submit si alguna vez queda dentro de un form
    console.log('[jwt-panel] click en btnMe');
    try {
        await updateMeFromStorage();
    } catch (err) {
        console.error('[jwt-panel] error en updateMeFromStorage', err);
    }
    });

    // --- estado de request para evitar carreras ---
    let meSeq = 0;
    
    // Para /jwt
    const refreshBtn  = $('#refresh-token');
    const refreshSpan = $('#refresh-status');
    const meP         = $('#me');

  // Helpers
    async function fetchMe(token) {
        const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await res.text();  
        console.log('[jwt-panel] /api/me body:', text);
        // Intentar parsear JSON - si falla, avisar que llego
        if (!res.ok) {
            return { ok: false, data: null, raw: text };
        }

        let data = null;
        try { data = JSON.parse(text); } catch { /* deja data = null */ }

        return { ok: true, data, raw: text };
    }

    async function updateMeFromStorage() {
    if (!meP) return;
    
    const my = ++meSeq;               // id para esta ejecucion
    meP.textContent = 'Cargando…';
    let token = getAccess();
    if (!token) {
        try {
        token = await tryRefresh();  // bootstrap si no hay token aun
        } catch {
        if (my !== meSeq) return;     // otra llamada gano
        meP.textContent = 'No autorizado';
        const meJson = document.getElementById('me-json');
        if (meJson) meJson.textContent = '—';
        return;
        }
    }

    // primer intento
    let r = await fetchMe(token);

    // si expiro el access o vino mal, intentamos un refresh una sola vez
    if (!r.ok || !r.data) {
        try {
        const t2 = await tryRefresh();
        r = await fetchMe(t2);
        } catch {  }
    }

    if (my !== meSeq) return;          // evita pisar con respuestas viejas

    const meJson = document.getElementById('me-json');

    if (r.ok && r.data && r.data.username) {
        meP.textContent = `Hola ${r.data.username} (rol: ${r.data.role})`;
        if (meJson) meJson.textContent = JSON.stringify(r.data, null, 2);
    } else if (r.ok && !r.data) {
        // 200 pero body no es JSON valido
        meP.textContent = 'Respuesta inválida';
        if (meJson) meJson.textContent = r.raw || '—';
    } else {
        meP.textContent = 'No autorizado';
        if (meJson) meJson.textContent = r.raw || '—';
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
        await tryRefresh();
        if (refreshSpan) { refreshSpan.textContent = 'Token actualizado ✅'; refreshSpan.style.color = 'green'; }
        await updateMeFromStorage();
    } catch {
        if (refreshSpan) { refreshSpan.textContent = 'No autorizado'; refreshSpan.style.color = 'red'; }
    }
    });

    // --- Auto-carga de /api/me al entrar a /jwt ---
    (async () => {
        if (window.location.pathname === '/jwt') {
        await updateMeFromStorage();
        }
    })();
})();
