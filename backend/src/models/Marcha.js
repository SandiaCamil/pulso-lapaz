const Alerta = require('./Alerta');

class Marcha extends Alerta {
    static TIPO = 'marcha';
    static CAMPOS_PROPIOS = ['organizador', 'recorrido'];

    constructor(datos) {
        super({ ...datos, tipo: Marcha.TIPO });
    }
}

module.exports = Marcha;