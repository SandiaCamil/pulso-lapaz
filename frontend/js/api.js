const Api = {
    async _pedir(ruta, opciones = {}) {
        const res = await fetch(API_URL + ruta, {
        headers: { 'Content-Type': 'application/json' },
        ...opciones
        });
        const datos = await res.json().catch(() => ({}));
        if (!res.ok) {
        const detalle = Array.isArray(datos.detalles) ? ' ' + datos.detalles.join(', ') : '';
        throw new Error((datos.error || 'Error de conexión') + detalle);
        }
        return datos;
    },

    listar(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this._pedir('/alertas' + (qs ? '?' + qs : ''));
    },
    obtener(id)          { return this._pedir(`/alertas/${id}`); },
    crear(datos)         { return this._pedir('/alertas', { method: 'POST', body: JSON.stringify(datos) }); },
    actualizar(id, datos){ return this._pedir(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify(datos) }); },
    confirmar(id)        { return this._pedir(`/alertas/${id}/confirmar`, { method: 'PATCH' }); },
    eliminar(id)         { return this._pedir(`/alertas/${id}`, { method: 'DELETE' }); }
};