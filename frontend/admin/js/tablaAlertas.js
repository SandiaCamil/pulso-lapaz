const Tabla = {
    datos: [],

    async cargar() {
        try {
            this.datos = await Api.listar();
            this.render();
        } catch (err) {
            toast(err.message, true);
        }
    },

    filtradas() {
        const q = document.getElementById('q').value.toLowerCase().trim();
        const tipo = document.getElementById('f-tipo').value;
        const estado = document.getElementById('f-estado').value;
        return this.datos.filter(a =>
            (!tipo || a.tipo === tipo) &&
            (!estado || a.estado === estado) &&
            (!q || [a.descripcion, a.zona, a.tipo].join(' ').toLowerCase().includes(q))
        );
    },

    render() {
        const d = this.datos;
        document.getElementById('resumen').innerHTML = `
            <div class="dato"><b>${d.length}</b><span>Total registradas</span></div>
            <div class="dato"><b>${d.filter(a => a.estado === 'activo').length}</b><span>Activas en mapa</span></div>
            <div class="dato"><b>${d.filter(a => a.estado === 'resuelto').length}</b><span>Resueltas</span></div>
            <div class="dato"><b>${d.filter(a => a.gravedad === 'alta' && a.estado === 'activo').length}</b><span>Gravedad alta activas</span></div>`;

        const lista = this.filtradas();
        const filas = document.getElementById('filas');

        if (!lista.length) {
            filas.innerHTML = '<tr><td colspan="8" class="vacio">No se encontraron alertas con los filtros seleccionados</td></tr>';
            return;
        }

        filas.innerHTML = lista.map(a => {
            const t = TIPOS[a.tipo] || { icono: 'map-pin', etiqueta: a.tipo };
            const color = COLOR_GRAVEDAD[a.gravedad] || '#94a3b8';
            return `<tr data-id="${esc(a._id)}">
                <td><span class="celda-ico">${iconoHtml(t.icono)}<span>${esc(t.etiqueta)}</span></span></td>
                <td class="desc">${esc(a.descripcion)}</td>
                <td><span class="etiqueta-grav"><span class="punto-color" style="background:${color}"></span>${esc(a.gravedad)}</span></td>
                <td>${esc(a.zona || '-')}</td>
                <td class="estado-${esc(a.estado)}">${esc(a.estado)}</td>
                <td class="celda-votos">
                    <span class="v-pos">${iconoHtml('thumbs-up')} ${a.confirmaciones || 0}</span>
                    <span class="v-neg">${iconoHtml('thumbs-down')} ${a.desmentidos || 0}</span>
                </td>
                <td>${new Date(a.creado).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td class="acciones-fila">
                    <button class="btn sec mini" data-accion="editar">${iconoHtml('pencil')}<span>Editar</span></button>
                    <button class="btn peligro mini" data-accion="eliminar" title="Eliminar">${iconoHtml('trash-2')}</button>
                </td>
            </tr>`;
        }).join('');

        renderIconos();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (!AdminAuth.exigir()) return;

    const selTipo = document.getElementById('f-tipo');
    Object.entries(TIPOS).forEach(([k, t]) => {
        selTipo.insertAdjacentHTML('beforeend', `<option value="${k}">${t.etiqueta}</option>`);
    });

    renderIconos();

    document.getElementById('q').addEventListener('input', () => Tabla.render());
    selTipo.addEventListener('change', () => Tabla.render());
    document.getElementById('f-estado').addEventListener('change', () => Tabla.render());
    document.getElementById('btn-recargar').addEventListener('click', () => Tabla.cargar());
    document.getElementById('btn-salir').addEventListener('click', () => AdminAuth.salir());

    document.getElementById('filas').addEventListener('click', async e => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        const id = boton.closest('tr').dataset.id;
        const alerta = Tabla.datos.find(a => String(a._id) === id);

        if (boton.dataset.accion === 'editar') {
            Editor.abrir(alerta, () => Tabla.cargar());
        } else if (confirm('¿Eliminar esta alerta de forma definitiva?')) {
            try {
                await Api.eliminar(id);
                toast('Alerta eliminada');
                Tabla.cargar();
            } catch (err) { toast(err.message, true); }
        }
    });

    Tabla.cargar();
});