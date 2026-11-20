const API_URL = ['5500', '5501'].includes(location.port) ? 'http://localhost:3000/api' : '/api';

const MAP_STYLE = 'positron';
const COLOR_GRAVEDAD = { baja: '#4ade80', media: '#facc15', alta: '#ff5a5f' };

const TIPOS = {
    bloqueo: {
        icono: '🚧', etiqueta: 'Bloqueo',
        campos: [
        { n: 'ruta_alterna', l: 'Ruta alterna', t: 'text' },
        { n: 'duracion_estimada', l: 'Duración estimada', t: 'text' }
        ]
    },
    marcha: {
        icono: '📢', etiqueta: 'Marcha',
        campos: [
        { n: 'organizador', l: 'Organizador', t: 'text' },
        { n: 'recorrido', l: 'Recorrido', t: 'text' }
        ]
    },
    deslizamiento: {
        icono: '⛰️', etiqueta: 'Deslizamiento',
        campos: [
        { n: 'zona_de_riesgo', l: 'Zona de riesgo', t: 'text' },
        { n: 'calle_habilitada', l: '¿Calle habilitada?', t: 'boolean' }
        ]
    },
    accidente: {
        icono: '🚗', etiqueta: 'Accidente',
        campos: [
        { n: 'heridos', l: 'Heridos', t: 'number' },
        { n: 'ambulancia_en_camino', l: '¿Ambulancia en camino?', t: 'boolean' }
        ]
    },
    calle_cerrada: {
        icono: '🕳️', etiqueta: 'Calle cerrada',
        campos: [
        { n: 'motivo', l: 'Motivo', t: 'text' },
        { n: 'fecha_reapertura', l: 'Reapertura estimada', t: 'text' }
        ]
    }
};

//Campos que ya tienen su lugar en la pantalla; el resto se muestra automáticamente
const CAMPOS_BASE = ['_id', 'tipo', 'descripcion', 'ubicacion', 'gravedad', 'zona', 'confirmaciones', 'estado', 'creado'];

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
    },
    cerrar() {
        document.getElementById('panel').classList.remove('abierto');
        Formulario.limpiarMarcador();
    }
};