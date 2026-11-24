const Cercanas = {
    usuario: null,

    buscar() {
        if (!navigator.geolocation) return toast('Tu navegador no soporta geolocalización', true);

        navigator.geolocation.getCurrentPosition(async pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            Mapa.map.setView([lat, lng], 15);

            if (this.usuario) this.usuario.setLatLng([lat, lng]);
            else this.usuario = L.circleMarker([lat, lng], {
                radius: 7, color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 1
            }).addTo(Mapa.map);

            try {
                this.mostrar(await Api.listar({ lat, lng, radio: 1000 }));
            } catch (err) {
                toast(err.message, true);
            }
        }, () => toast('No se pudo obtener tu ubicación actual', true), { enableHighAccuracy: true, timeout: 10000 });
    },

    mostrar(lista) {
        const items = lista.map(a => {
            const t = TIPOS[a.tipo] || { icono: 'map-pin', etiqueta: a.tipo };
            return `<button class="item-cercana" data-id="${esc(a._id)}">
                <div class="item-cercana-tit">${iconoHtml(t.icono)}<span>${esc(a.descripcion)}</span></div>
                <small>${esc(a.zona || 'Sin zona')} · ${hace(a.creado)}</small>
            </button>`;
        }).join('');

        Panel.abrir(`
            <h2>${iconoHtml('navigation')}<span>Alertas cercanas (1 km)</span></h2>
            ${lista.length ? `<p class="meta-item">Ordenadas de la más cercana a la más lejana</p><br>${items}`
                           : '<p class="meta-item">No se registran alertas activas en un radio de 1 km.</p>'}
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