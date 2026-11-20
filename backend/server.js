require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const database = require('./src/config/Database');
const alertasRoutes = require('./src/routes/alertas.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/salud', (req, res) => res.json({ estado: 'ok', base: database.nombreBD }));
app.use('/api/alertas', alertasRoutes);

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

async function iniciar() {
    await database.conectar();
    app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
}

iniciar().catch(err => {
    console.error('No se pudo iniciar:', err.message);
    process.exit(1);
});