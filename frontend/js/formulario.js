const esMovil = () => window.matchMedia('(max-width: 640px)').matches;
const MAX_CAMPOS_PROPIOS = 5;

const Formulario = {
    punto: null,
    marcador: null,

    abrir() {
        this.punto = null;
        if (this.marcador) { this.marcador.remove(); this.marcador = null; }
        if (esMovil()) this.elegirUbicacion();
        else this.mostrarFormulario();
    },

    elegirUbicacion() {
        document.getElementById('panel').classList.remove('abierto');
        document.body.classList.add('eligiendo');

        const aviso = document.getElementById('aviso-mapa');
        aviso.innerHTML = `
            <p id="aviso-texto">Toca el mapa para marcar la ubicación del incidente</p>
            <div class="aviso-botones">
                <button type="button" id="a-gps" class="btn sec">${iconoHtml('locate-fixed')}<span>Mi ubicación</span></button>
                <button type="button" id="a-cancel" class="btn sec">Cancelar</button>
                <button type="button" id="a-ok" class="btn" disabled>Continuar</button>
            </div>`;
        aviso.classList.add('visible');
        renderIconos();

        const ok = document.getElementById('a-ok');
        if (this.punto) {
            ok.disabled = false;
            document.getElementById('aviso-texto').textContent = 'Ubicación marcada. Toca otro punto para ajustarla.';
        }

        document.getElementById('a-gps').onclick = () => this.usarGps();
        document.getElementById('a-cancel').onclick = () => this.limpiarMarcador();
        ok.onclick = () => { this.ocultarAviso(); this.mostrarFormulario(); };
        Mapa.onSeleccionPunto = ll => this.setPunto(ll.lat, ll.lng);
    },

    ocultarAviso() {
        document.getElementById('aviso-mapa').classList.remove('visible');
        document.body.classList.remove('eligiendo');
    },

    mostrarFormulario() {
        const opciones = Object.entries(TIPOS)
            .map(([k, t]) => `<option value="${k}">${t.etiqueta}</option>`).join('')
            + '<option value="__otro">Otro (escribir manualmente)</option>';

        const ubicacion = esMovil()
            ? `<span id="f-coords"></span>
               <button type="button" id="f-cambiar" class="btn sec">${iconoHtml('map-pin')}<span>Cambiar ubicación</span></button>`
            : `<button type="button" id="f-gps" class="btn sec">${iconoHtml('locate-fixed')}<span>Usar mi ubicación actual</span></button>
               <span id="f-coords">O haz clic directamente sobre el mapa para marcar el punto</span>`;

        Panel.abrir(`
            <h2>${iconoHtml('file-plus-2')}<span>Nuevo reporte</span></h2>
            <form id="form-alerta">
                <label>Tipo de incidente<select id="f-tipo">${opciones}</select></label>
                <label id="f-otro-wrap" class="oculto">Nombre del incidente
                    <input id="f-otro" type="text" maxlength="30" placeholder="Ej. Carrera de bicicletas">
                </label>
                <label>Descripción
                    <textarea id="f-desc" rows="3" maxlength="300" required placeholder="Describe brevemente lo que ocurre en la vía..."></textarea>
                </label>
                <label>Nivel de gravedad
                    <select id="f-grav">
                        <option value="baja">Baja</option>
                        <option value="media" selected>Media</option>
                        <option value="alta">Alta</option>
                    </select>
                </label>
                <label>Zona o referencia<input id="f-zona" type="text" maxlength="60" placeholder="Ej. Sopocachi, Av. 6 de Agosto"></label>

                <div id="f-extra"></div>

                <div class="extras-cab">
                    <span>Campos adicionales (opcional)</span>
                    <button type="button" id="f-mas" class="btn-mas" title="Agregar campo personalizado" aria-label="Agregar campo personalizado">
                        ${iconoHtml('plus')}
                    </button>
                </div>
                <div id="f-campos"></div>

                <div class="ubicacion">${ubicacion}</div>
                <button type="submit" class="btn">Publicar reporte</button>
            </form>
        `);

        this.dibujarExtras();
        this.actualizarCoords();

        document.getElementById('f-tipo').addEventListener('change', () => this.alternarTipo());
        document.getElementById('f-mas').addEventListener('click', () => this.agregarCampo());
        document.getElementById('f-campos').addEventListener('click', e => {
            const quitar = e.target.closest('.quitar-propio');
            if (quitar) quitar.closest('.campo-propio').remove();
        });
        document.getElementById('form-alerta').addEventListener('submit', e => this.enviar(e));

        const gps = document.getElementById('f-gps');
        if (gps) gps.addEventListener('click', () => this.usarGps());

        const cambiar = document.getElementById('f-cambiar');
        if (cambiar) cambiar.addEventListener('click', () => {
            document.getElementById('panel').classList.remove('abierto');
            this.elegirUbicacion();
        });

        Mapa.onSeleccionPunto = ll => {
            if (document.getElementById('form-alerta')) this.setPunto(ll.lat, ll.lng);
        };
    },

    alternarTipo() {
        const otro = document.getElementById('f-tipo').value === '__otro';
        document.getElementById('f-otro-wrap').classList.toggle('oculto', !otro);
        if (otro) document.getElementById('f-otro').focus();
        this.dibujarExtras();
    },

    dibujarExtras() {
        const tipo = document.getElementById('f-tipo').value;
        const campos = TIPOS[tipo] ? TIPOS[tipo].campos : [];
        document.getElementById('f-extra').innerHTML = campos.map(c => {
            const id = `x-${c.n}`;
            if (c.t === 'boolean') {
                return `<label>${c.l}<select id="${id}"><option value="">Sin especificar</option><option value="true">Sí</option><option value="false">No</option></select></label>`;
            }
            return `<label>${c.l}<input id="${id}" type="${c.t === 'number' ? 'number' : 'text'}" ${c.t === 'number' ? 'min="0"' : ''}></label>`;
        }).join('');
    },

    agregarCampo() {
        const lista = document.getElementById('f-campos');
        if (lista.children.length >= MAX_CAMPOS_PROPIOS) {
            return toast(`Máximo ${MAX_CAMPOS_PROPIOS} campos adicionales`, true);
        }
        lista.insertAdjacentHTML('beforeend', `
            <div class="campo-propio">
                <input class="cp-titulo" type="text" maxlength="30" placeholder="Título (ej. Participantes)">
                <input class="cp-valor" type="text" maxlength="200" placeholder="Contenido (ej. 50 personas)">
                <button type="button" class="quitar-propio" title="Quitar campo" aria-label="Quitar campo">${iconoHtml('x')}</button>
            </div>`);
        renderIconos();
        lista.lastElementChild.querySelector('.cp-titulo').focus();
    },

    actualizarCoords() {
        const c = document.getElementById('f-coords');
        if (c && this.punto) c.textContent = `Coordenadas: ${this.punto.lat.toFixed(5)}, ${this.punto.lng.toFixed(5)}`;
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
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                }),
                interactive: false
            }).addTo(Mapa.map);
        }

        this.actualizarCoords();

        const ok = document.getElementById('a-ok');
        if (ok) {
            ok.disabled = false;
            document.getElementById('aviso-texto').textContent = 'Ubicación marcada. Toca otro punto para ajustarla.';
        }
    },

    usarGps() {
        if (!navigator.geolocation) return toast('Tu navegador no soporta geolocalización', true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                this.setPunto(pos.coords.latitude, pos.coords.longitude);
                Mapa.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
            },
            () => toast('No se pudo obtener tu ubicación. Marca el punto en el mapa.', true),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    },

    async enviar(e) {
        e.preventDefault();
        if (!this.punto) return toast('Selecciona la ubicación en el mapa o usa el GPS', true);

        const seleccion = document.getElementById('f-tipo').value;
        let tipo = seleccion;
        if (seleccion === '__otro') {
            tipo = document.getElementById('f-otro').value.trim();
            if (slug(tipo).length < 3) return toast('Escribe el nombre del incidente (mínimo 3 letras)', true);
        }

        const datos = {
            tipo,
            descripcion: document.getElementById('f-desc').value,
            gravedad: document.getElementById('f-grav').value,
            zona: document.getElementById('f-zona').value,
            ubicacion: { lat: this.punto.lat, lng: this.punto.lng }
        };

        if (TIPOS[seleccion]) {
            TIPOS[seleccion].campos.forEach(c => {
                const v = document.getElementById(`x-${c.n}`).value.trim();
                if (v === '') return;
                datos[c.n] = c.t === 'number' ? Number(v) : c.t === 'boolean' ? v === 'true' : v;
            });
        }

        const usados = new Set();
        for (const fila of document.querySelectorAll('.campo-propio')) {
            const titulo = fila.querySelector('.cp-titulo').value.trim();
            const valor = fila.querySelector('.cp-valor').value.trim();
            if (!titulo && !valor) continue;
            if (!titulo || !valor) return toast('Cada campo nuevo necesita título y contenido', true);

            const clave = slug(titulo);
            if (!/^[a-z]/.test(clave)) return toast(`El título "${titulo}" debe empezar con una letra`, true);
            if (CAMPOS_BASE.includes(clave) || usados.has(clave)) {
                return toast(`El título "${titulo}" está reservado o repetido`, true);
            }
            usados.add(clave);
            datos[clave] = valor;
        }

        try {
            await Api.crear(datos);
            Panel.cerrar();
            await Mapa.cargar();
            toast('Alerta publicada correctamente');
        } catch (err) {
            toast(err.message, true);
        }
    },

    limpiarMarcador() {
        if (this.marcador) { this.marcador.remove(); this.marcador = null; }
        this.punto = null;
        Mapa.onSeleccionPunto = null;
        this.ocultarAviso();
    }
};