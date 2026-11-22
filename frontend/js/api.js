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

// Identificador anónimo de este navegador y registro local de sus votos
const Votante = {
    id() {
        try {
            let v = localStorage.getItem('plp_votante');
            if (!v) {
                v = (crypto.randomUUID ? crypto.randomUUID()
                    : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
                localStorage.setItem('plp_votante', v);
            }
            return v;
        } catch { return 'anonimo-sin-almacenamiento'; }
    },
    _votos() {
        try { return JSON.parse(localStorage.getItem('plp_votos')) || {}; } catch { return {}; }
    },
    yaVoto(idAlerta) { return this._votos()[idAlerta] || null; },
    registrar(idAlerta, voto) {
        try {
            const v = this._votos();
            v[idAlerta] = voto;
            localStorage.setItem('plp_votos', JSON.stringify(v));
        } catch { /* sin almacenamiento: el servidor igual impide repetir */ }
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
    votar(id, voto) {
        return this._pedir(`/alertas/${id}/votar`, {
            method: 'POST',
            body: JSON.stringify({ voto, votante: Votante.id() })
        });
    },
    eliminar(id)  { return this._pedir(`/alertas/${id}`, { method: 'DELETE' }); }
};