const Editor = {
    alerta: null,
    quitar: new Set(),
    alGuardar: null,

    abrir(alerta, alGuardar) {
        this.alerta = alerta;
        this.quitar = new Set();
        this.alGuardar = alGuardar;

        const [lng, lat] = alerta.ubicacion.coordinates;
        const t = TIPOS[alerta.tipo] || { icono: 'map-pin', etiqueta: alerta.tipo };
        const opciones = (lista, actual) =>
            lista.map(v => `<option value="${v}" ${v === actual ? 'selected' : ''}>${v}</option>`).join('');
        const extras = Object.entries(alerta).filter(([k]) => !CAMPOS_BASE.includes(k));

        document.getElementById('modal-caja').innerHTML = `
            <h2>${iconoHtml(t.icono)}<span>Editar alerta · ${esc(t.etiqueta)}</span></h2>
            <p class="meta">ID: ${esc(alerta._id)} · Creada: ${new Date(alerta.creado).toLocaleString('es-BO')}</p>
            <form id="form-editor">
                <label>Descripción
                    <textarea id="e-desc" rows="3" maxlength="300" required>${esc(alerta.descripcion)}</textarea>
                </label>
                <div class="fila2">
                    <label>Gravedad<select id="e-grav">${opciones(['baja', 'media', 'alta'], alerta.gravedad)}</select></label>
                    <label>Estado<select id="e-estado">${opciones(['activo', 'resuelto', 'descartado'], alerta.estado)}</select></label>
                    <label>Zona<input id="e-zona" maxlength="60" value="${esc(alerta.zona)}"></label>
                    <label>Confirmaciones<input id="e-conf" type="number" min="0" value="${Number(alerta.confirmaciones) || 0}"></label>
                    <label>Latitud<input id="e-lat" type="number" step="any" value="${lat}" required></label>
                    <label>Longitud<input id="e-lng" type="number" step="any" value="${lng}" required></label>
                </div>

                <h3>Campos adicionales (Esquema flexible NoSQL)</h3>
                <p class="meta">Atributos específicos o agregados directamente desde MongoDB Atlas.</p>
                <div id="e-extras">${extras.map(([k, v]) => this.filaExtra(k, v)).join('')}</div>

                <div class="nuevo-campo">
                    <label>Nuevo campo<input id="n-nombre" placeholder="ej. sector_afectado"></label>
                    <label>Valor<input id="n-valor" placeholder="ej. Carril de bajada"></label>
                    <button type="button" id="n-agregar" class="btn sec mini">${iconoHtml('plus')}<span>Agregar</span></button>
                </div>

                <div class="modal-botones">
                    <button type="button" class="btn sec" id="e-cancelar">Cancelar</button>
                    <button type="submit" class="btn">Guardar cambios</button>
                </div>
            </form>`;

        document.getElementById('modal').classList.add('abierto');
        renderIconos();

        document.getElementById('form-editor').addEventListener('submit', e => this.guardar(e));
        document.getElementById('e-cancelar').onclick = () => this.cerrar();
        document.getElementById('n-agregar').onclick = () => this.agregar();
        document.getElementById('e-extras').addEventListener('click', e => {
            const boton = e.target.closest('.quitar');
            if (!boton) return;
            const fila = boton.closest('.campo-extra');
            if (fila.dataset.clave in this.alerta) this.quitar.add(fila.dataset.clave);
            fila.remove();
        });
    },

    filaExtra(clave, valor) {
        let tipo = 'text';
        let control;
        if (typeof valor === 'boolean') {
            tipo = 'boolean';
            control = `<select class="valor"><option value="true" ${valor ? 'selected' : ''}>Sí</option><option value="false" ${!valor ? 'selected' : ''}>No</option></select>`;
        } else if (typeof valor === 'number') {
            tipo = 'number';
            control = `<input class="valor" type="number" step="any" value="${valor}">`;
        } else if (valor !== null && typeof valor === 'object') {
            tipo = 'json';
            control = `<textarea class="valor" rows="2">${esc(JSON.stringify(valor))}</textarea>`;
        } else {
            control = `<input class="valor" type="text" value="${esc(valor)}">`;
        }
        return `<div class="campo-extra" data-clave="${esc(clave)}" data-tipo="${tipo}">
            <label>${esc(clave.replace(/_/g, ' '))}${control}</label>
            <button type="button" class="btn sec mini quitar" title="Quitar campo">${iconoHtml('trash-2')}</button>
        </div>`;
    },

    agregar() {
        const nombre = document.getElementById('n-nombre').value.trim();
        const texto = document.getElementById('n-valor').value.trim();

        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(nombre)) {
            return toast('Nombre inválido: usa letras, números y guion bajo', true);
        }
        if (CAMPOS_BASE.includes(nombre) || document.querySelector(`.campo-extra[data-clave="${nombre}"]`)) {
            return toast('Ese campo ya existe', true);
        }

        let valor = texto;
        if (texto === 'true' || texto === 'false') valor = texto === 'true';
        else if (texto !== '' && !isNaN(Number(texto))) valor = Number(texto);

        this.quitar.delete(nombre);
        document.getElementById('e-extras').insertAdjacentHTML('beforeend', this.filaExtra(nombre, valor));
        renderIconos();
        document.getElementById('n-nombre').value = '';
        document.getElementById('n-valor').value = '';
    },

    async guardar(e) {
        e.preventDefault();
        const datos = {
            descripcion: document.getElementById('e-desc').value,
            gravedad: document.getElementById('e-grav').value,
            estado: document.getElementById('e-estado').value,
            zona: document.getElementById('e-zona').value,
            confirmaciones: Number(document.getElementById('e-conf').value),
            ubicacion: {
                lat: Number(document.getElementById('e-lat').value),
                lng: Number(document.getElementById('e-lng').value)
            }
        };

        try {
            document.querySelectorAll('#e-extras .campo-extra').forEach(fila => {
                const clave = fila.dataset.clave;
                const v = fila.querySelector('.valor').value;
                const tipo = fila.dataset.tipo;
                if (tipo === 'boolean') datos[clave] = v === 'true';
                else if (tipo === 'number') datos[clave] = Number(v);
                else if (tipo === 'json') datos[clave] = JSON.parse(v);
                else datos[clave] = v;
            });
        } catch {
            return toast('Uno de los campos JSON no es válido', true);
        }

        try {
            await Api.actualizar(this.alerta._id, datos, [...this.quitar]);
            this.cerrar();
            toast('Cambios guardados correctamente');
            if (this.alGuardar) this.alGuardar();
        } catch (err) {
            toast(err.message, true);
        }
    },

    cerrar() {
        document.getElementById('modal').classList.remove('abierto');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal').addEventListener('click', e => {
        if (e.target.id === 'modal') Editor.cerrar();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') Editor.cerrar();
    });
});