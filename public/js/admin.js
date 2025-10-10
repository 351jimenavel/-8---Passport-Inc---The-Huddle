// public/js/admin.js
document.addEventListener('DOMContentLoaded', () => {
    const CSRF = document.querySelector('meta[name="csrf"]')?.content || '';
    console.log('[admin] js cargado. csrf=', CSRF);

    const statusBox = document.getElementById('admin-status') || (() => {
        const el = document.createElement('div');
        el.id = 'admin-status';
        el.className = 'muted';
        document.body.appendChild(el);
        return el;
    })();

    document.querySelectorAll('button.del').forEach(btn => {
        btn.setAttribute('type', 'button'); // evita submit accidental
        btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        console.log('[admin] click eliminar id=', id);
        if (!id) return;
        if (!confirm('¿Eliminar este usuario?')) return;

        try {
            const r = await fetch(`/admin/users/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'X-CSRF-Token': CSRF }
            });
            const txt = await r.text();
            statusBox.textContent = `DELETE /admin/users/${id} → ${r.status} ${r.statusText}`;
            if (r.ok) location.reload();
            else alert(`Error ${r.status}: ${txt || 'No se pudo eliminar'}`);
        } catch (e) {
            console.error(e);
            alert('Error de red');
        }
        });
    });
});
