const { Router } = require('express');
const controller = require('../controllers/AlertaController');

const router = Router();

router.get('/', controller.listar);                  // GET /api/alertas
router.get('/:id', controller.obtener);              // GET /api/alertas/:id
router.post('/', controller.crear);                  // POST /api/alertas
router.put('/:id', controller.actualizar);           // PUT /api/alertas/:id
router.patch('/:id/confirmar', controller.confirmar);// PATCH /api/alertas/:id/confirmar
router.delete('/:id', controller.eliminar);          // DELETE /api/alertas/:id

module.exports = router;