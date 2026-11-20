const { ObjectId } = require('mongodb');
const database = require('../config/Database');
const AlertaFactory = require('../models/AlertaFactory');

function errorHttp(status, mensaje, detalles) {
    const err = new Error(mensaje);
    err.status = status;
    if (detalles) err.detalles = detalles;
    return err;
}

function aObjectId(id) {
    if (!ObjectId.isValid(id)) throw errorHttp(400, 'ID inválido');
    return new ObjectId(id);
}

const CAMPOS_PROTEGIDOS = ['_id', 'tipo', 'descripcion', 'ubicacion', 'gravedad', 'zona', 'confirmaciones', 'estado', 'creado'];

class AlertaService {
    get coleccion() {
        return database.coleccion('alertas');
    }

  //CREATE
    async crear(datos) {
        const alerta = AlertaFactory.crear(datos);
        const errores = alerta.validar();
        if (errores.length) throw errorHttp(400, 'Datos inválidos', errores);

        const doc = alerta.toDocumento();
        delete doc._id;
        const res = await this.coleccion.insertOne(doc);
        return { _id: res.insertedId, ...doc };
    }

  //READ (lista con filtros)
    async listar({ tipo, gravedad, zona, estado } = {}) {
        const filtro = {};
        if (tipo) filtro.tipo = tipo;
        if (gravedad) filtro.gravedad = gravedad;
        if (zona) filtro.zona = zona;
        if (estado) filtro.estado = estado;
        return this.coleccion.find(filtro).sort({ creado: -1 }).limit(500).toArray();
    }

  //READ (alertas cercanas con el índice 2dsphere)
    async cercanas(lng, lat, metros = 1000) {
        const x = Number(lng), y = Number(lat), r = Number(metros);
        if ([x, y, r].some(Number.isNaN)) throw errorHttp(400, 'lat, lng y radio deben ser números');
        return this.coleccion.find({
        estado: 'activo',
        ubicacion: {
            $near: {
            $geometry: { type: 'Point', coordinates: [x, y] },
            $maxDistance: r
            }
        }
        }).limit(100).toArray();
    }

  //READ (una)
    async obtener(id) {
        const alerta = await this.coleccion.findOne({ _id: aObjectId(id) });
        if (!alerta) throw errorHttp(404, 'Alerta no encontrada');
        return alerta;
    }

    // UPDATE (edita campos, agrega nuevos y quita los indicados en _quitar)
    async actualizar(id, cambios) {
        const _id = aObjectId(id);
        const existente = await this.obtener(id);

        const { _id: _i, creado: _c, tipo: _t, _quitar, ...permitidos } = cambios || {};
        const quitar = (Array.isArray(_quitar) ? _quitar : [])
        .filter(k => typeof k === 'string' && !CAMPOS_PROTEGIDOS.includes(k));

        if (!Object.keys(permitidos).length && !quitar.length) {
        throw errorHttp(400, 'No hay cambios para guardar');
        }

        const base = { ...existente, ...permitidos };
        quitar.forEach(k => delete base[k]);

        const alerta = AlertaFactory.crear(base);
        const errores = alerta.validar();
        if (errores.length) throw errorHttp(400, 'Datos inválidos', errores);

        const doc = alerta.toDocumento();
        delete doc._id;

        const operacion = { $set: doc };
        if (quitar.length) operacion.$unset = Object.fromEntries(quitar.map(k => [k, '']));

        await this.coleccion.updateOne({ _id }, operacion);
        return { _id, ...doc };
    }

  //UPDATE (confirmar: +1)
    async confirmar(id) {
        const res = await this.coleccion.findOneAndUpdate(
        { _id: aObjectId(id) },
        { $inc: { confirmaciones: 1 } },
        { returnDocument: 'after' }
        );
        if (!res) throw errorHttp(404, 'Alerta no encontrada');
        return res;
    }

  //DELETE
    async eliminar(id) {
        const res = await this.coleccion.deleteOne({ _id: aObjectId(id) });
        if (!res.deletedCount) throw errorHttp(404, 'Alerta no encontrada');
        return { eliminado: true };
    }
}

module.exports = new AlertaService();