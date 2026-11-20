const { Router } = require('express');
const controller = require('../controllers/AuthController');
const exigirAdmin = require('../middlewares/auth.middleware');

const router = Router();

router.post('/login', controller.login);        // POST /api/auth/login
router.get('/yo', exigirAdmin, controller.yo);   // GET  /api/auth/yo (verifica la sesion)

module.exports = router;