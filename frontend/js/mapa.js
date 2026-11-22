const Mapa = {
    map: null,
    capa: null,
    onSeleccionPunto: null,

    iniciar() {
        this.map = L.map('mapa', { zoomControl: false }).setView([-16.4955, -68.1335], 13);
        L.control.zoom({ position: 'topleft' }).addTo(this.map);

        L.maplibreGL({
            style: `https://tiles.openfreemap.org/styles/${MAP_STYLE}`,
            attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
                         '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> ' +
                         'Datos de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(this.map);

        this.capa = L.layerGroup().addTo(this.map);
        this.map.on('click', e => { if (this.onSeleccionPunto) this.onSeleccionPunto(e.latlng); });
    },

    dibujar(alertas) {
        this.capa.clearLayers();
        alertas.forEach(a => {
            const [lng, lat] = a.ubicacion.coordinates;
            const color = COLOR_GRAVEDAD[a.gravedad] || '#ffffff';
            const radio = 8 + Math.min(a.confirmaciones || 0, 10); // mas confirmaciones, punto mas grande
            const t = TIPOS[a.tipo] || { icono: '📍' };

            const marcador = L.circleMarker([lat, lng], {
                radius: radio, color: '#ffffff', weight: 2,
                fillColor: color, fillOpacity: 0.85, className: 'punto-alerta'
            }).addTo(this.capa);

            marcador.bindTooltip(`${t.icono} ${esc(a.descripcion)}`);
            marcador.on('click', () => Detalle.mostrar(a._id));
        });
    },

    async cargar() {
        const filtros = { estado: 'activo' };
        const tipo = document.getElementById('filtro-tipo').value;
        const grav = document.getElementById('filtro-grav').value;
        if (tipo) filtros.tipo = tipo;
        if (grav) filtros.gravedad = grav;

        try {
            const alertas = await Api.listar(filtros);
            this.dibujar(alertas);
            document.getElementById('contador').textContent = `${alertas.length} alertas activas`;
        } catch (err) {
            toast(err.message, true);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión de administrador, el botón lleva directo al panel
    const enlaceAdmin = document.getElementById('enlace-admin');
    if (enlaceAdmin && Sesion.activa()) {
        enlaceAdmin.href = 'admin/alertas.html';
        enlaceAdmin.innerHTML = '🛠️<span class="txt"> Panel</span>';
    }

    // Filtro de tipos generado desde la configuracion
    const selTipo = document.getElementById('filtro-tipo');
    Object.entries(TIPOS).forEach(([clave, t]) => {
        selTipo.insertAdjacentHTML('beforeend', `<option value="${clave}">${t.icono} ${t.etiqueta}</option>`);
    });

    Mapa.iniciar();
    Mapa.cargar();

    selTipo.addEventListener('change', () => Mapa.cargar());
    document.getElementById('filtro-grav').addEventListener('change', () => Mapa.cargar());
    document.getElementById('btn-nuevo').addEventListener('click', () => Formulario.abrir());
    document.getElementById('btn-cercanas').addEventListener('click', () => Cercanas.buscar());
    document.getElementById('panel-cerrar').addEventListener('click', () => Panel.cerrar());

    setInterval(() => Mapa.cargar(), 30000); // refresco automatico cada 30s
});