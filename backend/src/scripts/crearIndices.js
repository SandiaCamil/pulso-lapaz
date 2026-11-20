    const database = require('../config/Database');

    async function crearIndices() {
    const db = await database.conectar();
    const ttlSegundos = Number(process.env.TTL_HORAS || 6) * 3600;

    //colecciones
    const existentes = (await db.listCollections().toArray()).map(c => c.name);
    for (const nombre of ['alertas', 'tipos_alerta', 'configuracion', 'admins']) {
        if (!existentes.includes(nombre)) {
        await db.createCollection(nombre);
        console.log(`Colección creada: ${nombre}`);
        }
    }

    //indice geoespacial: consultas por cercanía (con $near)
    await db.collection('alertas').createIndex({ ubicacion: '2dsphere' });
    console.log('Índice 2dsphere creado en alertas.ubicacion');

    //indice TTL: borra las alertas a las N horas de su creacion
    await db.collection('alertas').createIndex(
        { creado: 1 },
        { expireAfterSeconds: ttlSegundos, name: 'ttl_creado' }
    );
    console.log(`Índice TTL creado en alertas.creado (${ttlSegundos} s)`);

    //un solo admin por nombre de usuario
    await db.collection('admins').createIndex({ usuario: 1 }, { unique: true });
    console.log('Índice único creado en admins.usuario');

    await database.cerrar();
    }

    crearIndices().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
    });