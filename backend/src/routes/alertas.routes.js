const { Router } = require('express');
const controller = require('../controllers/AlertaController');
const exigirAdmin = require('../middlewares/auth.middleware');

const router = Router();

// Publicas
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.post('/:id/votar', controller.votar);

// Solo administrador
router.put('/:id', exigirAdmin, controller.actualizar);
router.delete('/:id', exigirAdmin, controller.eliminar);

module.exports = router;