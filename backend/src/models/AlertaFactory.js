const Alerta = require('./Alerta');
const Bloqueo = require('./Bloqueo');
const Marcha = require('./Marcha');
const Deslizamiento = require('./Deslizamiento');
const Accidente = require('./Accidente');
const CalleCerrada = require('./CalleCerrada');

const CLASES = {
    [Bloqueo.TIPO]: Bloqueo,
    [Marcha.TIPO]: Marcha,
    [Deslizamiento.TIPO]: Deslizamiento,
    [Accidente.TIPO]: Accidente,
    [CalleCerrada.TIPO]: CalleCerrada
};

class AlertaFactory {
    static normalizar(texto) {
        return String(texto ?? '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30);
    }

    static crear(datos, estricto = true) {
        const bruto = typeof datos?.tipo === 'string' ? datos.tipo : '';
        const tipo = estricto ? AlertaFactory.normalizar(bruto) : bruto;

        const Clase = CLASES[tipo];
        if (Clase) return new Clase(datos);

        if (tipo.length >= 3) return new Alerta({ ...datos, tipo }); // incidente libre

        const err = new Error('Escribe el nombre del incidente (mínimo 3 letras)');
        err.status = 400;
        throw err;
    }

    static tiposValidos() {
        return Object.keys(CLASES);
    }
}

module.exports = AlertaFactory;