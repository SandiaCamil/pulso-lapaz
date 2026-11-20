const Alerta = require('./Alerta');

class CalleCerrada extends Alerta {
    static TIPO = 'calle_cerrada';
    static CAMPOS_PROPIOS = ['motivo', 'fecha_reapertura'];

    constructor(datos) {
        super({ ...datos, tipo: CalleCerrada.TIPO });
    }
}

module.exports = CalleCerrada;