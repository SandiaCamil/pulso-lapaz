class Alerta {
    static GRAVEDADES = ['baja', 'media', 'alta'];
    static ESTADOS = ['activo', 'resuelto', 'descartado'];

    constructor(datos = {}) {
        const { _id, tipo, descripcion, ubicacion, gravedad, zona,
                confirmaciones, desmentidos, estado, creado, ...extras } = datos;

        if (_id !== undefined) this._id = _id;
        this.tipo = tipo;
        this.descripcion = typeof descripcion === 'string' ? descripcion.trim() : '';
        this.ubicacion = Alerta.normalizarUbicacion(ubicacion);
        this.gravedad = gravedad || 'media';
        this.zona = typeof zona === 'string' ? zona.trim() : '';
        this.confirmaciones = Number(confirmaciones) || 0;
        this.desmentidos = Number(desmentidos) || 0;
        this.estado = estado || 'activo';
        this.creado = creado ? new Date(creado) : new Date();

        //Campos extra
        Object.assign(this, extras);
    }

    //Acepta { lat, long } o GeoJSON
    static normalizarUbicacion(u) {
        if (!u) return null;
        if (u.type === 'Point' && Array.isArray(u.coordinates)) {
            return { type: 'Point', coordinates: u.coordinates.map(Number) };
        }
        if (u.lat !== undefined && u.lng !== undefined) {
            return { type: 'Point', coordinates: [Number(u.lng), Number(u.lat)] };
        }
        return null;
    }

    validar() {
        const errores = [];
        if (this.descripcion.length < 5 || this.descripcion.length > 300) {
            errores.push('La descripción debe tener entre 5 y 300 caracteres');
        }
        const c = this.ubicacion?.coordinates;
        if (!c || c.length !== 2 || c.some(Number.isNaN) || Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) {
            errores.push('Ubicación inválida (se requiere lat y lng)');
        }
        if (!Alerta.GRAVEDADES.includes(this.gravedad)) {
            errores.push(`Gravedad inválida (${Alerta.GRAVEDADES.join(', ')})`);
        }
        if (!Alerta.ESTADOS.includes(this.estado)) {
            errores.push(`Estado inválido (${Alerta.ESTADOS.join(', ')})`);
        }
        if (Number.isNaN(this.creado.getTime())) errores.push('Fecha de creación inválida');
        return errores;
    }

    toDocumento() {
        return { ...this };
    }
}

module.exports = Alerta;