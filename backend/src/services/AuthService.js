const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/Database');

function errorHttp(status, mensaje) {
    const err = new Error(mensaje);
    err.status = status;
    return err;
}

class AuthService {
    get admins() {
        return database.coleccion('admins');
    }

    async login(usuario, password) {
        if (!process.env.JWT_SECRET) throw errorHttp(500, 'Falta JWT_SECRET en el servidor');

        const nombre = String(usuario || '').toLowerCase().trim();
        const admin = await this.admins.findOne({ usuario: nombre });
        const correcto = admin && await bcrypt.compare(String(password || ''), admin.passwordHash);

        // Mismo mensaje para usuario o clave incorrectos
        if (!correcto) throw errorHttp(401, 'Usuario o contraseña incorrectos');

        const token = jwt.sign(
            { id: String(admin._id), usuario: admin.usuario, rol: admin.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
            );
            return { token, usuario: admin.usuario, rol: admin.rol };
    }

    verificar(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = new AuthService();