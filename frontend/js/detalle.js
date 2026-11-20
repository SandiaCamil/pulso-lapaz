const Detalle = {
    async mostrar(id) {
        try {
        this.render(await Api.obtener(id));
        } catch (err) {
        toast(err.message, true);
        }
    },

    render(a) {
        const t = TIPOS[a.tipo] || { icono: '📍', etiqueta: a.tipo };
        const color = COLOR_GRAVEDAD[a.gravedad] || '#fff';

        //Cualquier campo que no sea base aparece solo
        const extras = Object.entries(a)
        .filter(([k]) => !CAMPOS_BASE.includes(k))
        .map(([k, v]) => `<li><b>${esc(k.replace(/_/g, ' '))}:</b> ${esc(valorLegible(v))}</li>`)
        .join('');

        const admin = Sesion.activa();

        Panel.abrir(`
        <h2>${t.icono} ${esc(t.etiqueta)}</h2>
        <span class="etiqueta" style="background:${color}">Gravedad ${esc(a.gravedad)}</span>
        <p class="desc">${esc(a.descripcion)}</p>
        <p class="meta">📍 ${esc(a.zona || 'Zona no indicada')} · ${hace(a.creado)} · ✅ ${a.confirmaciones} confirmaciones</p>
        ${extras ? `<ul class="extras">${extras}</ul>` : ''}
        <div class="botones">
            <button class="btn" id="d-conf">👍 Confirmar</button>
            ${admin ? `
            <button class="btn sec" id="d-res">✔️ Resuelta</button>
            <button class="btn sec" id="d-edit">✏️ Editar</button>
            <button class="btn peligro" id="d-del">🗑️ Eliminar</button>` : ''}
        </div>
        `);

        document.getElementById('d-conf').onclick = () => this.accion(() => Api.confirmar(a._id), 'Gracias por confirmar', a._id);

        if (admin) {
            document.getElementById('d-res').onclick = () => this.accion(() => Api.actualizar(a._id, { estado: 'resuelto' }), 'Alerta marcada como resuelta');
            document.getElementById('d-edit').onclick = () => this.editar(a);
            document.getElementById('d-del').onclick = () => {
                if (confirm('¿Eliminar esta alerta?')) this.accion(() => Api.eliminar(a._id), 'Alerta eliminada');
            };
        }
    },

    //Ejecuta la accion; si se pasa id, vuelve a mostrar el detalle actualizado
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
        <h2>Editar alerta</h2>
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