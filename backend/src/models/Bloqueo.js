const Alerta = require('./Alerta');

class Bloqueo extends Alerta {
    static TIPO = 'bloqueo';
    static CAMPOS_PROPIOS = ['ruta_alterna', 'duracion_estimada'];

    constructor(datos) {
        super({ ...datos, tipo: Bloqueo.TIPO });
    }
}

module.exports = Bloqueo;