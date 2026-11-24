const Detalle = {
    async mostrar(id) {
        try {
            this.render(await Api.obtener(id));
        } catch (err) {
            toast(err.message, true);
        }
    },

    render(a) {
        const t = TIPOS[a.tipo] || { icono: 'map-pin', etiqueta: a.tipo };
        const color = COLOR_GRAVEDAD[a.gravedad] || '#94a3b8';
        const admin = Sesion.activa();

        const extras = Object.entries(a)
            .filter(([k]) => !CAMPOS_BASE.includes(k))
            .map(([k, v]) => `<li><b>${esc(k.replace(/_/g, ' '))}</b><span>${esc(valorLegible(v))}</span></li>`)
            .join('');

        const voto = Votante.yaVoto(a._id);
        const textoVoto = voto === 'confirmar' ? 'Confirmaste que esta alerta sigue activa'
                        : voto === 'negar' ? 'Indicaste que esta alerta ya no está'
                        : 'Ya registraste tu voto en esta alerta';

        let bloqueVotos;
        if (a.estado !== 'activo') {
            bloqueVotos = `<div class="voto-hecho">${iconoHtml('info')}<span>Esta alerta ya no está activa (${esc(a.estado)})</span></div>`;
        } else if (voto) {
            bloqueVotos = `<div class="voto-hecho">${iconoHtml('check-circle-2')}<span>${textoVoto}</span></div>`;
        } else {
            bloqueVotos = `<div class="votos">
                <button class="btn" id="d-conf">${iconoHtml('thumbs-up')}<span>Sí, sigue ahí</span></button>
                <button class="btn sec" id="d-neg">${iconoHtml('thumbs-down')}<span>Ya no está</span></button>
            </div>`;
        }

        Panel.abrir(`
            <h2>${iconoHtml(t.icono)}<span>${esc(t.etiqueta)}</span></h2>
            <span class="etiqueta-grav"><span class="punto-color" style="background:${color}"></span>Gravedad ${esc(a.gravedad)}</span>
            <p class="desc">${esc(a.descripcion)}</p>
            <div class="meta-lista">
                <div class="meta-item">${iconoHtml('map-pin')}<span>${esc(a.zona || 'Zona no indicada')} · ${hace(a.creado)}</span></div>
                <div class="meta-item">${iconoHtml('users')}<span>${a.confirmaciones || 0} confirman · ${a.desmentidos || 0} niegan</span></div>
            </div>
            ${extras ? `<ul class="extras">${extras}</ul>` : ''}
            ${bloqueVotos}
            ${admin ? `<div class="botones">
                <button class="btn sec" id="d-res">${iconoHtml('check')}<span>Resolver</span></button>
                <button class="btn sec" id="d-edit">${iconoHtml('pencil')}<span>Editar</span></button>
                <button class="btn peligro" id="d-del">${iconoHtml('trash-2')}<span>Eliminar</span></button>
            </div>` : ''}
        `);

        const conf = document.getElementById('d-conf');
        const neg = document.getElementById('d-neg');
        if (conf) conf.onclick = () => this.votar(a._id, 'confirmar');
        if (neg) neg.onclick = () => this.votar(a._id, 'negar');

        if (admin) {
            document.getElementById('d-res').onclick = () => this.accion(() => Api.actualizar(a._id, { estado: 'resuelto' }), 'Alerta marcada como resuelta');
            document.getElementById('d-edit').onclick = () => this.editar(a);
            document.getElementById('d-del').onclick = () => {
                if (confirm('¿Eliminar esta alerta?')) this.accion(() => Api.eliminar(a._id), 'Alerta eliminada');
            };
        }
    },

    async votar(id, voto) {
        try {
            await Api.votar(id, voto);
            Votante.registrar(id, voto);
            toast(voto === 'confirmar' ? 'Confirmación registrada' : 'Reporte de finalización registrado');
        } catch (err) {
            if (/ya votaste/i.test(err.message)) Votante.registrar(id, 'ya');
            toast(err.message, true);
        }
        await Mapa.cargar();
        await this.mostrar(id);
    },

    async accion(fn, mensaje, idRecargar) {
        try {
            await fn();
            toast(mensaje);
            await Mapa.cargar();
            if (idRecargar) await this.mostrar(idRecargar);
            else Panel.cerrar();
        } catch (err) {
            toast(err.message, true);
        }
    },

    editar(a) {
        const opt = g => `<option value="${g}" ${a.gravedad === g ? 'selected' : ''}>${g[0].toUpperCase() + g.slice(1)}</option>`;
        Panel.abrir(`
            <h2>${iconoHtml('pencil')}<span>Editar alerta</span></h2>
            <form id="form-editar">
                <label>Descripción<textarea id="e-desc" rows="3" maxlength="300" required>${esc(a.descripcion)}</textarea></label>
                <label>Gravedad<select id="e-grav">${['baja', 'media', 'alta'].map(opt).join('')}</select></label>
                <label>Zona<input id="e-zona" type="text" maxlength="60" value="${esc(a.zona)}"></label>
                <button type="submit" class="btn">Guardar cambios</button>
            </form>
        `);
        document.getElementById('form-editar').addEventListener('submit', async e => {
            e.preventDefault();
            await this.accion(() => Api.actualizar(a._id, {
                descripcion: document.getElementById('e-desc').value,
                gravedad: document.getElementById('e-grav').value,
                zona: document.getElementById('e-zona').value
            }), 'Cambios guardados', a._id);
        });
    }
};