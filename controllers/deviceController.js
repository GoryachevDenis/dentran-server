const uuid = require('uuid')
const path = require('path');
const {Device, DeviceInfo, BasketDevice} = require('../models/models')
const ApiError = require('../error/ApiError');
const { where } = require('sequelize');
const sequelize = require('sequelize');

class DeviceController {
    async create(req, res, next) {
        try {
            let {name, price, brandId, typeId, info} = req.body
            const {img} = req.files
            let fileName = uuid.v4() + ".jpg"
            img.mv(path.resolve(__dirname, '..', 'static', fileName))
            const device = await Device.create({name, price, brandId, typeId, img: fileName});

            if (info) {
                info = JSON.parse(info)
                info.forEach(i =>
                    DeviceInfo.create({
                        title: i.title,
                        description: i.description,
                        deviceId: device.id
                    })
                )
            }

            return res.json(device)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }

    }

    async getAll(req, res) {
        let {brandId, typeId, limit, page} = req.query
        page = page || 1
        limit = limit || 9
        let offset = page * limit - limit
        let devices;
        if (!brandId && !typeId) {
            devices = await Device.findAndCountAll({limit, offset})
        }
        if (brandId && !typeId) {
            devices = await Device.findAndCountAll({where:{brandId}, limit, offset})
        }
        if (!brandId && typeId) {
            devices = await Device.findAndCountAll({where:{typeId}, limit, offset})
        }
        if (brandId && typeId) {
            devices = await Device.findAndCountAll({where:{typeId, brandId}, limit, offset})
        }
        return res.json(devices)
    }

    async getOne(req, res) {
        const {id} = req.params
        const device = await Device.findOne(
            {
                where: {id},
                include: [{model: DeviceInfo, as: 'info'}]
            },
        )
        return res.json(device)
    }

    async putDeviceInBasket(req, res, next) {
        const { deviceId, basketId } = req.body

        const basketHasDevice = await BasketDevice.findOne({where: {basketId, deviceId}})

        if(basketHasDevice) return next(ApiError.badRequest("В корзине уже есть этот товар"));

        const basketDevice = await BasketDevice.create({basketId, deviceId}) 

        return res.json(basketDevice);
    }

    async removeDeviceFromBasket(req, res) {
        const { deviceId, basketId } = req.query

        await BasketDevice.destroy({where: {basketId, deviceId}}) 
    }

    async getUserBasket (req, res) {
        const {basketId} = req.query;

        const basketDevices = await BasketDevice.findAll({where: {basketId}})

        const basketDevicesIds = basketDevices.map(device => {return device["deviceId"]});

        const devices = await Device.findAll({where: sequelize.and({id: basketDevicesIds })});

        return res.json(devices); 
    }
}

module.exports = new DeviceController()
