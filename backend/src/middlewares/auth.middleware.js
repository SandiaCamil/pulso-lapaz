const authService = require('../services/AuthService');

module.exports = function exigirAdmin(req, res, next) {
    const cabecera = req.headers.authorization || '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Se requiere iniciar sesión' });

    try {
        req.admin = authService.verificar(token);
        next();
    } catch {
        res.status(401).json({ error: 'Sesión inválida o vencida' });
    }
};