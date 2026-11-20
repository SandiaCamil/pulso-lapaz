const authService = require('../services/AuthService');

const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const intentos = new Map(); // ip -> { cuenta, desde }

function bloqueado(ip) {
    const r = intentos.get(ip);
    if (!r) return false;
    if (Date.now() - r.desde > VENTANA_MS) { intentos.delete(ip); return false; }
    return r.cuenta >= MAX_INTENTOS;
}

function registrarFallo(ip) {
    const r = intentos.get(ip);
    if (!r || Date.now() - r.desde > VENTANA_MS) intentos.set(ip, { cuenta: 1, desde: Date.now() });
    else r.cuenta++;
}

class AuthController {
    login = async (req, res) => {
        const ip = req.ip;
        if (bloqueado(ip)) {
        return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
        }
        try {
        const { usuario, password } = req.body || {};
        const sesion = await authService.login(usuario, password);
        intentos.delete(ip);
        res.json(sesion);
        } catch (err) {
        const status = err.status || 500;
        if (status === 401) registrarFallo(ip);
        if (status === 500) console.error(err);
        res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
        }
    };

    yo = (req, res) => {
        res.json({ usuario: req.admin.usuario, rol: req.admin.rol });
    };
}

module.exports = new AuthController();