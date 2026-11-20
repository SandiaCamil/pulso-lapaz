const Formulario = {
    punto: null,
    marcador: null,

    abrir() {
        this.punto = null;
        const opciones = Object.entries(TIPOS)
        .map(([k, t]) => `<option value="${k}">${t.icono} ${t.etiqueta}</option>`).join('');

        Panel.abrir(`
        <h2>Nuevo reporte</h2>
        <form id="form-alerta">
            <label>Tipo<select id="f-tipo">${opciones}</select></label>
            <label>Descripción
            <textarea id="f-desc" rows="3" maxlength="300" required placeholder="¿Qué está pasando?"></textarea>
            </label>
            <label>Gravedad
            <select id="f-grav">
                <option value="baja">Baja</option>
                <option value="media" selected>Media</option>
                <option value="alta">Alta</option>
            </select>
            </label>
            <label>Zona<input id="f-zona" type="text" maxlength="60" placeholder="Ej. Sopocachi"></label>
            <div id="f-extra"></div>
            <div class="ubicacion">
            <button type="button" id="f-gps" class="btn sec">📍 Usar mi ubicación</button>
            <span id="f-coords">O toca el mapa para marcar el lugar</span>
            </div>
            <button type="submit" class="btn">Publicar alerta</button>
        </form>
        `);

        this.dibujarExtras();
        document.getElementById('f-tipo').addEventListener('change', () => this.dibujarExtras());
        document.getElementById('f-gps').addEventListener('click', () => this.usarGps());
        document.getElementById('form-alerta').addEventListener('submit', e => this.enviar(e));

        Mapa.onSeleccionPunto = ll => {
        if (document.getElementById('form-alerta')) this.setPunto(ll.lat, ll.lng);
        };
    },

    //Campos propios del tipo elegido (bloqueo, accidente, etc.)
    dibujarExtras() {
        const tipo = document.getElementById('f-tipo').value;
        const html = TIPOS[tipo].campos.map(c => {
        const id = `x-${c.n}`;
        if (c.t === 'boolean') {
            return `<label>${c.l}<select id="${id}"><option value="">Sin dato</option><option value="true">Sí</option><option value="false">No</option></select></label>`;
        }
        return `<label>${c.l}<input id="${id}" type="${c.t === 'number' ? 'number' : 'text'}" ${c.t === 'number' ? 'min="0"' : ''}></label>`;
        }).join('');
        document.getElementById('f-extra').innerHTML = html;
    },

    setPunto(lat, lng) {
        this.punto = { lat, lng };

        if (this.marcador) {
        this.marcador.setLatLng([lat, lng]);
        } else {
        this.marcador = L.marker([lat, lng], {
            icon: L.divIcon({
            className: 'punto-nuevo-wrap',
            html: '<div class="punto-nuevo"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]      // el centro del punto queda exactamente donde tocaste
            }),
            interactive: false          // permite volver a tocar el mapa para mover el punto
        }).addTo(Mapa.map);
        }

        document.getElementById('f-coords').textContent = `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    },

    usarGps() {
        if (!navigator.geolocation) return toast('Tu navegador no tiene GPS', true);
        navigator.geolocation.getCurrentPosition(
        pos => {
            this.setPunto(pos.coords.latitude, pos.coords.longitude);
            Mapa.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
        },
        () => toast('No se pudo obtener tu ubicación. Toca el mapa.', true),
        { enableHighAccuracy: true, timeout: 10000 }
        );
    },

    async enviar(e) {
        e.preventDefault();
        if (!this.punto) return toast('Marca el lugar en el mapa o usa tu ubicación', true);

        const tipo = document.getElementById('f-tipo').value;
        const datos = {
        tipo,
        descripcion: document.getElementById('f-desc').value,
        gravedad: document.getElementById('f-grav').value,
        zona: document.getElementById('f-zona').value,
        ubicacion: { lat: this.punto.lat, lng: this.punto.lng }
        };

        TIPOS[tipo].campos.forEach(c => {
        const v = document.getElementById(`x-${c.n}`).value.trim();
        if (v === '') return;
        datos[c.n] = c.t === 'number' ? Number(v) : c.t === 'boolean' ? v === 'true' : v;
        });

        try {
        await Api.crear(datos);
        Panel.cerrar();
        await Mapa.cargar();
        toast('Alerta publicada ✅');
        } catch (err) {
        toast(err.message, true);
        }
    },

    limpiarMarcador() {
        if (this.marcador) { this.marcador.remove(); this.marcador = null; }
        this.punto = null;
        Mapa.onSeleccionPunto = null;
    }
};