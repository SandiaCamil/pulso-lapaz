const API_URL = ['5500', '5501'].includes(location.port) ? 'http://localhost:3000/api' : '/api';

const COLOR_GRAVEDAD = { baja: '#22c55e', media: '#eab308', alta: '#ef4444' };

const TIPOS = {
    bloqueo: {
        icono: 'octagon-alert', etiqueta: 'Bloqueo',
        campos: [
            { n: 'ruta_alterna', l: 'Ruta alterna', t: 'text' },
            { n: 'duracion_estimada', l: 'Duración estimada', t: 'text' }
        ]
    },
    marcha: {
        icono: 'megaphone', etiqueta: 'Marcha',
        campos: [
            { n: 'organizador', l: 'Organizador', t: 'text' },
            { n: 'recorrido', l: 'Recorrido', t: 'text' }
        ]
    },
    deslizamiento: {
        icono: 'mountain', etiqueta: 'Deslizamiento',
        campos: [
            { n: 'zona_de_riesgo', l: 'Zona de riesgo', t: 'text' },
            { n: 'calle_habilitada', l: '¿Calle habilitada?', t: 'boolean' }
        ]
    },
    accidente: {
        icono: 'car-front', etiqueta: 'Accidente',
        campos: [
            { n: 'heridos', l: 'Heridos', t: 'number' },
            { n: 'ambulancia_en_camino', l: '¿Ambulancia en camino?', t: 'boolean' }
        ]
    },
    calle_cerrada: {
        icono: 'construction', etiqueta: 'Calle cerrada',
        campos: [
            { n: 'motivo', l: 'Motivo', t: 'text' },
            { n: 'fecha_reapertura', l: 'Reapertura estimada', t: 'text' }
        ]
    }
};

const CAMPOS_BASE = ['_id', 'tipo', 'descripcion', 'ubicacion', 'gravedad', 'zona', 'confirmaciones', 'desmentidos', 'votantes', 'estado', 'creado'];

function renderIconos() {
    if (window.lucide) lucide.createIcons();
}

function iconoHtml(nombre, clase = '') {
    return `<i data-lucide="${esc(nombre)}" class="ico ${clase}"></i>`;
}

function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function valorLegible(v) {
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (v !== null && typeof v === 'object') return JSON.stringify(v);
    return v;
}

function hace(fecha) {
    const min = Math.max(0, Math.round((Date.now() - new Date(fecha)) / 60000));
    if (min < 1) return 'justo ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    return h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`;
}

function toast(mensaje, error = false) {
    const el = document.getElementById('toast');
    el.textContent = mensaje;
    el.className = 'visible' + (error ? ' error' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = ''; }, 3200);
}

const Panel = {
    abrir(html) {
        document.getElementById('panel-contenido').innerHTML = html;
        document.getElementById('panel').classList.add('abierto');
        renderIconos();
    },
    cerrar() {
        document.getElementById('panel').classList.remove('abierto');
        Formulario.limpiarMarcador();
    }
};

function slug(texto) {
    return String(texto || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
}

function nombreLegible(clave) {
    const t = String(clave || '').replace(/_/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function infoTipo(tipo) {
    return TIPOS[tipo] || { icono: 'map-pin', etiqueta: nombreLegible(tipo), campos: [] };
}