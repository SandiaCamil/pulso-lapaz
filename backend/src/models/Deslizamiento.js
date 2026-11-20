const Alerta = require('./Alerta');

class Deslizamiento extends Alerta {
    static TIPO = 'deslizamiento';
    static CAMPOS_PROPIOS = ['zona_de_riesgo', 'calle_habilitada'];

    constructor(datos) {
        super({ ...datos, tipo: Deslizamiento.TIPO });
    }

    validar() {
        const errores = super.validar();
        if (this.calle_habilitada !== undefined && typeof this.calle_habilitada !== 'boolean') {
        errores.push('calle_habilitada debe ser true o false');
        }
        return errores;
    }
}

module.exports = Deslizamiento;