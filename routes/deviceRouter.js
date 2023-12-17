const Router = require('express')
const router = new Router()
const deviceController = require('../controllers/deviceController')

router.post('/', deviceController.create)
router.post('/basket', deviceController.putDeviceInBasket)
router.get('/basket', deviceController.getUserBasket)
router.delete('/basket', deviceController.removeDeviceFromBasket)
router.get('/', deviceController.getAll)
router.get('/:id', deviceController.getOne)

module.exports = router
