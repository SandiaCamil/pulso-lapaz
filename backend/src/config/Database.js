require('dotenv').config();
const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.uri = process.env.MONGODB_URI;
        this.nombreBD = process.env.DB_NAME || 'pulso_lapaz';
        this.client = null;
        this.db = null;
    }

    async conectar() {
        if (this.db) return this.db;
        if (!this.uri) throw new Error('Falta MONGODB_URI en el archivo .env');

        this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 10000 });
        await this.client.connect();
        this.db = this.client.db(this.nombreBD);
        await this.db.command({ ping: 1 });
        console.log(`Conectado a MongoDB Atlas (base: ${this.nombreBD})`);
        return this.db;
    }

    coleccion(nombre) {
        if (!this.db) throw new Error('La base de datos no está conectada');
        return this.db.collection(nombre);
    }

    async cerrar() {
        if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('Conexión cerrada');
        }
    }
    }

//Instancia unica compartida por todo el sistema (con patron Singleton)
module.exports = new Database();