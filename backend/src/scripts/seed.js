require('dotenv').config();
const bcrypt = require('bcryptjs');
const database = require('../config/Database');

async function seed() {
    const usuario = String(process.env.ADMIN_USER || 'admin').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!password || password.length < 8) {
        throw new Error('Define ADMIN_PASSWORD (mínimo 8 caracteres) en el archivo .env');
    }

    const db = await database.conectar();
    const passwordHash = await bcrypt.hash(password, 10);

  //Si el admin ya existe, se actualiza su clave; si no, se crea
    await db.collection('admins').updateOne(
        { usuario },
        { $set: { passwordHash }, $setOnInsert: { usuario, rol: 'admin', creado: new Date() } },
        { upsert: true }
    );

    console.log(`Administrador listo: ${usuario}`);
    await database.cerrar();
}

seed().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});