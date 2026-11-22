const alertaService = require('../services/AlertaService');

class AlertaController {
    constructor(service) {
        this.service = service;
    }

    _error(res, err) {
        const status = err.status || 500;
        if (status === 500) console.error(err);
        res.status(status).json({
            error: status === 500 ? 'Error interno del servidor' : err.message,
            detalles: err.detalles
        });
    }

    listar = async (req, res) => {
        try {
            const { lat, lng, radio, ...filtros } = req.query;
            const datos = (lat && lng)
                ? await this.service.cercanas(lng, lat, radio)
                : await this.service.listar(filtros);
            res.json(datos);
        } catch (err) { this._error(res, err); }
    };

    obtener = async (req, res) => {
        try { res.json(await this.service.obtener(req.params.id)); }
        catch (err) { this._error(res, err); }
    };

    crear = async (req, res) => {
        try { res.status(201).json(await this.service.crear(req.body)); }
        catch (err) { this._error(res, err); }
    };

    actualizar = async (req, res) => {
        try { res.json(await this.service.actualizar(req.params.id, req.body)); }
        catch (err) { this._error(res, err); }
    };

    votar = async (req, res) => {
        try {
            const { voto, votante } = req.body || {};
            res.json(await this.service.votar(req.params.id, voto, votante));
        } catch (err) { this._error(res, err); }
    };

    eliminar = async (req, res) => {
        try { res.json(await this.service.eliminar(req.params.id)); }
        catch (err) { this._error(res, err); }
    };
}

module.exports = new AlertaController(alertaService);