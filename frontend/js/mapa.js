const Mapa = {
    map: null,
    capa: null,
    onSeleccionPunto: null,

    iniciar() {
        this.map = L.map('mapa', { zoomControl: false }).setView([-16.4955, -68.1335], 14);
        L.control.zoom({ position: 'topleft' }).addTo(this.map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(this.map);

        this.capa = L.layerGroup().addTo(this.map);
        this.map.on('click', e => { if (this.onSeleccionPunto) this.onSeleccionPunto(e.latlng); });
    },

    dibujar(alertas) {
        this.capa.clearLayers();
        alertas.forEach(a => {
            const [lng, lat] = a.ubicacion.coordinates;
            const color = COLOR_GRAVEDAD[a.gravedad] || '#6366f1';
            const radio = 9 + Math.min(a.confirmaciones || 0, 10);
            const t = infoTipo(a.tipo);

            const marcador = L.circleMarker([lat, lng], {
                radius: radio, color: '#0f172a', weight: 2.5,
                fillColor: color, fillOpacity: 0.9, className: 'punto-alerta'
            }).addTo(this.capa);

            marcador.bindTooltip(`<strong>${esc(t.etiqueta)}</strong>: ${esc(a.descripcion)}`);
            marcador.on('click', () => Detalle.mostrar(a._id));
        });
    },

    async cargar() {
        const filtros = { estado: 'activo' };
        const tipo = document.getElementById('filtro-tipo').value;
        const grav = document.getElementById('filtro-grav').value;
        if (tipo && tipo !== '__otros') filtros.tipo = tipo;
        if (grav) filtros.gravedad = grav;

        try {
            let alertas = await Api.listar(filtros);
            if (tipo === '__otros') alertas = alertas.filter(a => !TIPOS[a.tipo]);
            this.dibujar(alertas);
            const n = alertas.length;
            document.getElementById('contador').textContent = `${n} ${n === 1 ? 'activa' : 'activas'}`;
        } catch (err) {
            toast(err.message, true);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const enlaceAdmin = document.getElementById('enlace-admin');
    if (enlaceAdmin && Sesion.activa()) {
        enlaceAdmin.href = 'admin/alertas.html';
        enlaceAdmin.innerHTML = '<i data-lucide="layout-dashboard"></i><span class="txt">Panel</span>';
    }

    const selTipo = document.getElementById('filtro-tipo');
    Object.entries(TIPOS).forEach(([clave, t]) => {
        selTipo.insertAdjacentHTML('beforeend', `<option value="${clave}">${t.etiqueta}</option>`);
    });
    selTipo.insertAdjacentHTML('beforeend', '<option value="__otros">Otros incidentes</option>');

    Mapa.iniciar();
    Mapa.cargar();
    renderIconos();

    selTipo.addEventListener('change', () => Mapa.cargar());
    document.getElementById('filtro-grav').addEventListener('change', () => Mapa.cargar());
    document.getElementById('btn-nuevo').addEventListener('click', () => Formulario.abrir());
    document.getElementById('btn-cercanas').addEventListener('click', () => Cercanas.buscar());
    document.getElementById('panel-cerrar').addEventListener('click', () => Panel.cerrar());

    setInterval(() => Mapa.cargar(), 30000);
});