const Alerta = require('./Alerta');

class Accidente extends Alerta {
    static TIPO = 'accidente';
    static CAMPOS_PROPIOS = ['heridos', 'ambulancia_en_camino'];

    constructor(datos) {
        super({ ...datos, tipo: Accidente.TIPO });
        if (this.heridos !== undefined) this.heridos = Number(this.heridos);
    }

    validar() {
        const errores = super.validar();
        if (this.heridos !== undefined && (!Number.isInteger(this.heridos) || this.heridos < 0)) {
        errores.push('heridos debe ser un número entero mayor o igual a 0');
        }
        return errores;
    }
}

module.exports = Accidente;