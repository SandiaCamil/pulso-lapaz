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
            <div class="dato"><b>${d.length}</b><span>Alertas en total</span></div>
            <div class="dato"><b>${d.filter(a => a.estado === 'activo').length}</b><span>Activas</span></div>
            <div class="dato"><b>${d.filter(a => a.estado === 'resuelto').length}</b><span>Resueltas</span></div>
            <div class="dato"><b>${d.filter(a => a.gravedad === 'alta' && a.estado === 'activo').length}</b><span>Gravedad alta activas</span></div>`;

        const lista = this.filtradas();
        const filas = document.getElementById('filas');

        if (!lista.length) {
            filas.innerHTML = '<tr><td colspan="8" class="vacio">No hay alertas con esos filtros</td></tr>';
            return;
        }

        filas.innerHTML = lista.map(a => {
            const t = TIPOS[a.tipo] || { icono: '📍', etiqueta: a.tipo };
            return `<tr data-id="${esc(a._id)}">
                <td>${t.icono} ${esc(t.etiqueta)}</td>
                <td class="desc">${esc(a.descripcion)}</td>
                <td><span class="etiqueta" style="background:${COLOR_GRAVEDAD[a.gravedad] || '#fff'}">${esc(a.gravedad)}</span></td>
                <td>${esc(a.zona || '-')}</td>
                <td class="estado-${esc(a.estado)}">${esc(a.estado)}</td>
                <td>✅ ${a.confirmaciones || 0} · ❌ ${a.desmentidos || 0}</td>
                <td>${new Date(a.creado).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td class="acciones-fila">
                    <button class="btn sec mini" data-accion="editar">✏️ Editar</button>
                    <button class="btn peligro mini" data-accion="eliminar">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (!AdminAuth.exigir()) return;

    const selTipo = document.getElementById('f-tipo');
    Object.entries(TIPOS).forEach(([k, t]) => {
        selTipo.insertAdjacentHTML('beforeend', `<option value="${k}">${t.icono} ${t.etiqueta}</option>`);
    });

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