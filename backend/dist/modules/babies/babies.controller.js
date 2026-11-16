"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BabiesController = void 0;
const babies_service_1 = require("./babies.service");
const response_1 = require("../../common/response");
class BabiesController {
    static async list(req, res, next) {
        try {
            const filters = {
                department: req.query.department,
                severityState: req.query.severityState,
                status: req.query.status,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
            };
            const result = await babies_service_1.BabiesService.listBabies(filters);
            (0, response_1.sendSuccess)(res, result.items, 200, 'Babies retrieved successfully', result.pagination);
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const baby = await babies_service_1.BabiesService.getBabyById(id);
            (0, response_1.sendSuccess)(res, baby, 200, 'Baby profile retrieved successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const baby = await babies_service_1.BabiesService.createBaby(req.body, req.user?.userId);
            (0, response_1.sendSuccess)(res, baby, 201, 'Baby registered successfully');
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const baby = await babies_service_1.BabiesService.updateBaby(id, req.body);
            (0, response_1.sendSuccess)(res, baby, 200, 'Baby updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BabiesController = BabiesController;
