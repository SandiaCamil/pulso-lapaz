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
    static crear(datos) {
        const Clase = CLASES[datos?.tipo];
        if (!Clase) {
        const err = new Error(`Tipo de alerta no válido. Use: ${AlertaFactory.tiposValidos().join(', ')}`);
        err.status = 400;
        throw err;
        }
        return new Clase(datos);
    }

    static tiposValidos() {
        return Object.keys(CLASES);
    }
}

module.exports = AlertaFactory;