// Sesión del administrador (se guarda en el navegador)
const Sesion = {
    clave: 'plp_sesion',
    obtener() {
        try { return JSON.parse(localStorage.getItem(this.clave)); } catch { return null; }
    },
    guardar(s) { localStorage.setItem(this.clave, JSON.stringify(s)); },
    salir() { localStorage.removeItem(this.clave); },
    token() { return this.obtener()?.token || null; },
    activa() {
        const t = this.token();
        if (!t) return false;
        try {
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return p.exp * 1000 > Date.now();
        } catch { return false; }
    }
    };

    const Api = {
    async _pedir(ruta, opciones = {}) {
        const headers = { 'Content-Type': 'application/json' };
        const token = Sesion.token();
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(API_URL + ruta, { ...opciones, headers });
        const datos = await res.json().catch(() => ({}));

        if (!res.ok) {
        if (res.status === 401 && token && ruta !== '/auth/login') {
            Sesion.salir();
            if (location.pathname.includes('/admin/')) location.replace('login.html');
            throw new Error('Tu sesión venció. Inicia sesión de nuevo.');
        }
        const detalle = Array.isArray(datos.detalles) ? ' ' + datos.detalles.join(', ') : '';
        throw new Error((datos.error || 'Error de conexión') + detalle);
        }
        return datos;
    },

    login(usuario, password) {
        return this._pedir('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, password }) });
    },
    listar(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this._pedir('/alertas' + (qs ? '?' + qs : ''));
    },
    obtener(id)   { return this._pedir(`/alertas/${id}`); },
    crear(datos)  { return this._pedir('/alertas', { method: 'POST', body: JSON.stringify(datos) }); },
    actualizar(id, datos, quitar = []) {
        return this._pedir(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify({ ...datos, _quitar: quitar }) });
    },
    confirmar(id) { return this._pedir(`/alertas/${id}/confirmar`, { method: 'PATCH' }); },
    eliminar(id)  { return this._pedir(`/alertas/${id}`, { method: 'DELETE' }); }
};