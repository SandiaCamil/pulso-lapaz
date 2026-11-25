const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const database = require('../config/Database');
const AlertaFactory = require('../models/AlertaFactory');

// Las huellas de los votantes nunca salen hacia el navegador
const SIN_VOTANTES = { projection: { votantes: 0 } };
const CAMPOS_PROTEGIDOS = ['_id', 'tipo', 'descripcion', 'ubicacion', 'gravedad', 'zona', 'confirmaciones', 'desmentidos', 'votantes', 'estado', 'creado'];
const UMBRAL_DESCARTE = 3;
const MAX_EXTRAS = 10;

function errorHttp(status, mensaje, detalles) {
    const err = new Error(mensaje);
    err.status = status;
    if (detalles) err.detalles = detalles;
    return err;
}

// Limpia los campos adicionales que envía el público
function sanitizarExtras(extras) {
    const limpio = {};
    for (const [k, v] of Object.entries(extras)) {
        const clave = AlertaFactory.normalizar(k);
        if (!/^[a-z]/.test(clave)) throw errorHttp(400, `Título de campo inválido: "${String(k).slice(0, 30)}"`);
        if (CAMPOS_PROTEGIDOS.includes(clave)) throw errorHttp(400, `El título "${clave}" está reservado`);
        if (!['string', 'number', 'boolean'].includes(typeof v)) continue;
        const valor = typeof v === 'string' ? v.trim().slice(0, 200) : v;
        if (valor === '') continue;
        limpio[clave] = valor;
    }
    if (Object.keys(limpio).length > MAX_EXTRAS) {
        throw errorHttp(400, `Máximo ${MAX_EXTRAS} campos adicionales`);
    }
    return limpio;
}

function aObjectId(id) {
    if (!ObjectId.isValid(id)) throw errorHttp(400, 'ID inválido');
    return new ObjectId(id);
}

class AlertaService {
    get coleccion() {
        return database.coleccion('alertas');
    }

    // CREATE
    async crear(datos) {
        // Campos que solo el sistema puede asignar
        const { _id, votantes, confirmaciones, desmentidos, estado, creado, ...resto } = datos || {};
        // Lo que el público puede enviar: campos base + extras saneados
        const { tipo, descripcion, ubicacion, gravedad, zona, ...extras } = resto;

        const alerta = AlertaFactory.crear({
            tipo, descripcion, ubicacion, gravedad, zona, ...sanitizarExtras(extras)
        });
        const errores = alerta.validar();
        if (errores.length) throw errorHttp(400, 'Datos inválidos', errores);

        const doc = alerta.toDocumento();
        delete doc._id;
        const res = await this.coleccion.insertOne(doc);
        return { _id: res.insertedId, ...doc };
    }

    // READ (lista con filtros)
    async listar({ tipo, gravedad, zona, estado } = {}) {
        const filtro = {};
        if (tipo) filtro.tipo = tipo;
        if (gravedad) filtro.gravedad = gravedad;
        if (zona) filtro.zona = zona;
        if (estado) filtro.estado = estado;
        return this.coleccion.find(filtro, SIN_VOTANTES).sort({ creado: -1 }).limit(500).toArray();
    }

    // READ (alertas cercanas con el índice 2dsphere)
    async cercanas(lng, lat, metros = 1000) {
        const x = Number(lng), y = Number(lat), r = Number(metros);
        if ([x, y, r].some(Number.isNaN)) throw errorHttp(400, 'lat, lng y radio deben ser números');
        return this.coleccion.find({
            estado: 'activo',
            ubicacion: {
                $near: { $geometry: { type: 'Point', coordinates: [x, y] },$maxDistance: r }
            }
        }, SIN_VOTANTES).limit(100).toArray();
    }

    // READ (una)
    async obtener(id) {
        const alerta = await this.coleccion.findOne({ _id: aObjectId(id) }, SIN_VOTANTES);
        if (!alerta) throw errorHttp(404, 'Alerta no encontrada');
        return alerta;
    }

    // UPDATE (administrador: edita, agrega y quita campos)
    async actualizar(id, cambios) {
        const _id = aObjectId(id);
        const existente = await this.obtener(id);

        const { _id: _i, creado: _c, tipo: _t, votantes: _v, _quitar, ...permitidos } = cambios || {};
        const quitar = (Array.isArray(_quitar) ? _quitar : [])
            .filter(k => typeof k === 'string' && !CAMPOS_PROTEGIDOS.includes(k));

        if (!Object.keys(permitidos).length && !quitar.length) {
            throw errorHttp(400, 'No hay cambios para guardar');
        }

        const base = { ...existente, ...permitidos };
        quitar.forEach(k => delete base[k]);

        const alerta = AlertaFactory.crear(base, false);
        const errores = alerta.validar();
        if (errores.length) throw errorHttp(400, 'Datos inválidos', errores);

        const doc = alerta.toDocumento();
        delete doc._id;

        const operacion = { $set: doc };
        if (quitar.length) operacion.$unset = Object.fromEntries(quitar.map(k => [k, '']));

        await this.coleccion.updateOne({ _id }, operacion);
        return { _id, ...doc };
    }

    // VOTAR: una vez por dispositivo (confirmar o negar)
    async votar(id, voto, votanteId) {
        if (!['confirmar', 'negar'].includes(voto)) throw errorHttp(400, 'Voto inválido');
        if (typeof votanteId !== 'string' || votanteId.length < 16 || votanteId.length > 100) {
            throw errorHttp(400, 'Identificador de votante inválido');
        }

        const _id = aObjectId(id);
        const huella = crypto.createHash('sha256')
            .update(votanteId + (process.env.JWT_SECRET || ''))
            .digest('hex');
        const campo = voto === 'confirmar' ? 'confirmaciones' : 'desmentidos';

        // Una sola operación atómica: solo cuenta si esa huella aún no votó
        const res = await this.coleccion.findOneAndUpdate(
            { _id, estado: 'activo', votantes: { $ne: huella } },
            { $push: { votantes: huella },$inc: { [campo]: 1 } },
            { returnDocument: 'after', projection: { votantes: 0 } }
        );

        if (!res) {
            const existe = await this.coleccion.findOne({ _id }, { projection: { estado: 1, votantes: 1 } });
            if (!existe) throw errorHttp(404, 'Alerta no encontrada');
            if ((existe.votantes || []).includes(huella)) throw errorHttp(409, 'Ya votaste en esta alerta');
            throw errorHttp(409, 'Esta alerta ya no está activa');
        }

        // Si la comunidad la niega, se descarta sola
        if ((res.desmentidos || 0) >= UMBRAL_DESCARTE && res.desmentidos > (res.confirmaciones || 0)) {
            await this.coleccion.updateOne({ _id, estado: 'activo' }, { $set: { estado: 'descartado' } });
            res.estado = 'descartado';
        }
        return res;
    }

    // DELETE
    async eliminar(id) {
        const res = await this.coleccion.deleteOne({ _id: aObjectId(id) });
        if (!res.deletedCount) throw errorHttp(404, 'Alerta no encontrada');
        return { eliminado: true };
    }
}

module.exports = new AlertaService();