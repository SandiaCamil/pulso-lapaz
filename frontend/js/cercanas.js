const Cercanas = {
    usuario: null,

    buscar() {
        if (!navigator.geolocation) return toast('Tu navegador no tiene GPS', true);

        navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        Mapa.map.setView([lat, lng], 15);

        if (this.usuario) this.usuario.setLatLng([lat, lng]);
        else this.usuario = L.circleMarker([lat, lng], {
            radius: 7, color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 1
        }).addTo(Mapa.map);

        try {
            this.mostrar(await Api.listar({ lat, lng, radio: 1000 }));
        } catch (err) {
            toast(err.message, true);
        }
        }, () => toast('No se pudo obtener tu ubicación', true), { enableHighAccuracy: true, timeout: 10000 });
    },

    mostrar(lista) {
        const items = lista.map(a => {
        const t = TIPOS[a.tipo] || { icono: '📍', etiqueta: a.tipo };
        return `<button class="item-cercana" data-id="${esc(a._id)}">
            ${t.icono} ${esc(a.descripcion)}
            <small>${esc(a.zona || 'Sin zona')} · ${hace(a.creado)}</small>
        </button>`;
        }).join('');

        Panel.abrir(`
        <h2>📍 Cerca de ti (1 km)</h2>
        ${lista.length ? `<p class="meta">De la más cercana a la más lejana</p>${items}`
                        : '<p class="meta">No hay alertas activas a menos de 1 km.</p>'}
        `);

        document.querySelectorAll('.item-cercana').forEach(btn => {
        btn.onclick = () => {
            const a = lista.find(x => String(x._id) === btn.dataset.id);
            const [lng, lat] = a.ubicacion.coordinates;
            Mapa.map.flyTo([lat, lng], 17);
            Detalle.mostrar(a._id);
        };
        });
    }
};